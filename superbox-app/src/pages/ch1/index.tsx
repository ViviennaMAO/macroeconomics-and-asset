import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch1Snapshots, type Ch1Params } from '../../utils/snapshots'
import {
  npv,
  recessionProbability,
  inventoryPhase,
} from '../../utils/formulas'
import {
  NBER_RECESSIONS,
  YIELD_CURVE_HISTORY,
  LEI_HISTORY,
  PMI_HISTORY,
  INVENTORY_CYCLE_PHASES,
  NBER_CORE_INDICATORS,
} from '../../data/recession-indicators'
import SnapshotBar from '../../components/SnapshotBar'
import SliderRow from '../../components/SliderRow'
import PredictModal from '../../components/PredictModal'
import RevealModal from '../../components/RevealModal'
import LiveData from '../../components/LiveData'
import MiniChart from '../../components/MiniChart'
import RecessionMeter from '../../components/RecessionMeter'
import InvestmentClock from '../../components/InvestmentClock'
import IndicatorTile from '../../components/IndicatorTile'
import { markOpened, markPredicted } from '../../utils/progress'
import './index.scss'

type ModalState =
  | { type: 'none' }
  | { type: 'predict'; snapshotKey: string }
  | { type: 'reveal'; snapshotKey: string }

const DEFAULT_PARAMS = ch1Snapshots[0].params

// ── Recession signals (illustrative Q4-2024 / early 2025 state) ──────────────
const RECESSION_SIGNALS = {
  yieldInverted: false,         // recently uninverted
  leiNegativeMonths: 25,        // 25-month streak
  pmiBelow50: true,             // manufacturing PMI below 50
  retailNegative: false,        // retail sales still positive
  unemploymentRising: true,     // unemployment gently rising
  nfciAbove50: false,           // NFCI still accommodative
}

// ── Merrill Clock illustrative data ──────────────────────────────────────────
const CLOCK_GDP = 2.1
const CLOCK_CPI = 2.4  // CPI below 2.5 threshold → recovery quadrant

// ── Inventory phase illustrative data ────────────────────────────────────────
const INV_INVENTORY_YOY = -1.2
const INV_SALES_YOY = 0.5

