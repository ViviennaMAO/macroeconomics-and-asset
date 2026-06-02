import Taro from '@tarojs/taro'

// ─── Monitor catalog ─────────────────────────────────────────────────────────
export type MonitorKey = 'gold' | 'usd'

export interface MonitorInfo {
  key: MonitorKey
  name: string
  emoji: string
  appId: string          // Luffa SuperBox target appId
  priceEds: number       // subscription price in EDS
  tagline: string
}

export const MONITORS: Record<MonitorKey, MonitorInfo> = {
  gold: {
    key: 'gold',
    name: '黄金看板',
    emoji: '🥇',
    appId: 'mp42k3a15b0hoec7',
    priceEds: 30,
    tagline: '实时金价 · 多因子定价 · 资产配置信号',
  },
  usd: {
    key: 'usd',
    name: '美元看板',
    emoji: '💱',
    appId: 'mpe5fp6sxaegbip9',
    priceEds: 30,
    tagline: 'DXY 实时追踪 · γ 信号路由 · 配置矩阵',
  },
}

// ─── Subscription state ──────────────────────────────────────────────────────
export interface SubscriptionRecord {
  key: MonitorKey
  subscribedAt: number        // unix ms
  txHash?: string             // Luffa wallet tx hash
  walletAddress?: string      // payer address
  priceEds: number
}

const STORAGE_KEY = 'MACRO_ASSET_SUBSCRIPTIONS'

function load(): Record<MonitorKey, SubscriptionRecord | null> {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (!raw) return { gold: null, usd: null }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return { gold: parsed.gold ?? null, usd: parsed.usd ?? null }
  } catch {
    return { gold: null, usd: null }
  }
}

function save(data: Record<MonitorKey, SubscriptionRecord | null>) {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function isSubscribed(key: MonitorKey): boolean {
  return !!load()[key]
}

export function getSubscription(key: MonitorKey): SubscriptionRecord | null {
  return load()[key]
}

export function markSubscribed(
  key: MonitorKey,
  txHash?: string,
  walletAddress?: string,
) {
  const data = load()
  data[key] = {
    key,
    subscribedAt: Date.now(),
    txHash,
    walletAddress,
    priceEds: MONITORS[key].priceEds,
  }
  save(data)
}

export function clearSubscription(key: MonitorKey) {
  const data = load()
  data[key] = null
  save(data)
}

// ─── Navigation helper: jump to external Luffa mini-program ──────────────────
export function openMonitorMiniProgram(key: MonitorKey) {
  const m = MONITORS[key]
  ;(wx as any).invokeNativePlugin({
    api_name: 'luffaWebRequest',
    data: {
      methodName: 'navigateToMiniProgram',
      url: `tcmppn3u4by5l18://applet/?appId=${m.appId}`,
    },
    success: () => {},
    fail: (res: any) => { console.log('navigate fail', res) },
  })
}

// ─── Payment flow via Luffa wallet ───────────────────────────────────────────
function rand16(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

// ═══════════════════════════════════════════════════════════════════════════
//  收款配置
// ═══════════════════════════════════════════════════════════════════════════
//
// 直接以 EDS 计价（30 EDS / 看板），通过 Endless 链内置的
// `0x1::endless_account::transfer` 把订阅费从用户钱包转到下面这个地址。
// 不需要部署任何合约。
//
const RECEIVER_ADDRESS = 'Bf8qoqsjPnT9ufHqLeEYoFyy5hxqm6ahrLxbkh2NPp4r'

// Endless 链内置原生转账方法
const TRANSFER_MODULE   = '0x1'
const TRANSFER_NAME     = 'endless_account'
const TRANSFER_FUNCTION = 'transfer'

export interface PaymentResult {
  ok: boolean
  txHash?: string
  walletAddress?: string
  error?: string
}

/**
 * Run the full Luffa wallet subscription payment flow.
 *  1. connect()           → fetch wallet address
 *  2. packageTransactionV2 → build payment tx ($priceUsd in endless units)
 *  3. signAndSubmitTransaction → sign and broadcast
 */
export function payForMonitor(key: MonitorKey): Promise<PaymentResult> {
  const monitor = MONITORS[key]
  return new Promise((resolve) => {
    // ── Step 1: connect wallet ─────────────────────────────────────────────
    ;(wx as any).invokeNativePlugin({
      api_name: 'luffaWebRequest',
      data: { methodName: 'connect' },
      success: (connRes: any) => {
        const walletAddress = connRes?.data?.address
        if (!walletAddress) {
          resolve({ ok: false, error: '未能获取钱包地址' })
          return
        }

        // ── Step 2: package payment transaction ─────────────────────────────
        // 30 EDS → 链上最小单位（EDS 用 8 位小数）
        const amountUnits = String(monitor.priceEds * 100_000_000)

        ;(wx as any).invokeNativePlugin({
          api_name: 'luffaWebRequest',
          data: {
            uuid: rand16(),
            from: walletAddress,
            methodName: 'packageTransaction',          // 内置转账用 V1 即可
            initData: { network: 'endless' },
            data: {
              module:       TRANSFER_MODULE,           // 0x1
              moduleName:   TRANSFER_NAME,             // endless_account
              functionName: TRANSFER_FUNCTION,         // transfer
              data: JSON.stringify({
                '1_address_address': RECEIVER_ADDRESS, // 收款地址 = 你的钱包
                '2_u128_amount':     amountUnits,      // 金额（最小单位）
              }),
            },
          },
          success: (pkgRes: any) => {
            const rawData = pkgRes?.data?.rawData
            if (!rawData) {
              resolve({ ok: false, error: '交易打包失败' })
              return
            }

            // ── Step 3: sign + submit ─────────────────────────────────────
            ;(wx as any).invokeNativePlugin({
              api_name: 'luffaWebRequest',
              data: {
                methodName: 'signAndSubmitTransaction',
                data: { serializedTransaction: { data: rawData } },
              },
              success: (submitRes: any) => {
                const txHash = submitRes?.data?.hash
                if (!txHash) {
                  resolve({ ok: false, error: '签名提交失败' })
                  return
                }
                markSubscribed(key, txHash, walletAddress)
                resolve({ ok: true, txHash, walletAddress })
              },
              fail: (e: any) => resolve({ ok: false, error: e?.errMsg || '用户取消签名' }),
            })
          },
          fail: (e: any) => resolve({ ok: false, error: e?.errMsg || '打包请求失败' }),
        })
      },
      fail: (e: any) => resolve({ ok: false, error: e?.errMsg || '钱包连接失败' }),
    })
  })
}
