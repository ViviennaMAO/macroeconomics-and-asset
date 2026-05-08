import { View, Text, ScrollView, Slider, Button } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}

export default function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: SliderRowProps) {
  return (
    <View className='slider-row'>
      <View className='slider-row__header'>
        <Text className='slider-row__label'>{label}</Text>
        <Text className='slider-row__value'>{value}{unit}</Text>
      </View>
      <Slider
        className='slider-row__slider'
        min={min}
        max={max}
        step={step}
        value={value}
        activeColor='#4a9eff'
        backgroundColor='#2a3045'
        blockColor='#4a9eff'
        blockSize={20}
        onChange={(e) => onChange(e.detail.value)}
      />
    </View>
  )
}
