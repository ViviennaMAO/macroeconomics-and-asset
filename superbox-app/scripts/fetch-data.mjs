/**
 * FRED data sync script — runs in GitHub Actions, writes public/data/fred-latest.json
 * Never run this with API_KEY in source code. Key lives ONLY in GitHub Secrets.
 *
 * Series fetched:
 *   利率: DFF, DGS2, DGS10, DGS30, T10Y2Y, SOFR, IORB
 *   通胀: CPIAUCSL, CPILFESL, T10YIE (breakeven = real rate proxy)
 *   货币: M2SL, WALCL
 *   实体: UNRATE, GDP
 *   汇率: DTWEXBGS (USD broad index)
 *   黄金: GOLDAMGBD228NLBM
 */

import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const API_KEY = process.env.FRED_API_KEY
if (!API_KEY) {
  console.error('⚠️  FRED_API_KEY not set — skipping data fetch')
  process.exit(0)
}

const BASE = 'https://api.stlouisfed.org/fred/series/observations'
const __dir = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = join(__dir, '..', 'public', 'data', 'fred-latest.json')

// Series to fetch: [id, units, label, chapter_hint]
const SERIES = [
  // 利率
  ['DFF',               'lin', 'Fed基准利率',        11],
  ['DGS2',              'lin', '2年期国债收益率',     7],
  ['DGS10',             'lin', '10年期国债收益率',    7],
  ['DGS30',             'lin', '30年期国债收益率',    7],
  ['T10Y2Y',            'lin', '2s10s利差',           7],
  ['SOFR',              'lin', 'SOFR隔夜利率',        11],
  // 通胀
  ['CPIAUCSL',          'pc1', 'CPI同比',             11],
  ['CPILFESL',          'pc1', '核心CPI同比',         11],
  ['T10YIE',            'lin', '10年盈亏平衡通胀',    10],
  // 货币
  ['M2SL',              'pc1', 'M2同比',              11],
  ['WALCL',             'lin', 'Fed资产负债表(B$)',   11],
  // 实体
  ['UNRATE',            'lin', '失业率',              11],
  // 汇率
  ['DTWEXBGS',          'lin', '美元指数(广义)',       6],
  // 黄金
  ['GOLDAMGBD228NLBM',  'lin', '黄金现货价格($/oz)', 10],
]

async function fetchSeries(id, units) {
  const url = new URL(BASE)
  url.searchParams.set('series_id', id)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('sort_order', 'desc')
  url.searchParams.set('limit', '2')        // latest + previous for change
  url.searchParams.set('units', units)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`FRED ${id}: HTTP ${res.status}`)
  const json = await res.json()

  const obs = json.observations?.filter(o => o.value !== '.' && o.value !== '') ?? []
  if (obs.length === 0) return null

  const latest = parseFloat(obs[0].value)
  const prev   = obs[1] ? parseFloat(obs[1].value) : null
  const change = prev !== null ? parseFloat((latest - prev).toFixed(4)) : null

  return {
    id,
    value: parseFloat(latest.toFixed(4)),
    change,
    date: obs[0].date,
    prevDate: obs[1]?.date ?? null,
  }
}

async function main() {
  console.log(`📡 Fetching ${SERIES.length} FRED series...`)
  const results = {}
  const errors  = []

  for (const [id, units, label, ch] of SERIES) {
    try {
      const data = await fetchSeries(id, units)
      if (data) {
        results[id] = { ...data, label, chapter: ch }
        console.log(`  ✓ ${id.padEnd(22)} ${data.value} (${data.date})`)
      }
    } catch (e) {
      errors.push(id)
      console.error(`  ✗ ${id}: ${e.message}`)
    }
  }

  // Derived metrics
  if (results['DGS10'] && results['DGS2']) {
    const spread = parseFloat((results['DGS10'].value - results['DGS2'].value).toFixed(3))
    results['_spread2s10s'] = {
      id: '_spread2s10s', label: '2s10s利差(bps)',
      value: Math.round(spread * 100),
      date: results['DGS10'].date, chapter: 7,
    }
  }

  // Real rate = 10Y nominal - 10Y breakeven
  if (results['DGS10'] && results['T10YIE']) {
    const realRate = parseFloat((results['DGS10'].value - results['T10YIE'].value).toFixed(3))
    results['_realRate10y'] = {
      id: '_realRate10y', label: '10年实际利率',
      value: realRate,
      date: results['DGS10'].date, chapter: 10,
    }
  }

  // WALCL: Fed returns millions, convert to trillions
  if (results['WALCL']) {
    results['WALCL'].value = parseFloat((results['WALCL'].value / 1_000_000).toFixed(2))
    results['WALCL'].label = 'Fed资产负债表(T$)'
    if (results['WALCL'].change) {
      results['WALCL'].change = parseFloat((results['WALCL'].change / 1_000_000).toFixed(4))
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    series: results,
    errors: errors.length > 0 ? errors : undefined,
  }

  mkdirSync(join(__dir, '..', 'public', 'data'), { recursive: true })
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8')
  console.log(`\n✅ Written to ${OUT_FILE} (${Object.keys(results).length} series, ${errors.length} errors)`)
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
