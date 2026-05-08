import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { markOpened } from '../../utils/progress'
import './index.scss'

export default function Ch12Page() {
  useEffect(() => { markOpened(12) }, [])

  return (
    <ScrollView scrollY className='ch12'>
      <View className='page-header'>
        <Text className='page-title'>🔄 汇率案例分析</Text>
        <Text className='page-meta'>第 12 章 · 三元悖论与危机传导机制</Text>
      </View>

      <View className='edu-card'>
        <Text className='edu-tag'>📝 核心框架</Text>
        <Text className='edu-text'>汇率分析的核心框架是三元悖论(Mundell-Fleming)：资本自由流动、固定汇率、货币政策独立性三者不可兼得。案例覆盖：1997亚洲金融危机、2015中国811汇改、1992英镑危机。</Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>教材用三元悖论解释亚洲金融危机,但2015中国"811汇改"证明过渡态比稳态更危险——从固定到浮动的切换本身就是危机触发器,而非解决方案。</Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>书中案例分析偏叙述性,缺乏反事实分析(counterfactual)。建议：(1)用合成控制法(synthetic control)构建反事实 (2)注意幸存者偏差——只分析了"典型"危机,忽略了成功防御的案例(如2018印度) (3)加入数字货币对汇率体系的潜在冲击。</Text>
      </View>

      <View className='coming-soon'>
        <Text className='coming-text'>🚧 互动模拟器开发中...</Text>
        <Text className='coming-sub'>敬请期待 WACC / 多因子模拟器升级</Text>
      </View>

      <View className='further-cta' onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=12' })}>
        <Text>🧩 试试本章 5 道精选题 →</Text>
      </View>
    </ScrollView>
  )
}
