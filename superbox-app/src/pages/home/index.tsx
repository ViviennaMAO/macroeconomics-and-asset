import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { parts } from '../../data/chapters'
import { loadProgress, dueReviews, completionRate as calcCompletion } from '../../utils/progress'
import ProgressCard from '../../components/ProgressCard'
import './index.scss'

const TOTAL_CHAPTERS = 12

const NEWS_PLACEHOLDERS = [
  { id: 1, tag: '美联储', title: '鲍威尔：在通胀与就业双重压力下，降息路径仍不明朗', time: '2h ago' },
  { id: 2, tag: '大宗商品', title: 'OPEC+ 意外宣布增产，WTI 原油盘中跌破 $76', time: '4h ago' },
  { id: 3, tag: '黄金', title: '央行购金潮持续，黄金 Q1 净购入量创十年新高', time: '6h ago' },
]

export default function HomePage() {
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set())
  const [progressData, setProgressData] = useState(() => loadProgress())

  useEffect(() => {
    setProgressData(loadProgress())
  }, [])

  const completionRate = useMemo(
    () => calcCompletion(progressData, TOTAL_CHAPTERS),
    [progressData],
  )
  const streakDays = progressData.streakDays
  const dueCount = useMemo(() => dueReviews(progressData).length, [progressData])
  const hasProgress = completionRate > 0 || streakDays > 0

  function togglePart(partNum: number) {
    setExpandedParts((prev) => {
      const next = new Set(prev)
      if (next.has(partNum)) {
        next.delete(partNum)
      } else {
        next.add(partNum)
      }
      return next
    })
  }

  function navigate(path: string) {
    Taro.navigateTo({ url: path })
  }

  function renderStars(difficulty: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} className={`chapter-card__star ${i < difficulty ? 'chapter-card__star--on' : ''}`}>
        ★
      </Text>
    ))
  }

  return (
    <ScrollView scrollY className='home-scroll'>

      {/* ── Hero ── */}
      <View className='hero'>
        <Text className='hero__title'>全球宏观经济分析与大类资产研究</Text>
        <Text className='hero__subtitle'>让陶川的框架 · 在今天的市场上立刻验证</Text>
      </View>

      {/* ── Progress Card ── */}
      {hasProgress && (
        <View className='home-section'>
          <ProgressCard
            completionRate={completionRate}
            streakDays={streakDays}
            dueCount={dueCount}
            onTap={() => navigate('/pages/progress/index')}
          />
        </View>
      )}

      {/* ── Chapter Directory ── */}
      <View className='home-section'>
        <Text className='section-label'>📚 完整目录</Text>
        {parts.map((part) => {
          const isExpanded = expandedParts.has(part.num)
          return (
            <View key={part.num} className='part-block'>
              <View className='part-header' onClick={() => togglePart(part.num)}>
                <View className='part-header__left'>
                  <Text className='part-header__range'>{part.range}</Text>
                  <Text className='part-header__title'>{part.title}</Text>
                </View>
                <View className='part-header__right'>
                  <Text className='part-header__count'>{part.chapters.length}章</Text>
                  <Text className={`part-header__chevron ${isExpanded ? 'part-header__chevron--open' : ''}`}>
                    ›
                  </Text>
                </View>
              </View>

              {isExpanded && (
                <View className='part-chapters'>
                  {part.chapters.map((ch) => (
                    <View
                      key={ch.num}
                      className='chapter-card'
                      onClick={() => ch.pagePath && navigate(ch.pagePath)}
                    >
                      <View className='chapter-card__top'>
                        <Text className='chapter-card__emoji'>{ch.emoji}</Text>
                        <View className='chapter-card__meta'>
                          <View className='chapter-card__title-row'>
                            <Text className='chapter-card__num'>Ch{ch.num}</Text>
                            <Text className='chapter-card__title'>{ch.title}</Text>
                            {ch.tier === 'mvp' && (
                              <Text className='chapter-card__mvp'>⭐ MVP</Text>
                            )}
                          </View>
                          <View className='chapter-card__stars'>
                            {renderStars(ch.difficulty)}
                          </View>
                        </View>
                      </View>
                      <Text className='chapter-card__brief'>{ch.brief}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </View>

      {/* ── Feature Cards ── */}
      <View className='home-section'>
        <Text className='section-label'>探索功能</Text>

        <View
          className='feature-card blue'
          onClick={() => navigate('/pages/paths/index')}
        >
          <Text className='feature-icon'>🗺️</Text>
          <View className='feature-body'>
            <Text className='feature-title'>学习地图</Text>
            <Text className='feature-desc'>9条主题路径打乱书本顺序</Text>
          </View>
          <Text className='feature-arrow'>›</Text>
        </View>

        <View
          className='feature-card amber'
          onClick={() => navigate('/pages/mvp/index')}
        >
          <Text className='feature-icon'>⭐</Text>
          <View className='feature-body'>
            <Text className='feature-title'>反预期精选</Text>
            <Text className='feature-desc'>每章一个"教材错了"的冲击时刻</Text>
          </View>
          <Text className='feature-arrow'>›</Text>
        </View>

        <View
          className='feature-card purple'
          onClick={() => navigate('/pages/quiz/index')}
        >
          <Text className='feature-icon'>🧩</Text>
          <View className='feature-body'>
            <Text className='feature-title'>跨章测验</Text>
            <Text className='feature-desc'>从12章随机抽题，检验融会贯通</Text>
          </View>
          <Text className='feature-arrow'>›</Text>
        </View>

        <View
          className='feature-card green'
          onClick={() => navigate('/pages/glossary/index')}
        >
          <Text className='feature-icon'>📖</Text>
          <View className='feature-body'>
            <Text className='feature-title'>词汇附录</Text>
            <Text className='feature-desc'>50+核心术语一键查阅</Text>
          </View>
          <Text className='feature-arrow'>›</Text>
        </View>
      </View>

      {/* ── Today's News ── */}
      <View className='home-section'>
        <View className='news-header'>
          <Text className='section-label'>📰 今日市场 Top 10</Text>
          <Text className='news-more' onClick={() => navigate('/pages/news/index')}>
            全部 ›
          </Text>
        </View>
        <View className='news-list'>
          {NEWS_PLACEHOLDERS.map((item) => (
            <View key={item.id} className='news-item'>
              <View className='news-item__top'>
                <Text className='news-item__tag'>{item.tag}</Text>
                <Text className='news-item__time'>{item.time}</Text>
              </View>
              <Text className='news-item__title'>{item.title}</Text>
            </View>
          ))}
        </View>
        <View className='news-view-all' onClick={() => navigate('/pages/news/index')}>
          <Text className='news-view-all__text'>查看全部 Top 10 →</Text>
        </View>
      </View>

      {/* ── Footer ── */}
      <View className='home-footer'>
        <Text className='home-footer__text'>
          基于陶川《全球宏观经济分析与大类资产研究》· 方法论批评版
        </Text>
      </View>

    </ScrollView>
  )
}
