import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

// ─── Data: 7 Fed Chairs Timeline ─────────────────────────────────────────────
const FED_CHAIRS = [
  { name: 'Burns', years: '1970–78', era: '大通胀', note: '政治压力下放任通胀，1970s滞胀的主要责任人' },
  { name: 'Volcker', years: '1979–87', era: '紧缩革命', note: '将FFR推至20%，以剧烈衰退终结两位数通胀' },
  { name: 'Greenspan', years: '1987–06', era: '大稳健', note: '主导金融创新时代，泡沫预警被忽视' },
  { name: 'Bernanke', years: '2006–14', era: 'QE元年', note: '危机后发明QE1/2/3，前瞻指引制度化' },
  { name: 'Yellen', years: '2014–18', era: '正常化', note: '渐进加息，确立2% PCE通胀锚' },
  { name: 'Powell', years: '2018–', era: '范式转换', note: '经历疫情冲击→暴力加息→降息，AIT框架检验期' },
]

// ─── Data: Policy Toolkit Evolution ─────────────────────────────────────────
const TOOLKIT_STEPS = [
  {
    tool: '联邦基金利率 FFR',
    period: '传统工具',
    color: '#4a9eff',
    desc: '通过调控短端隔夜拆借利率，影响银行信贷成本，传导至消费与投资。零利率下界（ZLB）使其失效。',
    limit: '下界 0%',
  },
  {
    tool: '大规模资产购买 QE',
    period: '2008年后',
    color: '#a855f7',
    desc: '购买国债+MBS，通过组合平衡渠道压低长端利率，通过信号渠道锚定预期。Fed资产负债表从0.9T→8.9T。',
    limit: '退出困难',
  },
  {
    tool: '前瞻指引 FG',
    period: '2011年后',
    color: '#f5a623',
    desc: '明确承诺利率路径（如"就业未改善前不加息"），通过预期管理拉低长端，无需实际操作资产负债表。',
    limit: '公信力成本',
  },
  {
    tool: '收益率曲线控制 YCC',
    period: '日本2016/美联储2020讨论',
    color: '#4cd964',
    desc: '直接锚定特定期限收益率目标，无限量买入以维持上限。日本成功，美联储因通胀压力未正式采用。',
    limit: '通胀时失控',
  },
  {
    tool: '充裕准备金框架',
    period: '2008年后转型',
    color: '#ff6b6b',
    desc: '从稀缺准备金（公开市场操作）→充裕准备金（IOER/ON RRP），利率走廊机制根本改变。',
    limit: '财政协调压力',
  },
]

// ─── Data: R* Neutral Rate ───────────────────────────────────────────────────
const RSTAR_TIMELINE = [
  { period: '1990s', rstar: '~4%', driver: '高生产率增长，Baby Boom劳动力' },
  { period: '2000s', rstar: '~3%', driver: '全球化红利逐步见顶' },
  { period: '2010s', rstar: '~1%', driver: '全球储蓄过剩，人口老龄化' },
  { period: '2020s', rstar: '~0.5–2.5%', driver: '疫情财政刺激抬升，但结构性下行趋势未变' },
]

// ─── Data: 15 Economic Indicators ────────────────────────────────────────────
interface Indicator {
  name: string
  abbr: string
  freq: string
  category: string
  bullish: string   // → 降息信号强
  bearish: string   // → 降息信号弱/加息
  note: string
  emoji: string
}

