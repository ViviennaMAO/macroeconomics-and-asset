import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { ch10Snapshots } from '../../utils/snapshots'
import { goldFairValue } from '../../utils/formulas'
import SnapshotBar from '../../components/SnapshotBar'
import SliderRow from '../../components/SliderRow'
import PredictModal from '../../components/PredictModal'
import RevealModal from '../../components/RevealModal'
import LiveData from '../../components/LiveData'
import MiniChart from '../../components/MiniChart'
import { getSeries } from '../../utils/fred'
import type { FredSnapshot } from '../../data/fred-baseline'
import { markOpened, markPredicted } from '../../utils/progress'
import './index.scss'

const GOLD_PRICE_HISTORY: { date: string; price: number }[] = [
  { date: '2022-01', price: 1815 },
  { date: '2022-02', price: 1900 },
  { date: '2022-03', price: 1950 },
  { date: '2022-04', price: 1930 },
  { date: '2022-05', price: 1850 },
  { date: '2022-06', price: 1820 },
  { date: '2022-07', price: 1730 },
  { date: '2022-08', price: 1760 },
  { date: '2022-09', price: 1650 },
  { date: '2022-10', price: 1640 },
  { date: '2022-11', price: 1660 },
  { date: '2022-12', price: 1820 },
  { date: '2023-01', price: 1930 },
  { date: '2023-02', price: 1850 },
  { date: '2023-03', price: 1980 },
  { date: '2023-04', price: 2010 },
  { date: '2023-05', price: 1970 },
  { date: '2023-06', price: 1920 },
  { date: '2023-07', price: 1960 },
  { date: '2023-08', price: 1940 },
  { date: '2023-09', price: 1880 },
  { date: '2023-10', price: 1850 },
  { date: '2023-11', price: 1980 },
  { date: '2023-12', price: 2060 },
  { date: '2024-01', price: 2040 },
  { date: '2024-02', price: 2050 },
  { date: '2024-03', price: 2160 },
  { date: '2024-04', price: 2340 },
  { date: '2024-05', price: 2350 },
  { date: '2024-06', price: 2330 },
  { date: '2024-07', price: 2430 },
  { date: '2024-08', price: 2500 },
  { date: '2024-09', price: 2630 },
  { date: '2024-10', price: 2730 },
  { date: '2024-11', price: 2650 },
  { date: '2024-12', price: 2630 },
  { date: '2025-01', price: 2800 },
  { date: '2025-02', price: 2860 },
  { date: '2025-03', price: 3000 },
  { date: '2025-04', price: 3250 },
  { date: '2025-05', price: 3300 },
  { date: '2025-06', price: 3350 },
  { date: '2025-07', price: 3350 },
  { date: '2025-08', price: 3300 },
  { date: '2025-09', price: 3650 },
  { date: '2025-10', price: 4000 },
  { date: '2025-11', price: 4150 },
  { date: '2025-12', price: 4500 },
  { date: '2026-01', price: 5400 },
  { date: '2026-02', price: 4950 },
  { date: '2026-03', price: 4600 },
  { date: '2026-04', price: 4600 },
  { date: '2026-05', price: 4475 },
]

