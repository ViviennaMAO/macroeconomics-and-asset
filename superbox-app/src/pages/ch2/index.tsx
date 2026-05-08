import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch2Snapshots, type Ch2Params } from '../../utils/snapshots'
import { sovereignSpread } from '../../utils/formulas'
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

const DEFAULT_PARAMS = ch2Snapshots[0].params

export default function Ch2Page() {
  const [params, setParams] = useState<Ch2Params>(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(2)
  }, [])

  const result = useMemo(
    () =>
      sovereignSpread(
        params.debtToGdp,
        params.fiscalDeficit,
        params.politicalRisk,
        params.ecbIntervention
      ),
    [params]
  )

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof Ch2Params>(key: K, value: Ch2Params[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch2Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(2, correct)
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
      ? ch2Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  const spreadColor =
    result.spreadBps < 100
      ? 'spread--green'
      : result.spreadBps <= 300
      ? 'spread--amber'
      : 'spread--red'

  return (
    <ScrollView className='ch2-page' scrollY>
      {/* Header */}
      <View className='page-header'>
        <Text className='page-title'>🇪🇺 欧洲主权利差模拟器</Text>
        <Text className='page-meta'>第 2 章 · 欧洲经济分析框架</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch2Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='债务/GDP'
          value={params.debtToGdp}
          min={40}
          max={200}
          step={1}
          unit='%'
          onChange={(v) => updateParam('debtToGdp', v)}
        />
        <SliderRow
          label='财政赤字'
          value={params.fiscalDeficit}
          min={0}
          max={15}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('fiscalDeficit', v)}
        />
        <SliderRow
          label='政治风险'
          value={params.politicalRisk}
          min={0}
          max={1}
          step={0.05}
          unit=''
          onChange={(v) => updateParam('politicalRisk', v)}
        />
        <SliderRow
          label='ECB干预力度'
          value={params.ecbIntervention}
          min={0}
          max={1}
          step={0.05}
          unit=''
          onChange={(v) => updateParam('ecbIntervention', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>10年期主权利差</Text>
            <Text className={`output-big ${spreadColor}`}>
              {Math.round(result.spreadBps)} bps
            </Text>
          </View>
        </View>

        <View className='ch2-breakdown'>
          <View className='ch2-breakdown__item'>
            <Text className='ch2-breakdown__label'>债务贡献</Text>
            <Text className='ch2-breakdown__value'>{Math.round(result.debtComponent)} bps</Text>
          </View>
          <View className='ch2-breakdown__item'>
            <Text className='ch2-breakdown__label'>赤字贡献</Text>
            <Text className='ch2-breakdown__value'>{Math.round(result.fiscalComponent)} bps</Text>
          </View>
          <View className='ch2-breakdown__item'>
            <Text className='ch2-breakdown__label'>政治风险</Text>
            <Text className='ch2-breakdown__value'>{Math.round(result.politicalComponent)} bps</Text>
          </View>
        </View>

        <Text className='output-hint'>
          利差 = 债务溢价 + 财政溢价 + 政治溢价 − ECB干预效应。
          {'< 100bps 安全区，100-300bps 压力区，> 300bps 危机区。'}
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 利差分解</Text>
        <Text className='edu-text'>
          主权利差驱动因素：债务可持续性(每超过60%/GDP贡献3bp/pp) + 财政赤字(每1%贡献25bp) + 政治风险溢价 - 央行干预效应。德拉吉2012年"whatever it takes"承诺让意大利利差从550bp迅速回落。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>
          教材说欧元区一体化降低融资成本，但2011年意大利vs德国10年利差飙至550bp——同一货币区，同一央行，融资成本却天差地别。统一货币没有统一信用风险。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          {'书中用同一框架分析德/法/意/西，忽略北欧vs南欧的结构性差异。建议：\n'}
          {'(1) 按"核心/外围"分层分析\n'}
          {'(2) 加入TARGET2余额作为金融碎片化指标\n'}
          (3) 用sovereign CDS spread替代主权债利差作为更纯粹的信用风险信号——后者剥离了流动性溢价。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=2' })}
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