const INDICATORS: Indicator[] = [
  {
    name: 'GDP 增速',
    abbr: 'GDP',
    freq: '季度',
    category: '增长',
    bullish: '< 1.5%，连续放缓',
    bearish: '> 3%，持续超预期',
    note: '美联储最终关注GDP，但实时性差，更多用于验证。连续两季负增长=技术性衰退，触发快速降息预期。',
    emoji: '📉',
  },
  {
    name: 'ISM 制造业PMI',
    abbr: 'ISM-M',
    freq: '月度',
    category: '增长',
    bullish: '< 48，连续3个月',
    bearish: '> 55，新订单强劲',
    note: '50为荣枯线。制造业占GDP 12%，但领先性强。新订单子项是最敏感先行指标。',
    emoji: '🏭',
  },
  {
    name: 'ISM 服务业PMI',
    abbr: 'ISM-S',
    freq: '月度',
    category: '增长',
    bullish: '< 50，就业+新订单双降',
    bearish: '> 57，价格分项上行',
    note: '服务业占GDP 70%，对就业市场影响更直接。价格分项与PCE强相关，被Fed重点跟踪。',
    emoji: '🛎️',
  },
  {
    name: '零售销售',
    abbr: 'Retail',
    freq: '月度',
    category: '消费',
    bullish: 'MoM < -0.3%，核心零售持续弱',
    bearish: 'MoM > 0.5%，控制组强劲',
    note: '控制组（剔除汽车+加油站+建材）直接进入GDP核算。消费者是美国经济最后一道防线。',
    emoji: '🛍️',
  },
  {
    name: '失业率',
    abbr: 'UR',
    freq: '月度',
    category: '就业',
    bullish: '> 4.5%，上行趋势明显',
    bearish: '< 3.8%，触及历史低位',
    note: '萨姆规则：3个月平均失业率高于过去12个月低点0.5ppt → 衰退信号。Fed双重使命之一。',
    emoji: '👥',
  },
  {
    name: '非农就业 NFP',
    abbr: 'NFP',
    freq: '月度',
    category: '就业',
    bullish: '< 100K，连续3个月',
    bearish: '> 250K，超预期',
    note: '金发女孩区间约150–200K（与人口增长匹配）。大幅超预期→延迟降息；大幅不及→加快降息。',
    emoji: '💼',
  },
  {
    name: '劳动参与率',
    abbr: 'LFPR',
    freq: '月度',
    category: '就业',
    bullish: '持续下行，尤其25-54岁人群',
    bearish: '上行，劳动力供给增加',
    note: '区分"真实失业"与"退出劳动力市场"。LFPR下行+低失业率→劳动力市场实际更紧张。',
    emoji: '📊',
  },
  {
    name: 'JOLTS 职位空缺',
    abbr: 'JOLTS',
    freq: '月度（滞后）',
    category: '就业',
    bullish: '< 700万，空缺/失业比 < 1.2',
    bearish: '> 900万，空缺/失业比 > 1.8',
    note: '疫情后峰值1200万。Fed特别关注空缺/失业比（Beveridge curve）。比率下行→劳动市场降温。',
    emoji: '🔍',
  },
  {
    name: '自愿离职率',
    abbr: 'Quits',
    freq: '月度（滞后）',
    category: '就业',
    bullish: '< 2.3%，员工信心下降',
    bearish: '> 3%，员工跳槽意愿强',
    note: 'Fed前主席耶伦称之为"最好的单一劳动市场指标"。Quits高 → 工资议价能力强 → 工资-通胀螺旋风险。',
    emoji: '🚶',
  },
  {
    name: '平均时薪增速',
    abbr: 'AWE',
    freq: '月度',
    category: '就业',
    bullish: 'YoY < 3.5%，向2%通胀目标靠拢',
    bearish: 'YoY > 5%，工资-通胀螺旋',
    note: '与PCE强相关。服务业通胀粘性主要来自工资。需看行业分布，高技能行业工资更受关注。',
    emoji: '💰',
  },
  {
    name: '核心PCE',
    abbr: 'Core PCE',
    freq: '月度',
    category: '通胀',
    bullish: 'YoY < 2.5%，MoM持续 < 0.2%',
    bearish: 'YoY > 3%，反弹迹象',
    note: 'Fed官方通胀目标指标（2% YoY）。比CPI更平滑，权重按实际消费支出调整。超级核心PCE（服务-住房）是当前最关注子项。',
    emoji: '🎯',
  },
  {
    name: 'CPI / 核心CPI',
    abbr: 'CPI',
    freq: '月度',
    category: '通胀',
    bullish: 'YoY < 2.8%，住房通胀回落',
    bearish: 'YoY > 3.5%，住房分项再次上行',
    note: 'CPI比PCE高约0.3–0.5ppt（住房权重更高）。市场对CPI反应更大（早于PCE两周发布）。',
    emoji: '🧾',
  },
  {
    name: 'PPI 生产者价格',
    abbr: 'PPI',
    freq: '月度',
    category: '通胀',
    bullish: 'MoM < 0%，投入成本下行',
    bearish: 'MoM > 0.5%，成本压力传导',
    note: '领先PCE 1-2个月。PPI服务分项直接进入PCE计算。大宗商品价格下行→PPI先降→PCE滞后确认。',
    emoji: '⚙️',
  },
  {
    name: '1年通胀预期（密歇根）',
    abbr: 'Inf. Exp.',
    freq: '月度',
    category: '通胀',
    bullish: '< 3%，预期稳定',
    bearish: '> 4%，去锚化风险',
    note: 'Fed最担心通胀预期去锚化（de-anchoring）。预期一旦飙升→自我实现螺旋。Powell多次强调这是"最重要的指标之一"。',
    emoji: '🔮',
  },
  {
    name: '金融条件指数 FCI',
    abbr: 'FCI',
    freq: '周度',
    category: '金融',
    bullish: 'FCI收紧，信用利差扩大',
    bearish: 'FCI宽松，股市上涨抵消加息',
    note: '高盛/芝加哥Fed均发布FCI。Fed需要金融条件配合货币政策。若市场提前宽松→Fed需要更多加息。',
    emoji: '📡',
  },
]

// ─── Data: Rate Cut Scenarios ─────────────────────────────────────────────────
const SCENARIOS = [
  {
    name: '软着陆',
    prob: '40%',
    color: '#4cd964',
    bgColor: 'rgba(76,217,100,0.08)',
    borderColor: 'rgba(76,217,100,0.2)',
    trigger: 'PCE降至2.5%以下，失业率温和上行至4.3-4.5%，GDP维持1.5-2%',
    pace: '每季度25bp，全年降息75-100bp',
    assets: [
      { asset: '美股', view: '↑ 利多', detail: '估值修复+盈利改善' },
      { asset: '美债', view: '↑ 利多', detail: '中短端收益率下行' },
      { asset: '黄金', view: '↑ 利多', detail: '实际利率下行' },
      { asset: '美元', view: '↓ 利空', detail: '利差优势收窄' },
    ],
  },
  {
    name: '衰退降息',
    prob: '30%',
    color: '#ff4757',
    bgColor: 'rgba(255,71,87,0.08)',
    borderColor: 'rgba(255,71,87,0.2)',
    trigger: '失业率快速突破5%，GDP连续负增长，信用危机苗头',
    pace: '紧急降息，每次50bp，全年降息200bp+',
    assets: [
      { asset: '美股', view: '↓ 利空', detail: '盈利衰退压制估值' },
      { asset: '美债', view: '↑↑ 强利多', detail: '避险+收益率急降' },
      { asset: '黄金', view: '↑↑ 强利多', detail: '避险+实际利率崩塌' },
      { asset: '美元', view: '混沌', detail: '避险vs降息博弈' },
    ],
  },
  {
    name: '滞胀困境',
    prob: '20%',
    color: '#f5a623',
    bgColor: 'rgba(245,166,35,0.08)',
    borderColor: 'rgba(245,166,35,0.2)',
    trigger: 'PCE回升至3%+，同时失业率上行，类1970s供给冲击',
    pace: 'Fed维持高利率，资产价格双杀',
    assets: [
      { asset: '美股', view: '↓↓ 利空', detail: '双杀：盈利+估值' },
      { asset: '美债', view: '↓ 利空', detail: '通胀溢价重新定价' },
      { asset: '黄金', view: '↑↑ 强利多', detail: '历史上最佳滞胀对冲' },
      { asset: '美元', view: '↑ 利多', detail: '紧缩维持支撑' },
    ],
  },
  {
    name: '高原平台',
    prob: '10%',
    color: '#4a9eff',
    bgColor: 'rgba(74,158,255,0.08)',
    borderColor: 'rgba(74,158,255,0.2)',
    trigger: '通胀黏着3%，就业韧性，Fed长期维持当前利率',
    pace: '2024年无降息或仅象征性1次',
    assets: [
      { asset: '美股', view: '震荡', detail: '高利率压估值，强盈利支撑' },
      { asset: '美债', view: '↓ 利空', detail: '久期风险持续' },
      { asset: '黄金', view: '震荡', detail: '实际利率高位压制' },
      { asset: '美元', view: '↑ 利多', detail: '高利率支撑' },
    ],
  },
]