const REAL_RATE_HISTORY: { date: string; realRate: number }[] = [
  { date: '2022-01', realRate: -1.0 },
  { date: '2022-02', realRate: -0.8 },
  { date: '2022-03', realRate: -0.5 },
  { date: '2022-04', realRate: -0.2 },
  { date: '2022-05', realRate:  0.1 },
  { date: '2022-06', realRate:  0.5 },
  { date: '2022-07', realRate:  0.8 },
  { date: '2022-08', realRate:  1.0 },
  { date: '2022-09', realRate:  1.3 },
  { date: '2022-10', realRate:  1.5 },
  { date: '2022-11', realRate:  1.4 },
  { date: '2022-12', realRate:  1.5 },
  { date: '2023-01', realRate:  1.3 },
  { date: '2023-02', realRate:  1.5 },
  { date: '2023-03', realRate:  1.4 },
  { date: '2023-04', realRate:  1.4 },
  { date: '2023-05', realRate:  1.6 },
  { date: '2023-06', realRate:  1.5 },
  { date: '2023-07', realRate:  1.8 },
  { date: '2023-08', realRate:  2.0 },
  { date: '2023-09', realRate:  2.2 },
  { date: '2023-10', realRate:  2.5 },
  { date: '2023-11', realRate:  2.3 },
  { date: '2023-12', realRate:  2.1 },
  { date: '2024-01', realRate:  1.8 },
  { date: '2024-02', realRate:  1.9 },
  { date: '2024-03', realRate:  2.0 },
  { date: '2024-04', realRate:  2.1 },
  { date: '2024-05', realRate:  2.0 },
  { date: '2024-06', realRate:  2.0 },
  { date: '2024-07', realRate:  1.9 },
  { date: '2024-08', realRate:  1.8 },
  { date: '2024-09', realRate:  1.7 },
  { date: '2024-10', realRate:  1.9 },
  { date: '2024-11', realRate:  2.1 },
  { date: '2024-12', realRate:  2.2 },
  { date: '2025-01', realRate:  2.1 },
  { date: '2025-02', realRate:  2.0 },
  { date: '2025-03', realRate:  1.9 },
  { date: '2025-04', realRate:  1.9 },
  { date: '2025-05', realRate:  1.8 },
  { date: '2025-06', realRate:  1.9 },
  { date: '2025-07', realRate:  2.0 },
  { date: '2025-08', realRate:  2.0 },
  { date: '2025-09', realRate:  1.9 },
  { date: '2025-10', realRate:  2.0 },
  { date: '2025-11', realRate:  2.1 },
  { date: '2025-12', realRate:  2.1 },
  { date: '2026-01', realRate:  2.0 },
  { date: '2026-02', realRate:  2.1 },
  { date: '2026-03', realRate:  2.2 },
  { date: '2026-04', realRate:  2.1 },
  { date: '2026-05', realRate:  2.07 },
]

type ModalState =
  | { type: 'none' }
  | { type: 'predict'; snapshotKey: string }
  | { type: 'reveal'; snapshotKey: string }

const DEFAULT_PARAMS = ch10Snapshots[0].params

