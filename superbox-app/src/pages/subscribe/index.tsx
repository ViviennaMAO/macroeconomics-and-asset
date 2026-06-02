import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import {
  MONITORS,
  MonitorKey,
  isSubscribed,
  payForMonitor,
  openMonitorMiniProgram,
} from '../../utils/subscription'
import './index.scss'

// ─── Feature data per monitor ────────────────────────────────────────────────
interface Feature {
  title: string
  desc: string
  bullets: string[]
}

const GOLD_FEATURES: Feature[] = [
  {
    title: '🥇 黄金 γ Score 综合评分',
    desc: '将实际利率、美元、央行购金、地缘风险四大因子合成 0-100 综合评分，给出 LONG / FLAT / SHORT 建议',
    bullets: ['实时多因子合成', '高/中/低三档确信度', '建议仓位系数 0.5x-1.0x'],
  },
  {
    title: '📊 多因子贡献度拆解',
    desc: '每日拆解推动金价变动的主要因子，可视化各因子权重，看清楚"是什么在推金价"',
    bullets: ['实际利率贡献度', 'DXY 美元贡献', '央行需求 / 地缘风险'],
  },
  {
    title: '🎯 黄金资产配置矩阵',
    desc: '基于 γ 信号自动给出 GLD、IAU、央企金矿股、白银的相对配置建议',
    bullets: ['受益资产清单', '回避资产清单', '净值曲线追踪'],
  },
]

const USD_FEATURES: Feature[] = [
  {
    title: '💱 美元 γ Score 信号路由',
    desc: 'DXY + 利差 + 通胀预期 + ML 模型多重路由，输出 LONG / FLAT / SHORT 决策',
    bullets: ['γ Score 0-100 仪表', 'ML 预测+0.09%等', '3×3 可信度矩阵'],
  },
  {
    title: '📡 流动性压力监测',
    desc: 'SOFR、RRP、信用利差(BBB)、波动率价差(VIX-MOVE)五维压力指数，提前捕捉流动性异常',
    bullets: ['SOFR-IORB 压力', 'VIX 恐慌指数', 'RRP 设施使用'],
  },
  {
    title: '🗺️ 资产配置建议',
    desc: '基于美元走势自动给出 GLD、EEM、DBC 等受益资产，UUP、KBE、XLE 等回避资产',
    bullets: ['黄金/新兴市场/大宗商品', '美元多头/银行股/能源', '净值曲线 30 天'],
  },
]

// ─── Mock preview screens (visual) ───────────────────────────────────────────
function GoldMockup() {
  return (
    <View className='sub-mockup'>
      <View className='sub-mockup__bar'>
        <Text className='sub-mockup__bar-text'>Gold Monitor</Text>
      </View>
      <View className='sub-mockup__gauge'>
        <View className='sub-mockup__gauge-ring sub-mockup__gauge-ring--gold' />
        <Text className='sub-mockup__gauge-val'>72</Text>
        <Text className='sub-mockup__gauge-label'>γ Score</Text>
      </View>
      <View className='sub-mockup__pill sub-mockup__pill--long'>
        <Text className='sub-mockup__pill-text'>看多 · LONG 1.0x</Text>
      </View>
      <View className='sub-mockup__row'>
        <View className='sub-mockup__cell'>
          <Text className='sub-mockup__cell-label'>金价 $/oz</Text>
          <Text className='sub-mockup__cell-val sub-mockup__cell-val--gold'>2,634</Text>
        </View>
        <View className='sub-mockup__cell'>
          <Text className='sub-mockup__cell-label'>实际利率</Text>
          <Text className='sub-mockup__cell-val'>1.82%</Text>
        </View>
      </View>
    </View>
  )
}

