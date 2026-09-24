import { httpFetch } from '../../request'
import {
  API,
  UA_DESKTOP,
  UA_MEDIA,
  HTML5_QN,
  HTML5_FALLBACK,
  VERIFY_URL,
  CACHE_TTL,
  buildReferer,
} from './config'
import { buildQuery, getJson, log } from './utils'

/*
 * 取链策略（v2，配合「播放器注入 Referer + 专用 UA」的改造）：
 *
 * 背景：B 站主 CDN upos-*.bilivideo.com 有两个并列的防盗链条件，缺一不可：
 *         ① 必须带 Referer: https://www.bilibili.com/video/<bvid>
 *         ② UA 里不能出现 Android
 *       洛雪的播放器原本两条都不满足（不给任何 headers，且 UA 写死成 Pixel 3），
 *       所以 upos 一律 403 —— 这就是旧版只能退回 platform=html5 混流 mp4
 *       （实测 14~40MB/首，qn 最高 64）的原因。
 *
 * 现在 src/plugins/player/playList.ts 的 buildTracks() 会按音源：
 *       userAgent = UA_MEDIA（iPhone，不含 Android）
 *       headers   = { Referer: https://www.bilibili.com/video/<bvid> }
 *   注入到 RNTP 的 track 上（Android 侧 Track.java -> setDefaultRequestProperties）。
 * 于是这里可以放心优先用 DASH 音轨（192K AAC / Hi-Res FLAC），体积 ~1-2MB。
 *
 * 本文件职责：
 *   1. 按音质偏好排出全部 DASH 候选（含 backupUrl）
 *   2. 用「与播放器完全一致的 UA + Referer」逐个实测可用性
 *   3. 全部不通时才退回 html5 渐进流兜底（极少数老稿件只有 durl）
 */

/* ------------------------- 音轨挑选 ------------------------- */
// B 站 DASH 音轨 id：
// 30216(64K) 30232(132K) 30280(192K) 30250(杜比全景声) 30251(Hi-Res FLAC)
const AUDIO_PREFER = {
  '128k': [30232, 30216, 30280, 30251, 30250],
  '320k': [30280, 30232, 30251, 30250, 30216],
  flac: [30251, 30250, 30280, 30232, 30216],
  flac24bit: [30251, 30250, 30280, 30232, 30216],
}

// mcdn 是 PCDN 节点，本来就不校验 Referer，作为最稳的一档
const isMcdn = (url) => /\.mcdn\.bilivideo\./.test(url)

const dashAudioCandidates = (playData, quality) => {
  const d = playData && playData.data
  if (!d || !d.dash) return []
  let pool = []
  if (d.dash.audio) pool = pool.concat(d.dash.audio)
  // Hi-Res FLAC(30251) / 杜比全景声(30250) 在独立字段里
  if (d.dash.flac && d.dash.flac.audio) pool = pool.concat(d.dash.flac.audio)
  if (d.dash.dolby && d.dash.dolby.audio) pool = pool.concat(d.dash.dolby.audio)
  if (!pool.length) return []

  const seen = new Set()
  const audios = []
  for (const a of pool) {
    if (!a || !a.id || seen.has(a.id)) continue
    seen.add(a.id)
    audios.push(a)
  }

  const byId = {}
  for (const a of audios) byId[a.id] = a

  // 先按音质偏好排，其余音轨按带宽从高到低兜底
  const used = new Set()
  const ordered = []
  for (const id of (AUDIO_PREFER[quality] || AUDIO_PREFER['128k'])) {
    if (byId[id] && !used.has(id)) {
      used.add(id)
      ordered.push(byId[id])
    }
  }
  for (const a of audios.slice().sort((x, y) => y.bandwidth - x.bandwidth)) {
    if (!used.has(a.id)) {
      used.add(a.id)
      ordered.push(a)
    }
  }

  const out = []
  for (const a of ordered) {
    const urls = [a.baseUrl].concat(a.backupUrl || [])
    for (const url of urls) {
      if (url) out.push({ url, kind: isMcdn(url) ? 'mcdn' : 'dash', id: a.id })
    }
  }
  return out
}

const html5Urls = (playData) => {
  const d = playData && playData.data
  if (!d || !d.durl || !d.durl.length) return []
  const out = []
  for (const one of d.durl) {
    for (const url of [one.url].concat(one.backup_url || [])) {
      if (url) out.push({ url, kind: 'html5' })
    }
  }
  return out
}

/* --------------------------- 可用性探测 --------------------------- */
// 关键：请求姿势必须与播放器完全一致 —— 同款 UA + 同款 Referer，
// 否则「探测通过」和「播放器实际请求」不是一回事，会误判。
// 特别提醒：UA 里不能含 Android，否则 upos 一律 403（见 config.js 的说明）。
// 另外要求响应体真的是 MP4/fMP4，避免把一段错误页当成可播。
const checkUrl = (url, referer) => {
  return httpFetch(url, {
    method: 'get',
    timeout: 8000,
    headers: {
      'User-Agent': UA_MEDIA,
      Accept: '*/*',
      Referer: referer,
      Range: 'bytes=0-511',
    },
  }).promise.then(({ statusCode, body }) => {
    if (statusCode !== 200 && statusCode !== 206) return false
    const head = typeof body === 'string' ? body.slice(0, 512) : ''
    return head.includes('ftyp') || head.includes('styp') || head.includes('moov')
  }).catch(() => false)
}

