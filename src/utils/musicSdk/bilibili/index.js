import musicSearch from './musicSearch'
import { getLyric } from './lyric'
import { getPic } from './pic'
import { apis } from '../api-source'
import { QUALITYS } from './config'

export { QUALITYS }

// 说明：
// 洛雪 v1.9.x 起不再内置任何「取播放链接」的能力，但「搜索」仍然由内置 SDK 提供。
// 所以这里把 B 站做成一个和酷我/酷狗平级的内置音源：
//   搜索结果 = B 站视频本身（标题即视频标题，歌手即 UP 主）
//   取播放链接 = 转发给自定义源脚本（global.lx.apis），由用户自行导入的音源脚本实现。
//                本仓库为了规避版权风险，不内置取链实现。
const bilibili = {
  musicSearch,

  getMusicUrl(songInfo, type) {
    return apis('bilibili').getMusicUrl(songInfo, type)
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
