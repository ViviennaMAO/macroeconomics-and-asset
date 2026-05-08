import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { getSnapshotSync, refreshSnapshot, getSeries, formatValue, formatChange, isStale } from '../../utils/fred'
import type { FredSnapshot } from '../../data/fred-baseline'
import './index.scss'

interface LiveTileSpec {
  id: string
  label?: string
  hint?: string
}

interface LiveDataProps {
  title?: string
  tiles: LiveTileSpec[]
  autoRefresh?: boolean
  onLoaded?: (snap: FredSnapshot) => void
}

export default function LiveData({ title, tiles, autoRefresh = false, onLoaded }: LiveDataProps) {
  const [snap, setSnap] = useState<FredSnapshot>(() => getSnapshotSync())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Show cached/baseline immediately (already set in useState initializer)
    if (autoRefresh) {
      setLoading(true)
      refreshSnapshot()
        .then((fresh) => {
          setSnap(fresh)
          onLoaded?.(fresh)
        })
        .finally(() => setLoading(false))
    }
  }, [autoRefresh])

  const stale = isStale(snap)

  // Format fetchedAt as YYYY-MM-DD
  const fetchedLabel = (() => {
    try {
      const d = new Date(snap.fetchedAt)
      if (isNaN(d.getTime())) return snap.fetchedAt
      return d.toISOString().slice(0, 10)
    } catch {
      return snap.fetchedAt
    }
  })()

  return (
    <View className='live-data'>
      {/* Header row */}
      <View className='live-data__header'>
        {title && <Text className='live-data__title'>{title}</Text>}
        <View className='live-data__badge-wrap'>
          {loading && <Text className='live-data__badge live-data__badge--loading'>⏳ 更新中</Text>}
          {!loading && !stale && <Text className='live-data__badge live-data__badge--fresh'>📡 实时</Text>}
          {!loading && stale && <Text className='live-data__badge live-data__badge--stale'>📦 离线基准</Text>}
        </View>
      </View>

      {/* Tile row */}
      <ScrollView className='live-data__scroll' scrollX enableFlex>
        <View className='live-data__row'>
          {tiles.map((spec) => {
            const item = getSeries(snap, spec.id)
            if (!item) {
              return (
                <View key={spec.id} className='live-tile live-tile--empty'>
                  <Text className='live-tile__label'>{spec.label ?? spec.id}</Text>
                  <Text className='live-tile__value'>—</Text>
                </View>
              )
            }

            const displayLabel = spec.label ?? item.label
            const valueStr = formatValue(item)
            const changeStr = formatChange(item)
            const changeClass =
              item.change === null
                ? ''
                : item.change > 0
                ? 'live-tile__change--up'
                : item.change < 0
                ? 'live-tile__change--down'
                : ''

            return (
              <View key={spec.id} className='live-tile'>
                <Text className='live-tile__label'>{displayLabel}</Text>
                {spec.hint && <Text className='live-tile__hint'>{spec.hint}</Text>}
                <Text className='live-tile__value'>{valueStr}</Text>
                {changeStr !== '' && (
                  <Text className={`live-tile__change ${changeClass}`}>{changeStr}</Text>
                )}
                <Text className='live-tile__date'>{item.date}</Text>
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <Text className='live-data__footer'>数据至 {fetchedLabel} · 来源 FRED</Text>
    </View>
  )
}
