import { View, Text } from '@tarojs/components'
import './index.scss'

interface InvestmentClockProps {
  gdpGrowth: number
  cpiYoY: number
  cpiTrend?: 'up' | 'down'
}

interface QuadrantDef {
  key: 'recovery' | 'overheat' | 'stagflation' | 'recession'
  emoji: string
  name: string
  assets: string[]
  gdpUp: boolean
  cpiUp: boolean
}

const QUADRANTS: QuadrantDef[] = [
  {
    key: 'recovery',
    emoji: '🌱',
    name: '复苏期',
    assets: ['股票', '风险资产'],
    gdpUp: true,
    cpiUp: false,
  },
  {
    key: 'overheat',
    emoji: '🔥',
    name: '过热期',
    assets: ['商品', '大宗物资'],
    gdpUp: true,
    cpiUp: true,
  },
  {
    key: 'recession',
    emoji: '❄️',
    name: '衰退期',
    assets: ['债券', '国债'],
    gdpUp: false,
    cpiUp: false,
  },
  {
    key: 'stagflation',
    emoji: '⚡',
    name: '滞胀期',
    assets: ['现金', '货币基金'],
    gdpUp: false,
    cpiUp: true,
  },
]

export default function InvestmentClock({
  gdpGrowth,
  cpiYoY,
  cpiTrend,
}: InvestmentClockProps) {
  const gdpUp = gdpGrowth > 2
  const resolvedCpiTrend = cpiTrend ?? (cpiYoY > 2.5 ? 'up' : 'down')
  const cpiUp = resolvedCpiTrend === 'up'

  const activeKey = QUADRANTS.find(
    (q) => q.gdpUp === gdpUp && q.cpiUp === cpiUp,
  )?.key

  const activeQuadrant = QUADRANTS.find((q) => q.key === activeKey)
  const primaryAsset = activeQuadrant?.assets[0] ?? '—'

  // Grid order: top-left, top-right, bottom-left, bottom-right
  // top = GDP up, bottom = GDP down; left = CPI down, right = CPI up
  const gridOrder: QuadrantDef['key'][] = [
    'recovery',    // GDP↑ CPI↓
    'overheat',    // GDP↑ CPI↑
    'recession',   // GDP↓ CPI↓
    'stagflation', // GDP↓ CPI↑
  ]

  return (
    <View className='investment-clock'>
      {/* Axis labels */}
      <View className='investment-clock__axis-row'>
        <View className='investment-clock__axis-spacer' />
        <Text className='investment-clock__axis-label'>CPI ↓</Text>
        <Text className='investment-clock__axis-label'>CPI ↑</Text>
      </View>

      <View className='investment-clock__body'>
        {/* Left axis label */}
        <View className='investment-clock__axis-col'>
          <Text className='investment-clock__axis-label investment-clock__axis-label--vert'>GDP ↑</Text>
          <Text className='investment-clock__axis-label investment-clock__axis-label--vert'>GDP ↓</Text>
        </View>

        {/* 2x2 grid */}
        <View className='investment-clock__grid'>
          {gridOrder.map((key) => {
            const quad = QUADRANTS.find((q) => q.key === key)!
            const isActive = key === activeKey
            return (
              <View
                key={key}
                className={`clock-cell ${isActive ? 'clock-cell--active' : ''}`}
              >
                {isActive && (
                  <Text className='clock-cell__badge'>当前</Text>
                )}
                <Text className='clock-cell__emoji'>{quad.emoji}</Text>
                <Text className='clock-cell__name'>{quad.name}</Text>
                {quad.assets.map((asset) => (
                  <Text key={asset} className='clock-cell__asset'>
                    {asset}
                  </Text>
                ))}
              </View>
            )
          })}
        </View>
      </View>

      {/* Summary row */}
      <View className='investment-clock__summary'>
        <View className='investment-clock__stat'>
          <Text className='investment-clock__stat-label'>GDP增速</Text>
          <Text
            className={`investment-clock__stat-value ${gdpUp ? 'investment-clock__stat-value--up' : 'investment-clock__stat-value--down'}`}
          >
            {gdpGrowth > 0 ? '+' : ''}{gdpGrowth.toFixed(1)}%
          </Text>
        </View>
        <View className='investment-clock__divider' />
        <View className='investment-clock__stat'>
          <Text className='investment-clock__stat-label'>CPI同比</Text>
          <Text
            className={`investment-clock__stat-value ${cpiUp ? 'investment-clock__stat-value--up' : 'investment-clock__stat-value--down'}`}
          >
            {cpiYoY > 0 ? '+' : ''}{cpiYoY.toFixed(1)}%
          </Text>
        </View>
        <View className='investment-clock__divider' />
        <View className='investment-clock__stat'>
          <Text className='investment-clock__stat-label'>推荐配置</Text>
          <Text className='investment-clock__stat-value investment-clock__stat-value--amber'>
            {primaryAsset}
          </Text>
        </View>
      </View>
    </View>
  )
}
