import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useMemo } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface Term {
  zh: string
  en: string
  short: string
  chapters: number[]
}

interface TermGroup {
  icon: string
  name: string
  terms: Term[]
}

const GROUPS: TermGroup[] = [
  {
    icon: '💵',
    name: '货币与汇率',
    terms: [
      { zh: 'NPV', en: 'Net Present Value', short: '未来现金流折现之和，衡量项目或资产的当前价值', chapters: [1, 7] },
      { zh: 'IRR', en: 'Internal Rate of Return', short: '使NPV为零的折现率，用于评估投资回报率', chapters: [1, 7] },
      { zh: 'WACC', en: 'Weighted Average Cost of Capital', short: '企业加权平均资本成本，折现率的基准', chapters: [7, 9] },
      { zh: '贴现率', en: 'Discount Rate', short: '将未来现金流折算为现值所用的利率', chapters: [1, 7, 11] },
      { zh: '现值', en: 'Present Value', short: '未来某笔资金在当前时点的价值', chapters: [1, 7] },
      { zh: '终值', en: 'Future Value', short: '当前资金在未来某时点的价值，计入复利增长', chapters: [1] },
      { zh: '时间价值', en: 'Time Value of Money', short: '今天的钱比未来同等金额更有价值的核心原则', chapters: [1, 7] },
      { zh: '复利', en: 'Compound Interest', short: '利息再生利息，指数级增长的基础机制', chapters: [1] },
    ],
  },
  {
    icon: '📈',
    name: '利率与债券',
    terms: [
      { zh: 'YTM', en: 'Yield to Maturity', short: '债券持有至到期的年化内部收益率', chapters: [7, 11] },
      { zh: '久期', en: 'Duration', short: '债券价格对利率变动的敏感度，以年为单位衡量', chapters: [7] },
      { zh: '凸度', en: 'Convexity', short: '久期的变化率，衡量价格-利率关系的曲率', chapters: [7] },
      { zh: '票息率', en: 'Coupon Rate', short: '债券每年支付利息占面值的百分比', chapters: [7] },
      { zh: '到期收益率', en: 'Yield to Maturity', short: '持有债券至到期所获得的年化总收益率', chapters: [7, 11] },
      { zh: '收益率曲线', en: 'Yield Curve', short: '不同期限国债收益率连成的曲线，反映市场预期', chapters: [7, 11] },
      { zh: '利差', en: 'Spread', short: '两种债券收益率之差，反映信用或流动性溢价', chapters: [2, 7] },
      { zh: '实际利率', en: 'Real Interest Rate', short: '名义利率减去通胀率，决定资金真实回报', chapters: [10, 11] },
    ],
  },
  {
    icon: '🏛️',
    name: '央行政策',
    terms: [
      { zh: '泰勒规则', en: 'Taylor Rule', short: '根据通胀缺口和产出缺口决定政策利率的公式', chapters: [11] },
      { zh: 'FFR', en: 'Federal Funds Rate', short: '美联储银行间隔夜拆借目标利率，货币政策核心工具', chapters: [11] },
      { zh: 'IOER', en: 'Interest on Excess Reserves', short: '美联储对超额准备金支付的利息，利率走廊上限', chapters: [11] },
      { zh: 'ON RRP', en: 'Overnight Reverse Repo', short: '美联储隔夜逆回购利率，构成利率走廊下限', chapters: [11] },
      { zh: 'QE', en: 'Quantitative Easing', short: '央行大规模购买债券以压低长端利率并扩张资产负债表', chapters: [3, 11] },
      { zh: 'QT', en: 'Quantitative Tightening', short: '缩减央行资产负债表规模，收紧流动性的操作', chapters: [11] },
      { zh: '利率走廊', en: 'Interest Rate Corridor', short: '由IOER和ON RRP构成的短端利率控制区间', chapters: [11] },
      { zh: '前瞻指引', en: 'Forward Guidance', short: '央行通过声明预先引导市场对未来政策路径的预期', chapters: [11] },
    ],
  },
  {
    icon: '🌏',
    name: '国际金融',
    terms: [
      { zh: '三元悖论', en: 'Impossible Trinity', short: '固定汇率、资本自由流动、独立货币政策三者只能取其二', chapters: [12, 4] },
      { zh: '套息交易', en: 'Carry Trade', short: '借入低息货币买入高息资产以赚取利差的策略', chapters: [6, 4] },
      { zh: '资本账户', en: 'Capital Account', short: '记录跨境资本流动，包括直接投资和证券投资', chapters: [4, 6] },
      { zh: '经常账户', en: 'Current Account', short: '贸易、服务及转移支付的跨境流量记录', chapters: [4, 6] },
      { zh: '购买力平价', en: 'Purchasing Power Parity', short: '两国汇率应反映两国价格水平之比的理论', chapters: [6] },
      { zh: '有效汇率', en: 'Effective Exchange Rate', short: '按贸易权重加权计算的一国汇率综合指数', chapters: [6] },
    ],
  },
  {
    icon: '🛢️',
    name: '大宗商品',
    terms: [
      { zh: '布伦特原油', en: 'Brent Crude', short: '北海原油基准价，代表国际原油定价参考', chapters: [9] },
      { zh: 'WTI', en: 'West Texas Intermediate', short: '美国轻质低硫原油基准价，美国原油定价标杆', chapters: [9] },
      { zh: 'OPEC', en: 'Organization of Petroleum Exporting Countries', short: '石油输出国组织，通过配额协调影响全球供给', chapters: [9, 5] },
      { zh: '页岩油', en: 'Shale Oil', short: '通过水力压裂开采的非常规石油，美国产量革命来源', chapters: [9] },
      { zh: '盈亏平衡价', en: 'Break-even Price', short: '生产商收回成本所需的最低油价，决定边际供给', chapters: [9] },
      { zh: '均值回归', en: 'Mean Reversion', short: '大宗商品价格长期向均值回归的统计规律', chapters: [9, 10] },
      { zh: '随机游走', en: 'Random Walk', short: '价格变动无法从历史数据预测的统计性质', chapters: [9] },
      { zh: '超级周期', en: 'Supercycle', short: '大宗商品持续10-35年的长波价格上涨周期', chapters: [9, 5] },
    ],
  },
  {
    icon: '🥇',
    name: '避险资产',
    terms: [
      { zh: '黄金', en: 'Gold', short: '终极避险资产，与实际利率负相关，兼具货币属性', chapters: [10] },
      { zh: '实际利率', en: 'Real Rate', short: '持有黄金的机会成本，实际利率跌则金价通常涨', chapters: [10, 11] },
      { zh: 'VIX', en: 'CBOE Volatility Index', short: '标普500隐含波动率指数，市场恐慌情绪温度计', chapters: [12, 10] },
      { zh: '避险溢价', en: 'Safe Haven Premium', short: '危机时期投资者为持有安全资产愿意支付的额外代价', chapters: [10, 12] },
      { zh: '央行购金', en: 'Central Bank Gold Buying', short: '各国央行增持黄金储备，近年成为金价上涨主驱动', chapters: [10] },
      { zh: '去美元化', en: 'De-dollarization', short: '降低美元在国际储备和贸易结算中比重的趋势', chapters: [6, 10] },
      { zh: '数字货币', en: 'Digital Currency / CBDC', short: '央行发行的数字法定货币，可能重塑货币体系', chapters: [6] },
      { zh: '通胀对冲', en: 'Inflation Hedge', short: '在通胀上升时能保值或增值的资产特征', chapters: [10, 9] },
    ],
  },
]