export default function Ch10Page() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const userEdited = useRef(false)

  useEffect(() => {
    markOpened(10)
  }, [])

  const result = useMemo(
    () => goldFairValue(params.realRate, params.dxyIndex, params.centralBankBuying),
    [params]
  )

  const { modelPrice, realRateComponent, dxyComponent, cbComponent } = result

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof typeof params>(key: K, value: (typeof params)[K]) {
    userEdited.current = true
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch10Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(10, correct)
    setModal((prev) =>
      prev.type === 'predict' ? { type: 'reveal', snapshotKey: prev.snapshotKey } : prev
    )
  }

  function handleRevealClose() {
    setModal({ type: 'none' })
  }

  function handlePredictClose() {
    setModal({ type: 'none' })
  }

  const activeSnapshot =
    modal.type !== 'none'
      ? ch10Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  function formatPrice(val: number): string {
    const rounded = Math.round(val)
    return `$${rounded.toLocaleString('en-US')}`
  }

  function formatComponent(val: number): string {
    const sign = val >= 0 ? '+' : ''
    return `${sign}$${Math.round(val)}`
  }

  function dominantFactor(): string {
    const abs = [
      { name: '实际利率', val: Math.abs(realRateComponent) },
      { name: '美元指数', val: Math.abs(dxyComponent) },
      { name: '央行购金', val: Math.abs(cbComponent) },
    ]
    abs.sort((a, b) => b.val - a.val)
    return abs[0].name
  }

  return (
    <ScrollView className='ch10-page' scrollY>
      {/* Header */}
      <View className='page-header ch10-header'>
        <Text className='page-title'>🏅 黄金多因子模拟器</Text>
        <Text className='page-meta'>第 10 章 · 大宗商品：黄金</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch10Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Live FRED Data */}
      <LiveData
        title='📡 当前黄金市场'
        autoRefresh
        tiles={[
          { id: 'GOLDAMGBD228NLBM', hint: '现货金价' },
          { id: '_realRate10y',     hint: '实际利率' },
          { id: 'T10YIE',           hint: '盈亏平衡' },
          { id: 'DFF',              hint: 'Fed利率' },
        ]}
        onLoaded={(freshSnap: FredSnapshot) => {
          if (userEdited.current) return
          const realRate = getSeries(freshSnap, '_realRate10y')
          const dxy = getSeries(freshSnap, 'DTWEXBGS')
          setParams((prev) => ({
            ...prev,
            ...(realRate ? { realRate: realRate.value } : {}),
            ...(dxy ? { dxyIndex: dxy.value } : {}),
          }))
        }}
      />

      {/* ── 黄金看板跳转入口 ── */}
      <View
        className='ch10-dashboard-banner'
        onClick={() => {
          // 始终先进订阅/预览页；订阅过用户在该页一键打开外部小程序
          Taro.navigateTo({ url: '/pages/subscribe/index?monitor=gold' })
        }}
      >
        <View className='ch10-dashboard-banner__left'>
          <Text className='ch10-dashboard-banner__icon'>📊</Text>
          <View>
            <Text className='ch10-dashboard-banner__title'>黄金看板</Text>
            <Text className='ch10-dashboard-banner__desc'>实时行情 · 多维指标 · 深度分析</Text>
          </View>
        </View>
        <View className='ch10-dashboard-banner__right'>
          <Text className='ch10-dashboard-banner__price'>30 EDS</Text>
          <Text className='ch10-dashboard-banner__arrow'>›</Text>
        </View>
      </View>

      {/* Gold Price History Chart */}
      <View className='section'>
        <Text className='section-title'>🥇 黄金价格 36 月走势</Text>
        <MiniChart
          id='ch10-gold-chart'
          type='line'
          data={GOLD_PRICE_HISTORY.map(d => ({ label: d.date.slice(2, 7), value: d.price }))}
          title='COMEX 黄金现货 ($/oz)'
          color='#f5a623'
          highlightLast
          yAxisFormat={(v) => `$${v.toFixed(0)}`}
        />
      </View>

      {/* Real Rate History Chart */}
      <View className='section'>
        <Text className='section-title'>📊 10 年实际利率 (反向参照)</Text>
        <MiniChart
          id='ch10-real-rate-chart'
          type='line'
          data={REAL_RATE_HISTORY.map(d => ({ label: d.date.slice(2, 7), value: d.realRate }))}
          title='10Y - 10Y Breakeven (%)'
          color='#4a9eff'
          showZeroLine
          yAxisFormat={(v) => `${v.toFixed(1)}%`}
        />
        <View className='ch10-chart-note'>
          <Text className='ch10-chart-note-text'>
            **教科书脱钩时刻**：2023-2024 实际利率从 1.5% 升至 2.2%，金价反而从 $1900 涨到 $2700+。
            传统模型 R²=0.36 已彻底失灵。新驱动：央行购金、地缘风险、去美元化。
          </Text>
        </View>
      </View>

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='实际利率'
          value={params.realRate}
          min={-3}
          max={5}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('realRate', v)}
        />
        <SliderRow
          label='美元指数'
          value={params.dxyIndex}
          min={80}
          max={120}
          step={0.5}
          unit=''
          onChange={(v) => updateParam('dxyIndex', v)}
        />
        <SliderRow
          label='央行购金量'
          value={params.centralBankBuying}
          min={0}
          max={1500}
          step={50}
          unit='吨/年'
          onChange={(v) => updateParam('centralBankBuying', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>黄金模型价格</Text>
            <Text className='output-big ch10-val--gold'>{formatPrice(modelPrice)}</Text>
          </View>
          <View className='ch10-secondary'>
            <Text className='output-label'>主导因子：{dominantFactor()}</Text>
          </View>
        </View>

        {/* Factor Decomposition */}
        <View className='ch10-decomp'>
          <Text className='output-label'>因子贡献分解</Text>
          <View className='ch10-factor-row'>
            <View className='ch10-factor-item'>
              <Text className='ch10-factor-label'>实际利率</Text>
              <Text className={`ch10-factor-val ${realRateComponent >= 0 ? 'ch10-val--pos' : 'ch10-val--neg'}`}>
                {formatComponent(realRateComponent)}
              </Text>
            </View>
            <View className='ch10-factor-item'>
              <Text className='ch10-factor-label'>美元指数</Text>
              <Text className={`ch10-factor-val ${dxyComponent >= 0 ? 'ch10-val--pos' : 'ch10-val--neg'}`}>
                {formatComponent(dxyComponent)}
              </Text>
            </View>
            <View className='ch10-factor-item'>
              <Text className='ch10-factor-label'>央行购金</Text>
              <Text className={`ch10-factor-val ${cbComponent >= 0 ? 'ch10-val--pos' : 'ch10-val--neg'}`}>
                {formatComponent(cbComponent)}
              </Text>
            </View>
          </View>
          <View className='ch10-base-row'>
            <Text className='ch10-base-label'>基准价 $2,000 + 各因子贡献 = {formatPrice(modelPrice)}</Text>
          </View>
        </View>

        <Text className='output-hint'>
          实际利率 {params.realRate}%（每+1% → -$300），美元指数 {params.dxyIndex}（每偏离100 → ±$10），央行购金 {params.centralBankBuying} 吨/年（每吨 → +$0.5）。主导因子：{dominantFactor()}。
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 多因子模型</Text>
        <Text className='edu-text'>
          {'Gold = f(实际利率, 美元, 央行购金)\n\n'}
          {'模型：价格 = 2000 − 300×r_real − (DXY−100)×10 + CB×0.5\n\n'}
          传统单因子模型（r=-0.6与实际利率）只解释了36%的金价变动。本模型加入美元指数（汇率竞争效应）和央行购金量（结构性需求），三因子联合解释力显著提升。实际利率代表持有成本：利率越高，不生息的黄金机会成本越大。美元走强压制以美元计价的黄金。央行购金是2022年后的新主导因子。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期：央行购金重写定价逻辑</Text>
        <Text className='edu-text'>
          {'2022-24实际利率从-1%升至+2%，金价从$1800涨到$2400——R²=0.36的单因子模型彻底失灵。\n\n'}
          中国、印度、土耳其央行年购金量从300吨飙至1050吨，成为新主导因子。新兴市场央行正系统性地将储备多元化：不依赖SWIFT、不怕制裁冻结、不受Fed利率周期干扰。这是美元信用体系裂缝的早期信号——去美元化驱动的结构性需求，不在任何传统利率模型里。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          {'书中过度依赖单因子（实际利率），R²=0.36意味着64%变动无法解释。\n\n'}
          {'建议：\n'}
          {'(1) 加入央行购金、地缘风险指数（GPR）、crypto替代效应\n'}
          {'(2) 用动态因子模型——允许因子权重随时间变化（2022前利率主导，2022后购金主导）\n'}
          (3) 区分"避险"需求和"去美元化"需求——后者是2022后的结构性变化，前者是周期性的。混合两种需求会导致模型在不同宏观环境下预测方向相反，降低实用价值。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=10' })}
      >
        <Text>做章节测验，检验理解 →</Text>
      </View>

      {/* Modals */}
      {modal.type === 'predict' && activeSnapshot?.predict && (
        <PredictModal
          question={activeSnapshot.predict.question}
          options={activeSnapshot.predict.options}
          correct={activeSnapshot.predict.correct}
          contextLine={activeSnapshot.predict.contextLine}
          onAnswer={handlePredictAnswer}
          onClose={handlePredictClose}
        />
      )}

      {modal.type === 'reveal' && activeSnapshot?.reveal && (
        <RevealModal
          title={activeSnapshot.reveal.title}
          delta={activeSnapshot.reveal.delta}
          explain={activeSnapshot.reveal.explain}
          twist={activeSnapshot.reveal.twist}
          onClose={handleRevealClose}
        />
      )}
    </ScrollView>
  )
}
