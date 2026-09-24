import apiSourceInfo from './api-source-info'

// import temp_api_kw from './kw/api-temp'
// import test_api_kg from './kg/api-test'
// import test_api_kw from './kw/api-test'
// import test_api_tx from './tx/api-test'
// import test_api_wy from './wy/api-test'
// import test_api_mg from './mg/api-test'

// import direct_api_kg from './kg/api-direct'
// import direct_api_kw from './kw/api-direct'
// import direct_api_tx from './tx/api-direct'
// import direct_api_wy from './wy/api-direct'
// import direct_api_mg from './mg/api-direct'

import settingState from '@/store/setting/state'


const apiList = {
  // temp_api_kw,
  // // test_api_bd: require('./bd/api-test'),
  // test_api_kg,
  // test_api_kw,
  // test_api_tx,
  // test_api_wy,
  // test_api_mg,
  // direct_api_kg,
  // direct_api_kw,
  // direct_api_tx,
  // direct_api_wy,
  // direct_api_mg,
  // test_api_tx: require('./tx/api-test'),
  // test_api_wy: require('./wy/api-test'),
  // test_api_xm: require('./xm/api-test'),
}
const supportQuality = {}

for (const api of apiSourceInfo) {
  supportQuality[api.id] = api.supportQualitys
  // for (const source of Object.keys(api.supportQualitys)) {
  //   const path = `./${source}/api-${api.id}`
  //   console.log(path)
  //   apiList[`${api.id}_api_${source}`] = path
  // }
}

const getAPI = source => apiList[`${settingState.setting['common.apiSource']}_api_${source}`]

const apis = source => {
  if (/^user_api/.test(settingState.setting['common.apiSource'])) {
    const api = global.lx.apis?.[source]
    if (!api) throw new Error(`当前音源脚本不支持「${source}」源的取链`)
    return api
  }
  // 二改版：bilibili 是「内置搜索 + 取链走用户导入的脚本」的混合源。
  // 它的取链实现不在软件里（为了规避版权风险），而是由用户导入的自定义源脚本
  // 通过 global.lx.apis 提供。所以这里对 bilibili 特殊处理：优先读脚本，脚本没导入才报错。
  if (source === 'bilibili') {
    const api = global.lx.apis?.[source]
    if (api) return api
    throw new Error('未导入哔哩哔哩取链脚本，请到「设置 → 音源 → 自定义源」导入')
  }
  const api = getAPI(source)
  if (api) return api
  throw new Error('Api is not found')
}

export { apis, supportQuality }
