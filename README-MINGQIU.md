# MQ Music · 基于 LX Music 的二改版

基于 [lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile) 的二次修改版本，
**把「哔哩哔哩」做成了内置音源**，装完直接能搜能播，不需要再导入任何自定义音源脚本。

- 应用名：**MQ Music**（内置包名 `top.mingqiu.lxmusic`，可与官方版共存）
- 许可：沿用上游 **Apache License 2.0**（见 `LICENSE`），本二改版同样以 Apache-2.0 发布
- 上游版本：`1.9.1`

---

## 一、和上游的区别

### 1. 内置哔哩哔哩音源（核心改动）

上游从 v1.9.x 起不再内置任何「取播放链接」能力，只保留搜索。
本版把 B 站做成一个**和酷我/酷狗平级的内置音源**：

| 能力 | 说明 |
|---|---|
| 搜索 | 用 B 站视频搜索，标题即视频标题，歌手即 UP 主 |
| 听歌 | 直接解析该视频的 **DASH 音频流**（192K，支持听 Hi-Res FLAC） |
| 歌词 | 从视频字幕里取 |
| 封面 | 取视频封面 |

相关文件都在 `src/utils/musicSdk/bilibili/`：

```
index.js        音源入口，导出 musicSearch / getMusicUrl / getLyric / getPic
musicSearch.js  B 站视频搜索（含匹配评分：歌名、歌手、时长、系列名）
musicUrl.js     取音频直链（DASH 优先，html5 渐进流兜底）
config.js       常量：API 地址、UA、音质映射、防盗链说明
lyric.js        字幕取歌词
pic.js          封面
utils.js        通用工具
```

### ★ 关键实现细节：B 站防盗链的两个并列条件

**这是整个改动的技术核心，写在这里免得后人重踩。**

B 站主 CDN `upos-*.bilivideo.com` 的防盗链要求**同时满足两个条件**，缺一即 403：

| | 条件 |
|---|---|
| ① | 请求必须带 `Referer: https://www.bilibili.com/video/<bvid>` |
| ② | **User-Agent 里不能出现 `Android`** |

条件 ② 非常反直觉 —— 桌面 Chrome、Linux Firefox、iPhone Safari、甚至裸 `Mozilla/5.0`
都能过，唯独任何含 `Android` 的 UA 一律 403。而**洛雪内置播放器的 UA 恰好写死成
Pixel 3（含 Android）**，且 `musicUrl` 协议只允许返回纯 URL、不允许附带请求头，
所以两个条件都不满足 → 上游版本取到的 upos 链接必然 403。

实测矩阵（3 个 upos 样本 × 7 种 UA）：

```
只带 UA、不带 Referer            upos 0/3 ❌   mcdn 2/2 ✅
带 Referer 时：
  Chrome 120 / Win               upos 3/3 ✅
  Edge 89 / Win                  upos 3/3 ✅
  Firefox 115 / Linux            upos 3/3 ✅
  iPhone Safari 13               upos 3/3 ✅
  裸 Mozilla/5.0                 upos 3/3 ✅
  Android Chrome 120             upos 0/3 ❌  ← 关键
  Pixel 3（洛雪内置 UA）          upos 0/3 ❌  ← 「大部分歌不能播」的真正原因
```

**本版的解法**（三处配合）：

1. `src/plugins/player/playList.ts` 新增 `getTrackOverride()` ——
   对 bilibili 音源注入 `userAgent`（iPhone UA）和 `headers.Referer`，
   再交给播放器（RNTP 的原生侧 `Track.java` 会把 headers 透传给 ExoPlayer）
2. `src/utils/musicSdk/bilibili/musicUrl.js` 取链时用**同一套 UA + Referer** 探测可用性
3. `src/utils/musicSdk/bilibili/config.js` 提供 `UA_MEDIA` 和 `buildReferer()`

只有 `*.mcdn.bilivideo.cn`（PCDN 节点）两个条件都不校验，但它不是每条都有。
`platform=html5` 的渐进流也不校验，但体积 14~40MB/首，所以只作兜底。

### 2. 更新通道（检测走自有服务，下载链接由服务端下发）

- `src/utils/version.js`：更新检查只认二改者自己的更新服务
  （`/api/app-update/version.json`），上游那一堆 GitHub / jsDelivr / Gitee 源全部移除
- **不做应用内下载**：点「更新」用浏览器打开 `version.json` 里 `page` 字段指向的下载页，
  下载链接由服务端动态下发（可在后台填写 GitHub Releases 等直链）
- `src/core/version.ts`、`VersionModal.tsx`：移除下载/安装流程

### 3. 其它

- Android `applicationId` 改为 `top.mingqiu.lxmusic`，**可与官方版共存**，互不覆盖
- 应用名 `MQ Music`（含侧边栏、桌面歌词占位、关于页等包内文案）
- 默认主题「热情似火」（`red`）；搜索页默认选中「小站音乐」（哔哩哔哩）
- 启动图标换成自有设计（5 个密度的 `ic_launcher` / `ic_launcher_round` / `ic_launcher_foreground`）
- 「关于」页说明是基于 LX Music 的二改，并署名

