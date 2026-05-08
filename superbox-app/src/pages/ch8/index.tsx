import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import SnapshotBar from '../../components/SnapshotBar'
import SliderRow from '../../components/SliderRow'
import PredictModal from '../../components/PredictModal'
import RevealModal from '../../components/RevealModal'
import { markOpened, markPredicted } from '../../utils/progress'
import { ch8Snapshots, type Ch8Params } from '../../utils/snapshots'
import { mag7Concentration } from '../../utils/formulas'
import './index.scss'

type ModalState =
  | { kind: 'none' }
  | { kind: 'predict'; snapshotKey: string }
  | { kind: 'reveal'; snapshotKey: string }

const DEFAULT_PARAMS = ch8Snapshots[0].params

export default function Ch8Page() {
  const [params, setParams] = useState<Ch8Params>(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })

  useEffect(() => {
    markOpened(8)
  }, [])

  const result = useMemo(
    () => mag7Concentration(params.mag7Weight, params.mag7Return, params.restReturn),
    [params]
  )

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof Ch8Params>(key: K, value: Ch8Params[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function loadSnapshot(key: string) {
    const snap = ch8Snapshots.find((s) => s.key === key)
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
    markPredicted(8, correct)
    const snap = ch8Snapshots.find((s) => s.key === modal.snapshotKey)
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
      ? ch8Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  const indexPositive = result.indexReturn > 0
  const concentrationHigh = Math.abs(result.concentrationRatio) > 60

  return (
    <ScrollView className='ch8-page' scrollY>
      {/* Header */}
      <View className='page-header ch8-header'>
        <Text className='page-title'>📈 Mag7 集中度模拟器</Text>
        <Text className='page-meta'>第 8 章 · 美股分析框架</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch8Snapshots}
        activeKey={activeKey}
        onSelect={loadSnapshot}
      />

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='Mag7 占S&P 500 权重'
          value={params.mag7Weight}
          min={5}
          max={50}
          step={1}
          unit='%'
          onChange={(v) => updateParam('mag7Weight', v)}
        />
        <SliderRow
          label='Mag7 年回报'
          value={params.mag7Return}
          min={-50}
          max={150}
          step={1}
          unit='%'
          onChange={(v) => updateParam('mag7Return', v)}
        />
        <SliderRow
          label='剩余493股回报'
          value={params.restReturn}
          min={-30}
          max={50}
          step={0.5}
          unit='%'
          onChange={(v) => updateParam('restReturn', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>S&P 500 指数回报</Text>
            <Text className={`output-big ${indexPositive ? 'ch8-val--positive' : 'ch8-val--negative'}`}>
              {result.indexReturn.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* 3-column breakdown */}
        <View className='ch8-breakdown'>
          <View className='ch8-stat-col'>
            <Text className='output-label'>Mag7 贡献</Text>
            <Text className='output-stat ch8-stat--amber'>
              {result.mag7Contribution.toFixed(2)} pp
            </Text>
          </View>
          <View className='ch8-stat-col'>
            <Text className='output-label'>493股贡献</Text>
            <Text className='output-stat'>
              {result.restContribution.toFixed(2)} pp
            </Text>
          </View>
          <View className='ch8-stat-col'>
            <Text className='output-label'>Mag7主导度</Text>
            <Text className={`output-stat ${concentrationHigh ? 'ch8-stat--alert' : ''}`}>
              {Math.abs(result.concentrationRatio).toFixed(0)}%
            </Text>
          </View>
        </View>

        <Text className='output-hint'>
          {`S&P 500 = Mag7权重(${params.mag7Weight}%) × Mag7回报(${params.mag7Return}%) + 剩余权重(${(100 - params.mag7Weight).toFixed(0)}%) × 剩余回报(${params.restReturn}%)`}
          {concentrationHigh ? '。当前Mag7主导度超过60%，指数已近似"7股指数"。' : ''}
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 集中度分解</Text>
        <Text className='edu-text'>
          {'S&P 500回报 = Mag7权重×Mag7回报 + 剩余权重×剩余回报。当Mag7权重达30%(2024年实际值)且回报远超大盘，"美股"就变成了"7股"。等权重指数(SPY equal weight)2023年仅涨14% vs 加权26%——12pp分化历史罕见。'}
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>
          {'2023年S&P 500涨26%，但去掉Mag7后剩余493只股票合计回报接近0%——单只指数60%涨幅来自7只股票。教材的"美股分析"在指数级集中度下变成"7只股票分析"。'}
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          {'书中PE分析用历史均值回归假设，但2010后科技股结构性推高PE中枢(15x→22x)。建议：(1) 区分科技vs非科技PE分别建模 (2) 用equity risk premium (ERP)替代简单PE均值——ERP用Damodaran逐月更新的市场隐含模型 (3) 加入buyback yield——美股回购量已超分红，传统PE估值需调整。'}
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=8' })}
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
