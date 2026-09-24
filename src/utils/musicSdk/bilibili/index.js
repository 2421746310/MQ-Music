import musicSearch from './musicSearch'
import { getLyric } from './lyric'
import { getPic } from './pic'
import { resolvePlayUrl } from './musicUrl'
import { QUALITYS } from './config'

export { QUALITYS }

// 说明：
// 洛雪 v1.9.x 起不再内置任何「取播放链接」的能力，但「搜索」仍然由内置 SDK 提供。
// 所以这里把 B 站做成一个和酷我/酷狗平级的内置音源：
//   搜索结果 = B 站视频本身（标题即视频标题，歌手即 UP 主）
//   取播放链接 = 直接解析该视频的音频流（不依赖任何外部脚本）
const bilibili = {
  musicSearch,

  getMusicUrl(songInfo, type) {
    return {
      promise: resolvePlayUrl(songInfo.songmid, type).then((url) => ({ url, type })),
      cancelHttp() {},
    }
  },

  getLyric(songInfo) {
    return getLyric(songInfo)
  },

  getPic(songInfo) {
    return getPic(songInfo)
  },

  getMusicDetailPageUrl(songInfo) {
    return `https://www.bilibili.com/video/${songInfo.songmid}`
  },
}

export default bilibili
