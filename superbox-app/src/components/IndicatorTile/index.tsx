import { View, Text, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import './index.scss'

interface IndicatorTileProps {
  emoji: string
  name: string
  value: string
  status: 'expansion' | 'contraction' | 'neutral'
  hint?: string
  trend?: 'up' | 'down' | 'flat'
  history?: number[]
}

const SPARK_W = 130
const SPARK_H = 20
const SPARK_PAD = 2

const STATUS_COLORS: Record<IndicatorTileProps['status'], string> = {
  expansion: '#4cd964',
  contraction: '#ff4757',
  neutral: '#5a6478',
}

const TREND_ARROWS: Record<NonNullable<IndicatorTileProps['trend']>, string> = {
  up: '↑',
  down: '↓',
  flat: '→',
}

const TREND_COLORS: Record<NonNullable<IndicatorTileProps['trend']>, string> = {
  up: '#4cd964',
  down: '#ff4757',
  flat: '#8b95a8',
}

export default function IndicatorTile({
  emoji,
  name,
  value,
  status,
  hint,
  trend,
  history,
}: IndicatorTileProps) {
  const sparkId = `spark-${name.replace(/\s+/g, '-')}`
  const statusColor = STATUS_COLORS[status]

  useEffect(() => {
    if (!history || history.length < 2) return

    const ctx = Taro.createCanvasContext(sparkId)
    const drawW = SPARK_W - SPARK_PAD * 2
    const drawH = SPARK_H - SPARK_PAD * 2

    const minV = Math.min(...history)
    const maxV = Math.max(...history)
    const range = maxV - minV || 1

    const toX = (i: number) => SPARK_PAD + (i / (history.length - 1)) * drawW
    const toY = (v: number) =>
      SPARK_PAD + drawH - ((v - minV) / range) * drawH

    ctx.setStrokeStyle(statusColor)
    ctx.setLineWidth(1.5)
    ctx.beginPath()
    history.forEach((v, i) => {
      const x = toX(i)
      const y = toY(v)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Last point dot
    const lastX = toX(history.length - 1)
    const lastY = toY(history[history.length - 1])
    ctx.setFillStyle(statusColor)
    ctx.beginPath()
    ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.draw()
  }, [history, statusColor, sparkId])

  return (
    <View className='indicator-tile'>
      {/* Top row: emoji + name */}
      <View className='indicator-tile__header'>
        <Text className='indicator-tile__emoji'>{emoji}</Text>
        <Text className='indicator-tile__name'>{name}</Text>
      </View>

      {/* Value row */}
      <View className='indicator-tile__value-row'>
        <Text
          className='indicator-tile__value'
          style={{ color: statusColor }}
        >
          {value}
        </Text>
        {trend && (
          <Text
            className='indicator-tile__trend'
            style={{ color: TREND_COLORS[trend] }}
          >
            {TREND_ARROWS[trend]}
          </Text>
        )}
      </View>

      {/* Hint */}
      {hint && <Text className='indicator-tile__hint'>{hint}</Text>}

      {/* Sparkline */}
      {history && history.length >= 2 && (
        <Canvas
          className='indicator-tile__spark'
          canvasId={sparkId}
          id={sparkId}
          style={{ width: `${SPARK_W}px`, height: `${SPARK_H}px` }}
        />
      )}
    </View>
  )
}
