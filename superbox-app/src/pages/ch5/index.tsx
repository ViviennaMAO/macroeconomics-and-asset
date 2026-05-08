import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { markOpened } from '../../utils/progress'
import './index.scss'

export default function Ch5Page() {
  useEffect(() => { markOpened(5) }, [])

  return (
    <ScrollView scrollY className='ch5'>
      <View className='page-header'>
        <Text className='page-title'>🌐 全球分析框架综合</Text>
        <Text className='page-meta'>第 5 章 · G7权重失效与新兴市场崛起</Text>
      </View>

      <View className='edu-card'>
        <Text className='edu-tag'>📝 核心框架</Text>
        <Text className='edu-text'>全球宏观分析需要统一框架：G7+EM权重配比、全球贸易周期同步性、美元流动性潮汐效应。关键工具：全球PMI加权、OECD领先指标合成。</Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>教材用G7 GDP加权代表全球,但2024年G7占全球GDP已从65%降到43%(PPP口径更低至30%)。用旧权重分析全球周期,会系统性低估中国/印度/东盟的影响。</Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>书中GDP权重未用PPP调整,且数据截止~2018。建议：(1)PPP权重vs市场汇率权重双轨对照 (2)加入中国PMI/印度GDP等EM核心指标 (3)用DCC-GARCH模型衡量经济周期动态相关性。</Text>
      </View>

      <View className='coming-soon'>
        <Text className='coming-text'>🚧 互动模拟器开发中...</Text>
        <Text className='coming-sub'>敬请期待 WACC / 多因子模拟器升级</Text>
      </View>

      <View className='further-cta' onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=5' })}>
        <Text>🧩 试试本章 5 道精选题 →</Text>
      </View>
    </ScrollView>
  )
}
