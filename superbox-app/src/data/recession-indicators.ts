// recession-indicators.ts
// Historical NBER recession data and indicator history. Used by Ch1 charts.
// Data is illustrative but historically approximate (FRED data through ~2024-12).

export interface RecessionEvent {
  start: string         // YYYY-MM
  end: string
  duration: number      // months
  trigger: string       // brief
  gdpDrop: number       // peak-to-trough %
  unemploymentPeak: number
}

export const NBER_RECESSIONS: RecessionEvent[] = [
  {
    start: '1973-11',
    end: '1975-03',
    duration: 16,
    trigger: '石油危机 + 布雷顿森林体系崩溃',
    gdpDrop: -3.4,
    unemploymentPeak: 9.0,
  },
  {
    start: '1980-01',
    end: '1980-07',
    duration: 6,
    trigger: '沃尔克加息第一轮 + 第二次石油危机',
    gdpDrop: -2.2,
    unemploymentPeak: 7.8,
  },
  {
    start: '1981-07',
    end: '1982-11',
    duration: 16,
    trigger: '沃尔克加息第二轮（利率高达20%）',
    gdpDrop: -2.9,
    unemploymentPeak: 10.8,
  },
  {
    start: '1990-07',
    end: '1991-03',
    duration: 8,
    trigger: '储贷危机 + 海湾战争油价冲击',
    gdpDrop: -1.4,
    unemploymentPeak: 7.8,
  },
  {
    start: '2001-03',
    end: '2001-11',
    duration: 8,
    trigger: '互联网泡沫破裂 + 9/11冲击',
    gdpDrop: -0.3,
    unemploymentPeak: 6.3,
  },
  {
    start: '2007-12',
    end: '2009-06',
    duration: 18,
    trigger: '次贷危机 / 全球金融危机（GFC）',
    gdpDrop: -5.1,
    unemploymentPeak: 10.0,
  },
  {
    start: '2020-02',
    end: '2020-04',
    duration: 2,
    trigger: 'COVID-19疫情封锁',
    gdpDrop: -10.1,
    unemploymentPeak: 14.7,
  },
]

// ---------------------------------------------------------------------------
// Yield curve history: 10Y-3M spread monthly, 60 months (2020-01 to 2024-12)
// Pattern:
//   2020-01 to 2021-12: positive, 0.3-1.8 range (post-COVID recovery)
//   2022-01 to 2022-06: declining from ~1.5 toward 0
//   2022-07: first inversion
//   2022-12 to 2024-06: deeply inverted, trough ~-1.9 around 2023-05
//   2024-07 onwards: gradually uninverting back toward 0
// ---------------------------------------------------------------------------
export const YIELD_CURVE_HISTORY: { date: string; spread: number }[] = [
  // 2020: COVID-era, curve steepened sharply as Fed cut rates
  { date: '2020-01', spread: 0.35 },
  { date: '2020-02', spread: 0.28 },
  { date: '2020-03', spread: 0.55 },  // Fed emergency cuts → 3M collapsed
  { date: '2020-04', spread: 0.85 },
  { date: '2020-05', spread: 0.95 },
  { date: '2020-06', spread: 1.10 },
  { date: '2020-07', spread: 1.05 },
  { date: '2020-08', spread: 1.15 },
  { date: '2020-09', spread: 1.08 },
  { date: '2020-10', spread: 1.02 },
  { date: '2020-11', spread: 1.20 },
  { date: '2020-12', spread: 1.35 },
  // 2021: reflation, curve steep
  { date: '2021-01', spread: 1.45 },
  { date: '2021-02', spread: 1.65 },
  { date: '2021-03', spread: 1.78 },
  { date: '2021-04', spread: 1.72 },
  { date: '2021-05', spread: 1.68 },
  { date: '2021-06', spread: 1.55 },
  { date: '2021-07', spread: 1.42 },
  { date: '2021-08', spread: 1.48 },
  { date: '2021-09', spread: 1.52 },
  { date: '2021-10', spread: 1.58 },
  { date: '2021-11', spread: 1.50 },
  { date: '2021-12', spread: 1.40 },
  // 2022: Fed hiking cycle, curve rapidly flattening
  { date: '2022-01', spread: 1.32 },
  { date: '2022-02', spread: 1.15 },
  { date: '2022-03', spread: 0.82 },
  { date: '2022-04', spread: 0.55 },
  { date: '2022-05', spread: 0.30 },
  { date: '2022-06', spread: 0.08 },
  { date: '2022-07', spread: -0.10 }, // inversion begins
  { date: '2022-08', spread: -0.38 },
  { date: '2022-09', spread: -0.52 },
  { date: '2022-10', spread: -0.68 },
  { date: '2022-11', spread: -0.82 },
  { date: '2022-12', spread: -1.05 },
  // 2023: deeply inverted
  { date: '2023-01', spread: -1.18 },
  { date: '2023-02', spread: -1.35 },
  { date: '2023-03', spread: -1.52 },
  { date: '2023-04', spread: -1.72 },
  { date: '2023-05', spread: -1.88 }, // trough
  { date: '2023-06', spread: -1.82 },
  { date: '2023-07', spread: -1.68 },
  { date: '2023-08', spread: -1.55 },
  { date: '2023-09', spread: -1.42 },
  { date: '2023-10', spread: -1.30 },
  { date: '2023-11', spread: -1.22 },
  { date: '2023-12', spread: -1.15 },
  // 2024: gradual uninversion
  { date: '2024-01', spread: -1.08 },
  { date: '2024-02', spread: -0.98 },
  { date: '2024-03', spread: -0.88 },
  { date: '2024-04', spread: -0.78 },
  { date: '2024-05', spread: -0.68 },
  { date: '2024-06', spread: -0.55 },
  { date: '2024-07', spread: -0.42 }, // uninverting
  { date: '2024-08', spread: -0.22 },
  { date: '2024-09', spread: -0.08 },
  { date: '2024-10', spread: 0.10 },
  { date: '2024-11', spread: 0.28 },
  { date: '2024-12', spread: 0.42 },
]

