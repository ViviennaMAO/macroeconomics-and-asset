import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch1Snapshots } from '../../utils/snapshots'
import { npv } from '../../utils/formulas'
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

const DEFAULT_PARAMS = ch1Snapshots[0].params

export default function Ch1Page() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(1)
  }, [])

  // Build cashflows: CF[0]=0 (no initial outlay), CF[t] = initialGDP*(1+g)^t
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
    [params.discountRate, cashflows]
  )

  // Effective annual growth after discounting: (npvResult/initialGDP)^(1/years) - 1
  const effectiveGrowth = useMemo(() => {
    if (params.initialGDP <= 0 || params.years <= 0) return 0
    const ratio = npvResult / params.initialGDP
    if (ratio <= 0) return -100
    return (Math.pow(ratio, 1 / params.years) - 1) * 100
  }, [npvResult, params.initialGDP, params.years])

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof typeof params>(key: K, value: (typeof params)[K]) {
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
      prev.type === 'predict' ? { type: 'reveal', snapshotKey: prev.snapshotKey } : prev
    )
  }

  function handleRevealClose() {
    setModal({ type: 'none' })
  }

  function handlePredictClose() {
    setModal({ type: 'none' })
  }

  function formatNpv(val: number): string {
    const rounded = Math.round(val)
    return rounded.toLocaleString('en-US')
  }

  const activeSnapshot =
    modal.type !== 'none'
      ? ch1Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  return (
    <ScrollView className='ch1-page' scrollY>
      {/* Header */}
      <View className='page-header ch1-header'>
        <Text className='page-title'>🇺🇸 美国经济 NPV 模拟器</Text>
        <Text className='page-meta'>第 1 章 · 美国经济分析框架</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch1Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Slider Inputs */}
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

      {/* Output */}
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

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 NPV公式</Text>
        <Text className='edu-text'>
          {'NPV = Σ CF_t / (1+r)^t，其中 CF_t = GDP₀ × (1+g)^t。'}
          {'\n\n'}
          g 为经济增长率，r 为贴现率（机会成本）。当 r {'>'} g，未来现金流被"压缩"得更快，NPV 最终收敛；当 r {'<'} g，经济增速快过资本回报要求，长期 NPV 发散——这正是超高增长时代估值难题的根源。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期：2022年领先指标集体失灵</Text>
        <Text className='edu-text'>
          2022年五大领先指标全亮红灯却没衰退——50年来首次集体失灵。教材的指标体系是基于1970-2010样本构建的，2020后供给冲击主导的通胀改变了指标间的传导逻辑。需求侧衰退预测模型在供给侧驱动的经济波动中系统性失准。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          书中相关性分析未区分伪相关与因果。建议：用 Granger 因果检验替代简单相关系数，用滚动窗口（5年）替代全样本，用结构性向量自回归（SVAR）控制混淆变量。全样本相关系数在结构断裂期前后方向可能完全相反。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=1' })}
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
