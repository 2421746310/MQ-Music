// Support qualitys: 128k 320k flac wav
//
// 这里登记的是「内置音源」。洛雪 v1.9.x 起把内置音源的取链实现全部移除了，
// 只留下这个登记表；用户在 设置 -> 音源 里选中的条目会决定
// global.lx.qualityList（也就是「哪些歌曲来源被认为是可播放的」）。
//
// 本二改版为了规避版权风险，不内置任何取链实现；音源由用户通过
// 「设置 -> 音源 -> 自定义源」自行导入脚本（如 bilibili-lx.js）。
// 注意：bilibili 的「搜索」仍是内置的（见 utils/musicSdk/bilibili/musicSearch.js），
// 但它不出现在这个可选源列表里 —— 用户导入取链脚本后即可播放搜到的 B 站视频。

const sources: Array<{
  id: string
  name: string
  disabled: boolean
  supportQualitys: Partial<Record<LX.OnlineSource, LX.Quality[]>>
}> = []

export default sources
