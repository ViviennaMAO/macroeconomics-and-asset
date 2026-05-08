import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { markOpened } from '../../utils/progress'
import './index.scss'

export default function Ch3Page() {
  useEffect(() => { markOpened(3) }, [])

  return (
    <ScrollView scrollY className='ch3'>
      <View className='page-header'>
        <Text className='page-title'>🇯🇵 日本经济分析框架</Text>
        <Text className='page-meta'>第 3 章 · 失去的三十年与通缩突破路径</Text>
      </View>

      <View className='edu-card'>
        <Text className='edu-tag'>📝 核心框架</Text>
        <Text className='edu-text'>日本经济分析的核心是"失去的三十年"：零利率困境、QQE效果、日元汇率与通胀的关系。关键框架：流动性陷阱假说vs汇率传导假说。</Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>教材说QQE失败因为"流动性陷阱",但2022-24日元贬值50%后通胀终于突破2%——不是流动性陷阱,是没贬够。汇率才是打破通缩的真正武器。</Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>书中用Phillips曲线分析日本通胀,但日本Phillips曲线1995后已平坦化(R²&lt;0.1)。建议用非线性Phillips或直接建模通胀预期锚定——日本的问题不是工资-物价螺旋,而是预期锚定在0%。</Text>
      </View>

      <View className='coming-soon'>
        <Text className='coming-text'>🚧 互动模拟器开发中...</Text>
        <Text className='coming-sub'>敬请期待 WACC / 多因子模拟器升级</Text>
      </View>

      <View className='further-cta' onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=3' })}>
        <Text>🧩 试试本章 5 道精选题 →</Text>
      </View>
    </ScrollView>
  )
}
