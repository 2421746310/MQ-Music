import { decodeHtml } from './utils'

// B 站本身不提供歌词。
// 这里返回一条占位歌词（必须带时间标签，否则洛雪会认为取词失败，
// 进而触发「切换到其他音源」——那样正在播的 B 站视频会被换掉）。
// 用户可在播放页手动切到别的音源取词，或用「搜索歌词」功能。
const buildPlaceholder = (songInfo) => {
  const name = decodeHtml(songInfo.name) || '哔哩哔哩音频'
  const singer = decodeHtml(songInfo.singer) || '未知 UP 主'
  return {
    lyric: `[00:00.000]${name} - ${singer}\n`,
    // tlyric / rlyric 给空串而不是 null，这样洛雪会走「歌词已缓存」的分支
    tlyric: '',
    rlyric: '',
    lxlyric: '',
  }
}

export const getLyric = (songInfo) => {
  return {
    promise: Promise.resolve(buildPlaceholder(songInfo)),
    cancelHttp() {},
  }
}

export default { getLyric }
