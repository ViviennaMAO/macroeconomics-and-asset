import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ch10Snapshots } from '../../utils/snapshots'
import { goldFairValue } from '../../utils/formulas'
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

const DEFAULT_PARAMS = ch10Snapshots[0].params

export default function Ch10Page() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  useEffect(() => {
    markOpened(10)
  }, [])

  const result = useMemo(
    () => goldFairValue(params.realRate, params.dxyIndex, params.centralBankBuying),
    [params]
  )

  const { modelPrice, realRateComponent, dxyComponent, cbComponent } = result

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof typeof params>(key: K, value: (typeof params)[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch10Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(10, correct)
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
      ? ch10Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  function formatPrice(val: number): string {
    const rounded = Math.round(val)
    return `$${rounded.toLocaleString('en-US')}`
  }

  function formatComponent(val: number): string {
    const sign = val >= 0 ? '+' : ''
    return `${sign}$${Math.round(val)}`
  }

  function dominantFactor(): string {
    const abs = [
      { name: '实际利率', val: Math.abs(realRateComponent) },
      { name: '美元指数', val: Math.abs(dxyComponent) },
      { name: '央行购金', val: Math.abs(cbComponent) },
    ]
    abs.sort((a, b) => b.val - a.val)
    return abs[0].name
  }

  return (
    <ScrollView className='ch10-page' scrollY>
      {/* Header */}
      <View className='page-header ch10-header'>
        <Text className='page-title'>🏅 黄金多因子模拟器</Text>
        <Text className='page-meta'>第 10 章 · 大宗商品：黄金</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch10Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='实际利率'
          value={params.realRate}
          min={-3}
          max={5}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('realRate', v)}
        />
        <SliderRow
          label='美元指数'
          value={params.dxyIndex}
          min={80}
          max={120}
          step={0.5}
          unit=''
          onChange={(v) => updateParam('dxyIndex', v)}
        />
        <SliderRow
          label='央行购金量'
          value={params.centralBankBuying}
          min={0}
          max={1500}
          step={50}
          unit='吨/年'
          onChange={(v) => updateParam('centralBankBuying', v)}
        />
      </View>

      {/* Output */}
      <View className={`output${flash ? ' flash' : ''}`}>
        <View className='output-row'>
          <View>
            <Text className='output-label'>黄金模型价格</Text>
            <Text className='output-big ch10-val--gold'>{formatPrice(modelPrice)}</Text>
          </View>
          <View className='ch10-secondary'>
            <Text className='output-label'>主导因子：{dominantFactor()}</Text>
          </View>
        </View>

        {/* Factor Decomposition */}
        <View className='ch10-decomp'>
          <Text className='output-label'>因子贡献分解</Text>
          <View className='ch10-factor-row'>
            <View className='ch10-factor-item'>
              <Text className='ch10-factor-label'>实际利率</Text>
              <Text className={`ch10-factor-val ${realRateComponent >= 0 ? 'ch10-val--pos' : 'ch10-val--neg'}`}>
                {formatComponent(realRateComponent)}
              </Text>
            </View>
            <View className='ch10-factor-item'>
              <Text className='ch10-factor-label'>美元指数</Text>
              <Text className={`ch10-factor-val ${dxyComponent >= 0 ? 'ch10-val--pos' : 'ch10-val--neg'}`}>
                {formatComponent(dxyComponent)}
              </Text>
            </View>
            <View className='ch10-factor-item'>
              <Text className='ch10-factor-label'>央行购金</Text>
              <Text className={`ch10-factor-val ${cbComponent >= 0 ? 'ch10-val--pos' : 'ch10-val--neg'}`}>
                {formatComponent(cbComponent)}
              </Text>
            </View>
          </View>
          <View className='ch10-base-row'>
            <Text className='ch10-base-label'>基准价 $2,000 + 各因子贡献 = {formatPrice(modelPrice)}</Text>
          </View>
        </View>

        <Text className='output-hint'>
          实际利率 {params.realRate}%（每+1% → -$300），美元指数 {params.dxyIndex}（每偏离100 → ±$10），央行购金 {params.centralBankBuying} 吨/年（每吨 → +$0.5）。主导因子：{dominantFactor()}。
        </Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 多因子模型</Text>
        <Text className='edu-text'>
          {'Gold = f(实际利率, 美元, 央行购金)\n\n'}
          {'模型：价格 = 2000 − 300×r_real − (DXY−100)×10 + CB×0.5\n\n'}
          传统单因子模型（r=-0.6与实际利率）只解释了36%的金价变动。本模型加入美元指数（汇率竞争效应）和央行购金量（结构性需求），三因子联合解释力显著提升。实际利率代表持有成本：利率越高，不生息的黄金机会成本越大。美元走强压制以美元计价的黄金。央行购金是2022年后的新主导因子。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期：央行购金重写定价逻辑</Text>
        <Text className='edu-text'>
          {'2022-24实际利率从-1%升至+2%，金价从$1800涨到$2400——R²=0.36的单因子模型彻底失灵。\n\n'}
          中国、印度、土耳其央行年购金量从300吨飙至1050吨，成为新主导因子。新兴市场央行正系统性地将储备多元化：不依赖SWIFT、不怕制裁冻结、不受Fed利率周期干扰。这是美元信用体系裂缝的早期信号——去美元化驱动的结构性需求，不在任何传统利率模型里。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          {'书中过度依赖单因子（实际利率），R²=0.36意味着64%变动无法解释。\n\n'}
          {'建议：\n'}
          {'(1) 加入央行购金、地缘风险指数（GPR）、crypto替代效应\n'}
          {'(2) 用动态因子模型——允许因子权重随时间变化（2022前利率主导，2022后购金主导）\n'}
          (3) 区分"避险"需求和"去美元化"需求——后者是2022后的结构性变化，前者是周期性的。混合两种需求会导致模型在不同宏观环境下预测方向相反，降低实用价值。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=10' })}
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
