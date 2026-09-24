import { formatPlayTime, sizeFormate } from '../../common'
import {
  API,
  UA_DESKTOP,
  UA_MOBILE,
  PAGE_SIZE,
  PREFER_CHANNEL_MID,
  PREFER_PHRASES,
  DEMOTE_EXCLUDED,
  EXCLUDE_RE,
  QUALITYS,
  QUALITY_BITRATE,
} from './config'
import { buildQuery, decodeHtml, fixPic, getJson, log, delay, parseDuration } from './utils'

/* --------------------------- buvid --------------------------- */
// 主动带上 buvid3/buvid4：不带的话搜索接口很容易被风控返回 -412
let cookie = ''

const ensureCookie = () => {
  if (cookie) return Promise.resolve(cookie)
  return getJson(`${API}/x/frontend/finger/spi`, {
    'User-Agent': UA_MOBILE,
    Accept: 'application/json',
  }).then((json) => {
    const d = json && json.data
    if (d && d.b_3) cookie = `buvid3=${d.b_3}; buvid4=${d.b_4 || ''}`
    return cookie
  }).catch(() => '')
}

/* --------------------------- 全站搜索 --------------------------- */
const searchHeaders = (ck) => {
  const headers = {
    'User-Agent': UA_DESKTOP,
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Origin: 'https://search.bilibili.com',
    Referer: 'https://search.bilibili.com/',
  }
  if (ck) headers.Cookie = ck
  return headers
}

const searchOnce = (keyword, page, pageSize, ck) => {
  const params = {
    context: '',
    page,
    order: '',
    page_size: pageSize,
    keyword,
    duration: '',
    tids_1: '',
    tids_2: '',
    __refresh__: 'true',
    _extra: '',
    highlight: 1,
    single_column: 0,
    platform: 'pc',
    from_source: '',
    search_type: 'video',
    dynamic_offset: 0,
  }
  return getJson(`${API}/x/web-interface/search/type?${buildQuery(params)}`, searchHeaders(ck))
}

// -412 是 B 站的短时风控，隔一会儿再来一次往往就好了
export const searchKeyword = (keyword, page, pageSize = PAGE_SIZE) => {
  return ensureCookie()
    .then((ck) => searchOnce(keyword, page, pageSize, ck))
    .then((json) => {
      if (json && json.code === 0 && json.data) return json.data
      log(`搜索被拦(code=${json && json.code})，1.2s 后重试`)
      return delay(1200)
        .then(() => searchOnce(keyword, page, pageSize, cookie))
        .then((json2) => {
          if (json2 && json2.code === 0 && json2.data) return json2.data
          if (json2 && json2.code === -412) {
            log('仍被风控(-412)，3s 后再试一次')
            return delay(3000)
              .then(() => searchOnce(keyword, page, pageSize, cookie))
              .then((json3) => {
                if (json3 && json3.code === 0 && json3.data) return json3.data
                throw new Error('B站风控中(-412)，请过几分钟再试')
              })
          }
          throw new Error(`B站搜索失败：code=${(json2 && json2.code) || '?'} ${(json2 && json2.message) || ''}`)
        })
    })
}

/* ------------------------- 优先 UP 的投稿 ------------------------- */
// 这个接口风控很凶（-799 请求过于频繁 / -352 风控校验失败），
// 一旦被拦就熔断 10 分钟不再尝试，避免把 IP 的风险等级刷高。
let spaceBlockedUntil = 0

export const searchChannel = (mid, keyword, pageSize = 30) => {
  if (!mid) return Promise.resolve([])
  if (Date.now() < spaceBlockedUntil) {
    log('UP 列表接口处于熔断期，跳过')
    return Promise.resolve([])
  }
  const url = `${API}/x/space/arc/search?${buildQuery({ mid, ps: pageSize, pn: 1, keyword })}`
  return getJson(url, {
    'User-Agent': UA_DESKTOP,
    Accept: 'application/json, text/plain, */*',
    Referer: `https://space.bilibili.com/${mid}/video`,
  }).then((res) => {
    if (!res || res.code !== 0) {
      if (res && [-799, -352, -412, -509].includes(res.code)) {
        spaceBlockedUntil = Date.now() + 10 * 60 * 1000
        log(`UP 列表接口被限流(code=${res.code})，熔断 10 分钟`)
      } else {
        log(`UP 列表接口返回 code=${res && res.code} ${(res && res.message) || ''}`)
      }
      return []
    }
    const vlist = (res.data && res.data.list && res.data.list.vlist) || []
    return vlist.map((v) => ({
      bvid: v.bvid,
      title: v.title,
      pic: null,
      duration: v.length, // 这个接口直接给 "MM:SS"
      author: v.author,
      mid: v.mid,
      typeid: v.typeid,
      play: v.play,
    })).filter((v) => v.bvid)
  }).catch((err) => {
    log('UP 列表接口异常', err.message)
    return []
  })
}

