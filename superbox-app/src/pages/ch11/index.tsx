import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch11Snapshots } from '../../utils/snapshots'
import { taylorRule } from '../../utils/formulas'
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

// Fed actual rate benchmarks by snapshot key
const FED_ACTUAL_RATE: Record<string, number> = {
  '2019': 2.25,
  '2022': 1.75,
  '2024': 5.33,
}

const DEFAULT_PARAMS = ch11Snapshots[0].params

export default function Ch11Page() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(11)
  }, [])

  const impliedRate = useMemo(
    () => taylorRule(params.inflation, params.inflationTarget, params.outputGap, params.rStar),
    [params]
  )

  const fedActual = activeKey != null ? (FED_ACTUAL_RATE[activeKey] ?? null) : null
  const gap = fedActual != null ? impliedRate - fedActual : null
  const gapBp = gap != null ? Math.round(gap * 100) : null
  const gapIsLarge = gapBp != null && Math.abs(gapBp) > 200

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof typeof params>(key: K, value: (typeof params)[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch11Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(11, correct)
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
      ? ch11Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  function formatRate(val: number): string {
    return `${val.toFixed(2)}%`
  }

  function formatGapBp(bp: number): string {
    const sign = bp >= 0 ? '+' : ''
    return `${sign}${bp}bp`
  }

  return (
    <ScrollView className='ch11-page' scrollY>
      {/* Header */}
      <View className='page-header ch11-header'>
        <Text className='page-title'>🏦 泰勒规则模拟器</Text>
        <Text className='page-meta'>第 11 章 · 央行政策利率</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch11Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='通胀率 π'
          value={params.inflation}
          min={0}
          max={15}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('inflation', v)}
        />
        <SliderRow
          label='通胀目标 π*'
          value={params.inflationTarget}
          min={1}
          max={4}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('inflationTarget', v)}
        />
        <SliderRow
          label='产出缺口'
          value={params.outputGap}
          min={-5}
          max={5}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('outputGap', v)}
        />
        <SliderRow
          label='自然利率 r*'
          value={params.rStar}
          min={-1}
          max={4}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('rStar', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>泰勒规则利率</Text>
            <Text className='output-big ch11-val--blue'>{formatRate(impliedRate)}</Text>
          </View>
          {fedActual != null && (
            <View className='ch11-secondary'>
              <Text className='output-label'>vs Fed实际利率</Text>
              <Text className='ch11-fed-actual'>{formatRate(fedActual)}</Text>
              {gapBp != null && (
                <Text className={`ch11-gap ${gapIsLarge ? 'ch11-gap--large' : 'ch11-gap--small'}`}>
                  差距 {formatGapBp(gapBp)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Formula breakdown */}
        <View className='ch11-breakdown'>
          <Text className='output-label'>公式分解</Text>
          <View className='ch11-formula-row'>
            <Text className='ch11-formula-term'>
              r* {params.rStar >= 0 ? '+' : ''}{params.rStar.toFixed(1)}
            </Text>
            <Text className='ch11-formula-sep'>+</Text>
            <Text className='ch11-formula-term'>
              π {params.inflation.toFixed(1)}
            </Text>
            <Text className='ch11-formula-sep'>+</Text>
            <Text className='ch11-formula-term'>
              0.5×(π-π*) {(0.5 * (params.inflation - params.inflationTarget)).toFixed(2)}
            </Text>
            <Text className='ch11-formula-sep'>+</Text>
            <Text className='ch11-formula-term'>
              0.5×gap {(0.5 * params.outputGap).toFixed(2)}
            </Text>
          </View>
        </View>

        <Text className='output-hint'>
          {'i = r* + π + 0.5×(π−π*) + 0.5×gap = '}
          {params.rStar.toFixed(1)} + {params.inflation.toFixed(1)} + {(0.5 * (params.inflation - params.inflationTarget)).toFixed(2)} + {(0.5 * params.outputGap).toFixed(2)} = {formatRate(impliedRate)}
          {fedActual != null && gapBp != null
            ? `。Fed实际利率 ${formatRate(fedActual)}，规则差距 ${formatGapBp(gapBp)}${gapIsLarge ? '（超过200bp，裁量空间显著）' : ''}`
            : '。选择历史快照可对比Fed实际利率。'}
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 泰勒规则</Text>
        <Text className='edu-text'>
          {'i = r* + π + 0.5×(π−π*) + 0.5×gap\n\n'}
          {'John Taylor 1993年提出，是货币政策的"标准规则"。\n\n'}
          {'r*：自然利率（经济不过热不过冷时的均衡利率）\n'}
          {'π：当前通胀率\n'}
          {'0.5×(π−π*)：对通胀偏离目标的纠偏（偏差越大，加息越多）\n'}
          {'0.5×gap：对产出缺口的刺激（经济疲软时降息，过热时加息）\n\n'}
          实际应用中各系数由实证校准，Taylor原始版本均为0.5。规则提供可预测、透明的基准，减少央行"相机抉择"带来的时间不一致性问题。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期：规则与裁量之间的1160bp鸿沟</Text>
        <Text className='edu-text'>
          {'2022通胀9.1%，泰勒规则说Fed应加息到13.35%，实际仅到1.75%——规则与裁量之差达1160bp。\n\n'}
          Fed并非无视规则，而是主动选择"渐进路径"：担心急剧加息触发金融稳定风险（2019年9月Repo利率一夜飙到10%，暴露了利率走廊机制的脆弱性）。这说明金融稳定目标隐性约束了货币政策——泰勒原始公式里根本没有这一项，导致规则在极端环境下系统性高估所需利率。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          {'泰勒规则假设r*可观测且稳定，但Holston-Laubach-Williams估计r*范围为-0.5%~+2.5%，不同估计值导致政策建议差300bp。\n\n'}
          {'建议：\n'}
          {'(1) 用HLW模型估计时变r*——r*并非常数，会随人口结构、生产率、全球储蓄率变化\n'}
          {'(2) 用影子利率（shadow rate）替代零利率下界——传统泰勒规则在零利率约束下失灵\n'}
          (3) 加入金融条件指数（FCI）作为额外约束——利率只是货币条件的一部分，信贷利差、资产价格、汇率同样传导货币政策，单一利率目标会遗漏大量信息。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=11' })}
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