// ---------------------------------------------------------------------------
// LEI (Leading Economic Index) YoY % change — 36 months, 2022-01 to 2024-12
// Historic anomaly: 24+ consecutive months of YoY decline (2022-12 onward)
// ---------------------------------------------------------------------------
export const LEI_HISTORY: { date: string; yoyChange: number }[] = [
  // 2022: turning negative by year-end
  { date: '2022-01', yoyChange: 1.8 },
  { date: '2022-02', yoyChange: 0.8 },
  { date: '2022-03', yoyChange: -0.2 },
  { date: '2022-04', yoyChange: -1.2 },
  { date: '2022-05', yoyChange: -2.5 },
  { date: '2022-06', yoyChange: -3.8 },
  { date: '2022-07', yoyChange: -5.2 },
  { date: '2022-08', yoyChange: -6.0 },
  { date: '2022-09', yoyChange: -7.2 },
  { date: '2022-10', yoyChange: -7.8 },
  { date: '2022-11', yoyChange: -8.5 },
  { date: '2022-12', yoyChange: -9.2 }, // 24+ month streak begins
  // 2023: deeply negative, historic streak
  { date: '2023-01', yoyChange: -9.8 },
  { date: '2023-02', yoyChange: -10.2 },
  { date: '2023-03', yoyChange: -10.5 },
  { date: '2023-04', yoyChange: -10.8 },
  { date: '2023-05', yoyChange: -10.2 },
  { date: '2023-06', yoyChange: -9.8 },
  { date: '2023-07', yoyChange: -9.2 },
  { date: '2023-08', yoyChange: -8.5 },
  { date: '2023-09', yoyChange: -7.8 },
  { date: '2023-10', yoyChange: -7.2 },
  { date: '2023-11', yoyChange: -6.5 },
  { date: '2023-12', yoyChange: -5.8 },
  // 2024: still negative but improving
  { date: '2024-01', yoyChange: -5.2 },
  { date: '2024-02', yoyChange: -4.5 },
  { date: '2024-03', yoyChange: -3.8 },
  { date: '2024-04', yoyChange: -3.2 },
  { date: '2024-05', yoyChange: -2.8 },
  { date: '2024-06', yoyChange: -2.2 },
  { date: '2024-07', yoyChange: -1.8 },
  { date: '2024-08', yoyChange: -1.5 },
  { date: '2024-09', yoyChange: -1.2 },
  { date: '2024-10', yoyChange: -0.8 },
  { date: '2024-11', yoyChange: -0.5 },
  { date: '2024-12', yoyChange: -0.3 }, // still negative — 24+ month streak maintained
]

