import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { markOpened } from '../../utils/progress'
import './index.scss'

export default function Ch2Page() {
  useEffect(() => { markOpened(2) }, [])

  return (
    <ScrollView scrollY className='ch2'>
      <View className='page-header'>
        <Text className='page-title'>🇪🇺 欧洲经济分析框架</Text>
        <Text className='page-meta'>第 2 章 · 核心-外围分化与欧元区制度约束</Text>
      </View>

      <View className='edu-card'>
        <Text className='edu-tag'>📝 核心框架</Text>
        <Text className='edu-text'>欧元区分析需关注核心-外围分化：德国经常账户盈余vs南欧赤字、ECB统一利率vs成员国不同通胀、财政纪律约束下的增长困境。关键指标：PMI、ZEW景气指数、TARGET2余额。</Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>统一货币没统一风险——2011年欧债危机,意大利/德国10年期利差飙至550bp。同一个央行、同一种货币,融资成本却天差地别。</Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>书中用同一分析框架覆盖德法意,忽略北欧vs南欧的结构性差异。建议按"核心/外围"分层分析,加入TARGET2余额作为金融碎片化指标。</Text>
      </View>

      <View className='coming-soon'>
        <Text className='coming-text'>🚧 互动模拟器开发中...</Text>
        <Text className='coming-sub'>敬请期待 WACC / 多因子模拟器升级</Text>
      </View>

      <View className='further-cta' onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=2' })}>
        <Text>🧩 试试本章 5 道精选题 →</Text>
      </View>
    </ScrollView>
  )
}
