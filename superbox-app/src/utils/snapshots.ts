export interface PredictDef {
  question: string
  options: string[]
  correct: number // 0-based
  contextLine: string
}

export interface RevealDef {
  title: string
  delta: string
  explain: string
  twist: string
}

export interface SnapshotItem<P> {
  key: string
  label: string
  accent?: 'primary' | 'danger'
  params: P
  predict?: PredictDef
  reveal?: RevealDef
}

// ─── Ch1: 美国经济 NPV ────────────────────────────────────────────────────────

export interface Ch1Params {
  growthRate: number
  discountRate: number
  years: number
  initialGDP: number
}

export const ch1Snapshots: SnapshotItem<Ch1Params>[] = [
  {
    key: '2019',
    label: '2019 疫情前',
    params: {
      growthRate: 2.3,
      discountRate: 3.5,
      years: 10,
      initialGDP: 21400,
    },
  },
  {
    key: '2020',
    label: '2020 COVID冲击',
    accent: 'danger',
    params: {
      growthRate: -3.4,
      discountRate: 0.5,
      years: 10,
      initialGDP: 20930,
    },
    predict: {
      question: '2020 Q2 美国GDP年化增速是多少？',
      options: ['-5%', '-15%', '-31%', '-50%'],
      correct: 2,
      contextLine: '新冠疫情重创经济，2020年Q2录得史上最大季度跌幅',
    },
    reveal: {
      title: '史上最大季度收缩',
      delta: '-31.2%',
      explain:
        '2020年Q2美国GDP年化增速暴跌至-31.2%，消费、投资、出口全面熄火，失业人数单月新增超2000万。',
      twist:
        '五大领先指标全亮红灯……这是50年来首次集体失灵却未引发长期衰退——财政与货币的史无前例双宽松在18个月内将GDP拉回正轨。',
    },
  },
  {
    key: '2022',
    label: '2022 加息周期',
    params: {
      growthRate: 2.1,
      discountRate: 5.0,
      years: 10,
      initialGDP: 25460,
    },
  },
]

// ─── Ch7: 美债 Bond Pricing ───────────────────────────────────────────────────

export interface Ch7Params {
  faceValue: number
  couponRate: number
  ytm: number
  years: number
}

export const ch7Snapshots: SnapshotItem<Ch7Params>[] = [
  {
    key: '2019',
    label: '2019 降息前',
    params: {
      faceValue: 1000,
      couponRate: 2.5,
      ytm: 2.0,
      years: 10,
    },
  },
  {
    key: '2020',
    label: '2020 零利率',
    accent: 'danger',
    params: {
      faceValue: 1000,
      couponRate: 1.5,
      ytm: 0.6,
      years: 10,
    },
  },
  {
    key: '2022',
    label: '2022 暴力加息',
    accent: 'danger',
    params: {
      faceValue: 1000,
      couponRate: 2.5,
      ytm: 4.2,
      years: 10,
    },
    predict: {
      question: '2022年长债ETF(TLT)全年跌了多少？',
      options: ['-10%', '-20%', '-31%', '-45%'],
      correct: 2,
      contextLine: 'Fed史上最快加息周期，10年期国债收益率从1.5%飙升至4.2%',
    },
    reveal: {
      title: '债券史上最惨烈的一年',
      delta: '-31%',
      explain:
        'TLT全年下跌约31%，利率上行400bp导致久期10年以上的长债遭遇历史性亏损，超过2008年金融危机期间表现。',
      twist:
        '教材说美债利率跟名义GDP走(r=0.7)，但GDP年化-31%利率仅降到0.6%——相关性在极端时失效，Fed的前瞻指引彻底主导了利率定价。',
    },
  },
  {
    key: '2024',
    label: '2024 高利率新常态',
    params: {
      faceValue: 1000,
      couponRate: 4.0,
      ytm: 4.5,
      years: 10,
    },
  },
]

// ─── Ch6: 美元 Dual Factor ────────────────────────────────────────────────────

export interface Ch6Params {
  usGrowth: number
  globalGrowth: number
  usInflation: number
  globalInflation: number
}