// ---------------------------------------------------------------------------
// Manufacturing PMI (ISM) history — 36 months, 2022-01 to 2024-12
// Pattern: starts ~57, drops below 50 by mid-2022, oscillates 46-50 in 2023-24
// ---------------------------------------------------------------------------
export const PMI_HISTORY: { date: string; value: number }[] = [
  // 2022: strong then sharp deceleration
  { date: '2022-01', value: 57.6 },
  { date: '2022-02', value: 58.6 },
  { date: '2022-03', value: 57.1 },
  { date: '2022-04', value: 55.4 },
  { date: '2022-05', value: 56.1 },
  { date: '2022-06', value: 53.0 },
  { date: '2022-07', value: 52.8 },
  { date: '2022-08', value: 51.5 },
  { date: '2022-09', value: 50.9 },
  { date: '2022-10', value: 50.2 },
  { date: '2022-11', value: 49.0 },
  { date: '2022-12', value: 48.4 },
  // 2023: sub-50 territory, manufacturing contraction
  { date: '2023-01', value: 47.4 },
  { date: '2023-02', value: 47.7 },
  { date: '2023-03', value: 46.3 },
  { date: '2023-04', value: 47.1 },
  { date: '2023-05', value: 46.9 },
  { date: '2023-06', value: 46.0 },
  { date: '2023-07', value: 46.4 },
  { date: '2023-08', value: 47.6 },
  { date: '2023-09', value: 49.0 },
  { date: '2023-10', value: 46.7 },
  { date: '2023-11', value: 46.7 },
  { date: '2023-12', value: 47.4 },
  // 2024: modest recovery attempts, still mostly sub-50
  { date: '2024-01', value: 49.1 },
  { date: '2024-02', value: 47.8 },
  { date: '2024-03', value: 50.3 },
  { date: '2024-04', value: 49.2 },
  { date: '2024-05', value: 48.7 },
  { date: '2024-06', value: 48.5 },
  { date: '2024-07', value: 46.8 },
  { date: '2024-08', value: 47.2 },
  { date: '2024-09', value: 47.2 },
  { date: '2024-10', value: 46.5 },
  { date: '2024-11', value: 48.4 },
  { date: '2024-12', value: 49.3 },
]

// ---------------------------------------------------------------------------
// Inventory Cycle: 4 phases with asset implications
// ---------------------------------------------------------------------------
export interface InventoryPhase {
  phase: '主动补库存' | '被动补库存' | '主动去库存' | '被动去库存'
  description: string
  assetsUp: string[]
  assetsDown: string[]
}

export const INVENTORY_CYCLE_PHASES: InventoryPhase[] = [
  {
    phase: '主动补库存',
    description: '需求旺盛，企业主动增加库存以满足订单。经济处于扩张期，产能利用率上升，原材料需求增加。通常对应经济周期的繁荣阶段（复苏后期至过热前期）。',
    assetsUp: ['股票（周期股）', '大宗商品', '工业金属', '能源'],
    assetsDown: ['国债', '黄金（避险资产）'],
  },
  {
    phase: '被动补库存',
    description: '需求开始放缓，但企业已生产的库存仍在累积，导致库存被动增加。这是经济由盛转衰的警示阶段，企业盈利开始承压。',
    assetsUp: ['防御性股票', '消费必需品', '短期国债'],
    assetsDown: ['周期股', '大宗商品', '工业金属'],
  },
  {
    phase: '主动去库存',
    description: '需求明显下滑，企业主动削减库存和产能，压缩开支。经济处于收缩/衰退期，失业率上升，信贷收紧。对应经济周期的衰退阶段。',
    assetsUp: ['长期国债', '黄金', '美元（避险）'],
    assetsDown: ['股票', '大宗商品', '高收益债'],
  },
  {
    phase: '被动去库存',
    description: '需求开始回暖，但库存仍在自然消耗中降低（被动减少）。经济触底复苏早期，市场预期改善，是新一轮扩张周期的起点。',
    assetsUp: ['成长股', '新兴市场股票', '信用债', '铜等早周期金属'],
    assetsDown: ['长期国债（利率开始反弹预期）'],
  },
]

// ---------------------------------------------------------------------------
// NBER Core Indicators — current snapshot (~2024-Q4 / early 2025)
// Mix of leading, coincident, and lagging indicators
// ---------------------------------------------------------------------------
export interface NberCoreIndicator {
  id: string
  name: string
  emoji: string
  type: 'leading' | 'coincident' | 'lagging'
  value: string         // formatted display string
  status: 'expansion' | 'contraction' | 'neutral'
  hint: string
  history?: number[]    // 12-month sparkline data
}

