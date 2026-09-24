// 哔哩哔哩音源的公共配置

export const API = 'https://api.bilibili.com'

// 请求 B 站接口时用的 UA（B 站对 PC 端 UA 更宽容）
export const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
// 取 html5 渐进流时必须用移动端 UA
export const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'

/*
 * 【极重要】播放器拉取媒体流时必须使用的 UA。
 *
 * 2026-09-23 实测结论（在真实网络下做的 UA × Referer 矩阵，样本见 test/probe-ua-matrix.mjs）：
 *
 *   upos-*.bilivideo.com（B 站主 CDN，绝大多数稿件返回的就是这一族）
 *     - 不带 Referer            -> 一律 403
 *     - 带 Referer 但 UA 含 Android -> 仍然 403   ← 洛雪默认的 Pixel 3 UA 正踩这一条
 *     - 带 Referer 且 UA 不含 Android -> 206 + ftyp  ✅
 *
 * 也就是说「403」有两个并列条件，缺一不可：
 *   ① 必须有 Referer（由 playList.ts 注入到 track 的 headers 里，见下）
 *   ② UA 里不能出现 Android（B 站对 Android 客户端走另一套带签名的防盗链，普通直链会被拒）
 *
 * *.mcdn.bilivideo.cn（PCDN）不校验这两项，用什么都行，所以它是最稳的一档。
 *
 * 这个常量的值同时被三处使用，必须保持一致，否则「探测通过」和「播放器实际请求」会不一致：
 *   - playList.ts 的 getTrackHeaders() / userAgent   -> 真正播放时的请求头
 *   - musicUrl.js 的 checkUrl()                      -> 取链前的可用性实测
 *   - musicUrl.js 取 html5 渐进流时的接口 UA
 */
export const UA_MEDIA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'

// 洛雪播放器原有的 UA（UA 里含 Android）。保留仅作对照，不要用它去拉 upos。
export const UA_PLAYER = 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Mobile Safari/537.36'

// 媒体流必须携带的 Referer 模板，{bvid} 会被替换成视频号。
// playList.ts 的 getTrackHeaders() 用同样的拼法，改这里要同步改那边。
export const REFERER_TPL = 'https://www.bilibili.com/video/{bvid}'
// 拼出某个视频的 Referer
export const buildReferer = (bvid) => `https://www.bilibili.com/video/${bvid}`

// 【优先 UP】JLRS-LeoFM，「在百万豪装录音棚大声听」系列的作者
export const PREFER_CHANNEL_MID = '3493093607213343'
export const PREFER_CHANNEL_NAME = 'JLRS-LeoFM'
// 【优先系列】标题里带这些字样的稿件排在最前面
export const PREFER_PHRASES = ['在百万豪装录音棚大声听']

// 向内层注册的音质（B 站实际没有 flac，注册它们只是为了不被洛雪降级过滤）
export const QUALITYS = ['128k', '320k', 'flac', 'flac24bit']
// 用于估算文件体积的码率（kbps）
export const QUALITY_BITRATE = { '128k': 128, '320k': 320, 'flac': 900, 'flac24bit': 1300 }

// 每页条数（B 站搜索接口上限 20）
export const PAGE_SIZE = 20
export const TIMEOUT = 15000

// 取流相关
// v2：播放器已能带 Referer（见 playList.ts 的 getTrackHeaders），
// 所以优先吃 DASH 音轨（192K AAC / Hi-Res FLAC），html5 只作兜底。
export const HTML5_FALLBACK = true
// 64 = 720p（音频约 128k）；16 = 360p（音频约 64k，更省流量）
export const HTML5_QN = 64
// 实测直链是否可用（多 1~3 次 Range 请求，但能避开 403 的死链）
export const VERIFY_URL = true
// 直链缓存时长，B 站直链 deadline 约 2 小时
export const CACHE_TTL = 20 * 60 * 1000

// 搜索结果的排序策略：把「循环播放 / 助眠 / 车载」这类稿件排到后面
// （这些是用户明确不想听到的类型），而不是直接删掉，保证「搜到的都能看到」
export const DEMOTE_EXCLUDED = true
export const EXCLUDE_RE = /(循环播放|单曲循环|无限循环|死循环|一小时|1小时|两小时|小时版|超长版|助眠|催眠|白噪音|睡眠音乐|冥想|沉浸式|车载|开车必备|净化|背景音乐|学习音乐|工作音乐|写作业|纯享版|合集版)/

export const DEBUG = false
