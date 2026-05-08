import { View, Text, ScrollView, Slider, Button } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface SnapshotBarProps {
  items: { key: string; label: string; accent?: 'primary' | 'danger' }[]
  activeKey?: string
  onSelect: (key: string) => void
}

export default function SnapshotBar({ items, activeKey, onSelect }: SnapshotBarProps) {
  return (
    <ScrollView className='snapshot-bar' scrollX enableFlex>
      <View className='snapshot-bar__inner'>
        {items.map((item) => {
          const isActive = item.key === activeKey
          const accentClass = item.accent === 'danger'
            ? 'snapshot-bar__btn--danger'
            : item.accent === 'primary'
            ? 'snapshot-bar__btn--primary'
            : 'snapshot-bar__btn--default'
          const activeClass = isActive ? 'snapshot-bar__btn--active' : ''
          return (
            <View
              key={item.key}
              className={`snapshot-bar__btn ${accentClass} ${activeClass}`}
              onClick={() => onSelect(item.key)}
            >
              <Text className='snapshot-bar__label'>{item.label}</Text>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
