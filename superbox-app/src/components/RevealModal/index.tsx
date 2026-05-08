import { View, Text, ScrollView, Slider, Button } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface RevealModalProps {
  title: string
  delta: string
  explain: string
  twist: string
  onClose: () => void
}

export default function RevealModal({
  title,
  delta,
  explain,
  twist,
  onClose,
}: RevealModalProps) {
  return (
    <View className='reveal-modal'>
      <View className='reveal-modal__backdrop' onClick={onClose} />
      <View className='reveal-modal__card'>
        <Text className='reveal-modal__title'>{title}</Text>
        <Text className='reveal-modal__delta'>{delta}</Text>
        <Text className='reveal-modal__explain'>{explain}</Text>
        <View className='reveal-modal__twist-box'>
          <Text className='reveal-modal__twist'>{twist}</Text>
        </View>
        <View className='reveal-modal__btn' onClick={onClose}>
          <Text className='reveal-modal__btn-text'>继续探索 →</Text>
        </View>
      </View>
    </View>
  )
}
