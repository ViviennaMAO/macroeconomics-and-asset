import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import SnapshotBar from '../../components/SnapshotBar'
import SliderRow from '../../components/SliderRow'
import PredictModal from '../../components/PredictModal'
import RevealModal from '../../components/RevealModal'
import { markOpened, markPredicted } from '../../utils/progress'
import { ch12Snapshots, type Ch12Params } from '../../utils/snapshots'
import { trilemmaScore } from '../../utils/formulas'
import './index.scss'

type ModalState =
  | { kind: 'none' }
  | { kind: 'predict'; snapshotKey: string }
  | { kind: 'reveal'; snapshotKey: string }

const DEFAULT_PARAMS = ch12Snapshots[0].params

export default function Ch12Page() {
  const [params, setParams] = useState<Ch12Params>(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })

  useEffect(() => {
    markOpened(12)
  }, [])

  const result = useMemo(
    () => trilemmaScore(params.capitalOpenness, params.exchangeFlexibility, params.monetaryIndependence),
    [params]
  )
  const sumScore = params.capitalOpenness + params.exchangeFlexibility + params.monetaryIndependence

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof Ch12Params>(key: K, value: Ch12Params[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function loadSnapshot(key: string) {
    const snap = ch12Snapshots.find((s) => s.key === key)
    if (!snap) return
    setParams(snap.params)
    setActiveKey(key)
    triggerFlash()
    if (snap.predict) {
      setModal({ kind: 'predict', snapshotKey: key })
    }
  }

  function onPredictAnswer(correct: boolean) {
    if (modal.kind !== 'predict') return
    markPredicted(12, correct)
    const snap = ch12Snapshots.find((s) => s.key === modal.snapshotKey)
    if (snap?.reveal) {
      setModal({ kind: 'reveal', snapshotKey: modal.snapshotKey })
    } else {
      setModal({ kind: 'none' })
    }
  }

  function onPredictClose() {
    setModal({ kind: 'none' })
  }

  function onRevealClose() {
    setModal({ kind: 'none' })
  }

  const activeSnapshot =
    modal.kind !== 'none'
      ? ch12Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  return (
    <ScrollView className='ch12-page' scrollY>
      {/* Header */}
      <View className='page-header ch12-header'>
        <Text className='page-title'>🔄 三元悖论模拟器</Text>
        <Text className='page-meta'>第 12 章 · 汇率案例分析</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch12Snapshots}
        activeKey={activeKey}
        onSelect={loadSnapshot}
      />

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='资本开放度'
          value={params.capitalOpenness}
          min={0}
          max={100}
          step={5}
          unit=''
          onChange={(v) => updateParam('capitalOpenness', v)}
        />
        <SliderRow
          label='汇率弹性'
          value={params.exchangeFlexibility}
          min={0}
          max={100}
          step={5}
          unit=''
          onChange={(v) => updateParam('exchangeFlexibility', v)}
        />
        <SliderRow
          label='货币政策独立性'
          value={params.monetaryIndependence}
          min={0}
          max={100}
          step={5}
          unit=''
          onChange={(v) => updateParam('monetaryIndependence', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        {/* Status badge */}
        <View className={`ch12-status-badge ${result.feasible ? 'ch12-status-badge--feasible' : 'ch12-status-badge--infeasible'}`}>
          <Text className='ch12-status-badge__icon'>
            {result.feasible ? '✅ 政策可行' : '⛔ 不可兼得'}
          </Text>
          <Text className='ch12-status-badge__sub'>
            {result.feasible
              ? `三角和：${sumScore}/200`
              : `超出 ${result.tension} 分`}
          </Text>
        </View>

        {/* Trinity bar visualization */}
        <View className='ch12-trinity'>
          {([
            { label: '🌐 资本自由流动', val: params.capitalOpenness },
            { label: '📊 汇率稳定', val: 100 - params.exchangeFlexibility },
            { label: '🏛️ 货币独立', val: params.monetaryIndependence },
          ] as { label: string; val: number }[]).map((item) => (
            <View key={item.label} className='ch12-trinity__row'>
              <Text className='ch12-trinity__label'>{item.label}</Text>
              <View className='ch12-trinity__bar'>
                <View
                  className='ch12-trinity__fill'
                  style={{ width: `${item.val}%` }}
                />
              </View>
              <Text className='ch12-trinity__val'>{item.val}</Text>
            </View>
          ))}
        </View>

        <Text className='output-hint'>
          提示：三个维度只能同时拥有两个。三者之和超过200时，体系将经历危机或被迫调整。
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 不可能三角</Text>
        <Text className='edu-text'>
          {'三元悖论(Mundell-Fleming)：资本自由流动 + 固定汇率 + 货币政策独立性，三者只能选两个。美国选(自由流动+独立)放弃稳定汇率；中国选(独立+稳定)放弃自由流动；香港选(自由流动+稳定)放弃独立(联系汇率)。'}
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>
          {'2015年8月11日中国"811汇改"尝试同时增加资本开放、汇率弹性和保留独立——结果触发外储从4万亿$降到3万亿$，资本外流约7000亿$。教材用三元悖论解释亚洲危机，但2015证明：从固定到浮动的过渡态比稳态更危险——切换本身就是危机触发器。'}
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          {'书中案例分析偏叙述性，缺乏反事实分析(counterfactual)。建议：(1) 用合成控制法(synthetic control)构建反事实——例：「如果中国2015没有汇改」下的反事实路径 (2) 注意幸存者偏差——只分析「典型」危机，忽略了成功防御案例(2018印度) (3) Rey(2015)论证三元悖论已退化为二元悖论：全球流动性周期下，浮动汇率也无法保证货币政策独立。'}
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=12' })}
      >
        <Text>做章节测验，检验理解 →</Text>
      </View>

      {/* Modals */}
      {modal.kind === 'predict' && activeSnapshot?.predict && (
        <PredictModal
          question={activeSnapshot.predict.question}
          options={activeSnapshot.predict.options}
          correct={activeSnapshot.predict.correct}
          contextLine={activeSnapshot.predict.contextLine}
          onAnswer={onPredictAnswer}
          onClose={onPredictClose}
        />
      )}

      {modal.kind === 'reveal' && activeSnapshot?.reveal && (
        <RevealModal
          title={activeSnapshot.reveal.title}
          delta={activeSnapshot.reveal.delta}
          explain={activeSnapshot.reveal.explain}
          twist={activeSnapshot.reveal.twist}
          onClose={onRevealClose}
        />
      )}
    </ScrollView>
  )
}
