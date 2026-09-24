// 哔哩哔哩音源的公共配置（仅搜索 / 封面 / 歌词，不含取链）

export const API = 'https://api.bilibili.com'

// 请求 B 站接口时用的 UA（B 站对 PC 端 UA 更宽容）
export const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
// 某些接口用移动端 UA
export const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'

// 播放器拉取 B 站媒体流时必须使用的 UA（不含 Android，否则 upos 防盗链会 403）。
// 这个常量本身只是「设置请求头」用，不含任何取链/版权内容，故保留在软件里。
// 它同时被 playList.ts（播放器注入）和独立的取链脚本共用，需保持一致。
export const UA_MEDIA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'

// 拼出某个视频的 Referer（也是「设置请求头」用，无罪，保留）
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

// 搜索结果的排序策略：把「循环播放 / 助眠 / 车载」这类稿件排到后面
// （这些是用户明确不想听到的类型），而不是直接删掉，保证「搜到的都能看到」
export const DEMOTE_EXCLUDED = true
export const EXCLUDE_RE = /(循环播放|单曲循环|无限循环|死循环|一小时|1小时|两小时|小时版|超长版|助眠|催眠|白噪音|睡眠音乐|冥想|沉浸式|车载|开车必备|净化|背景音乐|学习音乐|工作音乐|写作业|纯享版|合集版)/

export const DEBUG = false