// ─── Data: Taylor Rule Historical Comparison ─────────────────────────────────
const TAYLOR_HISTORY = [
  { year: '2021 Q2', taylor: 8.5,  fed: 0.25, label: '暂时性通胀争议', color: '#ff4757' },
  { year: '2022 Q2', taylor: 13.0, fed: 1.75, label: '加息严重滞后',   color: '#ff4757' },
  { year: '2022 Q4', taylor: 11.5, fed: 4.50, label: '快速追赶',       color: '#f5a623' },
  { year: '2023 Q3', taylor: 8.0,  fed: 5.50, label: '政策超调区间',   color: '#f5a623' },
  { year: '2024 Q2', taylor: 5.5,  fed: 5.50, label: '基本对齐',       color: '#4cd964' },
  { year: '2024 Q4', taylor: 4.5,  fed: 4.50, label: '软着陆着陆点',   color: '#4cd964' },
  { year: '2025 Q2', taylor: 4.0,  fed: 4.00, label: '降息周期开启',   color: '#4cd964' },
  { year: '2025 Q4', taylor: 4.9,  fed: 3.75, label: '通胀触底反弹',   color: '#f5a623' },
  { year: '2026 Q2', taylor: 5.2,  fed: 3.75, label: '通胀再加速·市场押注加息', color: '#ff4757' },
]

// ─── Data: Taylor Rule Variants ───────────────────────────────────────────────
const TAYLOR_VARIANTS = [
  {
    name: '标准泰勒规则',
    year: '1993',
    author: 'John Taylor',
    formula: 'r* + π + 0.5(π − π*) + 0.5·gap',
    piWeight: 0.5,
    gapWeight: 0.5,
    note: '等权重对待通胀缺口与产出缺口，是最原始版本。',
    color: '#4a9eff',
  },
  {
    name: '均衡规则',
    year: '1999',
    author: 'Taylor (修订)',
    formula: 'r* + π + 0.5(π − π*) + 1.0·gap',
    piWeight: 0.5,
    gapWeight: 1.0,
    note: '产出缺口权重加倍，更重视就业偏差，偏鸽派。',
    color: '#a855f7',
  },
  {
    name: '激进反通胀规则',
    year: '实践变体',
    author: 'Fed 2022–23实际操作',
    formula: 'r* + π + 1.5(π − π*) + 0.5·gap',
    piWeight: 1.5,
    gapWeight: 0.5,
    note: '通胀偏差权重放大到1.5，即"通胀每超目标1ppt，利率多升1.5ppt"。反映2022年鹰派立场。',
    color: '#ff6b6b',
  },
]

// ─── Data: AIT vs Flexible Average ──────────────────────────────────────────
const FRAMEWORK_COMPARE = [
  { dim: '通胀目标', old: '2% 硬目标', ait: '2% 长期平均目标' },
  { dim: '超调容忍', old: '即时纠偏', ait: '允许一段时间超2%以弥补不足' },
  { dim: '先发制人', old: '预期加息防通胀', ait: '等待实际通胀数据确认' },
  { dim: '就业权重', old: '通胀优先', ait: '强调广泛包容性就业' },
  { dim: '采用时间', old: '2012年前', ait: '2020年8月正式宣布' },
]

// ─── Taylor Rule Calculator ───────────────────────────────────────────────────
function calcTaylor(pi: number, piStar: number, gap: number, rStar: number, piW: number, gapW: number): number {
  return rStar + pi + piW * (pi - piStar) + gapW * gap
}

