import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { ch7Snapshots } from '../../utils/snapshots'
import { bondPrice, modifiedDuration } from '../../utils/formulas'
import SnapshotBar from '../../components/SnapshotBar'
import SliderRow from '../../components/SliderRow'
import PredictModal from '../../components/PredictModal'
import RevealModal from '../../components/RevealModal'
import LiveData from '../../components/LiveData'
import { getSeries } from '../../utils/fred'
import type { FredSnapshot } from '../../data/fred-baseline'
import { markOpened, markPredicted } from '../../utils/progress'
import './index.scss'

type ModalState =
  | { type: 'none' }
  | { type: 'predict'; snapshotKey: string }
  | { type: 'reveal'; snapshotKey: string }

const DEFAULT_PARAMS = ch7Snapshots[0].params

export default function Ch7Page() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined)
  const [flash, setFlash] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const userEdited = useRef(false)

  useEffect(() => {
    markOpened(7)
  }, [])

  const price = useMemo(
    () => bondPrice(params.faceValue, params.couponRate, params.ytm, params.years),
    [params]
  )

  const duration = useMemo(
    () => modifiedDuration(params.faceValue, params.couponRate, params.ytm, params.years),
    [params]
  )

  // Price change estimate for +1% rate rise: ΔP/P ≈ -ModDuration × Δy
  const priceChangePct = useMemo(() => -duration * 0.01 * 100, [duration])

  const isPremium = price > params.faceValue
  const isDiscount = price < params.faceValue
  const priceDiff = price - params.faceValue
  const priceDiffPct = params.faceValue > 0 ? (priceDiff / params.faceValue) * 100 : 0

  function triggerFlash() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }

  function updateParam<K extends keyof typeof params>(key: K, value: (typeof params)[K]) {
    userEdited.current = true
    setParams((prev) => ({ ...prev, [key]: value }))
    triggerFlash()
  }

  function handleSnapshotSelect(key: string) {
    const snapshot = ch7Snapshots.find((s) => s.key === key)
    if (!snapshot) return
    setParams(snapshot.params)
    setActiveKey(key)
    triggerFlash()
    if (snapshot.predict) {
      setModal({ type: 'predict', snapshotKey: key })
    }
  }

  function handlePredictAnswer(correct: boolean) {
    markPredicted(7, correct)
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
      ? ch7Snapshots.find((s) => s.key === modal.snapshotKey)
      : undefined

  // Price status label
  const priceStatusLabel = isPremium
    ? `溢价 +${priceDiffPct.toFixed(2)}%`
    : isDiscount
    ? `折价 ${priceDiffPct.toFixed(2)}%`
    : '平价'

  const priceHint = isPremium
    ? `票息率(${params.couponRate}%) > YTM(${params.ytm}%)，债券以溢价交易。购买者为高票息支付额外溢价，到期按面值偿还，总回报收敛至YTM。`
    : isDiscount
    ? `票息率(${params.couponRate}%) < YTM(${params.ytm}%)，债券以折价交易。低票息由资本利得补偿，持有至到期总回报仍等于YTM。`
    : `票息率等于YTM，债券以面值平价交易。`

  return (
    <ScrollView className='ch7-page' scrollY>
      {/* Header */}
      <View className='page-header ch7-header'>
        <Text className='page-title'>📊 美国国债定价模拟器</Text>
        <Text className='page-meta'>第 7 章 · 美国国债</Text>
      </View>

      {/* Snapshot Bar */}
      <SnapshotBar
        items={ch7Snapshots}
        activeKey={activeKey}
        onSelect={handleSnapshotSelect}
      />

      {/* Live FRED Data */}
      <LiveData
        title='📡 当前美债市场'
        autoRefresh
        tiles={[
          { id: 'DGS2',         hint: '2年期' },
          { id: 'DGS10',        hint: '10年期' },
          { id: 'DGS30',        hint: '30年期' },
          { id: 'T10Y2Y',       hint: '期限利差' },
          { id: '_spread2s10s', hint: '2s10s bps' },
        ]}
        onLoaded={(freshSnap: FredSnapshot) => {
          const dgs10 = getSeries(freshSnap, 'DGS10')
          if (dgs10 && !userEdited.current) {
            setParams((prev) => ({ ...prev, ytm: dgs10.value }))
          }
        }}
      />

      {/* Slider Inputs */}
      <View className='panel'>
        <Text className='panel-tag'>调整参数</Text>
        <SliderRow
          label='面值'
          value={params.faceValue}
          min={100}
          max={10000}
          step={100}
          unit='$'
          onChange={(v) => updateParam('faceValue', v)}
        />
        <SliderRow
          label='票息率'
          value={params.couponRate}
          min={0}
          max={10}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('couponRate', v)}
        />
        <SliderRow
          label='到期收益率 YTM'
          value={params.ytm}
          min={0}
          max={15}
          step={0.1}
          unit='%'
          onChange={(v) => updateParam('ytm', v)}
        />
        <SliderRow
          label='期限'
          value={params.years}
          min={1}
          max={30}
          step={1}
          unit='年'
          onChange={(v) => updateParam('years', v)}
        />
      </View>

      {/* Output */}
      <View className={`output ch7-output${flash ? ' flash' : ''}`}>
        <View className='ch7-output-primary'>
          <Text className='output-label'>债券价格</Text>
          <Text className={`ch7-price-big${isPremium ? ' ch7-price--premium' : isDiscount ? ' ch7-price--discount' : ' ch7-price--par'}`}>
            ${price.toFixed(2)}
          </Text>
          <View className={`ch7-badge${isPremium ? ' ch7-badge--premium' : isDiscount ? ' ch7-badge--discount' : ' ch7-badge--par'}`}>
            <Text className='ch7-badge-text'>{priceStatusLabel}</Text>
          </View>
        </View>

        <View className='ch7-output-secondary-row'>
          <View className='ch7-secondary-block'>
            <Text className='output-label'>修正久期</Text>
            <Text className='ch7-secondary-value'>
              {duration.toFixed(2)} <Text className='ch7-unit'>年</Text>
            </Text>
          </View>
          <View className='ch7-secondary-block ch7-secondary-block--right'>
            <Text className='output-label'>价格变动估算(利率+1%)</Text>
            <Text className={`ch7-secondary-value${priceChangePct < 0 ? ' ch7-secondary--neg' : ' ch7-secondary--pos'}`}>
              {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
            </Text>
          </View>
        </View>

        <Text className='output-hint'>{priceHint}</Text>
      </View>

      {/* Edu Cards */}
      <View className='edu-card'>
        <Text className='edu-tag'>📐 债券定价公式</Text>
        <Text className='edu-text'>
          {'P = Σ C/(1+y)^t + FV/(1+y)^n\n\n'}
          {'C = 年票息 = 票息率 × 面值；y = YTM；n = 期限年数。\n\n'}
          这正是 NPV 在固定收益中的应用：把每期票息现金流和到期本金偿还全部折现，加总即得债券的公允价值。当 YTM 上升，折现率增大，所有未来现金流的现值同步下降，债券价格随之下跌——这就是利率风险的数学本质。
        </Text>
      </View>

      <View className='edu-card edu-twist'>
        <Text className='edu-tag'>⚡ 反预期</Text>
        <Text className='edu-text'>
          教材说美债利率跟名义GDP走(r=0.7)，2020 GDP年化-31%但10Y利率仅从1.9%降到0.6%。分段检验发现2008后r降至0.3，QE导致结构性断裂。全样本相关系数掩盖了regime change。
        </Text>
      </View>

      <View className='edu-card edu-critique'>
        <Text className='edu-tag'>🔬 方法论批评</Text>
        <Text className='edu-text'>
          书中r=0.7基于1960-2018全样本，但2008后相关性降至0.3。建议：(1)用Chow断裂检验识别结构变化 (2)用滚动5年窗口相关性替代全样本 (3)加入QE购债量作为控制变量。2022年TLT跌31%比股市还惨——久期风险是教材最低估的风险。
        </Text>
      </View>

      {/* Quiz CTA */}
      <View
        className='further-cta'
        onClick={() => Taro.navigateTo({ url: '/pages/quiz/index?ch=7' })}
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
