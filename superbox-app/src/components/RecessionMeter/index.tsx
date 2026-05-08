import { View, Text, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import './index.scss'

interface Signal {
  name: string
  triggered: boolean
  weight: number
}

interface RecessionMeterProps {
  probability: number
  signals: Signal[]
  asOfDate?: string
}

const CANVAS_SIZE = 180
const CX = 90
const CY = 100
const RADIUS = 64
const STROKE_W = 12
// 270° arc from 135° to 45° (going clockwise through bottom)
const START_ANGLE = (135 * Math.PI) / 180
const END_ANGLE = (45 * Math.PI) / 180
const TOTAL_ARC = (270 * Math.PI) / 180

function gaugeColor(prob: number): string {
  if (prob < 30) return '#4cd964'
  if (prob < 60) return '#f5a623'
  return '#ff4757'
}

export default function RecessionMeter({
  probability,
  signals,
  asOfDate,
}: RecessionMeterProps) {
  const clamped = Math.min(100, Math.max(0, probability))
  const color = gaugeColor(clamped)
  const canvasId = 'recession-meter-canvas'

  useEffect(() => {
    const ctx = Taro.createCanvasContext(canvasId)

    // Background arc
    ctx.setStrokeStyle('#2a3045')
    ctx.setLineWidth(STROKE_W)
    ctx.beginPath()
    ctx.arc(CX, CY, RADIUS, START_ANGLE, START_ANGLE + TOTAL_ARC)
    ctx.stroke()

    // Filled arc
    if (clamped > 0) {
      const filledArc = (clamped / 100) * TOTAL_ARC
      ctx.setStrokeStyle(color)
      ctx.setLineWidth(STROKE_W)
      ctx.beginPath()
      ctx.arc(CX, CY, RADIUS, START_ANGLE, START_ANGLE + filledArc)
      ctx.stroke()
    }

    // Center percentage
    ctx.setFillStyle('#e8ecf4')
    ctx.setTextAlign('center')
    ctx.setTextBaseline('middle')
    ctx.fillText(`${Math.round(clamped)}%`, CX, CY - 8)

    // Sub-label
    ctx.setFillStyle('#8b95a8')
    ctx.setTextAlign('center')
    ctx.setTextBaseline('top')
    ctx.fillText('衰退概率', CX, CY + 14)

    // Color indicator dot at arc tip
    if (clamped > 0) {
      const tipAngle = START_ANGLE + (clamped / 100) * TOTAL_ARC
      const tipX = CX + RADIUS * Math.cos(tipAngle)
      const tipY = CY + RADIUS * Math.sin(tipAngle)
      ctx.setFillStyle(color)
      ctx.beginPath()
      ctx.arc(tipX, tipY, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.draw()
  }, [clamped, color])

  return (
    <View className='recession-meter'>
      <Canvas
        className='recession-meter__canvas'
        canvasId={canvasId}
        id={canvasId}
        style={{ width: `${CANVAS_SIZE}px`, height: `${CANVAS_SIZE}px` }}
      />
      {asOfDate && (
        <Text className='recession-meter__date'>截至 {asOfDate}</Text>
      )}
      <View className='recession-meter__signals'>
        {signals.map((sig) => (
          <View
            key={sig.name}
            className={`recession-meter__pill ${sig.triggered ? 'recession-meter__pill--on' : 'recession-meter__pill--off'}`}
          >
            <View
              className={`recession-meter__dot ${sig.triggered ? 'recession-meter__dot--on' : 'recession-meter__dot--off'}`}
            />
            <Text className='recession-meter__pill-label'>{sig.name}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