export const ch6Snapshots: SnapshotItem<Ch6Params>[] = [
  {
    key: '2014',
    label: '2014 美元暴涨',
    accent: 'primary',
    params: {
      usGrowth: 2.5,
      globalGrowth: 3.5,
      usInflation: 1.6,
      globalInflation: 3.2,
    },
    predict: {
      question: '2014-16美国经济放缓，美元指数涨还是跌？',
      options: ['跌5-10%', '基本持平', '涨10-15%', '涨20%+'],
      correct: 3,
      contextLine: 'ECB与BOJ相继推出大规模QE，全球央行政策严重分化',
    },
    reveal: {
      title: '相对宽松差驱动的美元牛市',
      delta: '+25%',
      explain:
        '美元指数从80飙升至100以上，涨幅超过25%。美国本身增长并不亮眼，但欧洲和日本的超级宽松制造了巨大的利差。',
      twist:
        '美国增长放缓但美元因ECB/BOJ QE的"相对宽松差"暴涨——不是美国强，是别人更弱。双因子模型里，增长差只是分子，政策差才是放大器。',
    },
  },
  {
    key: '2020',
    label: '2020 疫情',
    params: {
      usGrowth: -3.4,
      globalGrowth: -3.1,
      usInflation: 1.2,
      globalInflation: 2.0,
    },
  },
  {
    key: '2022',
    label: '2022 强美元',
    params: {
      usGrowth: 2.1,
      globalGrowth: 3.4,
      usInflation: 8.0,
      globalInflation: 7.5,
    },
  },
]

// ─── Ch10: 黄金 Fair Value ────────────────────────────────────────────────────

export interface Ch10Params {
  realRate: number
  dxyIndex: number
  centralBankBuying: number
}

export const ch10Snapshots: SnapshotItem<Ch10Params>[] = [
  {
    key: '2019',
    label: '2019 降息预期',
    params: {
      realRate: 0.5,
      dxyIndex: 97,
      centralBankBuying: 650,
    },
  },
  {
    key: '2020',
    label: '2020 负实际利率',
    params: {
      realRate: -1.0,
      dxyIndex: 90,
      centralBankBuying: 300,
    },
  },
  {
    key: '2023',
    label: '2023 金价脱钩',
    accent: 'danger',
    params: {
      realRate: 1.5,
      dxyIndex: 104,
      centralBankBuying: 1050,
    },
    predict: {
      question: '2022-24实际利率从-1%升到+2%，金价？',
      options: ['跌30%+', '跌10-20%', '基本持平', '涨20%+'],
      correct: 3,
      contextLine: '央行购金量连续两年突破1000吨，为1950年代以来最高记录',
    },
    reveal: {
      title: '央行购金重写黄金定价逻辑',
      delta: '+33%',
      explain:
        '2022-2024年间，尽管实际利率上升约300bp（对金价理论利空），金价依然从约1800美元涨至约2400美元，涨幅超过33%。',
      twist:
        '实际利率涨3%金价反涨33%——R²=0.36的单因子模型彻底失灵，央行购金成新主导因子。以新兴市场为主的央行正在系统性地将储备多元化，这是美元信用体系裂缝的早期信号。',
    },
  },
]

// ─── Ch11: 央行 Taylor Rule ───────────────────────────────────────────────────

export interface Ch11Params {
  inflation: number
  inflationTarget: number
  outputGap: number
  rStar: number
}

export const ch11Snapshots: SnapshotItem<Ch11Params>[] = [
  {
    key: '2019',
    label: '2019 预防式降息',
    params: {
      inflation: 1.8,
      inflationTarget: 2.0,
      outputGap: -0.5,
      rStar: 0.5,
    },
  },
  {
    key: '2022',
    label: '2022 通胀风暴',
    accent: 'danger',
    params: {
      inflation: 9.1,
      inflationTarget: 2.0,
      outputGap: 1.5,
      rStar: 0.5,
    },
    predict: {
      question: '泰勒规则说Fed应加息到多少？',
      options: ['5-6%', '8-10%', '12-14%', '15%+'],
      correct: 2,
      contextLine: 'CPI同比达9.1%，为1981年以来最高，远超Fed 2%目标',
    },
    reveal: {
      title: '规则与裁量之间1160bp的鸿沟',
      delta: '13.35% vs 实际1.75%',
      explain:
        '标准泰勒规则代入2022年Q2数据（通胀9.1%，产出缺口+1.5%）得出名义利率应达13-14%。Fed实际联邦基金利率彼时仅1.75%。',
      twist:
        '泰勒说加到13%，Fed实际只到1.75%——规则与裁量之差达1160bp。这不是Fed失职，而是泰勒规则本身对极端非线性冲击存在系统性高估，金融稳定目标未被纳入原始公式。',
    },
  },
  {
    key: '2024',
    label: '2024 软着陆?',
    params: {
      inflation: 3.0,
      inflationTarget: 2.0,
      outputGap: 0.5,
      rStar: 0.5,
    },
  },
]

