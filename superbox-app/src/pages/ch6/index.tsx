import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch6Snapshots } from '../../utils/snapshots'
import { dollarDualFactor } from '../../utils/formulas'
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

const DEFAULT_PARAMS = ch6Snapshots[0].params

export default function Ch6Page() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(6)
  }, [])

  const result = useMemo(
    () =>
      dollarDualFactor(
        params.usGrowth,
        params.globalGrowth,
        params.usInflation,
        params.globalInflation
      ),
    [params]
  )

  const { compositeIndex, realFactor, nominalFactor } = result
  const isStrong = compositeIndex >= 100

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof typeof params>(key: K, value: (typeof params)[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch6Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(6, correct)
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
      ? ch6Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  const indexLabel = isStrong ? '强美元' : '弱美元'

  return (
    <ScrollView className='ch6-page' scrollY>
      {/* Header */}
      <View className='page-header ch6-header'>
        <Text className='page-title'>💵 美元双因子模拟器</Text>
        <Text className='page-meta'>第 6 章 · 美元周期</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch6Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* ── 美元看板跳转入口 ── */}
      <View
        className='ch6-dashboard-banner'
        onClick={() => {
          Taro.navigateTo({ url: '/pages/subscribe/index?monitor=usd' })
        }}
      >
        <View className='ch6-dashboard-banner__left'>
          <Text className='ch6-dashboard-banner__icon'>💱</Text>
          <View>
            <Text className='ch6-dashboard-banner__title'>美元看板</Text>
            <Text className='ch6-dashboard-banner__desc'>实时汇率 · DXY走势 · 全球美元流动性</Text>
          </View>
        </View>
        <View className='ch6-dashboard-banner__right'>
          <Text className='ch6-dashboard-banner__price'>30 EDS</Text>
          <Text className='ch6-dashboard-banner__arrow'>›</Text>
        </View>
      </View>

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='美国增长率'
          value={params.usGrowth}
          min={-5}
          max={8}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('usGrowth', v)}
        />
        <SliderRow
          label='全球增长率'
          value={params.globalGrowth}
          min={-3}
          max={8}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('globalGrowth', v)}
        />
        <SliderRow
          label='美国通胀率'
          value={params.usInflation}
          min={-1}
          max={12}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('usInflation', v)}
        />
        <SliderRow
          label='全球通胀率'
          value={params.globalInflation}
          min={-1}
          max={12}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('globalInflation', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>美元指数模拟值</Text>
            <Text className={`output-big${isStrong ? ' ch6-val--strong' : ' ch6-val--weak'}`}>
              {compositeIndex.toFixed(1)}
            </Text>
            <Text className={`ch6-status-badge${isStrong ? ' ch6-status--strong' : ' ch6-status--weak'}`}>
              {indexLabel}
            </Text>
          </View>
          <View className='ch6-secondary'>
            <View className='ch6-factor-block'>
              <Text className='output-label'>实际因子</Text>
              <Text className={`ch6-factor-value${realFactor >= 0 ? ' ch6-val--strong' : ' ch6-val--weak'}`}>
                {realFactor >= 0 ? '+' : ''}{realFactor.toFixed(2)}pp
              </Text>
            </View>
            <View className='ch6-factor-block ch6-factor-block--bottom'>
              <Text className='output-label'>名义因子</Text>
              <Text className={`ch6-factor-value${nominalFactor >= 0 ? ' ch6-val--strong' : ' ch6-val--weak'}`}>
                {nominalFactor >= 0 ? '+' : ''}{nominalFactor.toFixed(2)}pp
              </Text>
            </View>
          </View>
        </View>
        <Text className='output-hint'>
          模拟值 = 100 + 实际因子×3 + 名义因子×1.5。{'>'} 100 为强美元，{'<'} 100 为弱美元。当前增长差 {realFactor.toFixed(2)}pp，通胀差 {nominalFactor.toFixed(2)}pp。
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 双因子模型</Text>
        <Text className='edu-text'>
          {'实际因子 = 美国增长率 - 全球增长率\n名义因子 = 美国通胀率 - 全球通胀率\n指数 = 100 + 实际因子×3 + 名义因子×1.5\n\n'}
          实际因子驱动实际汇率（购买力平价视角）：若美国经济相对全球更强，资本流入推升美元。名义因子驱动价格水平（相对价格视角）：通胀差异通过利差预期影响汇率。权重3:1.5反映实际增长对汇率的主导性更强。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期：2014-16 美国放缓但美元涨25%</Text>
        <Text className='edu-text'>
          2014-16年美国增长放缓但美元指数暴涨25%——不是美国强，是ECB/BOJ QE让别人更弱。"相对宽松差"才是真正驱动力：欧洲和日本超级宽松制造了巨大利差，资本流入美元资产。双因子模型里，增长差只是分子，政策差才是放大器——这一维度在静态模型中完全缺失。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          双因子模型 R² 仅 0.4-0.5，遗漏避险需求/石油美元循环。且用线性模型拟合非线性汇率——美元在危机时期有"避险溢价"跳升，在稳定期则遵循利差逻辑，两个截然不同的 regime 用同一组系数估计必然失真。建议补充分位数回归（捕捉尾部行为）或 Markov regime-switching 模型，并加入美联储资产负债表增速作为第三因子。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=6' })}
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
