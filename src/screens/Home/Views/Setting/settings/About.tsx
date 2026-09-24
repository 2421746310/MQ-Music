import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Section from '../components/Section'
// import Button from './components/Button'

import { createStyle, openUrl } from '@/utils/tools'
// import { showPactModal } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { showPactModal } from '@/core/common'

// 二改版信息（MingQiu）
// 项目地址（GitHub 仓库）
const PROJECT_REPO = 'https://github.com/2421746310/MQ-Music'
// 上游项目
const UPSTREAM_REPO = 'https://github.com/lyswhut/lx-music-mobile'
const UPSTREAM_RELEASE = 'https://github.com/lyswhut/lx-music-mobile/releases'
const UPSTREAM_FAQ = 'https://lyswhut.github.io/lx-music-doc/mobile/faq'
const UPSTREAM_LICENSE = 'https://github.com/lyswhut/lx-music-mobile#%E9%A1%B9%E7%9B%AE%E5%8D%8F%E8%AE%AE'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const openProjectRepo = () => {
    void openUrl(PROJECT_REPO)
  }
  const openUpstreamRepo = () => {
    void openUrl(UPSTREAM_REPO)
  }
  const openUpstreamRelease = () => {
    void openUrl(UPSTREAM_RELEASE)
  }
  const openFAQPage = () => {
    void openUrl(UPSTREAM_FAQ)
  }
  const openPactModal = () => {
    showPactModal()
  }
  const openPartPage = () => {
    void openUrl(UPSTREAM_LICENSE)
  }

  const textLinkStyle = {
    ...styles.text,
    textDecorationLine: 'underline',
    color: theme['c-primary-font'],
    // fontSize: 14,
  } as const


  return (
    <Section title={t('setting_about')}>
      <View style={styles.part}>
        <Text style={styles.text}>本版本（<Text style={styles.boldText}>MQ Music</Text>）是基于开源项目 </Text>
        <Text style={styles.boldText}>LX Music（洛雪音乐）</Text>
        <Text style={styles.text}> 的二次修改版本。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>二改作者：</Text>
        <Text style={styles.boldText}>MingQiu</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>本项目地址：</Text>
        <TouchableOpacity onPress={openProjectRepo}>
          <Text style={textLinkStyle}>https://github.com/2421746310/MQ-Music</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>原版项目（未内置任何音源，需自行导入）源码地址：</Text>
        <TouchableOpacity onPress={openUpstreamRepo}>
          <Text style={textLinkStyle}>https://github.com/lyswhut/lx-music-mobile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>原版发布页：</Text>
        <TouchableOpacity onPress={openUpstreamRelease}>
          <Text style={textLinkStyle}>GitHub Releases</Text>
        </TouchableOpacity>
        <Text style={styles.text}>（那里只有原版，没有本二改版）</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text} >原版软件的常见问题可转至：</Text>
        <TouchableOpacity onPress={openFAQPage}>
          <Text style={textLinkStyle}>移动版常见问题</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>由于软件开发的初衷仅是为了对新技术的学习与研究，因此软件直至停止维护都将会一直保持纯净。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}><Text style={styles.boldText}>本二改版不含任何广告、引流、加群或关注公众号的要求。</Text>若你安装到的「二改版」有上述内容，那它并不是本版本。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>若在升级新版本时提示「<Text style={styles.boldText}>签名不一致</Text>」，说明新旧安装包并非同一来源，请卸载后重新安装本二改版。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>你已签署本软件的</Text>
        <TouchableOpacity onPress={openPactModal}><Text style={styles.text} color={theme['c-primary-font']}>许可协议</Text></TouchableOpacity>
        <Text style={styles.text}>，协议的在线版本在</Text>
        <TouchableOpacity onPress={openPartPage}><Text style={textLinkStyle}>这里</Text></TouchableOpacity>
        <Text style={styles.text}>。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>By: </Text>
        <Text style={styles.text}>落雪无痕</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>二改 By: </Text>
        <Text style={styles.boldText}>MingQiu</Text>
      </View>
    </Section>
  )
})

const styles = createStyle({
  part: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 14,
    textAlignVertical: 'bottom',
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
  },
  throughText: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    textAlignVertical: 'bottom',
  },
  btn: {
    flexDirection: 'row',
  },
})
