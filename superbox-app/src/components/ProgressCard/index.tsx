import { View, Text, ScrollView, Slider, Button } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface ProgressCardProps {
  completionRate: number
  streakDays: number
  dueCount: number
  onTap: () => void
}

export default function ProgressCard({
  completionRate,
  streakDays,
  dueCount,
  onTap,
}: ProgressCardProps) {
  if (completionRate <= 0 && streakDays <= 0) return null

  const clampedRate = Math.min(100, Math.max(0, completionRate))

  return (
    <View className='progress-card' onClick={onTap}>
      <View className='progress-card__stat'>
        <View className='progress-card__stat-header'>
          <Text className='progress-card__stat-label'>完成率</Text>
          <Text className='progress-card__stat-value progress-card__stat-value--blue'>
            {clampedRate}%
          </Text>
        </View>
        <View className='progress-card__bar-bg'>
          <View
            className='progress-card__bar-fill'
            style={{ width: `${clampedRate}%` }}
          />
        </View>
      </View>

      <View className='progress-card__divider' />

      <View className='progress-card__stat progress-card__stat--center'>
        <Text className='progress-card__stat-label'>连续打卡</Text>
        <Text className='progress-card__stat-value progress-card__stat-value--amber'>
          🔥 {streakDays}天
        </Text>
      </View>

      <View className='progress-card__divider' />

      <View className='progress-card__stat progress-card__stat--center'>
        <Text className='progress-card__stat-label'>待复习</Text>
        <Text className='progress-card__stat-value progress-card__stat-value--red'>
          {dueCount}
        </Text>
      </View>
    </View>
  )
}
