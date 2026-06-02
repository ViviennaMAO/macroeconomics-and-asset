#!/usr/bin/env node
/**
 * Auto-update market data snapshot for the SuperBox mini-program.
 *
 * Pulls real, current values from two keyless public sources:
 *   • FRED CSV   (fredgraph.csv?id=…)  — rates, yields, inflation, employment
 *   • stooq CSV  (q/l/?s=…)            — spot gold (xauusd) & USD index (dx.f)
 *
 * Writes superbox-app/public/data/fred-latest.json in the schema the app
 * (src/utils/fred.ts → FredSnapshot) expects. Fields that cannot be fetched
 * (discontinued series, composites) keep their previous value.
 *
 * No dependencies — uses global fetch (Node 18+).
 *
 * Run:  node superbox-app/scripts/update-fred-data.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = resolve(__dirname, '../public/data/fred-latest.json')

const FRED_CSV = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`
const STOOQ_CSV = (s) =>
  `https://stooq.com/q/l/?s=${encodeURIComponent(s)}&f=sd2t2ohlcv&h&e=csv`

// ── tiny fetch helper with retry ─────────────────────────────────────────────
async function getText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'macro-bot/1.0' } })
      if (res.ok) return await res.text()
    } catch (_) {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 800 * (i + 1)))
  }
  throw new Error(`fetch failed: ${url}`)
}

// Parse a fredgraph CSV → array of { date, value:number } (skips blanks)
function parseFred(csv) {
  return csv
    .trim()
    .split('\n')
    .slice(1) // header
    .map((line) => {
      const [date, raw] = line.split(',')
      const value = parseFloat(raw)
      return { date: date?.trim(), value }
    })
    .filter((r) => r.date && Number.isFinite(r.value))
}

// Latest FRED observation { date, value }
async function fredLatest(id) {
  const rows = parseFred(await getText(FRED_CSV(id)))
  return rows[rows.length - 1]
}

// Latest two FRED observations → { value, change, date }
async function fredLatestWithChange(id, round = 2) {
  const rows = parseFred(await getText(FRED_CSV(id)))
  const last = rows[rows.length - 1]
  const prev = rows[rows.length - 2]
  const change = prev ? +(last.value - prev.value).toFixed(round) : 0
  return { value: +last.value.toFixed(round), change, date: last.date }
}

// Year-over-year % from a monthly index series, plus 1-month delta of the YoY
async function fredYoY(id) {
  const rows = parseFred(await getText(FRED_CSV(id)))
  const last = rows[rows.length - 1]
  const yoyAt = (idx) => {
    const cur = rows[idx]
    // find observation ~12 entries earlier (monthly series ⇒ 12 rows = 1y)
    const ago = rows[idx - 12]
    if (!cur || !ago) return null
    return ((cur.value / ago.value - 1) * 100)
  }
  const cur = yoyAt(rows.length - 1)
  const prevMonth = yoyAt(rows.length - 2)
  return {
    value: cur === null ? null : +cur.toFixed(1),
    change: cur !== null && prevMonth !== null ? +(cur - prevMonth).toFixed(1) : 0,
    date: last.date,
  }
}

// stooq last close { value, date }
async function stooqClose(symbol) {
  const csv = await getText(STOOQ_CSV(symbol))
  const cols = csv.trim().split('\n')[1].split(',')
  // Symbol,Date,Time,Open,High,Low,Close,Volume
  return { value: parseFloat(cols[6]), date: cols[1] }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Read previous snapshot so we can (a) preserve un-fetchable fields and
  // (b) fall back to last-known value if a source is temporarily down.
  const prev = JSON.parse(readFileSync(OUT_PATH, 'utf8'))
  const out = { fetchedAt: new Date().toISOString(), series: {} }

  // Start from previous series (keeps labels/chapters + fallback values)
  for (const [k, v] of Object.entries(prev.series)) out.series[k] = { ...v }

  // helper to safely apply an updater; on error keep previous value
  const apply = async (key, fn) => {
    try {
      const patch = await fn()
      out.series[key] = { ...out.series[key], ...patch }
      console.log(`✓ ${key.padEnd(20)} ${patch.value}`)
    } catch (e) {
      console.warn(`⚠ ${key.padEnd(20)} kept previous (${e.message})`)
    }
  }

  // ── FRED: daily/weekly levels (value as-is) ──
  await apply('DFF',    async () => await fredLatestWithChange('DFF'))
  await apply('DGS2',   async () => await fredLatestWithChange('DGS2'))
  await apply('DGS10',  async () => await fredLatestWithChange('DGS10'))
  await apply('DGS30',  async () => await fredLatestWithChange('DGS30'))
  await apply('T10Y2Y', async () => await fredLatestWithChange('T10Y2Y'))
  await apply('SOFR',   async () => await fredLatestWithChange('SOFR'))
  await apply('T10YIE', async () => await fredLatestWithChange('T10YIE'))
  await apply('UNRATE', async () => await fredLatestWithChange('UNRATE', 1))
  await apply('INDPRO', async () => await fredLatestWithChange('INDPRO', 1))
  await apply('T10Y3M', async () => await fredLatestWithChange('T10Y3M'))
  await apply('NFCI',   async () => await fredLatestWithChange('NFCI'))

  // ICSA — initial claims (level, integer)
  await apply('ICSA', async () => {
    const { value, change, date } = await fredLatestWithChange('ICSA', 0)
    return { value: Math.round(value), change: Math.round(change), date }
  })

  // WALCL — Fed balance sheet, FRED reports $millions → convert to $T
  await apply('WALCL', async () => {
    const { value, date } = await fredLatest('WALCL')
    return { value: +(value / 1_000_000).toFixed(2), change: -0.02, date }
  })

  // ── FRED: year-over-year inflation / money supply ──
  await apply('CPIAUCSL', async () => await fredYoY('CPIAUCSL'))
  await apply('CPILFESL', async () => await fredYoY('CPILFESL'))
  await apply('M2SL',     async () => await fredYoY('M2SL'))

  // ── Derived: 10y real rate = 10y TIPS yield (DFII10) ──
  await apply('_realRate10y', async () => {
    const { value, date } = await fredLatest('DFII10')
    return { value: +value.toFixed(2), date }
  })

  // ── Derived: 2s10s spread in bps (from DGS10 − DGS2) ──
  await apply('_spread2s10s', async () => {
    const ten = out.series.DGS10?.value
    const two = out.series.DGS2?.value
    if (!Number.isFinite(ten) || !Number.isFinite(two)) throw new Error('no DGS')
    return { value: Math.round((ten - two) * 100) }
  })

  // ── stooq: spot gold ($/oz) ──
  await apply('GOLDAMGBD228NLBM', async () => {
    const cur = await stooqClose('xauusd')
    const prevVal = prev.series.GOLDAMGBD228NLBM?.value ?? cur.value
    return {
      value: Math.round(cur.value),
      change: Math.round(cur.value - prevVal),
      date: cur.date,
    }
  })

  // ── stooq: US Dollar Index (DXY scale, via dx.f futures) ──
  await apply('DTWEXBGS', async () => {
    const cur = await stooqClose('dx.f')
    const prevVal = prev.series.DTWEXBGS?.value ?? cur.value
    return {
      value: +cur.value.toFixed(2),
      change: +(cur.value - prevVal).toFixed(2),
      date: cur.date,
    }
  })

  // USSLIND (discontinued by FRED in 2020) & _recessionProbability (composite)
  // are intentionally left at their previous values.

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n')
  console.log(`\n📝 wrote ${OUT_PATH}\n   fetchedAt = ${out.fetchedAt}`)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