// ─── Ch9: Oil Project NPV ─────────────────────────────────────────────────────

export interface Ch9Params {
  oilPrice: number
  costPerBarrel: number
  dailyProduction: number
  waccRate: number
  years: number
}

export const ch9Snapshots: SnapshotItem<Ch9Params>[] = [
  {
    key: '2014',
    label: '2014 高油价',
    params: {
      oilPrice: 100,
      costPerBarrel: 40,
      dailyProduction: 5000,
      waccRate: 10,
      years: 20,
    },
  },
  {
    key: '2016',
    label: '2016 油价崩盘',
    accent: 'danger',
    params: {
      oilPrice: 30,
      costPerBarrel: 40,
      dailyProduction: 5000,
      waccRate: 12,
      years: 20,
    },
    predict: {
      question: '2016油价跌到$30/桶，页岩油企业的项目NPV？',
      options: ['小幅盈利', '盈亏平衡', '亏损30%+', '亏损60%+'],
      correct: 2,
      contextLine: '布伦特原油从$115跌至$27，OPEC拒绝减产导致全球供给过剩',
    },
    reveal: {
      title: '收入倒挂：每桶亏损$10',
      delta: 'NPV为负',
      explain:
        '油价$30低于$40的开采成本，项目现金流每桶亏损$10，叠加12%的高资本成本，NPV深度为负。北美超过100家油气公司于2015-16年申请破产保护。',
      twist:
        '教材说2001前油价均值回归，2014后页岩油让油价重回均值回归——第三种范式：页岩油成为"弹性供给阀门"，将长期油价锚定在$50-80区间，颠覆了OPEC卡特尔的定价权。',
    },
  },
  {
    key: '2022',
    label: '2022 俄乌冲击',
    accent: 'danger',
    params: {
      oilPrice: 120,
      costPerBarrel: 45,
      dailyProduction: 5000,
      waccRate: 8,
      years: 20,
    },
  },
]

// ─── Ch4: 新兴市场 IRR ────────────────────────────────────────────────────────

export interface Ch4Params {
  initialInvestment: number
  annualReturn: number
  exitMultiple: number
  holdingYears: number
}

export const ch4Snapshots: SnapshotItem<Ch4Params>[] = [
  {
    key: '2007',
    label: '2007 EM黄金期',
    params: {
      initialInvestment: -1000,
      annualReturn: 150,
      exitMultiple: 2.0,
      holdingYears: 5,
    },
  },
  {
    key: '2013',
    label: '2013 Taper Tantrum',
    accent: 'danger',
    params: {
      initialInvestment: -1000,
      annualReturn: 80,
      exitMultiple: 0.7,
      holdingYears: 5,
    },
    predict: {
      question: '2013 Fed暗示缩减QE，EM资本外流速度vs流入？',
      options: ['差不多', '外流快2倍', '外流快5倍', '外流快10倍'],
      correct: 2,
      contextLine: 'Bernanke一句"可能缩减购债"，触发EM史上最快资本逃离',
    },
    reveal: {
      title: '资本的不对称性：慢进快出',
      delta: '外流速度是流入的3-5倍',
      explain:
        '2013年5月至9月，新兴市场累计资本外流超过800亿美元，印度卢比、巴西雷亚尔、印尼盾等货币单季贬值15-20%。',
      twist:
        '资本进来要一年，出去只要一周——利差解释不了恐慌。流动性错配才是核心：长期资产+短期负债的结构在压力下自我强化，IRR模型无法捕捉"挤兑动态"。',
    },
  },
  {
    key: '2024',
    label: '2024 EM分化',
    params: {
      initialInvestment: -1000,
      annualReturn: 100,
      exitMultiple: 1.5,
      holdingYears: 5,
    },
  },
]