/* --------------------------- 结果整形 --------------------------- */
const buildQualitys = (seconds) => {
  const types = []
  const _types = {}
  for (const q of QUALITYS) {
    const size = sizeFormate(Math.round((seconds || 180) * QUALITY_BITRATE[q] * 1000 / 8))
    types.push({ type: q, size })
    _types[q] = { size }
  }
  return { types, _types }
}

// 标题里带系列名 -> 用它当专辑名，列表里更好认
const matchPhrase = (title) => {
  for (const ph of PREFER_PHRASES) {
    if (title.includes(ph)) return ph
  }
  return ''
}

const toMusicInfo = (item) => {
  const title = decodeHtml(item.title)
  const author = decodeHtml(item.author) || '哔哩哔哩'
  const seconds = parseDuration(item.duration)
  const { types, _types } = buildQualitys(seconds)
  const series = matchPhrase(title)
  return {
    singer: author,
    name: title,
    albumName: series || author,
    albumId: item.bvid,
    songmid: item.bvid, // -> meta.songId，取链时靠它定位视频
    source: 'bilibili',
    interval: formatPlayTime(seconds),
    img: fixPic(item.pic),
    lrc: null,
    lrcUrl: null,
    types,
    _types,
    typeUrl: {},
    // 以下字段不参与展示，仅用于列表内排序
    _bvid: item.bvid,
    _mid: item.mid,
    _typeid: item.typeid,
    _seconds: seconds,
  }
}

// 去掉排序用的私有字段，避免被存进列表数据里
const stripPrivate = (info) => {
  const out = { ...info }
  delete out._bvid
  delete out._mid
  delete out._typeid
  delete out._seconds
  return out
}

const isPreferred = (item) => {
  if (PREFER_CHANNEL_MID && String(item.mid) === String(PREFER_CHANNEL_MID)) return true
  return !!matchPhrase(decodeHtml(item.title))
}

const isExcluded = (item) => EXCLUDE_RE.test(decodeHtml(item.title))

// 稳定分区：优先系列排最前，被排除的类型沉到后面，其余保持 B 站的相关度顺序
const orderItems = (items) => {
  const preferred = []
  const normal = []
  const demoted = []
  for (const it of items) {
    if (isPreferred(it)) preferred.push(it)
    else if (DEMOTE_EXCLUDED && isExcluded(it)) demoted.push(it)
    else normal.push(it)
  }
  return preferred.concat(normal, demoted)
}

const dedupe = (items) => {
  const seen = new Set()
  const out = []
  for (const it of items) {
    if (!it || !it.bvid || seen.has(it.bvid)) continue
    seen.add(it.bvid)
    out.push(it)
  }
  return out
}

/* ---------------------------- 模块 ---------------------------- */
export default {
  limit: PAGE_SIZE,
  total: 0,
  page: 0,
  allPage: 1,

  // 返回 { list, total }，list 已排好序
  musicSearch(keyword, page, limit) {
    const ps = Math.min(limit || this.limit, 50)
    const globalReq = searchKeyword(keyword, page, ps).then((data) => ({
      items: (data && data.result) || [],
      total: (data && data.numResults) || 0,
    }))

    // 第 1 页额外翻一遍优先 UP 的投稿，把「在百万豪装录音棚大声听」这类稿件顶到最前
    const channelReq = (page === 1 && PREFER_CHANNEL_MID)
      ? searchChannel(PREFER_CHANNEL_MID, keyword, ps).then((items) => items)
      : Promise.resolve([])

    return Promise.all([channelReq, globalReq]).then(([channelItems, global]) => {
      log(`"${keyword}" p${page}: 全站 ${global.items.length} 条，UP 投稿 ${channelItems.length} 条`)
      const merged = dedupe(channelItems.concat(global.items))
      return {
        list: orderItems(merged).map(toMusicInfo).map(stripPrivate),
        total: global.total || merged.length,
      }
    })
  },

  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit
    return this.musicSearch(str, page, limit).then(({ list, total }) => {
      this.total = total
      this.page = page
      this.allPage = Math.max(1, Math.ceil((total || list.length) / limit))
      return {
        list,
        allPage: this.allPage,
        limit,
        total: this.total,
        source: 'bilibili',
      }
    })
  },
}
