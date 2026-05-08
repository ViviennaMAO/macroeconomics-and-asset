import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { loadProgress, dueReviews, completionRate, ProgressData, ReviewItem } from '../../utils/progress'
import { parts } from '../../data/chapters'
import './index.scss'

const TOTAL_CHAPTERS = 12

// Flatten all chapters for lookup
const allChapters = parts.flatMap(p => p.chapters)

function chapterName(num: number): string {
  const ch = allChapters.find(c => c.num === num)
  return ch ? `${ch.emoji} ${ch.title}` : `第${num}章`
}

function chapterEmoji(num: number): string {
  const ch = allChapters.find(c => c.num === num)
  return ch?.emoji ?? '📖'
}

function streakEmoji(days: number): string {
  if (days >= 30) return '🔥🔥🔥'
  if (days >= 14) return '🔥🔥'
  if (days >= 7) return '🔥'
  if (days >= 3) return '✨'
  return '🌱'
}

function accuracyBar(correct: number, attempts: number): string {
  if (attempts === 0) return '—'
  const pct = Math.round((correct / attempts) * 100)
  const filled = Math.round(pct / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${pct}%`
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null)

  useEffect(() => {
    setData(loadProgress())
  }, [])

  if (!data) {
    return (
      <View className='progress-page'>
        <View className='progress-loading'>
          <Text className='progress-loading__text'>加载中…</Text>
        </View>
      </View>
    )
  }

  const completed = completionRate(data, TOTAL_CHAPTERS)
  const completedCount = Math.round(completed * TOTAL_CHAPTERS)
  const pct = Math.round(completed * 100)
  const due = dueReviews(data)

  const openedNums = Object.keys(data.chapters)
    .map(n => parseInt(n, 10))
    .filter(n => data.chapters[n]?.firstOpenedAt)

  function goChapter(num: number) {
    Taro.navigateTo({ url: `/pages/ch${num}/index` })
  }

  function goQuiz(num?: number) {
    const url = num ? `/pages/quiz/index?ch=${num}` : '/pages/quiz/index'
    Taro.navigateTo({ url })
  }

  return (
    <ScrollView scrollY className='progress-page'>
      <View className='page-header'>
        <Text className='page-title'>📊 学习进度</Text>
        <Text className='page-meta'>追踪你的掌握程度 · 艾宾浩斯复习提醒</Text>
      </View>

      {/* Completion Overview */}
      <View className='progress-overview panel'>
        <Text className='panel-tag'>总体进度</Text>
        <View className='progress-overview__main'>
          <View className='progress-overview__circle'>
            <Text className='progress-overview__pct'>{pct}%</Text>
            <Text className='progress-overview__label'>完成</Text>
          </View>
          <View className='progress-overview__stats'>
            <Text className='progress-overview__stat'>
              <Text className='progress-overview__stat-num'>{completedCount}</Text>
              <Text className='progress-overview__stat-unit'> / {TOTAL_CHAPTERS} 章已完成</Text>
            </Text>
            <Text className='progress-overview__stat'>
              <Text className='progress-overview__stat-num'>{openedNums.length}</Text>
              <Text className='progress-overview__stat-unit'> 章已浏览</Text>
            </Text>
            <Text className='progress-overview__stat'>
              <Text className='progress-overview__stat-num'>{due.length}</Text>
              <Text className='progress-overview__stat-unit'> 章待复习</Text>
            </Text>
          </View>
        </View>
        <View className='progress-bar-track'>
          <View className='progress-bar-fill' style={{ width: `${pct}%` }} />
        </View>
        <Text className='progress-bar-label'>{pct}% · {completedCount}/{TOTAL_CHAPTERS} 章</Text>
      </View>

      {/* Streak */}
      <View className='panel streak-panel'>
        <Text className='panel-tag'>学习连续天数</Text>
        <View className='streak-row'>
          <Text className='streak-emoji'>{streakEmoji(data.streakDays)}</Text>
          <Text className='streak-days'>{data.streakDays}</Text>
          <Text className='streak-unit'>天连续学习</Text>
        </View>
        {data.lastActiveDate && (
          <Text className='streak-last'>上次活跃：{data.lastActiveDate}</Text>
        )}
        {data.streakDays === 0 && (
          <Text className='streak-cta'>今天学一章，开启你的连续记录 →</Text>
        )}
      </View>

      {/* Due Reviews */}
      {due.length > 0 && (
        <View className='panel'>
          <Text className='panel-tag'>⏰ 今日待复习 ({due.length})</Text>
          {due.map((item: ReviewItem) => (
            <View key={item.num} className='review-item' onClick={() => goChapter(item.num)}>
              <Text className='review-item__emoji'>{chapterEmoji(item.num)}</Text>
              <View className='review-item__info'>
                <Text className='review-item__name'>{chapterName(item.num)}</Text>
                <Text className='review-item__level'>复习等级 {item.level}/5</Text>
              </View>
              <Text className='review-item__cta'>去复习 →</Text>
            </View>
          ))}
        </View>
      )}

      {due.length === 0 && (
        <View className='panel due-empty'>
          <Text className='due-empty__icon'>🎉</Text>
          <Text className='due-empty__text'>今日无待复习内容，继续新章节吧！</Text>
        </View>
      )}

      {/* Chapter-by-chapter stats */}
      <View className='panel'>
        <Text className='panel-tag'>各章详情</Text>
        {allChapters.map(ch => {
          const stat = data.chapters[ch.num]
          const hasData = !!stat
          return (
            <View key={ch.num} className={`ch-stat-row ${hasData ? 'ch-stat-row--active' : 'ch-stat-row--locked'}`}>
              <View className='ch-stat-row__left'>
                <Text className='ch-stat-row__emoji'>{ch.emoji}</Text>
                <View className='ch-stat-row__info'>
                  <Text className='ch-stat-row__title'>Ch{ch.num} {ch.title}</Text>
                  {hasData ? (
                    <View className='ch-stat-row__bars'>
                      <Text className='ch-stat-bar'>
                        预测准确率: {accuracyBar(stat.predictCorrect, stat.predictAttempts)}
                      </Text>
                      {stat.quizScore !== undefined && (
                        <Text className='ch-stat-bar'>
                          测验得分: {stat.quizScore}分
                        </Text>
                      )}
                      {stat.completed && (
                        <Text className='ch-stat-complete'>✓ 已完成</Text>
                      )}
                    </View>
                  ) : (
                    <Text className='ch-stat-row__unstarted'>尚未开始</Text>
                  )}
                </View>
              </View>
              <View className='ch-stat-row__actions'>
                {hasData && (
                  <View className='ch-stat-btn' onClick={() => goQuiz(ch.num)}>
                    <Text className='ch-stat-btn__text'>测验</Text>
                  </View>
                )}
                <View className='ch-stat-btn ch-stat-btn--ghost' onClick={() => goChapter(ch.num)}>
                  <Text className='ch-stat-btn__text'>→</Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>

      {/* Quick action */}
      <View className='further-cta' onClick={() => goQuiz()}>
        <Text>🎯 开始随机10题综合测验 →</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}
