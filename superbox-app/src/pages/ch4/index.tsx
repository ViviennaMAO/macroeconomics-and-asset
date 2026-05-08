import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch4Snapshots } from '../../utils/snapshots'
import { irr } from '../../utils/formulas'
import SnapshotBar from '../../components/SnapshotBar'
import SliderRow from '../../components/SliderRow'
import PredictModal from '../../components/PredictModal'
import RevealModal from '../../components/RevealModal'
import { markOpened, markPredicted } from '../../utils/progress'
import './index.scss'

type ModalState =
  | { type: 'none' }
  | { type: 'predict'; snapshotKey: string }
  | { type: 'reveal'; snapshotKey: string }

const DEFAULT_PARAMS = ch4Snapshots[0].params

export default function Ch4Page() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(4)
  }, [])

  // Build cashflows: [initialInvestment, annualReturn×(holdingYears-1), annualReturn + exitProceeds]
  const cashflows = useMemo(() => {
    const { initialInvestment, annualReturn, exitMultiple, holdingYears } = params
    const exitProceeds = Math.abs(initialInvestment) * exitMultiple
    const cfs: number[] = [initialInvestment]
    for (let t = 1; t < holdingYears; t++) {
      cfs.push(annualReturn)
    }
    cfs.push(annualReturn + exitProceeds)
    return cfs
  }, [params])

  const irrResult = useMemo(() => irr(cashflows), [cashflows])

  const irrPct = useMemo(() => {
    if (isNaN(irrResult)) return null
    return irrResult * 100
  }, [irrResult])

  const spread = useMemo(() => {
    if (irrPct === null) return null
    return irrPct - 4
  }, [irrPct])

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof typeof params>(key: K, value: (typeof params)[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch4Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(4, correct)
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
      ? ch4Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  const irrPositive = irrPct !== null && irrPct > 0
  const irrDisplay = irrPct !== null ? `${irrPct.toFixed(2)}%` : 'N/A'
  const spreadDisplay =
    spread !== null
      ? `${spread >= 0 ? '+' : ''}${spread.toFixed(2)}pp`
      : 'N/A'

  return (
    <ScrollView className='ch4-page' scrollY>
      {/* Header */}
      <View className='page-header ch4-header'>
        <Text className='page-title'>🌏 新兴市场IRR模拟器</Text>
        <Text className='page-meta'>第 4 章 · 新兴市场资本流动</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch4Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='初始投资'
          value={params.initialInvestment}
          min={-5000}
          max={-100}
          step={50}
          unit='万$'
          onChange={(v) => updateParam('initialInvestment', v)}
        />
        <SliderRow
          label='年回报'
          value={params.annualReturn}
          min={0}
          max={500}
          step={10}
          unit='万$'
          onChange={(v) => updateParam('annualReturn', v)}
        />
        <SliderRow
          label='退出倍数'
          value={params.exitMultiple}
          min={0.1}
          max={5.0}
          step={0.1}
          unit='x'
          onChange={(v) => updateParam('exitMultiple', v)}
        />
        <SliderRow
          label='持有年数'
          value={params.holdingYears}
          min={1}
          max={15}
          step={1}
          unit='年'
          onChange={(v) => updateParam('holdingYears', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>投资IRR</Text>
            <Text className={`output-big${irrPositive ? ' ch4-val--pos' : ' ch4-val--neg'}`}>
              {irrDisplay}
            </Text>
          </View>
          <View className='ch4-secondary'>
            <Text className='output-label'>vs 无风险利率(~4%)</Text>
            <Text className={`ch4-secondary-value${spread !== null && spread >= 0 ? ' ch4-val--pos' : ' ch4-val--neg'}`}>
              {spreadDisplay}
            </Text>
          </View>
        </View>
        <Text className='output-hint'>
          持有 {params.holdingYears} 年，退出倍数 {params.exitMultiple}x。IRR 使项目 NPV=0 的折现率；利差越大，新兴市场风险溢价越高。
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 IRR公式</Text>
        <Text className='edu-text'>
          {'IRR 是使 NPV = 0 的折现率：Σ CF_t / (1+IRR)^t = 0\n\n'}
          计算采用牛顿-拉弗森迭代法：从猜测值 r₀ 出发，通过 r_{n+1} = r_n - f(r_n)/f′(r_n) 逐步收敛。f(r) 为 NPV 函数，f′(r) 为其导数（加权现金流之和的负值）。通常 3-10 次迭代即可达到 1e-7 精度。IRR 高于资本成本时项目值得投资；低于无风险利率时，新兴市场风险溢价已无法覆盖汇率与政治风险。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期：2013 Taper Tantrum</Text>
        <Text className='edu-text'>
          2013 Taper Tantrum：资本进来要一年，出去只要一周。Fed仅暗示缩减QE，EM资本外流速度是流入的3-5倍——利差模型解释不了恐慌。流动性错配才是核心：长期资产叠加短期负债的结构在压力下自我强化，IRR 静态模型无法捕捉"挤兑动态"。印度卢比、巴西雷亚尔单季贬值超 15%，IRR 事后倒算跌穿无风险利率。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          书中用利差解释资本流动，忽略全球流动性周期。Rey(2015)证明三元悖论已退化为二元悖论——资本自由流动下，小国货币政策独立性是幻觉。建议加入 VIX/美元流动性指标：当 VIX {'>'} 25，利差模型的解释力 R² 从 0.6 跌至 0.1；全球流动性周期才是 EM 资金进出的真正开关，IRR 优化在宏观风险爆发时形同虚设。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=4' })}
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