export default function Ch1Page() {
  const [params, setParams] = useState<Ch1Params>(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(1)
  }, [])

  // ── Recession probability ─────────────────────────────────────────────────
  const { probability, weights } = useMemo(
    () => recessionProbability(RECESSION_SIGNALS),
    [],
  )

  const meterSignals = useMemo(
    () => [
      { name: '收益率倒挂', triggered: RECESSION_SIGNALS.yieldInverted, weight: weights.yieldInverted },
      { name: 'LEI 连续负值', triggered: RECESSION_SIGNALS.leiNegativeMonths >= 12, weight: weights.leiNegativeMonths },
      { name: 'PMI < 50', triggered: RECESSION_SIGNALS.pmiBelow50, weight: weights.pmiBelow50 },
      { name: '零售负增长', triggered: RECESSION_SIGNALS.retailNegative, weight: weights.retailNegative },
      { name: '失业上升', triggered: RECESSION_SIGNALS.unemploymentRising, weight: weights.unemploymentRising },
      { name: 'NFCI 紧张', triggered: RECESSION_SIGNALS.nfciAbove50, weight: weights.nfciAbove50 },
    ],
    [weights],
  )

  // ── Inventory phase ───────────────────────────────────────────────────────
  const currentInventory = useMemo(
    () => inventoryPhase(INV_INVENTORY_YOY, INV_SALES_YOY),
    [],
  )

  // ── Chart data ────────────────────────────────────────────────────────────
  const yieldCurveData = useMemo(
    () => YIELD_CURVE_HISTORY.map((d) => ({ label: d.date.slice(2, 7), value: d.spread })),
    [],
  )

  const leiData = useMemo(
    () => LEI_HISTORY.map((d) => ({ label: d.date.slice(2, 7), value: d.yoyChange })),
    [],
  )

  const pmiData = useMemo(
    () => PMI_HISTORY.map((d) => ({ label: d.date.slice(2, 7), value: d.value })),
    [],
  )

  // ── NBER indicator split ──────────────────────────────────────────────────
  const coincidentIndicators = useMemo(
    () => NBER_CORE_INDICATORS.filter((_, i) => i < 4),
    [],
  )
  const leadingIndicators = useMemo(
    () => NBER_CORE_INDICATORS.filter((ind) => ind.type === 'leading'),
    [],
  )

  // ── NPV simulator ────────────────────────────────────────────────────────
  const cashflows = useMemo(() => {
    const { growthRate, years, initialGDP } = params
    const cfs: number[] = [0]
    for (let t = 1; t <= years; t++) {
      cfs.push(initialGDP * Math.pow(1 + growthRate / 100, t))
    }
    return cfs
  }, [params])

  const npvResult = useMemo(
    () => npv(params.discountRate / 100, cashflows),
    [params.discountRate, cashflows],
  )

  const effectiveGrowth = useMemo(() => {
    if (params.initialGDP <= 0 || params.years <= 0) return 0
    const ratio = npvResult / params.initialGDP
    if (ratio <= 0) return -100
    return (Math.pow(ratio, 1 / params.years) - 1) * 100
  }, [npvResult, params.initialGDP, params.years])

  // ── Handlers ─────────────────────────────────────────────────────────────
  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof Ch1Params>(key: K, value: Ch1Params[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch1Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(1, correct)
    setModal((prev) =>
      prev.type === 'predict' ? { type: 'reveal', snapshotKey: prev.snapshotKey } : prev,
    )
  }

  function handleRevealClose() {
    setModal({ type: 'none' })
  }

  function handlePredictClose() {
    setModal({ type: 'none' })
  }

  function formatNpv(val: number): string {
    return Math.round(val).toLocaleString('en-US')
  }

  const activeSnapshot =
    modal.type !== 'none'
      ? ch1Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  // Inventory phase active index for highlight
  const PHASE_ORDER = ['主动补库存', '被动补库存', '主动去库存', '被动去库存']

  return (
    <ScrollView className='ch1-page' scrollY>

      {/* ── 1. Hero Header ─────────────────────────────────────────────────── */}
      <View className='page-header ch1-header'>
        <Text className='page-title'>🇺🇸 美国经济分析框架</Text>
        <Text className='page-meta'>煤矿中的金丝雀 · 多指标共振判断衰退</Text>
        <Text className='ch1-header__subtitle'>第 1 章 · 美国经济 | 数据截至 2024-Q4</Text>
      </View>

      {/* ── 2. 衰退概率综合面板 ────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>🚨 衰退概率综合面板</Text>
        <View className='panel ch1-meter-panel'>
          <View className='ch1-meter-layout'>
            <RecessionMeter
              probability={probability}
              signals={meterSignals}
              asOfDate='2024-12'
            />
            <View className='ch1-meter-aside'>
              <Text className='ch1-meter-aside__label'>综合评级</Text>
              <Text className={`ch1-meter-aside__rating ${probability < 30 ? 'rating--low' : probability < 60 ? 'rating--mid' : 'rating--high'}`}>
                {probability < 30 ? '信号混杂' : probability < 60 ? '警惕升温' : '高风险区'}
              </Text>
              <Text className='ch1-meter-aside__desc'>
                {probability < 30
                  ? '收益率曲线正常化，NFCI 宽松，但 LEI 与 PMI 仍偏弱。多指标分歧，难以单一定论。'
                  : probability < 60
                  ? '超过半数领先指标发出预警，需密切监测劳动力市场与消费数据。'
                  : '主要领先指标共振，衰退风险显著上升，建议防御性配置。'}
              </Text>
              <View className='ch1-meter-aside__note'>
                <Text className='ch1-meter-aside__note-text'>
                  ⚠ 单一指标失误率 13-20%，多指标共振准确率可达 80%+
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── 3. 实时数据 ────────────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>📡 当前经济信号</Text>
        <LiveData
          title='📡 当前经济信号'
          tiles={[
            { id: 'T10Y3M', label: '收益率曲线', hint: '10Y-3M' },
            { id: 'INDPRO', label: '工业生产', hint: 'YoY' },
            { id: 'ICSA', label: '初请失业金', hint: '周均' },
            { id: 'NFCI', label: '金融条件', hint: 'NFCI' },
            { id: 'RSAFS', label: '零售消费', hint: 'YoY' },
          ]}
          autoRefresh
        />
      </View>

      {/* ── 4. NBER 4 大核心指标（同步指标）──────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>📊 NBER 4 大核心指标 (同步指标)</Text>
        <Text className='section-subtitle'>NBER 委员会判定衰退的官方依据 — 4 项必须同时下行</Text>
        <View className='indicator-grid indicator-grid--2col'>
          {coincidentIndicators.map((ind) => (
            <IndicatorTile
              key={ind.id}
              emoji={ind.emoji}
              name={ind.name}
              value={ind.value}
              status={ind.status}
              hint={ind.hint}
              history={ind.history}
            />
          ))}
        </View>
      </View>

      {/* ── 5. 领先指标（早期信号）────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>⚡ 领先指标 (煤矿中的金丝雀)</Text>
        <Text className='section-subtitle'>领先经济周期 6-18 个月，是衰退预测的核心工具</Text>
        <View className='indicator-grid indicator-grid--2col'>
          {leadingIndicators.map((ind) => (
            <IndicatorTile
              key={ind.id}
              emoji={ind.emoji}
              name={ind.name}
              value={ind.value}
              status={ind.status}
              hint={ind.hint}
              history={ind.history}
            />
          ))}
        </View>
      </View>

      {/* ── 6. 收益率曲线 ──────────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>📈 收益率曲线 10Y-3M (60 月)</Text>
        <View className='panel ch1-chart-panel'>
          <MiniChart
            id='yc-chart'
            type='line'
            data={yieldCurveData}
            unit='%'
            threshold={{ value: 0, label: '倒挂线', color: '#ff4757' }}
            showZeroLine
            color='#4a9eff'
            highlightLast
            yAxisFormat={(v) => v.toFixed(2)}
          />
          <View className='ch1-chart-note'>
            <Text className='ch1-chart-note__text'>
              2022.07 倒挂开始，2024 末缓慢正常化。
            </Text>
            <Text className='ch1-chart-note__highlight'>
              13% 失误率
            </Text>
            <Text className='ch1-chart-note__text'>
              {' '}— 历史最长倒挂却未触发衰退
            </Text>
          </View>
        </View>
      </View>

      {/* ── 7. LEI 同比 ────────────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>📉 领先经济指数 LEI 同比 (36 月)</Text>
        <View className='panel ch1-chart-panel'>
          <MiniChart
            id='lei-chart'
            type='line'
            data={leiData}
            unit='%'
            threshold={{ value: 0, label: '0线', color: '#ff4757' }}
            showZeroLine
            color='#f5a623'
            highlightLast
            yAxisFormat={(v) => v.toFixed(1)}
          />
          <View className='ch1-chart-note'>
            <Text className='ch1-chart-note__highlight'>~20% 失误率</Text>
            <Text className='ch1-chart-note__text'>
              {' '}— 25 个月连续负值，历史首次长期失效。8 次衰退中 7 次预示，但本轮例外。
            </Text>
          </View>
        </View>
      </View>

      {/* ── 8. 制造业 PMI ──────────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>🏭 制造业 PMI (36 月)</Text>
        <View className='panel ch1-chart-panel'>
          <MiniChart
            id='pmi-chart'
            type='line'
            data={pmiData}
            threshold={{ value: 50, label: '荣枯线', color: '#f5a623' }}
            color='#4cd964'
            highlightLast
            yAxisFormat={(v) => v.toFixed(1)}
          />
          <View className='ch1-chart-note'>
            <Text className='ch1-chart-note__text'>
              PMI {'<'} 50 持续 18+ 月。新订单/库存/就业三细分都疲弱。
            </Text>
          </View>
        </View>
      </View>

      {/* ── 9. 库存周期 4 阶段 ──────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>🔄 库存周期</Text>
        <Text className='section-subtitle'>
          当前：{currentInventory.phase}（库存同比 {INV_INVENTORY_YOY}%，销售同比 {INV_SALES_YOY}%）
        </Text>
        <View className='inventory-grid'>
          {INVENTORY_CYCLE_PHASES.map((phase, idx) => {
            const isActive = PHASE_ORDER[idx] === currentInventory.phase
            return (
              <View
                key={phase.phase}
                className={`inventory-card ${isActive ? 'inventory-card--active' : ''}`}
              >
                {isActive && (
                  <View className='inventory-card__badge'>
                    <Text className='inventory-card__badge-text'>当前阶段</Text>
                  </View>
                )}
                <View className='inventory-card__header'>
                  <Text className='inventory-card__step'>{idx + 1}</Text>
                  <Text className='inventory-card__phase'>{phase.phase}</Text>
                </View>
                <Text className='inventory-card__desc'>{phase.description}</Text>
                <View className='inventory-card__assets'>
                  <View className='inventory-card__asset-row'>
                    <Text className='inventory-card__asset-label inventory-card__asset-label--up'>↑ 上行资产</Text>
                    <Text className='inventory-card__asset-list'>{phase.assetsUp.join(' · ')}</Text>
                  </View>
                  <View className='inventory-card__asset-row'>
                    <Text className='inventory-card__asset-label inventory-card__asset-label--down'>↓ 下行资产</Text>
                    <Text className='inventory-card__asset-list'>{phase.assetsDown.join(' · ')}</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      </View>

      {/* ── 10. 美林时钟 ───────────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>🕐 美林时钟 · 当前位置</Text>
        <View className='panel'>
          <InvestmentClock gdpGrowth={CLOCK_GDP} cpiYoY={CLOCK_CPI} cpiTrend='down' />
          <View className='ch1-clock-note'>
            <Text className='ch1-clock-note__text'>
              当前位置：复苏期（GDP↑ + CPI↓回落）— 推荐配置：
            </Text>
            <Text className='ch1-clock-note__highlight'>股票优先、商品次之</Text>
          </View>
        </View>
      </View>

      {/* ── 11. NPV 现值模拟器 ──────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>💰 GDP 现值模拟器</Text>
        <Text className='section-subtitle'>调整增长率与贴现率，观察未来 GDP 现值变化</Text>

        <SnapshotBar
          items={ch1Snapshots}
          activeKey={activeKey}
          onSelect={handleSnapshotSelect}
        />

        <View className='panel'>
          <Text className='panel-tag'>调整参数</Text>
          <SliderRow
            label='GDP增长率'
            value={params.growthRate}
            min={-5}
            max={8}
            step={0.1}
            unit='%'
            onChange={(v) => updateParam('growthRate', v)}
          />
          <SliderRow
            label='贴现率'
            value={params.discountRate}
            min={0}
            max={10}
            step={0.1}
            unit='%'
            onChange={(v) => updateParam('discountRate', v)}
          />
          <SliderRow
            label='预测年数'
            value={params.years}
            min={1}
            max={30}
            step={1}
            unit='年'
            onChange={(v) => updateParam('years', v)}
          />
          <SliderRow
            label='初始GDP'
            value={params.initialGDP}
            min={15000}
            max={35000}
            step={100}
            unit='亿美元'
            onChange={(v) => updateParam('initialGDP', v)}
          />
        </View>

        <View className={`output${flash ? ' flash' : ''}`}>
          <View className='output-row'>
            <View>
              <Text className='output-label'>未来GDP现值</Text>
              <Text className={`output-big${npvResult < 0 ? ' output-big--neg' : ' output-big--pos'}`}>
                {npvResult < 0 ? '-' : ''}¥{formatNpv(Math.abs(npvResult))} 亿
              </Text>
            </View>
            <View className='output-secondary'>
              <Text className='output-label'>年均贴现增长</Text>
              <Text className={`output-secondary-value${effectiveGrowth < 0 ? ' neg' : ' pos'}`}>
                {effectiveGrowth >= 0 ? '+' : ''}{effectiveGrowth.toFixed(2)}%
              </Text>
            </View>
          </View>
          <Text className='output-hint'>
            以 {params.discountRate}% 贴现率折算，未来 {params.years} 年 GDP 流量的今日价值。
            贴现率 {'>'} 增长率时 NPV 随年数增加趋于收敛；反之则发散。
          </Text>
        </View>
      </View>

      {/* ── 12. 历史衰退对比 ────────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>📚 历次衰退对比</Text>
        <View className='recession-table'>
          {/* Header */}
          <View className='recession-row recession-row--header'>
            <Text className='recession-cell recession-cell--period'>时期</Text>
            <Text className='recession-cell recession-cell--dur'>月数</Text>
            <Text className='recession-cell recession-cell--gdp'>GDP跌幅</Text>
            <Text className='recession-cell recession-cell--unemp'>失业峰值</Text>
          </View>
          {NBER_RECESSIONS.map((rec) => (
            <View key={rec.start} className='recession-row'>
              <View className='recession-cell recession-cell--period'>
                <Text className='recession-period'>{rec.start.slice(0, 4)}</Text>
                <Text className='recession-trigger'>{rec.trigger}</Text>
              </View>
              <Text className='recession-cell recession-cell--dur'>{rec.duration}月</Text>
              <Text className={`recession-cell recession-cell--gdp recession-val--neg`}>
                {rec.gdpDrop}%
              </Text>
              <Text className='recession-cell recession-cell--unemp'>
                {rec.unemploymentPeak}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── 13. 教育卡片 ────────────────────────────────────────────────────── */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 衰退预测方法论</Text>
        <Text className='edu-text'>
          NBER 4 大核心指标（同步）+ 领先指标共振：制造业 PMI {'<'} 50 + 收益率曲线倒挂 + LEI 连续负值 + NFCI 上升。单一指标失误率 13-20%；多指标共振才能将准确率提升至 80%+。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期：本轮周期颠覆教科书</Text>
        <Text className='edu-text'>
          本轮周期颠覆教科书：收益率曲线倒挂创历史最长（800+ 天），LEI 连续 25 个月负值，但失业率仅 4.2%、非农仍正增。"软着陆" or "不着陆"？— 教材的指标体系是 1970-2010 样本构建的，2020 后供给冲击主导的通胀改变了指标间的传导逻辑。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          书中相关性分析未区分伪相关与因果，未控制 QE 结构性断裂。建议：(1) 用 Granger 因果检验替代简单相关系数；(2) 用滚动窗口（5 年）替代全样本；(3) 用结构性向量自回归 SVAR 控制混淆变量；(4) 加入 Sahm Rule（失业率 3 月均值高出 12 月低点 0.5pp）作为更稳健的衰退触发器 — 自 1970 年来零失误。
        </Text>
      </View>

      {/* ── 14. Quiz CTA ────────────────────────────────────────────────────── */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=1' })}
      >
        <Text>做章节测验，检验理解 →</Text>
      </View>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
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