---

## 二、怎么构建

### 依赖

```bash
npm install          # 或 npm ci
```

> 仓库自带 `.npmrc`，registry 指向 `registry.npmmirror.com`（国内镜像）。
> 如果你在海外或不想用镜像，删掉 `.npmrc` 即可，不影响构建。

### 打 release APK

```bash
cd android
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

产物在 `android/app/build/outputs/apk/release/`。

`android/gradle/wrapper/gradle-wrapper.properties` 已经把 Gradle 发行版换成
腾讯云镜像的 `gradle-8.8-bin.zip`（原版是 `services.gradle.org` 的 `-all` 包）。
想换回官方源就改这一行，**但别改回 `-all`**，原因见第三节。

### 签名

**仓库里不含任何签名密钥**（`.gitignore` 已排除 `*.keystore` 与 `keystore.properties`）。

没有 `android/keystore.properties` 时会**自动退回 debug 签名**并打印警告，
所以 clone 下来即可直接构建、装到手机测试。

要正式发布就自己生成一个：

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/my-release.keystore \
  -alias mykey -keyalg RSA -keysize 2048 -validity 10000
```

然后建 `android/keystore.properties`：

```properties
storeFile=my-release.keystore
storePassword=你的库密码
keyAlias=mykey
keyPassword=你的密钥密码
```

> ⚠️ **这个文件千万别提交到公开仓库。** 一旦泄露，任何人都能用你的签名打包
> 伪造更新覆盖已安装的 App。仓库的 `.gitignore` 已排除它，别绕过。

---

## 三、Windows 上构建的坑（实测踩过，供参考）

如果你在 Windows 上从源码构建，可能会撞到这些，都不是项目本身的问题：

| 现象 | 原因 | 处理 |
|---|---|---|
| `npm install` 卡住几十分钟无输出 | 部分 git 依赖走 HTTPS 拉取，而 Windows 的 schannel TLS 后端可能失效（`SEC_E_NO_CREDENTIALS`） | 改用 tarball 方式从 `codeload.github.com` 下载；或给 git 加 `-c http.sslBackend=openssl` |
| Gradle 解压发行版卡到像死机 | wrapper 默认用 `-all` 包（含全部文档源码，解压 >1GB、几万个小文件，Defender 逐文件扫描只有 0.5MB/s） | **本仓库已改为腾讯云镜像的 `-bin` 包**（138MB，解压 150MB）。若你换回官方源，记得也用 `-bin` |
| `Could not download ... Read timed out` | 直连 `repo.maven.apache.org` 超时 | 用国内 Maven 镜像（阿里云 / 华为云 / 腾讯云），并确认**没有**把 `HTTP_PROXY`/`HTTPS_PROXY` 传给它 |
| 依赖下载只有 1MB/s 还中途卡死 | **Java 会自动读取 `HTTP_PROXY`/`HTTPS_PROXY`**，把 Gradle 的流量全塞进代理 | 构建前 `unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy` 并 `NO_PROXY=*` |
| `Cannot find a Java installation matching {languageVersion=17}` | RN 的 `@react-native/gradle-plugin` 子工程要求 toolchain 17；Gradle 默认去 foojay 自动下载，而 foojay 会 302 到 GitHub（国内不可达） | 单独装一个 JDK 17，在 **`~/.gradle/gradle.properties`**（不是项目里的）写 `org.gradle.java.installations.paths=<JDK17路径>` 和 `auto-download=false`。子工程是 included build，只认 GRADLE_USER_HOME 的配置 |
| `[CXX1101] NDK ... did not have a source.properties file` | 有 3 个原生依赖要现场编译 C++（`react-native-pager-view`、`react-native-quick-base64`、`react-native-quick-md5`），**必须装 NDK** | 装 `26.1.10909125`（= r26b），目录名必须**正好是版本号**。Windows 上 `Sdk\ndk\<版本号>\source.properties` |

---

## 四、目录说明

只列二改相关的：

```
src/utils/musicSdk/bilibili/     哔哩哔哩音源（本版新增）
src/utils/musicSdk/index.js      音源注册
src/utils/musicSdk/api-source-info.ts  音源元信息
src/plugins/player/playList.ts   播放器：getTrackOverride() 注入 UA / Referer
src/utils/version.js             更新源：检测走自有服务
src/core/version.ts              版本比较与更新流程
src/screens/.../About.tsx        署名页（说明是 LX 二改）
android/app/src/main/res/mipmap-*/                启动图标
android/app/src/main/AndroidManifest.xml          包名 / 应用名
```

---

## 五、免责声明

- 本项目仅供**个人学习与技术研究**使用
- 音源内容均来自第三方平台公开接口，本项目不存储、不转发、不分发任何音频内容
- 请勿用于任何商业用途；请在下载后 24 小时内删除
- 因使用本软件产生的一切后果由使用者自行承担

上游项目地址：<https://github.com/lyswhut/lx-music-mobile>
