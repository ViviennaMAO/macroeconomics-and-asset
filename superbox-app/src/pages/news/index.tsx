import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface NewsItem {
  rank: number
  emoji: string
  category: string
  title: string
  summary: string
  chapters: number[]
}

const NEWS: NewsItem[] = [
  {
    rank: 1,
    emoji: '🏛️',
    category: 'Fed',
    title: 'Fed维持利率不变，鲍威尔暗示年内降息',
    summary: '联邦基金利率维持5.25-5.50%区间不变。鲍威尔表示通胀正在向2%目标回归，若数据符合预期，年内存在降息空间，市场定价两次25bp降息。',
    chapters: [11, 7],
  },
  {
    rank: 2,
    emoji: '🥇',
    category: '黄金',
    title: '金价突破$2,500创历史新高',
    summary: '现货黄金涨至$2,512/盎司，央行购金需求持续推动。TIPS实际利率温和回落，地缘风险溢价为金价提供结构性支撑，去美元化趋势加速。',
    chapters: [10],
  },
  {
    rank: 3,
    emoji: '🛢️',
    category: '原油',
    title: 'OPEC+决定延长减产至Q4，油价企稳$85',
    summary: 'OPEC+宣布将220万桶/日自愿减产延长至第四季度。美国页岩油产量维持约1300万桶/日，盈亏平衡价约$55-65，上行空间受限。',
    chapters: [9, 5],
  },
  {
    rank: 4,
    emoji: '💱',
    category: '美元',
    title: 'DXY跌破104，日元反弹套息平仓',
    summary: '美元指数下跌1.2%至103.8，日本央行加息预期升温触发套息交易平仓，美元/日元跌至148区间。欧元、英镑、新兴市场货币普涨。',
    chapters: [6, 11],
  },
  {
    rank: 5,
    emoji: '🌍',
    category: '新兴市场',
    title: '资本重返新兴市场，债券创两年最大单周流入',
    summary: '全球新兴市场债券基金单周净流入达$42亿，为近两年新高。美元走弱叠加美联储降息预期，推动资金重返亚洲和拉美市场，印度、巴西受益最大。',
    chapters: [4, 6],
  },
  {
    rank: 6,
    emoji: '📊',
    category: '美股',
    title: '标普500 P/E达22x，成长股估值再度承压',
    summary: '随着10年期美债收益率回升至4.4%，无风险利率压制下成长股DCF估值收缩。WACC重定价影响纳斯达克科技权重股，AI主题股出现分化。',
    chapters: [7, 1],
  },
  {
    rank: 7,
    emoji: '🇪🇺',
    category: '欧洲',
    title: '意大利与德国利差扩至150bp，ECB关注债市',
    summary: '意大利10年国债收益率上行，德意利差扩大至150bp，接近ECB关注阈值。市场聚焦欧元区财政规则执行及传导保护工具（TPI）启用门槛。',
    chapters: [2, 11],
  },
  {
    rank: 8,
    emoji: '🏦',
    category: '货币政策',
    title: '泰勒规则暗示利率应高于当前水平',
    summary: '据最新CPI数据计算，泰勒规则建议FFR约6.2%，高于当前5.375%中值约85bp，暗示政策仍偏宽松。市场对"高利率更长"路径重新定价。',
    chapters: [11, 3],
  },
  {
    rank: 9,
    emoji: '⚠️',
    category: '风险',
    title: 'VIX升至22，危机传染模型发出黄色预警',
    summary: 'VIX从16快速升至22，期限利差倒挂延续，信贷利差小幅走阔。历史上三元悖论压力叠加流动性收紧曾触发新兴市场危机，需关注多米诺效应。',
    chapters: [12, 4],
  },
  {
    rank: 10,
    emoji: '🌐',
    category: '全球格局',
    title: 'G20份额继续向新兴市场转移，G7降至42%',
    summary: '最新IMF数据显示G7占全球GDP按PPP计算降至42%，新兴市场（含中国、印度）合计突破58%。多极化货币体系讨论持续升温，美元储备比例降至59%。',
    chapters: [5, 6],
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Fed': '#4a9eff',
  '黄金': '#f5a623',
  '原油': '#8b95a8',
  '美元': '#4cd964',
  '新兴市场': '#a855f7',
  '美股': '#4a9eff',
  '欧洲': '#4cd964',
  '货币政策': '#f5a623',
  '风险': '#ff4757',
  '全球格局': '#a855f7',
}

export default function NewsPage() {
  function goChapter(num: number) {
    Taro.navigateTo({ url: `/pages/ch${num}/index` })
  }

  return (
    <ScrollView scrollY className='news-page'>
      <View className='page-header'>
        <Text className='page-title'>📰 今日市场</Text>
        <Text className='page-meta'>10大关键事件 · 联动章节知识</Text>
      </View>

      <View className='news-date-bar'>
        <Text className='news-date-bar__text'>2026年5月8日 · 数据仅供学习演示</Text>
      </View>

      {NEWS.map(item => (
        <View key={item.rank} className='news-card'>
          <View className='news-card__header'>
            <View className='news-card__rank-emoji'>
              <Text className='news-card__rank'>#{item.rank}</Text>
              <Text className='news-card__emoji'>{item.emoji}</Text>
            </View>
            <View
              className='news-card__category'
              style={{ borderColor: CATEGORY_COLORS[item.category] || '#8b95a8' }}
            >
              <Text
                className='news-card__category-text'
                style={{ color: CATEGORY_COLORS[item.category] || '#8b95a8' }}
              >
                {item.category}
              </Text>
            </View>
          </View>

          <Text className='news-card__title'>{item.title}</Text>
          <Text className='news-card__summary'>{item.summary}</Text>

          <View className='news-card__chapters'>
            <Text className='news-card__ch-label'>关联章节</Text>
            <View className='news-card__ch-pills'>
              {item.chapters.map(num => (
                <View
                  key={num}
                  className='news-ch-pill'
                  onClick={() => goChapter(num)}
                >
                  <Text className='news-ch-pill__text'>Ch{num} →</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}

      <View className='news-disclaimer'>
        <Text className='news-disclaimer__text'>
          以上数据为学习演示用途，模拟真实市场动态。实际投资请参考专业资讯渠道。
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}