export default function Ch13Page() {
  const [activeTab, setActiveTab] = useState<'growth' | 'employment' | 'inflation' | 'financial'>('employment')
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState(0)

  // Taylor Rule calculator state
  const [trVariant, setTrVariant] = useState(0)          // which variant (0=standard)
  const [trPi, setTrPi] = useState(2.6)                  // current PCE inflation
  const [trPiStar] = useState(2.0)                       // target (fixed at 2%)
  const [trGap, setTrGap] = useState(-0.5)               // output gap %
  const [trRStar, setTrRStar] = useState(0.5)            // neutral real rate

  const variant = TAYLOR_VARIANTS[trVariant]
  const taylorImplied = calcTaylor(trPi, trPiStar, trGap, trRStar, variant.piWeight, variant.gapWeight)
  const currentFFR = 3.625  // midpoint of 3.50–3.75% as of Jun 2026 (Fed cut ~75bp in 2025, then held as inflation re-accelerated)
  const deviation = taylorImplied - currentFFR
  const deviationBp = Math.round(deviation * 100)

  const filteredIndicators = INDICATORS.filter(ind => {
    if (activeTab === 'growth') return ind.category === '增长'
    if (activeTab === 'employment') return ind.category === '就业'
    if (activeTab === 'inflation') return ind.category === '通胀'
    if (activeTab === 'financial') return ind.category === '金融'
    return true
  })

  return (
    <ScrollView scrollY className='ch13-page'>

      {/* ── Hook ── */}
      <View className='ch13-hook'>
        <Text className='ch13-hook__label'>Ch13 · 美联储货币政策</Text>
        <Text className='ch13-hook__title'>当中性利率从4%跌到0.5%，货币政策的"正常"永久改变了</Text>
        <Text className='ch13-hook__sub'>
          从沃尔克的20%利率到贝南克的QE无限，从2%通胀锚到AIT超调框架——读懂美联储，才能读懂一切资产的定价基准
        </Text>
      </View>

      {/* ══════════════════════════════════════════════════
          §1  美联储机构概览
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section'>
        <Text className='ch13-section__title'>🏛️ 美联储：制度框架与双重使命</Text>

        <View className='ch13-mandate-card'>
          <View className='ch13-mandate-item ch13-mandate--price'>
            <Text className='ch13-mandate__icon'>🎯</Text>
            <Text className='ch13-mandate__name'>价格稳定</Text>
            <Text className='ch13-mandate__desc'>PCE通胀长期维持在 2% 附近</Text>
          </View>
          <View className='ch13-mandate-divider' />
          <View className='ch13-mandate-item ch13-mandate--jobs'>
            <Text className='ch13-mandate__icon'>👔</Text>
            <Text className='ch13-mandate__name'>最大就业</Text>
            <Text className='ch13-mandate__desc'>失业率接近"自然失业率"NAIRU</Text>
          </View>
        </View>

        <View className='ch13-info-box'>
          <Text className='ch13-info-box__title'>机构结构</Text>
          <Text className='ch13-info-box__body'>
            美联储由12家地区储备银行 + 华盛顿联邦储备委员会（BOG）构成。FOMC（联邦公开市场委员会）每年8次会议决定利率，由7名理事 + 5名地区行长（纽约联储永久席位）投票。主席任期4年，由总统提名、参议院确认，在法律上享有独立性。
          </Text>
        </View>

        {/* 7 Chairs Timeline */}
        <Text className='ch13-subsection-label'>历任主席与政策遗产</Text>
        <View className='ch13-chairs'>
          {FED_CHAIRS.map((chair) => (
            <View key={chair.name} className='ch13-chair-card'>
              <View className='ch13-chair-card__top'>
                <Text className='ch13-chair-card__name'>{chair.name}</Text>
                <Text className='ch13-chair-card__era'>{chair.era}</Text>
              </View>
              <Text className='ch13-chair-card__years'>{chair.years}</Text>
              <Text className='ch13-chair-card__note'>{chair.note}</Text>
            </View>
          ))}
        </View>

        <View className='ch13-mvp-box'>
          <Text className='ch13-mvp-box__label'>⭐ 反预期时刻</Text>
          <Text className='ch13-mvp-box__text'>
            Burns主席任期内，为配合尼克松的政治需求维持低利率，直接导致1970年代滞胀。沃尔克继任后用20%利率硬着陆经济，制造了1981–82年大衰退，但彻底打断通胀预期——用短期衰退换取此后40年的低通胀。这是货币政策史上最大的反预期操作：更大的痛苦，换来更持久的稳定。
          </Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          §2  政策工具演进
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section'>
        <Text className='ch13-section__title'>🔧 政策工具箱：从FFR到QE的范式跃迁</Text>

        <Text className='ch13-section__desc'>
          2008年金融危机是分水岭。当FFR触及零利率下界（ZLB），美联储被迫开发一系列非常规工具，货币政策框架发生根本性转变。
        </Text>

        {TOOLKIT_STEPS.map((step, i) => (
          <View key={i} className='ch13-tool-card'>
            <View className='ch13-tool-card__header' style={{ borderLeftColor: step.color }}>
              <Text className='ch13-tool-card__tool'>{step.tool}</Text>
              <Text className='ch13-tool-card__period'>{step.period}</Text>
            </View>
            <Text className='ch13-tool-card__desc'>{step.desc}</Text>
            <View className='ch13-tool-card__limit'>
              <Text className='ch13-tool-card__limit-label'>局限性</Text>
              <Text className='ch13-tool-card__limit-text'>{step.limit}</Text>
            </View>
          </View>
        ))}

        <View className='ch13-info-box ch13-info-box--amber'>
          <Text className='ch13-info-box__title'>QE的两个传导渠道（Bernanke框架）</Text>
          <Text className='ch13-info-box__body'>
            ① 组合平衡渠道（Portfolio Balance Channel）：Fed购债减少市场可得安全资产供给，投资者被迫转向股票、企业债等风险资产，压低风险溢价。{'\n\n'}
            ② 信号渠道（Signaling Channel）：购债承诺向市场传递"利率长期维持低位"信号，降低预期短期利率，直接作用于长端利率。
          </Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          §3  中性利率 R*
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section'>
        <Text className='ch13-section__title'>📐 中性利率 R*：货币政策的隐形锚</Text>

        <Text className='ch13-section__desc'>
          R*（R-star）是既不刺激也不抑制经济的理论利率水平。当FFR {'>'} R*，政策为紧缩性；当FFR {'<'} R*，政策为宽松性。问题在于：R*无法直接观测，只能通过模型估计。
        </Text>

        <View className='ch13-rstar-timeline'>
          {RSTAR_TIMELINE.map((item, i) => (
            <View key={i} className='ch13-rstar-item'>
              <Text className='ch13-rstar-item__period'>{item.period}</Text>
              <Text className='ch13-rstar-item__value'>{item.rstar}</Text>
              <Text className='ch13-rstar-item__driver'>{item.driver}</Text>
            </View>
          ))}
        </View>

        <View className='ch13-info-box'>
          <Text className='ch13-info-box__title'>为什么R*持续下行？</Text>
          <Text className='ch13-info-box__body'>
            ① 人口老龄化：储蓄率上升，消费需求下降{'\n'}
            ② 生产率增长放缓：自1990年代科技红利后，全要素生产率增速明显下行{'\n'}
            ③ 全球储蓄过剩（Bernanke 2005）：新兴市场高储蓄压低全球实际利率{'\n'}
            ④ 风险偏好下降：金融危机后企业和家庭去杠杆，长期压制投资需求
          </Text>
        </View>

        <View className='ch13-rstar-models'>
          <View className='ch13-rstar-model-card'>
            <Text className='ch13-rstar-model__name'>LW 模型</Text>
            <Text className='ch13-rstar-model__full'>Laubach-Williams (纽约联储)</Text>
            <Text className='ch13-rstar-model__est'>当前估计 ~0.7%</Text>
            <Text className='ch13-rstar-model__note'>考虑趋势增长率，估值偏低</Text>
          </View>
          <View className='ch13-rstar-model-card'>
            <Text className='ch13-rstar-model__name'>HLW 模型</Text>
            <Text className='ch13-rstar-model__full'>Holston-Laubach-Williams</Text>
            <Text className='ch13-rstar-model__est'>当前估计 ~1.2%</Text>
            <Text className='ch13-rstar-model__note'>多国联合估计，更稳健</Text>
          </View>
        </View>

        <View className='ch13-highlight-box'>
          <Text className='ch13-highlight-box__text'>
            💡 当前FFR（4.25–4.5%）远高于任何R*估计值 → 货币政策实质上仍处于限制性区间，即便已经降息。
          </Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          §4  通胀目标框架
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section'>
        <Text className='ch13-section__title'>🎯 通胀目标框架：从硬目标到AIT</Text>

        <View className='ch13-pce-vs-cpi'>
          <View className='ch13-metric-compare-card'>
            <Text className='ch13-metric-compare__title'>核心PCE</Text>
            <Text className='ch13-metric-compare__badge ch13-metric-compare__badge--primary'>Fed目标</Text>
            <View className='ch13-metric-compare__items'>
              <Text className='ch13-metric-compare__item'>• 权重按实际支出调整，更反映消费行为</Text>
              <Text className='ch13-metric-compare__item'>• 住房权重约17%（低于CPI的33%）</Text>
              <Text className='ch13-metric-compare__item'>• 通常比CPI低约0.3–0.5ppt</Text>
              <Text className='ch13-metric-compare__item'>• 2% 是官方目标</Text>
            </View>
          </View>
          <View className='ch13-metric-compare-card'>
            <Text className='ch13-metric-compare__title'>CPI</Text>
            <Text className='ch13-metric-compare__badge'>市场指标</Text>
            <View className='ch13-metric-compare__items'>
              <Text className='ch13-metric-compare__item'>• 固定权重，反应更直接</Text>
              <Text className='ch13-metric-compare__item'>• 住房权重约33%（OER主导）</Text>
              <Text className='ch13-metric-compare__item'>• 早于PCE 2周发布，市场反应更强</Text>
              <Text className='ch13-metric-compare__item'>• 联动通胀挂钩国债（TIPS）</Text>
            </View>
          </View>
        </View>

        {/* AIT vs Old Framework */}
        <Text className='ch13-subsection-label'>AIT框架 vs 传统框架对比</Text>
        <View className='ch13-compare-table'>
          <View className='ch13-compare-table__header'>
            <Text className='ch13-compare-table__col-label'>维度</Text>
            <Text className='ch13-compare-table__col-old'>传统框架</Text>
            <Text className='ch13-compare-table__col-new'>AIT（2020）</Text>
          </View>
          {FRAMEWORK_COMPARE.map((row, i) => (
            <View key={i} className={`ch13-compare-table__row ${i % 2 === 0 ? 'ch13-compare-table__row--even' : ''}`}>
              <Text className='ch13-compare-table__col-label'>{row.dim}</Text>
              <Text className='ch13-compare-table__col-old'>{row.old}</Text>
              <Text className='ch13-compare-table__col-new'>{row.ait}</Text>
            </View>
          ))}
        </View>

        <View className='ch13-mvp-box ch13-mvp-box--red'>
          <Text className='ch13-mvp-box__label'>⚠️ AIT框架的致命缺陷</Text>
          <Text className='ch13-mvp-box__text'>
            2021年美联储以AIT为理由，将通胀定性为"暂时性（transitory）"，延迟加息直到PCE突破5%。事后复盘，AIT框架在供给冲击型通胀（而非需求不足型通胀）面前完全失效——它是为2009年后的低通胀环境设计的工具。2022年被迫以有史以来最快速度加息500bp以上，是AIT框架历史上最大的政策失误检验。
          </Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          §5  菲利普斯曲线
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section'>
        <Text className='ch13-section__title'>📈 菲利普斯曲线：为何越来越平？</Text>

        <Text className='ch13-section__desc'>
          菲利普斯曲线描述失业率与通胀的负相关关系：失业↓ → 工资上涨 → 通胀↑。这是Fed货币政策的核心理论基础。但自2008年后，曲线明显趋于平坦，令货币政策效力大打折扣。
        </Text>

        <View className='ch13-phillips-timeline'>
          <View className='ch13-phillips-era'>
            <Text className='ch13-phillips-era__period'>1960s–70s</Text>
            <Text className='ch13-phillips-era__status ch13-phillips-era__status--steep'>陡峭期</Text>
            <Text className='ch13-phillips-era__desc'>失业率每降1ppt，通胀约涨1–2ppt。政策效力强但副作用大。</Text>
          </View>
          <View className='ch13-phillips-era'>
            <Text className='ch13-phillips-era__period'>1980s–2000s</Text>
            <Text className='ch13-phillips-era__status ch13-phillips-era__status--moderate'>大稳健期</Text>
            <Text className='ch13-phillips-era__desc'>预期锚定后曲线斜率下降，通胀对就业变化更不敏感。</Text>
          </View>
          <View className='ch13-phillips-era'>
            <Text className='ch13-phillips-era__period'>2010s</Text>
            <Text className='ch13-phillips-era__status ch13-phillips-era__status--flat'>平坦化</Text>
            <Text className='ch13-phillips-era__desc'>失业率降至3.5%，通胀仍在2%以下。传统模型完全失效。</Text>
          </View>
          <View className='ch13-phillips-era'>
            <Text className='ch13-phillips-era__period'>2021–22</Text>
            <Text className='ch13-phillips-era__status ch13-phillips-era__status--revival'>暂时复活</Text>
            <Text className='ch13-phillips-era__desc'>供给冲击打破平坦化，通胀飙升证明曲线仍在，只是隐伏。</Text>
          </View>
        </View>

        <View className='ch13-info-box ch13-info-box--purple'>
          <Text className='ch13-info-box__title'>平坦化的结构性原因</Text>
          <Text className='ch13-info-box__body'>
            ① 通胀预期锚定：央行公信力建立后，工资谈判不再基于"预期通胀"加码{'\n'}
            ② 全球化：劳动力定价全球化压制本土工资议价能力{'\n'}
            ③ 零工经济：劳动力市场弹性上升，工资刚性下降{'\n'}
            ④ 科技的价格下行压力：持续压低商品通胀，掩盖劳动力市场过热信号
          </Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          §6  泰勒规则
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section'>
        <Text className='ch13-section__title'>📐 泰勒规则：美联储的政策利率参照系</Text>
        <Text className='ch13-section__desc'>
          泰勒规则（Taylor Rule）由斯坦福经济学家约翰·泰勒于1993年提出，给出了一个基于通胀与产出缺口的"理论最优利率"公式。美联储并不机械执行，但将其作为重要参照，分析当前政策是否过松或过紧。
        </Text>

        {/* ── Formula Display ── */}
        <View className='ch13-taylor-formula'>
          <View className='ch13-taylor-formula__main'>
            <Text className='ch13-taylor-formula__lhs'>i*  =</Text>
            <View className='ch13-taylor-formula__rhs'>
              <Text className='ch13-taylor-term ch13-taylor-term--rstar'>r*</Text>
              <Text className='ch13-taylor-formula__op'>+</Text>
              <Text className='ch13-taylor-term ch13-taylor-term--pi'>π</Text>
              <Text className='ch13-taylor-formula__op'>+</Text>
              <Text className='ch13-taylor-term ch13-taylor-term--gap1'>α·(π − π*)</Text>
              <Text className='ch13-taylor-formula__op'>+</Text>
              <Text className='ch13-taylor-term ch13-taylor-term--gap2'>β·ỹ</Text>
            </View>
          </View>
          <View className='ch13-taylor-legend'>
            <View className='ch13-taylor-legend__item'>
              <Text className='ch13-taylor-legend__sym ch13-taylor-term--rstar'>r*</Text>
              <Text className='ch13-taylor-legend__def'>中性实际利率（R-star）</Text>
            </View>
            <View className='ch13-taylor-legend__item'>
              <Text className='ch13-taylor-legend__sym ch13-taylor-term--pi'>π</Text>
              <Text className='ch13-taylor-legend__def'>当前通胀率（核心PCE）</Text>
            </View>
            <View className='ch13-taylor-legend__item'>
              <Text className='ch13-taylor-legend__sym ch13-taylor-term--gap1'>α·(π − π*)</Text>
              <Text className='ch13-taylor-legend__def'>通胀缺口项，权重α（通常0.5）</Text>
            </View>
            <View className='ch13-taylor-legend__item'>
              <Text className='ch13-taylor-legend__sym ch13-taylor-term--gap2'>β·ỹ</Text>
              <Text className='ch13-taylor-legend__def'>产出缺口项，权重β（通常0.5）</Text>
            </View>
          </View>
        </View>

        {/* ── Variant Selector ── */}
        <Text className='ch13-subsection-label'>选择规则变体</Text>
        <View className='ch13-taylor-variants'>
          {TAYLOR_VARIANTS.map((v, i) => (
            <View
              key={i}
              className={`ch13-taylor-variant ${trVariant === i ? 'ch13-taylor-variant--active' : ''}`}
              style={trVariant === i ? { borderColor: v.color, backgroundColor: `${v.color}12` } : {}}
              onClick={() => setTrVariant(i)}
            >
              <Text className='ch13-taylor-variant__name' style={trVariant === i ? { color: v.color } : {}}>{v.name}</Text>
              <Text className='ch13-taylor-variant__formula'>{v.formula}</Text>
            </View>
          ))}
        </View>

        {/* Variant note */}
        <View className='ch13-info-box' style={{ borderLeftColor: variant.color, marginTop: 8 }}>
          <Text className='ch13-info-box__title'>{variant.name}（{variant.year}，{variant.author}）</Text>
          <Text className='ch13-info-box__body'>{variant.note}</Text>
        </View>

        {/* ── Interactive Calculator ── */}
        <Text className='ch13-subsection-label'>参数调节器</Text>
        <View className='ch13-taylor-calc'>

          {/* Row: Current PCE */}
          <View className='ch13-taylor-row'>
            <View className='ch13-taylor-row__label-wrap'>
              <Text className='ch13-taylor-row__label ch13-taylor-term--pi'>π  当前通胀</Text>
              <Text className='ch13-taylor-row__value'>{trPi.toFixed(1)}%</Text>
            </View>
            <View className='ch13-taylor-slider-track'>
              {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0].map((v) => (
                <View
                  key={v}
                  className={`ch13-taylor-pip ${trPi === v ? 'ch13-taylor-pip--active' : ''}`}
                  onClick={() => setTrPi(v)}
                >
                  <Text className='ch13-taylor-pip__label'>{v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Row: Output Gap */}
          <View className='ch13-taylor-row'>
            <View className='ch13-taylor-row__label-wrap'>
              <Text className='ch13-taylor-row__label ch13-taylor-term--gap2'>ỹ  产出缺口</Text>
              <Text className='ch13-taylor-row__value'>{trGap > 0 ? '+' : ''}{trGap.toFixed(1)}%</Text>
            </View>
            <View className='ch13-taylor-slider-track'>
              {[-3.0, -2.5, -2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0].map((v) => (
                <View
                  key={v}
                  className={`ch13-taylor-pip ${trGap === v ? 'ch13-taylor-pip--active' : ''} ${v < 0 ? 'ch13-taylor-pip--neg' : v > 0 ? 'ch13-taylor-pip--pos' : ''}`}
                  onClick={() => setTrGap(v)}
                >
                  <Text className='ch13-taylor-pip__label'>{v > 0 ? `+${v}` : v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Row: R-star */}
          <View className='ch13-taylor-row'>
            <View className='ch13-taylor-row__label-wrap'>
              <Text className='ch13-taylor-row__label ch13-taylor-term--rstar'>r*  中性利率</Text>
              <Text className='ch13-taylor-row__value'>{trRStar.toFixed(1)}%</Text>
            </View>
            <View className='ch13-taylor-slider-track'>
              {[0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((v) => (
                <View
                  key={v}
                  className={`ch13-taylor-pip ${trRStar === v ? 'ch13-taylor-pip--active' : ''}`}
                  onClick={() => setTrRStar(v)}
                >
                  <Text className='ch13-taylor-pip__label'>{v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Result */}
          <View className='ch13-taylor-result'>
            <View className='ch13-taylor-result__block ch13-taylor-result__block--implied'>
              <Text className='ch13-taylor-result__label'>泰勒规则建议利率</Text>
              <Text className='ch13-taylor-result__value'>{taylorImplied.toFixed(2)}%</Text>
            </View>
            <View className='ch13-taylor-result__vs'>VS</View>
            <View className='ch13-taylor-result__block ch13-taylor-result__block--actual'>
              <Text className='ch13-taylor-result__label'>当前FFR</Text>
              <Text className='ch13-taylor-result__value'>{currentFFR.toFixed(2)}%</Text>
            </View>
          </View>

          {/* Deviation Badge */}
          <View className={`ch13-taylor-deviation ${deviationBp > 50 ? 'ch13-taylor-deviation--loose' : deviationBp < -50 ? 'ch13-taylor-deviation--tight' : 'ch13-taylor-deviation--neutral'}`}>
            <Text className='ch13-taylor-deviation__val'>
              {deviationBp > 0 ? '▲' : deviationBp < 0 ? '▼' : '●'} {Math.abs(deviationBp)} bp
            </Text>
            <Text className='ch13-taylor-deviation__label'>
              {deviationBp > 50
                ? '泰勒规则暗示应加息，当前政策偏宽松'
                : deviationBp < -50
                ? '泰勒规则暗示应降息，当前政策偏紧缩'
                : '政策利率接近泰勒规则建议'}
            </Text>
          </View>
        </View>

        {/* ── Historical Deviation Chart ── */}
        <Text className='ch13-subsection-label'>历史偏差：泰勒规则 vs 实际FFR</Text>
        <View className='ch13-taylor-history'>
          {TAYLOR_HISTORY.map((h, i) => {
            const diff = h.taylor - h.fed
            const maxDiff = 13  // scale reference
            const barPct = Math.min(Math.abs(diff) / maxDiff * 100, 100)
            return (
              <View key={i} className='ch13-taylor-hist-row'>
                <Text className='ch13-taylor-hist-row__year'>{h.year}</Text>
                <View className='ch13-taylor-hist-row__bars'>
                  <View className='ch13-taylor-hist-bar ch13-taylor-hist-bar--taylor' style={{ width: `${Math.min(h.taylor / 14 * 100, 100)}%` }}>
                    <Text className='ch13-taylor-hist-bar__val'>{h.taylor}%</Text>
                  </View>
                  <View className='ch13-taylor-hist-bar ch13-taylor-hist-bar--fed' style={{ width: `${Math.min(h.fed / 14 * 100, 100)}%` }}>
                    <Text className='ch13-taylor-hist-bar__val'>{h.fed}%</Text>
                  </View>
                </View>
                <Text className='ch13-taylor-hist-row__label' style={{ color: h.color }}>{h.label}</Text>
              </View>
            )
          })}
          <View className='ch13-taylor-hist-legend'>
            <View className='ch13-taylor-hist-legend__item'>
              <View className='ch13-taylor-hist-legend__dot ch13-taylor-hist-legend__dot--taylor' />
              <Text className='ch13-taylor-hist-legend__text'>泰勒规则建议</Text>
            </View>
            <View className='ch13-taylor-hist-legend__item'>
              <View className='ch13-taylor-hist-legend__dot ch13-taylor-hist-legend__dot--fed' />
              <Text className='ch13-taylor-hist-legend__text'>实际FFR</Text>
            </View>
          </View>
        </View>

        <View className='ch13-mvp-box'>
          <Text className='ch13-mvp-box__label'>⭐ 关键洞察</Text>
          <Text className='ch13-mvp-box__text'>
            2021年泰勒规则建议利率高达8–10%，而Fed实际维持在0.25%——偏差近900bp。这是历史上Fed对泰勒规则最大的偏离。事后来看，正是这段滞后埋下了2022年被迫激进加息（全年加息425bp）的根源。泰勒规则不是铁律，但偏差超过200bp时，市场往往需要为政策"补课"付出代价。
          </Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          §7  经济指标仪表盘
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section'>
        <Text className='ch13-section__title'>📡 降息信号仪表盘：15大指标追踪框架</Text>
        <Text className='ch13-section__desc'>
          美联储决策无单一指标，必须综合看这15个数据。以下按类别分组，标注各指标在降息/加息方向的触发信号。
        </Text>

        {/* Tab Bar */}
        <View className='ch13-ind-tabs'>
          {([
            { key: 'employment', label: '就业', count: INDICATORS.filter(i => i.category === '就业').length },
            { key: 'inflation', label: '通胀', count: INDICATORS.filter(i => i.category === '通胀').length },
            { key: 'growth', label: '增长', count: INDICATORS.filter(i => i.category === '增长').length },
            { key: 'financial', label: '金融', count: INDICATORS.filter(i => i.category === '金融').length },
          ] as { key: typeof activeTab; label: string; count: number }[]).map((tab) => (
            <View
              key={tab.key}
              className={`ch13-ind-tab ${activeTab === tab.key ? 'ch13-ind-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className='ch13-ind-tab__label'>{tab.label}</Text>
              <Text className='ch13-ind-tab__count'>{tab.count}</Text>
            </View>
          ))}
        </View>

        {/* Indicator Cards */}
        {filteredIndicators.map((ind) => {
          const isExpanded = expandedIndicator === ind.abbr
          return (
            <View
              key={ind.abbr}
              className={`ch13-ind-card ${isExpanded ? 'ch13-ind-card--expanded' : ''}`}
              onClick={() => setExpandedIndicator(isExpanded ? null : ind.abbr)}
            >
              <View className='ch13-ind-card__header'>
                <Text className='ch13-ind-card__emoji'>{ind.emoji}</Text>
                <View className='ch13-ind-card__meta'>
                  <Text className='ch13-ind-card__name'>{ind.name}</Text>
                  <Text className='ch13-ind-card__freq'>{ind.freq}</Text>
                </View>
                <Text className={`ch13-ind-card__chevron ${isExpanded ? 'ch13-ind-card__chevron--open' : ''}`}>›</Text>
              </View>

              {isExpanded && (
                <View className='ch13-ind-card__body'>
                  <View className='ch13-ind-signal'>
                    <View className='ch13-ind-signal__item ch13-ind-signal--cut'>
                      <Text className='ch13-ind-signal__label'>↓ 降息信号</Text>
                      <Text className='ch13-ind-signal__value'>{ind.bullish}</Text>
                    </View>
                    <View className='ch13-ind-signal__item ch13-ind-signal--hike'>
                      <Text className='ch13-ind-signal__label'>↑ 加息信号</Text>
                      <Text className='ch13-ind-signal__value'>{ind.bearish}</Text>
                    </View>
                  </View>
                  <Text className='ch13-ind-card__note'>{ind.note}</Text>
                </View>
              )}
            </View>
          )
        })}

        <View className='ch13-ind-hint'>
          <Text className='ch13-ind-hint__text'>💡 点击指标卡片查看降息/加息触发信号与Fed关注要点</Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          §7  降息路径情景分析
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section'>
        <Text className='ch13-section__title'>🗺️ 降息路径情景分析 × 资产配置影响</Text>
        <Text className='ch13-section__desc'>
          基于不同宏观路径，Fed的降息节奏与幅度截然不同，对各大类资产的影响也大相径庭。
        </Text>

        {/* Scenario Tabs */}
        <View className='ch13-scenario-tabs'>
          {SCENARIOS.map((s, i) => (
            <View
              key={i}
              className={`ch13-scenario-tab ${activeScenario === i ? 'ch13-scenario-tab--active' : ''}`}
              style={activeScenario === i ? { borderColor: s.color, backgroundColor: s.bgColor } : {}}
              onClick={() => setActiveScenario(i)}
            >
              <Text className='ch13-scenario-tab__name' style={activeScenario === i ? { color: s.color } : {}}>{s.name}</Text>
              <Text className='ch13-scenario-tab__prob'>{s.prob}</Text>
            </View>
          ))}
        </View>

        {/* Active Scenario Detail */}
        {(() => {
          const s = SCENARIOS[activeScenario]
          return (
            <View className='ch13-scenario-detail' style={{ borderColor: s.borderColor, backgroundColor: s.bgColor }}>
              <Text className='ch13-scenario-detail__name' style={{ color: s.color }}>{s.name} 情景</Text>
              <View className='ch13-scenario-detail__row'>
                <Text className='ch13-scenario-detail__label'>触发条件</Text>
                <Text className='ch13-scenario-detail__value'>{s.trigger}</Text>
              </View>
              <View className='ch13-scenario-detail__row'>
                <Text className='ch13-scenario-detail__label'>降息节奏</Text>
                <Text className='ch13-scenario-detail__value'>{s.pace}</Text>
              </View>
              <Text className='ch13-scenario-detail__assets-title'>资产影响</Text>
              <View className='ch13-scenario-assets'>
                {s.assets.map((a, j) => (
                  <View key={j} className='ch13-scenario-asset'>
                    <Text className='ch13-scenario-asset__name'>{a.asset}</Text>
                    <Text className={`ch13-scenario-asset__view ${a.view.includes('↑') ? 'ch13-scenario-asset--up' : a.view.includes('↓') ? 'ch13-scenario-asset--down' : 'ch13-scenario-asset--neutral'}`}>
                      {a.view}
                    </Text>
                    <Text className='ch13-scenario-asset__detail'>{a.detail}</Text>
                  </View>
                ))}
              </View>
            </View>
          )
        })()}
      </View>

      {/* ══════════════════════════════════════════════════
          §8  超级核心通胀
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section'>
        <Text className='ch13-section__title'>🔬 超级核心PCE：当前Fed最关注的通胀指标</Text>

        <View className='ch13-supercore-card'>
          <Text className='ch13-supercore-card__formula'>超级核心PCE = 核心服务PCE — 住房</Text>
          <Text className='ch13-supercore-card__desc'>
            剔除住房（因存量租约滞后效应导致OER数据滞后12-18个月）后，最纯粹地反映劳动力市场对服务通胀的传导，与工资增速高度同步。
          </Text>
        </View>

        <View className='ch13-supercore-layers'>
          <View className='ch13-supercore-layer'>
            <View className='ch13-supercore-layer__bar' style={{ width: '100%', backgroundColor: '#4a9eff33' }} />
            <Text className='ch13-supercore-layer__name'>整体CPI</Text>
            <Text className='ch13-supercore-layer__note'>含食品+能源，波动最大</Text>
          </View>
          <View className='ch13-supercore-layer'>
            <View className='ch13-supercore-layer__bar' style={{ width: '80%', backgroundColor: '#4a9eff55' }} />
            <Text className='ch13-supercore-layer__name'>核心CPI</Text>
            <Text className='ch13-supercore-layer__note'>剔除食品+能源</Text>
          </View>
          <View className='ch13-supercore-layer'>
            <View className='ch13-supercore-layer__bar' style={{ width: '60%', backgroundColor: '#4a9eff88' }} />
            <Text className='ch13-supercore-layer__name'>核心PCE</Text>
            <Text className='ch13-supercore-layer__note'>Fed官方目标，权重调整</Text>
          </View>
          <View className='ch13-supercore-layer'>
            <View className='ch13-supercore-layer__bar' style={{ width: '40%', backgroundColor: '#4a9effcc' }} />
            <Text className='ch13-supercore-layer__name'>超级核心PCE</Text>
            <Text className='ch13-supercore-layer__note'>核心服务-住房，最纯粹劳动力市场信号</Text>
          </View>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          §9  关键结论
      ══════════════════════════════════════════════════ */}
      <View className='ch13-section ch13-section--last'>
        <Text className='ch13-section__title'>💡 核心结论：如何用Fed框架做资产判断</Text>

        <View className='ch13-conclusion-cards'>
          <View className='ch13-conclusion-card'>
            <Text className='ch13-conclusion-card__num'>01</Text>
            <Text className='ch13-conclusion-card__title'>先看R*位置</Text>
            <Text className='ch13-conclusion-card__body'>当前FFR是否高于R*？差距越大，政策越紧缩，长端债券越受益于降息预期。R*若上移（疫情后财政扩张），"中性"就已经提高，降息空间比想象中小。</Text>
          </View>
          <View className='ch13-conclusion-card'>
            <Text className='ch13-conclusion-card__num'>02</Text>
            <Text className='ch13-conclusion-card__title'>追踪超级核心PCE</Text>
            <Text className='ch13-conclusion-card__body'>月度MoM持续低于0.2% → 年化约2.4%，Fed有空间降息；若反弹至0.3%+ → 降息推迟。配合工资增速看：工资降→超级核心PCE必然跟降。</Text>
          </View>
          <View className='ch13-conclusion-card'>
            <Text className='ch13-conclusion-card__num'>03</Text>
            <Text className='ch13-conclusion-card__title'>萨姆规则预警衰退</Text>
            <Text className='ch13-conclusion-card__body'>失业率3个月均值超过过去12个月低点0.5ppt → 历史上每次均对应经济衰退。一旦触发，Fed会快速切换至衰退降息模式，节奏远快于市场预期。</Text>
          </View>
          <View className='ch13-conclusion-card'>
            <Text className='ch13-conclusion-card__num'>04</Text>
            <Text className='ch13-conclusion-card__title'>区分降息原因</Text>
            <Text className='ch13-conclusion-card__body'>预防性降息（soft landing）利好股债双多；衰退降息利好长债/黄金但利空股票；滞胀环境下则几乎无好资产，黄金是历史上最可靠的对冲工具。</Text>
          </View>
        </View>
      </View>

      {/* ── Footer ── */}
      <View className='ch13-footer'>
        <Text className='ch13-footer__text'>
          参考：Bernanke《21世纪货币政策》· 美联储FOMC声明 · LW/HLW R*模型 · Treasury数据
        </Text>
      </View>

    </ScrollView>
  )
}
