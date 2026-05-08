import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { parts } from '../../data/chapters'
import './index.scss'

// Collect all chapters that have a hook field
const hookChapters = parts
  .flatMap(p => p.chapters)
  .filter(ch => ch.hook && ch.hook.trim().length > 0)

export default function MvpPage() {
  function goChapter(pagePath?: string) {
    if (!pagePath) return
    Taro.navigateTo({ url: pagePath })
  }

  return (
    <ScrollView scrollY className='mvp-page'>
      <View className='page-header'>
        <Text className='page-title'>⭐ 反预期精选</Text>
        <Text className='page-meta'>每章一个"教材说X，市场实际Y"的冲击时刻</Text>
      </View>

      <View className='mvp-count-bar'>
        <Text className='mvp-count-text'>共 {hookChapters.length} 个冲击时刻</Text>
      </View>

      {hookChapters.map(ch => (
        <View key={ch.num} className='shock-card'>
          <View className='shock-card__header'>
            <View className='shock-card__badge'>
              <Text className='shock-card__emoji'>{ch.emoji}</Text>
              <Text className='shock-card__num'>Ch{ch.num}</Text>
            </View>
            <Text className='shock-card__title'>{ch.title}</Text>
          </View>

          <View className='shock-card__hook'>
            <Text className='shock-card__hook-label'>⚡ 冲击时刻</Text>
            <Text className='shock-card__hook-text'>{ch.hook}</Text>
          </View>

          {ch.brief && (
            <Text className='shock-card__brief'>{ch.brief}</Text>
          )}

          <View
            className='shock-card__cta'
            onClick={() => goChapter(ch.pagePath)}
          >
            <Text className='shock-card__cta-text'>体验模拟器 →</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}
