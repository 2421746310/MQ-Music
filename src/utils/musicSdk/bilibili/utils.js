import { httpFetch } from '../../request'
import { TIMEOUT, DEBUG } from './config'

/* ---------------------------- 日志 ---------------------------- */
export const log = (...args) => {
  if (!DEBUG) return
  console.log('[bilibili]', ...args)
}

/* ---------------------------- HTTP ---------------------------- */
const decodeBody = (body) => {
  if (body == null) return null
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch (e) {
      return null
    }
  }
  return body
}

// 发起一次 GET 并返回解析后的 JSON（失败返回 null）
export const getJson = (url, headers, timeout = TIMEOUT) => {
  return httpFetch(url, {
    method: 'get',
    headers,
    timeout,
  }).promise.then(({ body, statusCode }) => {
    const json = decodeBody(body)
    if (json == null) log('响应不是 JSON', url, statusCode)
    return json
  })
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/* -------------------------- URL / 文本 -------------------------- */
export const buildQuery = (params) => {
  const parts = []
  for (const k of Object.keys(params)) {
    const v = params[k]
    if (v === undefined || v === null) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  }
  return parts.join('&')
}

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
}

// B 站搜索会把命中的关键词用 <em class="keyword"> 包起来，
// 直接拿原始标题做「连续子串」判断会被标签割断，所以必须先剥标签。
export const decodeHtml = (str) => {
  if (str == null) return ''
  return String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] || m)
}

// 归一化：去标签、去空白、去标点，便于模糊比对
export const norm = (str) => decodeHtml(str)
  .toLowerCase()
  .replace(/[\s\u3000]+/g, '')
  .replace(/[「」『』【】[\]（）()《》〈〉<>"'`’‘“”·・.,，。、!！?？:：;；~～\-—_|/\\+*&^%$#@=]/g, '')

/* ---------------------------- 时长 ---------------------------- */
// "04:13" / "1:02:33" -> 秒
export const parseDuration = (val) => {
  if (typeof val === 'number') return val
  if (val == null || val === '') return 0
  const parts = String(val).split(':')
  let sec = 0
  for (const p of parts) sec = sec * 60 + (parseInt(p, 10) || 0)
  return sec
}

/* ---------------------------- 封面 ---------------------------- */
// 搜索接口给的 pic 常是 //i2.hdslb.com/... 需要补协议
export const fixPic = (pic) => {
  if (!pic) return ''
  const url = String(pic)
  if (/^https?:/.test(url)) return url
  if (/^\/\//.test(url)) return `https:${url}`
  return `https:${url}`
}