// mcdn 最稳 -> 其余 DASH -> html5 渐进流兜底
const buildOrder = (dash, h5) => {
  const out = []
  const seen = new Set()
  const push = (u) => {
    if (!u || !u.url || u.url.length > 2048 || seen.has(u.url)) return
    seen.add(u.url)
    out.push(u)
  }
  for (const d of dash) if (d.kind === 'mcdn') push(d)
  for (const d of dash) if (d.kind !== 'mcdn') push(d)
  for (const h of h5) push(h)
  return out.slice(0, 10)
}

const pickPlayable = (list, startIndex, referer) => {
  if (!list.length) return Promise.reject(new Error('未获取到音频流地址'))
  if (!VERIFY_URL) return Promise.resolve({ url: list[startIndex % list.length].url, index: startIndex % list.length })

  let tried = 0
  const next = () => {
    if (tried >= list.length) {
      // 全都探测失败：优先退回 html5（对老稿件最稳），否则用第一条
      const h5 = list.find((u) => u.kind === 'html5')
      const fb = h5 || list[0]
      log(`全部候选探测失败，兜底使用 [${fb.kind}]`)
      return Promise.resolve({ url: fb.url, index: list.indexOf(fb) })
    }
    const idx = (startIndex + tried) % list.length
    const u = list[idx]
    tried++
    return checkUrl(u.url, referer).then((ok) => {
      if (ok) {
        log(`采用 [${u.kind}/${u.id || '-'}] ${u.url.slice(0, 96)}...`)
        return { url: u.url, index: idx }
      }
      log(`[${u.kind}/${u.id || '-'}] 探测不可用，换下一个`)
      return next()
    })
  }
  return next()
}

/* ---------------------------- 缓存 ---------------------------- */
const cache = new Map()
// bvid -> { index, time }：记住上次选中的候选流下标。
// 若同一条在 60 秒内又被请求（通常是播放失败后重试），就自动换下一个候选。
const lastPick = new Map()
const RETRY_WINDOW = 60 * 1000

const cacheKey = (bvid, quality) => `${bvid}|${quality}`
const pickKey = (bvid, quality) => `${bvid}|${quality}`

const cacheGet = (key) => {
  const v = cache.get(key)
  if (!v) return null
  if (Date.now() > v.expire) {
    cache.delete(key)
    return null
  }
  return v.url
}

const cacheSet = (key, url) => {
  cache.set(key, { url, expire: Date.now() + CACHE_TTL })
}

const nextStartIndex = (key) => {
  const prev = lastPick.get(key)
  if (prev && Date.now() - prev.time < RETRY_WINDOW) return prev.index + 1
  return 0
}

/* ---------------------------- 主流程 ---------------------------- */
export const resolvePlayUrl = (bvid, quality) => {
  if (!bvid) return Promise.reject(new Error('缺少视频 bvid'))
  const key = cacheKey(bvid, quality)
  const hit = cacheGet(key)
  if (hit) {
    log('命中直链缓存', key)
    return Promise.resolve(hit)
  }

  // 这个 referer 与 playList.ts 注入到播放器 track 上的完全一致
  const ref = buildReferer(bvid)
  const apiHeaders = { 'User-Agent': UA_DESKTOP, Accept: 'application/json', Referer: ref }
  const h5Headers = { 'User-Agent': UA_MEDIA, Accept: 'application/json', Referer: ref }

  return getJson(`${API}/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`, apiHeaders)
    .then((view) => {
      if (!view || view.code !== 0 || !view.data) {
        throw new Error(`获取视频信息失败：${(view && view.message) || ''}`)
      }
      const cid = view.data.cid

      const dashReq = getJson(`${API}/x/player/playurl?${buildQuery({
        bvid, cid, fnval: 16, fnver: 0, fourk: 1, qn: 120,
      })}`, apiHeaders)

      const h5Req = HTML5_FALLBACK
        ? getJson(`${API}/x/player/playurl?${buildQuery({
          bvid, cid, fnval: 1, fnver: 0, qn: HTML5_QN, platform: 'html5', high_quality: 1,
        })}`, h5Headers).catch(() => null)
        : Promise.resolve(null)

      return Promise.all([dashReq, h5Req]).then(([dashData, h5Data]) => {
        const dash = dashAudioCandidates(dashData, quality)
        const h5 = html5Urls(h5Data)
        log(`候选流：dash ${dash.length} 条 / html5 ${h5.length} 条`)
        const order = buildOrder(dash, h5)
        const pKey = pickKey(bvid, quality)
        const startIndex = nextStartIndex(pKey)
        return pickPlayable(order, startIndex, ref).then(({ url, index }) => {
          lastPick.set(pKey, { index, time: Date.now() })
          return url
        })
      })
    })
    .then((url) => {
      if (typeof url !== 'string' || !/^https?:/.test(url)) throw new Error('解析结果不是合法链接')
      if (url.length > 2048) throw new Error('链接过长')
      cacheSet(key, url)
      return url
    })
}
