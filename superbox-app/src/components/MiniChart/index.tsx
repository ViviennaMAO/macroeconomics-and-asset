import { View, Text, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import './index.scss'

interface DataPoint {
  label: string
  value: number
}

interface MiniChartProps {
  id: string
  type: 'line' | 'bar'
  data: DataPoint[]
  title?: string
  unit?: string
  threshold?: { value: number; label: string; color?: string }
  color?: string
  highlightLast?: boolean
  showZeroLine?: boolean
  yAxisFormat?: (v: number) => string
}

const CANVAS_W = 340
const CANVAS_H = 180
const PAD_TOP = 20
const PAD_BOTTOM = 30
const PAD_LEFT = 40
const PAD_RIGHT = 10

export default function MiniChart({
  id,
  type,
  data,
  title,
  unit,
  threshold,
  color = '#4a9eff',
  highlightLast = false,
  showZeroLine = false,
  yAxisFormat,
}: MiniChartProps) {
  useEffect(() => {
    if (!data || data.length === 0) return

    const ctx = Taro.createCanvasContext(id)
    const chartW = CANVAS_W - PAD_LEFT - PAD_RIGHT
    const chartH = CANVAS_H - PAD_TOP - PAD_BOTTOM

    // Compute min/max with 10% padding
    const values = data.map((d) => d.value)
    let minVal = Math.min(...values)
    let maxVal = Math.max(...values)
    const range = maxVal - minVal || 1
    minVal -= range * 0.1
    maxVal += range * 0.1
    const totalRange = maxVal - minVal

    const toX = (i: number) => PAD_LEFT + (i / (data.length - 1 || 1)) * chartW
    const toY = (v: number) => PAD_TOP + chartH - ((v - minVal) / totalRange) * chartH

    // Grid lines (3 horizontal)
    const ticks = 3
    for (let t = 0; t <= ticks; t++) {
      const tickVal = minVal + (totalRange * t) / ticks
      const y = toY(tickVal)
      ctx.setStrokeStyle('rgba(255,255,255,0.05)')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(PAD_LEFT, y)
      ctx.lineTo(CANVAS_W - PAD_RIGHT, y)
      ctx.stroke()

      // Y-axis label
      const label = yAxisFormat ? yAxisFormat(tickVal) : tickVal.toFixed(1)
      ctx.setFillStyle('#8b95a8')
      ctx.setTextAlign('right')
      ctx.setTextBaseline('middle')
      ctx.fillText(label, PAD_LEFT - 4, y)
    }

    // Axes
    ctx.setStrokeStyle('#5a6478')
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(PAD_LEFT, PAD_TOP)
    ctx.lineTo(PAD_LEFT, PAD_TOP + chartH)
    ctx.lineTo(CANVAS_W - PAD_RIGHT, PAD_TOP + chartH)
    ctx.stroke()

    // Zero line
    if (showZeroLine && minVal < 0 && maxVal > 0) {
      const y0 = toY(0)
      ctx.setStrokeStyle('#5a6478')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(PAD_LEFT, y0)
      ctx.lineTo(CANVAS_W - PAD_RIGHT, y0)
      ctx.stroke()
    }

    // Threshold line
    if (threshold && threshold.value >= minVal && threshold.value <= maxVal) {
      const ty = toY(threshold.value)
      const thColor = threshold.color || '#f5a623'
      ctx.setStrokeStyle(thColor)
      ctx.setLineWidth(1)
      ctx.setLineDash([4, 4], 0)
      ctx.beginPath()
      ctx.moveTo(PAD_LEFT, ty)
      ctx.lineTo(CANVAS_W - PAD_RIGHT, ty)
      ctx.stroke()
      ctx.setLineDash([], 0)
      // Threshold label
      ctx.setFillStyle(thColor)
      ctx.setTextAlign('left')
      ctx.setTextBaseline('bottom')
      ctx.fillText(threshold.label, PAD_LEFT + 2, ty - 2)
    }

    // Draw chart data
    if (type === 'line') {
      ctx.setStrokeStyle(color)
      ctx.setLineWidth(2)
      ctx.beginPath()
      data.forEach((point, i) => {
        const x = toX(i)
        const y = toY(point.value)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // Dots
      data.forEach((point, i) => {
        const x = toX(i)
        const y = toY(point.value)
        const isLast = i === data.length - 1
        const radius = highlightLast && isLast ? 6 : 3
        ctx.setFillStyle(color)
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      })
    } else {
      // Bar chart
      const barWidth = (chartW / data.length) * 0.6
      data.forEach((point, i) => {
        const x = toX(i) - barWidth / 2
        const y = toY(Math.max(point.value, minVal))
        const zeroY = toY(Math.max(0, minVal))
        const barH = Math.abs(zeroY - toY(point.value))
        const barY = point.value >= 0 ? y : zeroY
        ctx.setFillStyle(color)
        ctx.fillRect(x, barY, barWidth, barH || 1)
      })

      // Highlight last bar top
      if (highlightLast && data.length > 0) {
        const last = data[data.length - 1]
        const x = toX(data.length - 1)
        const y = toY(last.value)
        ctx.setFillStyle(color)
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // X-axis labels
    const maxLabels = 6
    const step = Math.max(1, Math.ceil(data.length / maxLabels))
    ctx.setFillStyle('#8b95a8')
    ctx.setTextAlign('center')
    ctx.setTextBaseline('top')
    data.forEach((point, i) => {
      if (i % step === 0 || i === data.length - 1) {
        const x = toX(i)
        ctx.fillText(point.label, x, PAD_TOP + chartH + 4)
      }
    })

    ctx.draw()
  }, [data, type])

  return (
    <View className='mini-chart'>
      {title && (
        <Text className='mini-chart__title'>
          {title}
          {unit ? ` (${unit})` : ''}
        </Text>
      )}
      <Canvas
        className='mini-chart__canvas'
        canvasId={id}
        id={id}
        style={{ width: `${CANVAS_W}px`, height: `${CANVAS_H}px` }}
      />
    </View>
  )
}
