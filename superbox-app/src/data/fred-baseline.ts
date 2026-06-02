export interface FredSeriesItem {
  id: string
  label: string
  value: number
  change: number | null
  date: string
  prevDate: string | null
  chapter: number
}

export interface FredSnapshot {
  fetchedAt: string
  series: Record<string, FredSeriesItem>
}

export const BASELINE_DATE = '2026-05-08'

export const FRED_BASELINE: FredSnapshot = {
  fetchedAt: BASELINE_DATE,
  series: {
    DFF: {
      id: 'DFF',
      label: 'Fed基准利率',
      value: 3.62,
      change: 0,
      date: '2026-05-29',
      prevDate: null,
      chapter: 11,
    },
    DGS2: {
      id: 'DGS2',
      label: '2年期国债收益率',
      value: 3.98,
      change: -0.01,
      date: '2026-05-29',
      prevDate: null,
      chapter: 7,
    },
    DGS10: {
      id: 'DGS10',
      label: '10年期国债收益率',
      value: 4.45,
      change: 0,
      date: '2026-05-29',
      prevDate: null,
      chapter: 7,
    },
    DGS30: {
      id: 'DGS30',
      label: '30年期国债收益率',
      value: 4.99,
      change: 0.01,
      date: '2026-05-29',
      prevDate: null,
      chapter: 7,
    },
    T10Y2Y: {
      id: 'T10Y2Y',
      label: '2s10s利差',
      value: 0.47,
      change: 0.01,
      date: '2026-05-29',
      prevDate: null,
      chapter: 7,
    },
    SOFR: {
      id: 'SOFR',
      label: 'SOFR隔夜利率',
      value: 3.63,
      change: 0,
      date: '2026-05-29',
      prevDate: null,
      chapter: 11,
    },
    CPIAUCSL: {
      id: 'CPIAUCSL',
      label: 'CPI同比',
      value: 3.9,
      change: 0.6,
      date: '2026-04-01',
      prevDate: null,
      chapter: 11,
    },
    CPILFESL: {
      id: 'CPILFESL',
      label: '核心CPI同比',
      value: 3.0,
      change: 0.3,
      date: '2026-04-01',
      prevDate: null,
      chapter: 11,
    },
    T10YIE: {
      id: 'T10YIE',
      label: '10年盈亏平衡通胀',
      value: 2.40,
      change: 0.02,
      date: '2026-06-01',
      prevDate: null,
      chapter: 10,
    },
    M2SL: {
      id: 'M2SL',
      label: 'M2同比',
      value: 4.7,
      change: 0.2,
      date: '2026-04-01',
      prevDate: null,
      chapter: 11,
    },
    WALCL: {
      id: 'WALCL',
      label: 'Fed资产负债表(T$)',
      value: 6.70,
      change: -0.02,
      date: '2026-05-27',
      prevDate: null,
      chapter: 11,
    },
    UNRATE: {
      id: 'UNRATE',
      label: '失业率',
      value: 4.3,
      change: 0,
      date: '2026-04-01',
      prevDate: null,
      chapter: 11,
    },
    DTWEXBGS: {
      id: 'DTWEXBGS',
      label: '美元指数(DXY)',
      value: 99.2,
      change: -0.2,
      date: '2026-05-29',
      prevDate: null,
      chapter: 6,
    },
    GOLDAMGBD228NLBM: {
      id: 'GOLDAMGBD228NLBM',
      label: '黄金现货价格($/oz)',
      value: 4475.0,
      change: -10.0,
      date: '2026-06-01',
      prevDate: null,
      chapter: 10,
    },
    _spread2s10s: {
      id: '_spread2s10s',
      label: '2s10s利差(bps)',
      value: 47,
      change: null,
      date: BASELINE_DATE,
      prevDate: null,
      chapter: 7,
    },
    _realRate10y: {
      id: '_realRate10y',
      label: '10年实际利率',
      value: 2.07,
      change: null,
      date: BASELINE_DATE,
      prevDate: null,
      chapter: 10,
    },
    // ---- Ch1: US Economy leading/coincident indicators ----
    USSLIND: {
      id: 'USSLIND',
      label: '州领先指标(LEI)',
      value: 0.02,
      change: 0.01,
      date: '2026-04-01',
      prevDate: null,
      chapter: 1,
    },
    ICSA: {
      id: 'ICSA',
      label: '初请失业金人数',
      value: 215000,
      change: 0,
      date: '2026-05-23',
      prevDate: null,
      chapter: 1,
    },
    INDPRO: {
      id: 'INDPRO',
      label: '工业生产指数同比',
      value: 102.5,
      change: 0.1,
      date: '2026-04-01',
      prevDate: null,
      chapter: 1,
    },
    T10Y3M: {
      id: 'T10Y3M',
      label: '10年-3月利差',
      value: 0.69,
      change: 0.02,
      date: '2026-06-01',
      prevDate: null,
      chapter: 1,
    },
    NFCI: {
      id: 'NFCI',
      label: 'Fed金融压力指数',
      value: -0.51,
      change: -0.01,
      date: '2026-05-22',
      prevDate: null,
      chapter: 1,
      // Note: negative = looser financial conditions; positive = tighter
    },
    // ---- Ch1: Derived recession probability composite ----
    _recessionProbability: {
      id: '_recessionProbability',
      label: '衰退概率(综合)',
      value: 27,
      change: null,
      date: BASELINE_DATE,
      prevDate: null,
      chapter: 1,
    },
  },
}
