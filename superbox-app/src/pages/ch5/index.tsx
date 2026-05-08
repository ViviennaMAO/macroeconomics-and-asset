import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch5Snapshots, type Ch5Params } from '../../utils/snapshots'
import { globalGdpWeighted } from '../../utils/formulas'
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

const DEFAULT_PARAMS = ch5Snapshots[0].params

export default function Ch5Page() {
  const [params, setParams] = useState<Ch5Params>(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(5)
  }, [])

  const result = useMemo(
    () =>
      globalGdpWeighted(
        params.mode,
        params.usGrowth,
        params.euGrowth,
        params.chinaGrowth,
        params.indiaGrowth,
        params.otherGrowth
      ),
    [params]
  )

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof Ch5Params>(key: K, value: Ch5Params[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch5Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(5, correct)
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
      ? ch5Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  const w = result.weights

  return (
    <ScrollView className='ch5-page' scrollY>
      {/* Header */}
      <View className='page-header'>
        <Text className='page-title'>🌐 全球GDP权重模拟器</Text>
        <Text className='page-meta'>第 5 章 · 全球分析框架综合</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch5Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Mode Toggle */}
      <View className='mode-toggle'>
        <View
          className={`mode-toggle__btn ${params.mode === 'market' ? 'mode-toggle__btn--active' : ''}`}
          onClick={() => updateParam('mode', 'market')}
        >
          <Text>市场汇率权重</Text>
        </View>
        <View
          className={`mode-toggle__btn ${params.mode === 'ppp' ? 'mode-toggle__btn--active' : ''}`}
          onClick={() => updateParam('mode', 'ppp')}
        >
          <Text>PPP权重</Text>
        </View>
      </View>

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整各区域增速</Text>
        <SliderRow
          label='美国增速'
          value={params.usGrowth}
          min={-3}
          max={8}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('usGrowth', v)}
        />
        <SliderRow
          label='欧元区增速'
          value={params.euGrowth}
          min={-3}
          max={6}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('euGrowth', v)}
        />
        <SliderRow
          label='中国增速'
          value={params.chinaGrowth}
          min={0}
          max={12}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('chinaGrowth', v)}
        />
        <SliderRow
          label='印度增速'
          value={params.indiaGrowth}
          min={0}
          max={12}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('indiaGrowth', v)}
        />
        <SliderRow
          label='其他EM增速'
          value={params.otherGrowth}
          min={-2}
          max={8}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('otherGrowth', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>全球加权GDP增速</Text>
            <Text className='output-big ch5-growth'>
              {result.weightedGrowth.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View className='ch5-weights'>
          <Text className='output-label'>权重分布（{params.mode === 'market' ? '市场汇率' : 'PPP'}）</Text>
          <View className='ch5-weights__grid'>
            <View className='ch5-weights__item'>
              <Text className='ch5-weights__label'>🇺🇸 美国</Text>
              <Text className='ch5-weights__value'>{(w.us * 100).toFixed(0)}%</Text>
            </View>
            <View className='ch5-weights__item'>
              <Text className='ch5-weights__label'>🇪🇺 欧元区</Text>
              <Text className='ch5-weights__value'>{(w.eu * 100).toFixed(0)}%</Text>
            </View>
            <View className='ch5-weights__item'>
              <Text className='ch5-weights__label'>🇨🇳 中国</Text>
              <Text className='ch5-weights__value'>{(w.cn * 100).toFixed(0)}%</Text>
            </View>
            <View className='ch5-weights__item'>
              <Text className='ch5-weights__label'>🇮🇳 印度</Text>
              <Text className='ch5-weights__value'>{(w.in * 100).toFixed(0)}%</Text>
            </View>
            <View className='ch5-weights__item'>
              <Text className='ch5-weights__label'>其他EM</Text>
              <Text className='ch5-weights__value'>{(w.other * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>

        <Text className='output-hint'>切换模式对比同样增速下的权重差异</Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 权重对比</Text>
        <Text className='edu-text'>
          市场汇率权重 vs PPP权重：美国26%→15%，中国17%→19%，印度4%→8%。PPP更反映实际购买力，但波动性低；市场汇率更反映金融市场视角，但被汇率扰动。IMF同时发布两套数据。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>
          教材用G7代表全球(原书数据~2018年G7占GDP 65%)，但2024年G7市场汇率口径已降至43%，PPP口径仅29%。用旧权重分析全球周期，会系统性低估中国/印度/东盟的影响。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          {'书中GDP权重未做PPP调整，且数据截止~2018年。建议：\n'}
          {'(1) 双轨对照PPP vs 市场汇率\n'}
          {'(2) 加入中国PMI/印度GDP季度数据等EM核心指标\n'}
          (3) 用DCC-GARCH模型衡量经济周期动态相关性——发达国家间相关性0.6，但与EM相关性已从0.3升至0.5。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=5' })}
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
