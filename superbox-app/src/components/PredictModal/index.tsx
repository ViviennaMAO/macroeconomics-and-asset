import { View, Text, ScrollView, Slider, Button } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface PredictModalProps {
  question: string
  options: string[]
  correct: number
  contextLine: string
  onAnswer: (correct: boolean) => void
  onClose: () => void
}

export default function PredictModal({
  question,
  options,
  correct,
  contextLine,
  onAnswer,
  onClose,
}: PredictModalProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  const handleSelect = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    const isCorrect = idx === correct
    setTimeout(() => {
      onAnswer(isCorrect)
    }, 600)
  }

  const getOptionClass = (idx: number) => {
    if (!answered || selected === null) return 'predict-modal__option'
    if (idx === correct) return 'predict-modal__option predict-modal__option--correct'
    if (idx === selected && idx !== correct) return 'predict-modal__option predict-modal__option--wrong'
    return 'predict-modal__option predict-modal__option--dim'
  }

  return (
    <View className='predict-modal'>
      <View className='predict-modal__backdrop' onClick={answered ? onClose : undefined} />
      <View className='predict-modal__sheet'>
        <Text className='predict-modal__context'>{contextLine}</Text>
        <Text className='predict-modal__question'>{question}</Text>
        <View className='predict-modal__options'>
          {options.map((opt, idx) => (
            <View
              key={idx}
              className={getOptionClass(idx)}
              onClick={() => handleSelect(idx)}
            >
              <Text className='predict-modal__option-text'>{opt}</Text>
            </View>
          ))}
        </View>
        {answered && (
          <View className='predict-modal__close' onClick={onClose}>
            <Text className='predict-modal__close-text'>关闭</Text>
          </View>
        )}
      </View>
    </View>
  )
}
