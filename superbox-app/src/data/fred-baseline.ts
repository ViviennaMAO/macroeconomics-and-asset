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

export const BASELINE_DATE = '2025-05-08'

export const FRED_BASELINE: FredSnapshot = {
  fetchedAt: BASELINE_DATE,
  series: {
    DFF: {
      id: 'DFF',
      label: 'Fed基准利率',
      value: 5.33,
      change: 0,
      date: '2025-01-31',
      prevDate: null,
      chapter: 11,
    },
    DGS2: {
      id: 'DGS2',
      label: '2年期国债收益率',
      value: 4.22,
      change: -0.05,
      date: '2025-05-01',
      prevDate: null,
      chapter: 7,
    },
    DGS10: {
      id: 'DGS10',
      label: '10年期国债收益率',
      value: 4.58,
      change: 0.03,
      date: '2025-05-01',
      prevDate: null,
      chapter: 7,
    },
    DGS30: {
      id: 'DGS30',
      label: '30年期国债收益率',
      value: 4.97,
      change: 0.02,
      date: '2025-05-01',
      prevDate: null,
      chapter: 7,
    },
    T10Y2Y: {
      id: 'T10Y2Y',
      label: '2s10s利差',
      value: 0.36,
      change: 0.08,
      date: '2025-05-01',
      prevDate: null,
      chapter: 7,
    },
    SOFR: {
      id: 'SOFR',
      label: 'SOFR隔夜利率',
      value: 5.30,
      change: 0,
      date: '2025-04-30',
      prevDate: null,
      chapter: 11,
    },
    CPIAUCSL: {
      id: 'CPIAUCSL',
      label: 'CPI同比',
      value: 2.4,
      change: -0.3,
      date: '2025-03-01',
      prevDate: null,
      chapter: 11,
    },
    CPILFESL: {
      id: 'CPILFESL',
      label: '核心CPI同比',
      value: 2.8,
      change: -0.1,
      date: '2025-03-01',
      prevDate: null,
      chapter: 11,
    },
    T10YIE: {
      id: 'T10YIE',
      label: '10年盈亏平衡通胀',
      value: 2.30,
      change: 0.05,
      date: '2025-05-01',
      prevDate: null,
      chapter: 10,
    },
    M2SL: {
      id: 'M2SL',
      label: 'M2同比',
      value: 3.5,
      change: 0.2,
      date: '2025-02-01',
      prevDate: null,
      chapter: 11,
    },
    WALCL: {
      id: 'WALCL',
      label: 'Fed资产负债表(T$)',
      value: 6.73,
      change: -0.02,
      date: '2025-04-30',
      prevDate: null,
      chapter: 11,
    },
    UNRATE: {
      id: 'UNRATE',
      label: '失业率',
      value: 4.2,
      change: 0.1,
      date: '2025-03-01',
      prevDate: null,
      chapter: 11,
    },
    DTWEXBGS: {
      id: 'DTWEXBGS',
      label: '美元指数(广义)',
      value: 103.5,
      change: -1.2,
      date: '2025-05-01',
      prevDate: null,
      chapter: 6,
    },
    GOLDAMGBD228NLBM: {
      id: 'GOLDAMGBD228NLBM',
      label: '黄金现货价格($/oz)',
      value: 3280.0,
      change: 45.0,
      date: '2025-05-01',
      prevDate: null,
      chapter: 10,
    },
    _spread2s10s: {
      id: '_spread2s10s',
      label: '2s10s利差(bps)',
      value: 36,
      change: null,
      date: BASELINE_DATE,
      prevDate: null,
      chapter: 7,
    },
    _realRate10y: {
      id: '_realRate10y',
      label: '10年实际利率',
      value: 2.28,
      change: null,
      date: BASELINE_DATE,
      prevDate: null,
      chapter: 10,
    },
  },
}
