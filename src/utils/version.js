import { httpGet } from '@/utils/request'
import { openUrl } from '@/utils/tools'

/*
 * 二改版（MQ Music）的更新通道
 *
 * 与原版的区别：
 *   - 原版会依次回落到 GitHub raw / jsDelivr / npm / Gitee 等多个官方源，
 *     拿到的永远是「原版」的版本号与安装包。
 *   - 本版只认二改者自己的更新服务，版本号与更新说明由
 *     /api/app-update/version.json 提供 —— 只有一个几百字节的 JSON，
 *     不占用服务端的下载流量。
 *
 * 【重要】下载链接由服务端动态下发：
 *   version.json 里的 page 字段指向实际的下载入口（二改者可在服务端
 *   自行填写，例如 GitHub Releases 的直链）。
 *
 * version.json 的期望结构：
 *   {
 *     "version": "1.9.1",
 *     "versionCode": 78,
 *     "desc": "更新说明",
 *     "history": [{ "version": "1.9.0", "desc": "..." }],
 *     "page": "https://github.com/xxx/releases/download/xxx.apk"
 *   }
 */

const UPDATE_BASE = 'https://mingqiu.top'
const DEFAULT_DOWNLOAD_PAGE = `${UPDATE_BASE}/download`

const address = [
  [`${UPDATE_BASE}/api/app-update/version.json`, 'direct'],
  ['https://www.mingqiu.top/api/app-update/version.json', 'direct'],
]

// 手动下载页：二改版专用的下载入口（原版发布页里拿不到本版本）
export const getDownloadPageUrl = (info) => (info && info.page) || DEFAULT_DOWNLOAD_PAGE

// 用浏览器打开下载页
export const openDownloadPage = async(info) => {
  await openUrl(getDownloadPageUrl(info))
}

const request = async(url, retryNum = 0) => {
  return new Promise((resolve, reject) => {
    httpGet(url, {
      timeout: 10000,
    }, (err, resp, body) => {
      if (err || resp.statusCode != 200) {
        ++retryNum >= 3
          ? reject(err || new Error(resp.statusMessage || resp.statusCode))
          : request(url, retryNum).then(resolve).catch(reject)
      } else resolve(body)
    })
  })
}

const getDirectInfo = async(url) => {
  return request(url).then(info => {
    if (info.version == null) throw new Error('failed')
    return info
  })
}

export const getVersionInfo = async(index = 0) => {
  const [url, source] = address[index]
  let promise
  switch (source) {
    case 'direct':
      promise = getDirectInfo(url)
      break
  }

  return promise.catch(async(err) => {
    index++
    if (index >= address.length) throw err
    return getVersionInfo(index)
  })
}
