import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch9Snapshots } from '../../utils/snapshots'
import { oilProjectNpv } from '../../utils/formulas'
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

const DEFAULT_PARAMS = ch9Snapshots[0].params

export default function Ch9Page() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(9)
  }, [])

  const result = useMemo(
    () =>
      oilProjectNpv(
        params.oilPrice,
        params.costPerBarrel,
        params.dailyProduction,
        params.waccRate,
        params.years
      ),
    [params]
  )

  const { projectNpv, annualCashflow, breakeven } = result
  const npvPositive = projectNpv >= 0

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof typeof params>(key: K, value: (typeof params)[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch9Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(9, correct)
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
      ? ch9Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  function formatMillions(val: number): string {
    const m = val / 1_000_000
    return `${m >= 0 ? '' : '-'}$${Math.abs(m).toFixed(1)}M`
  }

  function formatBillions(val: number): string {
    const b = val / 1_000_000_000
    if (Math.abs(b) >= 1) {
      return `${b >= 0 ? '' : '-'}$${Math.abs(b).toFixed(2)}B`
    }
    return formatMillions(val)
  }

  return (
    <ScrollView className='ch9-page' scrollY>
      {/* Header */}
      <View className='page-header ch9-header'>
        <Text className='page-title'>🛢️ 石油项目WACC模拟器</Text>
        <Text className='page-meta'>第 9 章 · 大宗商品：石油</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch9Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='油价'
          value={params.oilPrice}
          min={10}
          max={200}
          step={1}
          unit='$/桶'
          onChange={(v) => updateParam('oilPrice', v)}
        />
        <SliderRow
          label='开采成本'
          value={params.costPerBarrel}
          min={10}
          max={100}
          step={1}
          unit='$/桶'
          onChange={(v) => updateParam('costPerBarrel', v)}
        />
        <SliderRow
          label='日产量'
          value={params.dailyProduction}
          min={1000}
          max={20000}
          step={500}
          unit='桶'
          onChange={(v) => updateParam('dailyProduction', v)}
        />
        <SliderRow
          label='WACC'
          value={params.waccRate}
          min={1}
          max={20}
          step={0.5}
          unit='%'
          onChange={(v) => updateParam('waccRate', v)}
        />
        <SliderRow
          label='项目年限'
          value={params.years}
          min={5}
          max={40}
          step={1}
          unit='年'
          onChange={(v) => updateParam('years', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>项目NPV</Text>
            <Text className={`output-big${npvPositive ? ' ch9-val--pos' : ' ch9-val--neg'}`}>
              {formatBillions(projectNpv)}
            </Text>
          </View>
          <View className='ch9-secondary'>
            <View className='ch9-metric-block'>
              <Text className='output-label'>年现金流</Text>
              <Text className={`ch9-metric-value${annualCashflow >= 0 ? ' ch9-val--pos' : ' ch9-val--neg'}`}>
                {formatMillions(annualCashflow)}
              </Text>
            </View>
            <View className='ch9-metric-block ch9-metric-block--bottom'>
              <Text className='output-label'>盈亏平衡油价</Text>
              <Text className='ch9-metric-value ch9-breakeven'>
                ${breakeven.toFixed(0)}/桶
              </Text>
            </View>
          </View>
        </View>
        <Text className='output-hint'>
          油价 ${params.oilPrice} vs 开采成本 ${params.costPerBarrel}，每桶毛利 ${(params.oilPrice - params.costPerBarrel).toFixed(0)}。WACC {params.waccRate}% 折现 {params.years} 年。NPV {'>'} 0 意味着项目回报超越加权资本成本。
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 WACC与NPV</Text>
        <Text className='edu-text'>
          {'WACC = Ke × E/(E+D) + Kd×(1-T) × D/(E+D)\n\n'}
          {'NPV = Σ CF_t / (1+WACC)^t，t=1…n\n\n'}
          WACC 是石油项目的"门槛收益率"：权益投资者要求的回报（Ke）加权债务税后成本（Kd×(1-T)）。年现金流 = (油价 - 开采成本) × 日产量 × 365。若 NPV {'>'} 0，项目在 WACC 折现下仍创造价值；若 NPV {'<'} 0，项目回报不足以覆盖资本成本，理性投资者应拒绝。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期：页岩油重写供给弹性</Text>
        <Text className='edu-text'>
          教材说2001前油价均值回归，2014后页岩油让油价重回均值回归——第三种范式。页岩油盈亏平衡从$80降到$40，彻底改变供给弹性：油价涨到$60，页岩油钻井平台迅速上线；跌破$40，页岩油主动减产。这让 OPEC 的卡特尔定价权大幅削弱，传统DCF模型假设的"固定供给"在页岩油时代完全失效。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          书中 ADF 检验判断油价范式，但样本窗口选择严重影响结果。建议用 Zivot-Andrews 检验——允许内生断点的单位根检验，可自动识别 1986、2008、2014 等结构性断裂点，而非人为选定窗口。且模型需加入碳转型对长期需求的结构性冲击：IEA 预测 2050 年石油需求可能下降 40%，当前 WACC 模型若不对终端价值打折，将系统性高估项目价值 30-50%。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=9' })}
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
