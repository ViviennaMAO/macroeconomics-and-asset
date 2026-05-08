import Taro from '@tarojs/taro'
import { FRED_BASELINE, type FredSnapshot, type FredSeriesItem } from '../data/fred-baseline'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'MACRO_FRED_SNAPSHOT'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12h
const MEM_TTL_MS = 60 * 60 * 1000 // 1h
const CDN_URLS = [
  'https://cdn.jsdelivr.net/gh/ViviennaMAO/macroeconomics-and-asset@main/superbox-app/public/data/fred-latest.json',
  'https://raw.githubusercontent.com/ViviennaMAO/macroeconomics-and-asset/main/superbox-app/public/data/fred-latest.json',
]

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

let memCache: { data: FredSnapshot; loadedAt: number } | null = null

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

interface StorageRecord {
  snapshot: FredSnapshot
  savedAt: number
}

function readFromStorage(): FredSnapshot | null {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (!raw) return null
    const record: StorageRecord = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!record || typeof record.savedAt !== 'number' || !record.snapshot) return null
    const age = Date.now() - record.savedAt
    if (age > CACHE_TTL_MS) return null
    return record.snapshot
  } catch {
    return null
  }
}

function writeToStorage(snapshot: FredSnapshot): void {
  try {
    const record: StorageRecord = { snapshot, savedAt: Date.now() }
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Storage write failures are non-fatal
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Synchronous read: memory cache (1h) → Taro storage (12h) → baseline.
 * Never throws.
 */
export function getSnapshotSync(): FredSnapshot {
  try {
    // 1. Memory cache
    if (memCache && Date.now() - memCache.loadedAt < MEM_TTL_MS) {
      return memCache.data
    }

    // 2. Taro storage
    const stored = readFromStorage()
    if (stored) {
      memCache = { data: stored, loadedAt: Date.now() }
      return stored
    }
  } catch {
    // Fall through to baseline
  }

  // 3. Hardcoded baseline
  return FRED_BASELINE
}

/**
 * Async refresh: tries each CDN URL in order, saves on success, returns snapshot.
 * Falls back to current sync snapshot on all failures. Never throws.
 */
export async function refreshSnapshot(): Promise<FredSnapshot> {
  for (const url of CDN_URLS) {
    try {
      const res = await Taro.request({ url, method: 'GET' })
      if (res.statusCode === 200 && res.data) {
        const snapshot: FredSnapshot =
          typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        // Basic shape validation
        if (snapshot && snapshot.fetchedAt && snapshot.series) {
          memCache = { data: snapshot, loadedAt: Date.now() }
          writeToStorage(snapshot)
          return snapshot
        }
      }
    } catch {
      // Try next URL
    }
  }

  return getSnapshotSync()
}

/**
 * Returns the series item for the given id, or null if not found.
 */
export function getSeries(snapshot: FredSnapshot, id: string): FredSeriesItem | null {
  return snapshot.series[id] ?? null
}

/**
 * Formats a series value with appropriate units/precision.
 */
export function formatValue(item: FredSeriesItem): string {
  const { id, value } = item
  if (id === 'GOLDAMGBD228NLBM') {
    return `$${value.toLocaleString()}`
  }
  if (id === '_spread2s10s') {
    return `${value}bps`
  }
  if (id === 'WALCL') {
    return `$${value}T`
  }
  return `${value}%`
}

/**
 * Formats a change value with +/- sign and appropriate units.
 * Returns '' when change is null.
 */
export function formatChange(item: FredSeriesItem): string {
  const { id, change } = item
  if (change === null) return ''

  if (id === 'GOLDAMGBD228NLBM') {
    return `${change >= 0 ? '+' : ''}$${change}`
  }
  if (id === '_spread2s10s') {
    return `${change >= 0 ? '+' : ''}${change}bps`
  }
  if (id === 'WALCL') {
    return `${change >= 0 ? '+' : ''}$${change}T`
  }
  return `${change > 0 ? '+' : ''}${change}%`
}

/**
 * Returns true if the snapshot's fetchedAt timestamp is older than 24 hours.
 */
export function isStale(snapshot: FredSnapshot): boolean {
  try {
    const fetchedMs = new Date(snapshot.fetchedAt).getTime()
    if (isNaN(fetchedMs)) return true
    return Date.now() - fetchedMs > 24 * 60 * 60 * 1000
  } catch {
    return true
  }
}
