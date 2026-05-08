import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { markOpened } from '../../utils/progress'
import './index.scss'

export default function Ch8Page() {
  useEffect(() => { markOpened(8) }, [])

  return (
    <ScrollView scrollY className='ch8'>
      <View className='page-header'>
        <Text className='page-title'>📈 美股分析框架</Text>
        <Text className='page-meta'>第 8 章 · EPS×PE分解与集中度陷阱</Text>
      </View>

      <View className='edu-card'>
        <Text className='edu-tag'>📝 核心框架</Text>
        <Text className='edu-text'>S&amp;P 500分析的核心是EPS×PE分解：EPS = 营收/股×利润率，PE受利率/风险偏好/增长预期驱动。Shiller CAPE用10年均值平滑周期波动。</Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>2023年"Magnificent 7"(苹果/微软/谷歌/亚马逊/英伟达/Meta/特斯拉)贡献S&amp;P 60%涨幅——指数级集中度让传统均值分析失效。分析"美股"其实只是在分析7只股票。</Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>书中PE分析用历史均值回归假设,但2010后科技股结构性推高PE中枢(从15x→22x)。建议：(1)区分科技vs非科技PE分别建模 (2)用equity risk premium替代简单PE均值 (3)加入buyback yield——美股回购量已超分红,改变了传统PE估值逻辑。</Text>
      </View>

      <View className='coming-soon'>
        <Text className='coming-text'>🚧 互动模拟器开发中...</Text>
        <Text className='coming-sub'>敬请期待 WACC / 多因子模拟器升级</Text>
      </View>

      <View className='further-cta' onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=8' })}>
        <Text>🧩 试试本章 5 道精选题 →</Text>
      </View>
    </ScrollView>
  )
}
