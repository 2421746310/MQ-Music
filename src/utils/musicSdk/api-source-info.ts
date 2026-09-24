// Support qualitys: 128k 320k flac wav
//
// 这里登记的是「内置音源」。洛雪 v1.9.x 起把内置音源的取链实现全部移除了，
// 只留下这个登记表；用户在 设置 -> 音源 里选中的条目会决定
// global.lx.qualityList（也就是「哪些歌曲来源被认为是可播放的」）。
//
// 哔哩哔哩音源是内置实现（见 utils/musicSdk/bilibili/），不依赖任何外部脚本，
// 所以在这里登记。选中它之后 qualityList.bilibili 会被自动填好。

const sources: Array<{
  id: string
  name: string
  disabled: boolean
  supportQualitys: Partial<Record<LX.OnlineSource, LX.Quality[]>>
}> = [
  {
    id: 'bilibili',
    name: '哔哩哔哩',
    disabled: false,
    supportQualitys: {
      bilibili: ['128k', '320k', 'flac', 'flac24bit'],
    },
  },
]

export default sources
