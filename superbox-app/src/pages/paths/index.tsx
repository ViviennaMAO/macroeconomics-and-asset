import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface PathItem {
  id: string
  emoji: string
  title: string
  tag: string
  level: number
  chapters: number[]
  hook: string
}

const PATHS: PathItem[] = [
  { id: 'quick-start', emoji: '🚀', title: '30分钟搞懂全球宏观', tag: '入门 · 3章 · 30min', level: 2, chapters: [1,5,6], hook: 'G7权重已从65%降到43%' },
  { id: 'dollar-faces', emoji: '💵', title: '美元的两张面孔', tag: '进阶 · 3章 · 45min', level: 4, chapters: [6,7,11], hook: '美元强≠美国强' },
  { id: 'valuation-trio', emoji: '📈', title: '资产定价三件套 NPV/IRR/WACC', tag: '核心 · 4章 · 60min', level: 3, chapters: [1,7,9,4], hook: '同一个NPV三个故事' },
  { id: 'gold-mystery', emoji: '🥇', title: '黄金之谜', tag: '进阶 · 4章 · 50min', level: 4, chapters: [10,7,6,11], hook: '实际利率涨3%金价反涨33%' },
  { id: 'oil-regime', emoji: '🛢️', title: '原油范式变迁', tag: '中级 · 3章 · 35min', level: 3, chapters: [9,5,6], hook: '三种范式两次断裂' },
  { id: 'central-bank', emoji: '🏛️', title: '央行的算盘', tag: '高级 · 3章 · 50min', level: 5, chapters: [11,3,12], hook: '泰勒说13%Fed只到5.5%' },
  { id: 'em-survival', emoji: '🌍', title: '新兴市场生存指南', tag: '进阶 · 4章 · 55min', level: 4, chapters: [4,12,10,6], hook: '资本进来一年出去一周' },
  { id: 'crisis-timeline', emoji: '🔥', title: '危机时间线', tag: '进阶 · 4章 · 50min', level: 4, chapters: [12,4,2,11], hook: '三元悖论是物理定律' },
  { id: 'anti-intuition', emoji: '⚡', title: '反预期速通', tag: '精选 · 6章 · 40min', level: 3, chapters: [1,6,7,10,11,9], hook: '6章6个教材错了时刻' },
]

const CH_LABELS: Record<number, string> = {
  1: 'Ch1 🇺🇸', 2: 'Ch2 🇪🇺', 3: 'Ch3 🇯🇵', 4: 'Ch4 🌍',
  5: 'Ch5 🌐', 6: 'Ch6 💱', 7: 'Ch7 📊', 8: 'Ch8 🔑',
  9: 'Ch9 🛢️', 10: 'Ch10 🥇', 11: 'Ch11 🏛️', 12: 'Ch12 ⚠️',
}

function Stars({ level }: { level: number }) {
  return (
    <Text className='path-stars'>
      {Array.from({ length: 5 }, (_, i) => (
        <Text key={i} className={i < level ? 'star star--on' : 'star star--off'}>★</Text>
      ))}
    </Text>
  )
}

export default function PathsPage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  function goChapter(num: number) {
    Taro.navigateTo({ url: `/pages/ch${num}/index` })
  }

  function toggleExpand(id: string) {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <ScrollView scrollY className='paths-page'>
      <View className='page-header'>
        <Text className='page-title'>🗺️ 学习路径</Text>
        <Text className='page-meta'>9条精选路径 · 按主题串联各章</Text>
      </View>

      {PATHS.map(path => {
        const isOpen = expanded === path.id
        return (
          <View key={path.id} className='path-card' onClick={() => toggleExpand(path.id)}>
            <View className='path-card__head'>
              <Text className='path-card__emoji'>{path.emoji}</Text>
              <View className='path-card__info'>
                <Text className='path-card__title'>{path.title}</Text>
                <Text className='path-card__tag'>{path.tag}</Text>
              </View>
              <Text className='path-card__chevron'>{isOpen ? '▲' : '▼'}</Text>
            </View>

            <View className='path-hook'>
              <Text className='path-hook__icon'>⚡</Text>
              <Text className='path-hook__text'>{path.hook}</Text>
            </View>

            <View className='path-meta'>
              <Stars level={path.level} />
            </View>

            {isOpen && (
              <View className='path-route'>
                <Text className='path-route__label'>章节路线</Text>
                <View className='path-route__pills'>
                  {path.chapters.map((num, idx) => (
                    <View key={num} className='path-route__step'>
                      {idx > 0 && <Text className='path-route__arrow'>→</Text>}
                      <View
                        className='ch-pill'
                        onClick={e => { e.stopPropagation(); goChapter(num) }}
                      >
                        <Text className='ch-pill__text'>{CH_LABELS[num] || `Ch${num}`}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <Text className='path-route__hint'>点击章节卡片直接跳转 →</Text>
              </View>
            )}
          </View>
        )
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}
