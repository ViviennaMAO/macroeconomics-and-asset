import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch3Snapshots, type Ch3Params } from '../../utils/snapshots'
import { yenInflation } from '../../utils/formulas'
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

const DEFAULT_PARAMS = ch3Snapshots[0].params

export default function Ch3Page() {
  const [params, setParams] = useState<Ch3Params>(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(3)
  }, [])

  const result = useMemo(
    () =>
      yenInflation(
        params.usdJpy,
        params.oilPrice,
        params.wageGrowth,
        params.importShare
      ),
    [params]
  )

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof Ch3Params>(key: K, value: Ch3Params[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch3Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(3, correct)
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
      ? ch3Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  const cpi = result.headlineCpi
  const cpiColor =
    cpi >= 1.5 && cpi <= 3 ? 'cpi--green' : 'cpi--red'

  return (
    <ScrollView className='ch3-page' scrollY>
      {/* Header */}
      <View className='page-header'>
        <Text className='page-title'>🇯🇵 日元-通胀传导模拟器</Text>
        <Text className='page-meta'>第 3 章 · 日本经济分析框架</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch3Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='USD/JPY'
          value={params.usdJpy}
          min={80}
          max={200}
          step={1}
          unit=''
          onChange={(v) => updateParam('usdJpy', v)}
        />
        <SliderRow
          label='油价'
          value={params.oilPrice}
          min={20}
          max={200}
          step={1}
          unit='$/桶'
          onChange={(v) => updateParam('oilPrice', v)}
        />
        <SliderRow
          label='工资增速'
          value={params.wageGrowth}
          min={-2}
          max={8}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('wageGrowth', v)}
        />
        <SliderRow
          label='进口占CPI权重'
          value={params.importShare}
          min={10}
          max={40}
          step={1}
          unit='%'
          onChange={(v) => updateParam('importShare', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>Headline CPI同比</Text>
            <Text className={`output-big ${cpiColor}`}>
              {cpi.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View className='ch3-breakdown'>
          <View className='ch3-breakdown__item'>
            <Text className='ch3-breakdown__label'>Core CPI</Text>
            <Text className='ch3-breakdown__value'>{result.coreCpi.toFixed(2)}%</Text>
          </View>
          <View className='ch3-breakdown__item'>
            <Text className='ch3-breakdown__label'>FX传导</Text>
            <Text className='ch3-breakdown__value'>{result.fxComponent.toFixed(2)}pp</Text>
          </View>
          <View className='ch3-breakdown__item'>
            <Text className='ch3-breakdown__label'>油价传导</Text>
            <Text className='ch3-breakdown__value'>{result.oilComponent.toFixed(2)}pp</Text>
          </View>
          <View className='ch3-breakdown__item'>
            <Text className='ch3-breakdown__label'>工资贡献</Text>
            <Text className='ch3-breakdown__value'>{result.wageComponent.toFixed(2)}pp</Text>
          </View>
        </View>

        <Text className='output-hint'>
          目标区间 1.5-3%（绿色），超出范围（红色）。
          {'基准 USD/JPY=110，偏离越大，FX传导越强。'}
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 传导链路</Text>
        <Text className='edu-text'>
          日本通胀 = 工资×0.4 + 汇率传导×进口权重×0.6 + 油价冲击。日本核心CPI对汇率敏感度比美国高3倍，因为日本是能源/原材料净进口国，import share 25-30%。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>
          教材说QQE失败因"流动性陷阱"，但2022-24日元贬50%(USD/JPY 110→161)后，核心CPI终于稳定突破2%。BOJ 2024年7月加息结束负利率——汇率才是打破通缩的真武器，不是货币基数。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          {'书中用Phillips曲线分析日本通胀，但日本Phillips曲线1995后已平坦化(R²<0.1)。建议：\n'}
          {'(1) 用非线性Phillips或threshold model\n'}
          {'(2) 直接建模通胀预期锚定\n'}
          (3) 加入汇率作为关键解释变量——日本央行模型2024后已正式加入汇率传导项。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=3' })}
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
