import { API, UA_DESKTOP } from './config'
import { fixPic, getJson } from './utils'

// 列表里一般已经带了封面（搜索结果的 pic 字段）。
// 万一没有，就回查一次视频信息拿封面。
export const getPic = (songInfo) => {
  const pic = fixPic(songInfo.img)
  if (pic) return Promise.resolve(pic)

  const bvid = songInfo.songmid
  if (!bvid) return Promise.resolve('')

  return getJson(
    `${API}/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
    { 'User-Agent': UA_DESKTOP, Accept: 'application/json', Referer: `https://www.bilibili.com/video/${bvid}` },
  ).then((view) => {
    if (!view || view.code !== 0 || !view.data) return ''
    return fixPic(view.data.pic)
  }).catch(() => '')
}

export default { getPic }