export default function GlossaryPage() {
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)

  const trimmed = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!trimmed) return GROUPS
    return GROUPS
      .map(g => ({
        ...g,
        terms: g.terms.filter(
          t =>
            t.zh.toLowerCase().includes(trimmed) ||
            t.en.toLowerCase().includes(trimmed) ||
            t.short.toLowerCase().includes(trimmed)
        ),
      }))
      .filter(g => g.terms.length > 0)
  }, [trimmed])

  function toggleGroup(name: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function toggleTerm(key: string) {
    setExpandedTerm(prev => (prev === key ? null : key))
  }

  function goChapter(num: number) {
    Taro.navigateTo({ url: `/pages/ch${num}/index` })
  }

  const isSearching = trimmed.length > 0

  return (
    <ScrollView scrollY className='glossary-page'>
      <View className='page-header'>
        <Text className='page-title'>📖 词汇附录</Text>
        <Text className='page-meta'>6大模块 · 约50个核心术语</Text>
      </View>

      <View className='glossary-search'>
        <Input
          className='glossary-search__input'
          placeholder='搜索术语 (中文/英文)…'
          value={query}
          onInput={e => setQuery(e.detail.value)}
          placeholderClass='glossary-search__placeholder'
        />
        {query.length > 0 && (
          <Text className='glossary-search__clear' onClick={() => setQuery('')}>✕</Text>
        )}
      </View>

      {filtered.map(group => {
        const isOpen = isSearching || openGroups.has(group.name)
        return (
          <View key={group.name} className='glossary-group'>
            <View
              className='glossary-group__header'
              onClick={() => toggleGroup(group.name)}
            >
              <Text className='glossary-group__icon'>{group.icon}</Text>
              <Text className='glossary-group__name'>{group.name}</Text>
              <Text className='glossary-group__count'>{group.terms.length}词</Text>
              <Text className='glossary-group__chevron'>{isOpen ? '▲' : '▼'}</Text>
            </View>

            {isOpen && (
              <View className='glossary-group__body'>
                {group.terms.map(term => {
                  const key = `${group.name}-${term.zh}`
                  const isExpanded = expandedTerm === key
                  return (
                    <View
                      key={term.zh}
                      className='term-row'
                      onClick={() => toggleTerm(key)}
                    >
                      <View className='term-row__main'>
                        <Text className='term-row__zh'>{term.zh}</Text>
                        <Text className='term-row__en'>{term.en}</Text>
                      </View>
                      {isExpanded && (
                        <View className='term-row__detail'>
                          <Text className='term-row__short'>{term.short}</Text>
                          {term.chapters.length > 0 && (
                            <View className='term-row__chapters'>
                              <Text className='term-row__ch-label'>相关章节：</Text>
                              {term.chapters.map(num => (
                                <View
                                  key={num}
                                  className='term-ch-pill'
                                  onClick={e => { e.stopPropagation(); goChapter(num) }}
                                >
                                  <Text className='term-ch-pill__text'>Ch{num}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )
      })}

      {filtered.length === 0 && (
        <View className='glossary-empty'>
          <Text className='glossary-empty__text'>未找到匹配术语</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}