export const NBER_CORE_INDICATORS: NberCoreIndicator[] = [
  // ---- COINCIDENT INDICATORS (NBER's 4 core) ----
  {
    id: 'INDPRO',
    name: '工业生产指数',
    emoji: '🏭',
    type: 'coincident',
    value: '+0.3% YoY',
    status: 'neutral',
    hint: '同比近乎停滞，制造业持续承压。历史上衰退时通常跌幅超-3%。',
    history: [0.8, 0.5, 0.2, -0.1, 0.3, 0.6, 0.4, 0.2, 0.5, 0.3, 0.4, 0.3],
  },
  {
    id: 'RSAFS',
    name: '实际零售消费',
    emoji: '🛒',
    type: 'coincident',
    value: '+1.8% YoY',
    status: 'expansion',
    hint: '消费者支出韧性较强，服务消费支撑整体数据，但商品消费放缓。',
    history: [2.5, 2.1, 1.8, 1.5, 2.0, 2.2, 1.9, 1.6, 1.8, 2.0, 1.9, 1.8],
  },
  {
    id: 'PAYEMS',
    name: '非农就业（同比）',
    emoji: '👷',
    type: 'lagging',
    value: '+1.4% YoY',
    status: 'expansion',
    hint: '就业市场降温但仍正增长。月均新增约15-18万，低于2022年峰值的40万。',
    history: [2.8, 2.5, 2.2, 2.0, 1.8, 1.6, 1.5, 1.4, 1.5, 1.5, 1.4, 1.4],
  },
  {
    id: 'RPI',
    name: '实际个人收入（剔除转移支付）',
    emoji: '💰',
    type: 'coincident',
    value: '+2.2% YoY',
    status: 'expansion',
    hint: '通胀回落叠加名义工资增长，实际购买力改善。超额储蓄基本耗尽。',
    history: [1.5, 1.8, 2.0, 2.2, 2.5, 2.4, 2.2, 2.1, 2.3, 2.2, 2.2, 2.2],
  },
  // ---- LEADING INDICATORS ----
  {
    id: 'MFGPMI',
    name: '制造业PMI（ISM）',
    emoji: '📊',
    type: 'leading',
    value: '49.3',
    status: 'contraction',
    hint: '连续26个月低于荣枯线50（历史罕见）。新订单分项略有改善，但就业分项仍疲弱。',
    history: [47.4, 47.7, 46.3, 47.1, 46.9, 46.0, 46.4, 47.6, 49.0, 46.7, 48.4, 49.3],
  },
  {
    id: 'T10Y3M',
    name: '收益率曲线（10Y-3M）',
    emoji: '📉',
    type: 'leading',
    value: '+0.42%',
    status: 'neutral',
    hint: '2024年底已从-1.88%的深度倒挂回归正值，历史上倒挂后12-18个月出现衰退。',
    history: [-1.15, -1.08, -0.98, -0.78, -0.55, -0.42, -0.22, -0.08, 0.10, 0.28, 0.42, 0.42],
  },
  {
    id: 'USSLIND',
    name: 'LEI领先经济指数（同比）',
    emoji: '🔭',
    type: 'leading',
    value: '-0.3% YoY',
    status: 'contraction',
    hint: '已连续25个月同比为负（2022年12月至今），超过以往大多数衰退前信号持续时长。',
    history: [-5.8, -5.2, -4.5, -3.8, -3.2, -2.8, -2.2, -1.8, -1.5, -1.2, -0.8, -0.3],
  },
  {
    id: 'ICSA',
    name: '初请失业金人数（周）',
    emoji: '📋',
    type: 'leading',
    value: '21.5万',
    status: 'neutral',
    hint: '仍处于历史低位，劳动力市场尚未出现大规模裁员。需关注是否突破25万关口。',
    history: [205, 212, 218, 225, 220, 215, 218, 210, 212, 215, 213, 215],
  },
  {
    id: 'TEMPHELP',
    name: '非农临时工（同比）',
    emoji: '⏱️',
    type: 'leading',
    value: '-3.5% YoY',
    status: 'contraction',
    hint: '临时工通常是经济风向标，领先全面就业市场6-12个月。持续负增长是早期预警。',
    history: [-0.5, -1.2, -1.8, -2.5, -2.8, -3.0, -3.2, -3.5, -3.8, -3.5, -3.5, -3.5],
  },
]