function UsdMockup() {
  return (
    <View className='sub-mockup'>
      <View className='sub-mockup__bar'>
        <Text className='sub-mockup__bar-text'>USD Monitor</Text>
      </View>
      <View className='sub-mockup__gauge'>
        <View className='sub-mockup__gauge-ring sub-mockup__gauge-ring--usd' />
        <Text className='sub-mockup__gauge-val'>50</Text>
        <Text className='sub-mockup__gauge-label'>γ Score</Text>
      </View>
      <View className='sub-mockup__pill sub-mockup__pill--flat'>
        <Text className='sub-mockup__pill-text'>中性 · FLAT</Text>
      </View>
      <View className='sub-mockup__row'>
        <View className='sub-mockup__cell'>
          <Text className='sub-mockup__cell-label'>DXY</Text>
          <Text className='sub-mockup__cell-val sub-mockup__cell-val--usd'>98.59</Text>
        </View>
        <View className='sub-mockup__cell'>
          <Text className='sub-mockup__cell-label'>ML 预测</Text>
          <Text className='sub-mockup__cell-val'>+0.09%</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Matrix mockup (USD signal routing) ──────────────────────────────────────
function MatrixMockup({ accent }: { accent: 'gold' | 'usd' }) {
  const cells = [
    ['LONG 1.0', 'LONG 0.5', 'FLAT'],
    ['LONG 0.5', 'FLAT', 'SHORT 0.5'],
    ['FLAT', 'SHORT 0.5', 'SHORT 1.0'],
  ]
  return (
    <View className={`sub-matrix sub-matrix--${accent}`}>
      <Text className='sub-matrix__title'>3×3 可信度矩阵</Text>
      <View className='sub-matrix__grid'>
        {cells.flatMap((row, i) =>
          row.map((c, j) => (
            <View
              key={`${i}-${j}`}
              className={`sub-matrix__cell ${i === 1 && j === 1 ? 'sub-matrix__cell--center' : ''} ${
                c.includes('LONG') ? 'sub-matrix__cell--long' : c.includes('SHORT') ? 'sub-matrix__cell--short' : 'sub-matrix__cell--flat'
              }`}
            >
              <Text className='sub-matrix__cell-text'>{c}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  )
}

// ─── Asset allocation mockup ─────────────────────────────────────────────────
function AllocationMockup({ kind }: { kind: 'gold' | 'usd' }) {
  const data = kind === 'gold'
    ? {
        bullish: [
          { name: '黄金 ETF', tag: 'GLD', note: '基准多头' },
          { name: '金矿股', tag: 'GDX', note: '杠杆暴露' },
          { name: '白银', tag: 'SLV', note: '高 β 跟随' },
        ],
        bearish: [
          { name: '美元多头', tag: 'UUP', note: '反向定价' },
          { name: '实际利率', tag: 'TIP', note: '走高利空' },
        ],
      }
    : {
        bullish: [
          { name: '黄金', tag: 'GLD', note: '美元走弱受益' },
          { name: '新兴市场', tag: 'EEM', note: '美元压力缓解' },
          { name: '大宗商品', tag: 'DBC', note: '反向定价' },
        ],
        bearish: [
          { name: '美元多头', tag: 'UUP', note: '方向相反' },
          { name: '美国银行股', tag: 'KBE', note: '曲线平坦化' },
          { name: '能源股', tag: 'XLE', note: '需求预期下行' },
        ],
      }

  return (
    <View className='sub-alloc'>
      <Text className='sub-alloc__title'>资产配置建议</Text>
      <View className='sub-alloc__cols'>
        <View className='sub-alloc__col sub-alloc__col--up'>
          <Text className='sub-alloc__col-label'>▲ 受益资产</Text>
          {data.bullish.map((it, i) => (
            <View key={i} className='sub-alloc__item'>
              <View className='sub-alloc__item-top'>
                <Text className='sub-alloc__item-name'>{it.name}</Text>
                <Text className='sub-alloc__item-tag'>{it.tag}</Text>
              </View>
              <Text className='sub-alloc__item-note'>{it.note}</Text>
            </View>
          ))}
        </View>
        <View className='sub-alloc__col sub-alloc__col--down'>
          <Text className='sub-alloc__col-label'>▼ 回避资产</Text>
          {data.bearish.map((it, i) => (
            <View key={i} className='sub-alloc__item'>
              <View className='sub-alloc__item-top'>
                <Text className='sub-alloc__item-name'>{it.name}</Text>
                <Text className='sub-alloc__item-tag'>{it.tag}</Text>
              </View>
              <Text className='sub-alloc__item-note'>{it.note}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SubscribePage() {
  const router = useRouter()
  const queryKey = (router.params.monitor as MonitorKey) || 'gold'
  const monitor = MONITORS[queryKey] || MONITORS.gold
  const features = queryKey === 'usd' ? USD_FEATURES : GOLD_FEATURES
  const accent = queryKey === 'usd' ? 'usd' : 'gold'

  const [paying, setPaying] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSubscribed(isSubscribed(monitor.key))
  }, [monitor.key])

  async function handleSubscribe() {
    if (paying) return
    setPaying(true)
    setError(null)
    try {
      const result = await payForMonitor(monitor.key)
      if (result.ok) {
        setSubscribed(true)
        Taro.showToast({ title: '订阅成功 ✓', icon: 'success' })
      } else {
        setError(result.error || '支付未完成')
      }
    } catch (e: any) {
      setError(e?.message || '支付异常')
    } finally {
      setPaying(false)
    }
  }

  function handleOpenMonitor() {
    openMonitorMiniProgram(monitor.key)
  }

  return (
    <ScrollView scrollY className='sub-page'>
      {/* ── Hero ── */}
      <View className={`sub-hero sub-hero--${accent}`}>
        <Text className='sub-hero__emoji'>{monitor.emoji}</Text>
        <Text className='sub-hero__title'>{monitor.name}</Text>
        <Text className='sub-hero__tagline'>{monitor.tagline}</Text>
        {subscribed && (
          <View className='sub-hero__badge'>
            <Text className='sub-hero__badge-text'>✓ 已订阅</Text>
          </View>
        )}
      </View>

      {/* ── Preview Mockups ── */}
      <View className='sub-section'>
        <Text className='sub-section__label'>📸 看板预览</Text>
        <ScrollView scrollX className='sub-preview-scroll'>
          <View className='sub-preview-row'>
            {accent === 'gold' ? <GoldMockup /> : <UsdMockup />}
            <MatrixMockup accent={accent} />
            <AllocationMockup kind={accent} />
          </View>
        </ScrollView>
        <Text className='sub-preview-hint'>← 横向滑动查看更多预览 →</Text>
      </View>

      {/* ── Features ── */}
      <View className='sub-section'>
        <Text className='sub-section__label'>✨ 核心功能</Text>
        {features.map((f, i) => (
          <View key={i} className={`sub-feature-card sub-feature-card--${accent}`}>
            <Text className='sub-feature-card__title'>{f.title}</Text>
            <Text className='sub-feature-card__desc'>{f.desc}</Text>
            <View className='sub-feature-card__bullets'>
              {f.bullets.map((b, j) => (
                <Text key={j} className='sub-feature-card__bullet'>· {b}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* ── Pricing / CTA ── */}
      <View className='sub-section'>
        <View className={`sub-price-card sub-price-card--${accent}`}>
          <View className='sub-price-card__top'>
            <Text className='sub-price-card__label'>解锁完整看板</Text>
            <View className='sub-price-card__price-wrap'>
              <Text className='sub-price-card__amount'>{monitor.priceEds}</Text>
              <Text className='sub-price-card__currency'>EDS</Text>
              <Text className='sub-price-card__unit'>/ 永久</Text>
            </View>
          </View>

          <View className='sub-price-card__benefits'>
            <Text className='sub-price-card__benefit'>✓ 解锁全部实时数据与多因子拆解</Text>
            <Text className='sub-price-card__benefit'>✓ 资产配置矩阵 + 净值跟踪</Text>
            <Text className='sub-price-card__benefit'>✓ 一次付费，长期使用</Text>
            <Text className='sub-price-card__benefit'>✓ 通过 Luffa 钱包安全支付</Text>
          </View>

          {subscribed ? (
            <View className={`sub-cta-btn sub-cta-btn--${accent}`} onClick={handleOpenMonitor}>
              <Text className='sub-cta-btn__text'>打开 {monitor.name} →</Text>
            </View>
          ) : (
            <View
              className={`sub-cta-btn sub-cta-btn--${accent} ${paying ? 'sub-cta-btn--loading' : ''}`}
              onClick={handleSubscribe}
            >
              <Text className='sub-cta-btn__text'>
                {paying ? '正在调用钱包...' : `订阅 · ${monitor.priceEds} EDS (Luffa Pay)`}
              </Text>
            </View>
          )}

          {error && (
            <Text className='sub-error'>⚠️ {error}</Text>
          )}

          <Text className='sub-price-card__footer'>
            支付通过 Luffa 钱包安全签名，链上可查；如遇问题，请稍后重试或联系客服。
          </Text>
        </View>
      </View>

      {/* ── Trust footer ── */}
      <View className='sub-trust'>
        <Text className='sub-trust__line'>🔐 Luffa Endless 链上签名 · 钱包级安全</Text>
        <Text className='sub-trust__line'>💎 与本书互动模拟器配套，构建完整宏观研究工具链</Text>
      </View>
    </ScrollView>
  )
}
