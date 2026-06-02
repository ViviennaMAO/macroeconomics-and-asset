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
import MiniChart from '../../components/MiniChart'
import AuctionBoard from '../../components/AuctionBoard'
import { getSeries } from '../../utils/fred'
import type { FredSnapshot } from '../../data/fred-baseline'
import { markOpened, markPredicted } from '../../utils/progress'
import { YIELD_CURVE_HISTORY } from '../../data/recession-indicators'
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

      {/* Yield Curve History Chart */}
      <View className='section'>
        <Text className='section-title'>📉 收益率曲线 60 月历史</Text>
        <MiniChart
          id='ch7-yc-chart'
          type='line'
          data={YIELD_CURVE_HISTORY.map(d => ({ label: d.date.slice(2, 7), value: d.spread }))}
          title='10年-3月利差 (%)'
          threshold={{ value: 0, label: '倒挂线', color: '#ff4757' }}
          showZeroLine
          color='#4a9eff'
          yAxisFormat={(v) => v.toFixed(2)}
        />
        <View className='ch7-chart-note'>
          <Text className='ch7-chart-note-text'>
            历史规律：曲线倒挂后 12-18 月通常衰退。**本轮例外**：2022.07 倒挂，至今 800+ 天，无衰退。
            历史最长记录(2006-07: 360 天 → 2008 GFC)。"狼来了" 还是 "这次不一样"？
          </Text>
        </View>
      </View>

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

      {/* ── 财政部 vs 美联储：三大核心矛盾 ──────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>⚔️ 财政部 vs 美联储：爱恨情仇</Text>
        <Text className='ch7-section-desc'>
          财政部管"花钱借债"，美联储管"印钱收钱"。两者独立运行，却通过国债市场深度纠缠。
        </Text>

        <View className='ch7-versus-card'>
          <View className='ch7-versus-side'>
            <Text className='ch7-versus-icon'>🏛️</Text>
            <Text className='ch7-versus-name'>财政部</Text>
            <Text className='ch7-versus-role'>财政政策 · 发债</Text>
            <View className='ch7-versus-tags'>
              <Text className='ch7-versus-tag'>税收管理</Text>
              <Text className='ch7-versus-tag'>国债发行</Text>
              <Text className='ch7-versus-tag'>支出安排</Text>
            </View>
          </View>
          <View className='ch7-versus-divider'>
            <Text className='ch7-versus-vs'>VS</Text>
          </View>
          <View className='ch7-versus-side'>
            <Text className='ch7-versus-icon'>🏦</Text>
            <Text className='ch7-versus-name'>美联储</Text>
            <Text className='ch7-versus-role'>货币政策 · 利率</Text>
            <View className='ch7-versus-tags'>
              <Text className='ch7-versus-tag'>联邦基金利率</Text>
              <Text className='ch7-versus-tag'>QE / QT</Text>
              <Text className='ch7-versus-tag'>银行监管</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── 矛盾一：供需失衡 ─────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>💥 矛盾一：供需失衡</Text>
        <View className='ch7-conflict-card'>
          <View className='ch7-conflict-row'>
            <View className='ch7-conflict-item ch7-conflict--supply'>
              <Text className='ch7-conflict-arrow'>↑</Text>
              <Text className='ch7-conflict-label'>供给激增</Text>
              <Text className='ch7-conflict-detail'>财政扩张 → 国债发行创新高</Text>
            </View>
            <View className='ch7-conflict-item ch7-conflict--demand'>
              <Text className='ch7-conflict-arrow'>↓</Text>
              <Text className='ch7-conflict-label'>需求收缩</Text>
              <Text className='ch7-conflict-detail'>Fed 缩表 QT → 最大买家退场</Text>
            </View>
          </View>
          <View className='ch7-conflict-result'>
            <Text className='ch7-conflict-result-text'>
              = 债券熊市 47 个月（2020 至今），1976 年以来最长
            </Text>
          </View>
        </View>
        <View className='ch7-data-grid'>
          <View className='ch7-data-item'>
            <Text className='ch7-data-value'>$34T+</Text>
            <Text className='ch7-data-label'>国债总规模</Text>
          </View>
          <View className='ch7-data-item'>
            <Text className='ch7-data-value'>~$1T</Text>
            <Text className='ch7-data-label'>年均赤字(2001-)</Text>
          </View>
          <View className='ch7-data-item'>
            <Text className='ch7-data-value'>$7.2T</Text>
            <Text className='ch7-data-label'>Fed 资产负债表</Text>
          </View>
          <View className='ch7-data-item'>
            <Text className='ch7-data-value'>5.4年</Text>
            <Text className='ch7-data-label'>平均持仓久期</Text>
          </View>
        </View>
      </View>

      {/* ── 矛盾二：利率传导 ─────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>🔗 矛盾二：利率传导链</Text>
        <View className='ch7-chain-card'>
          <View className='ch7-chain-step'>
            <Text className='ch7-chain-num'>1</Text>
            <View className='ch7-chain-content'>
              <Text className='ch7-chain-title'>Fed 加息</Text>
              <Text className='ch7-chain-desc'>联邦基金利率上调（隔夜拆借）</Text>
            </View>
          </View>
          <Text className='ch7-chain-arrow'>↓</Text>
          <View className='ch7-chain-step'>
            <Text className='ch7-chain-num'>2</Text>
            <View className='ch7-chain-content'>
              <Text className='ch7-chain-title'>短端利率跟涨</Text>
              <Text className='ch7-chain-desc'>2Y 国债收益率同步上行</Text>
            </View>
          </View>
          <Text className='ch7-chain-arrow'>↓</Text>
          <View className='ch7-chain-step'>
            <Text className='ch7-chain-num'>3</Text>
            <View className='ch7-chain-content'>
              <Text className='ch7-chain-title'>长端预期重定价</Text>
              <Text className='ch7-chain-desc'>10Y/30Y = 未来短期利率预期 + 期限溢价</Text>
            </View>
          </View>
          <Text className='ch7-chain-arrow'>↓</Text>
          <View className='ch7-chain-step'>
            <Text className='ch7-chain-num'>4</Text>
            <View className='ch7-chain-content'>
              <Text className='ch7-chain-title'>财政部融资成本飙升</Text>
              <Text className='ch7-chain-desc'>利息支出已超国防开支，债务可持续性承压</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── 矛盾三：通胀侵蚀 ─────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>🔥 矛盾三：通胀侵蚀</Text>
        <View className='ch7-inflation-card'>
          <Text className='ch7-inflation-intro'>
            通胀是债券投资者的头号敌人——它从三个维度同时侵蚀债券价值：
          </Text>
          <View className='ch7-inflation-channels'>
            <View className='ch7-inflation-ch'>
              <Text className='ch7-inflation-ch-icon'>💸</Text>
              <Text className='ch7-inflation-ch-title'>购买力侵蚀</Text>
              <Text className='ch7-inflation-ch-desc'>固定票息的实际购买力下降</Text>
            </View>
            <View className='ch7-inflation-ch'>
              <Text className='ch7-inflation-ch-icon'>📈</Text>
              <Text className='ch7-inflation-ch-title'>风险溢价上升</Text>
              <Text className='ch7-inflation-ch-desc'>投资者要求更高收益率补偿</Text>
            </View>
            <View className='ch7-inflation-ch'>
              <Text className='ch7-inflation-ch-icon'>🔮</Text>
              <Text className='ch7-inflation-ch-title'>预期自我强化</Text>
              <Text className='ch7-inflation-ch-desc'>通胀预期推高长端收益率</Text>
            </View>
          </View>
          <View className='ch7-inflation-timeline'>
            <Text className='ch7-inflation-tl-title'>本轮周期的发债策略转变</Text>
            <View className='ch7-inflation-tl-item'>
              <Text className='ch7-inflation-tl-date'>2020-21</Text>
              <Text className='ch7-inflation-tl-text'>通胀初起 → 财政部主发长债锁定低利率</Text>
            </View>
            <View className='ch7-inflation-tl-item'>
              <Text className='ch7-inflation-tl-date'>2022+</Text>
              <Text className='ch7-inflation-tl-text'>通胀持续 → 被迫转向短债，频繁滚动续发</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── 期限溢价 ─────────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>📊 期限溢价 Term Premium</Text>
        <View className='ch7-tp-card'>
          <View className='ch7-tp-formula'>
            <Text className='ch7-tp-formula-text'>
              10Y 收益率 = 未来短期利率预期均值 + 期限溢价
            </Text>
          </View>
          <Text className='ch7-tp-example'>
            例：10Y 收益率 3%，预期短期利率均值 2%，则期限溢价 = 1%
          </Text>
          <View className='ch7-tp-factors'>
            <Text className='ch7-tp-factors-title'>期限溢价的驱动因素</Text>
            <View className='ch7-tp-factor'>
              <Text className='ch7-tp-factor-dot'>●</Text>
              <Text className='ch7-tp-factor-text'>利率风险 — 持有期越长，价格波动越大</Text>
            </View>
            <View className='ch7-tp-factor'>
              <Text className='ch7-tp-factor-dot'>●</Text>
              <Text className='ch7-tp-factor-text'>通胀不确定性 — 未来物价水平难以预测</Text>
            </View>
            <View className='ch7-tp-factor'>
              <Text className='ch7-tp-factor-dot'>●</Text>
              <Text className='ch7-tp-factor-text'>流动性风险 — 长债在压力期更难变现</Text>
            </View>
            <View className='ch7-tp-factor'>
              <Text className='ch7-tp-factor-dot'>●</Text>
              <Text className='ch7-tp-factor-text'>供需结构 — QT 减少需求，赤字增加供给</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── SVB 案例 ─────────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>💀 案例：硅谷银行 (SVB) 崩塌</Text>
        <View className='ch7-case-card'>
          <View className='ch7-case-timeline'>
            <View className='ch7-case-step'>
              <Text className='ch7-case-step-date'>2020-21</Text>
              <Text className='ch7-case-step-text'>SVB 用大量存款买入长期国债和 MBS，锁定"稳健"收益</Text>
            </View>
            <View className='ch7-case-step'>
              <Text className='ch7-case-step-date'>2022</Text>
              <Text className='ch7-case-step-text'>Fed 暴力加息 425bp，长债价格暴跌，SVB 持仓出现巨额浮亏</Text>
            </View>
            <View className='ch7-case-step'>
              <Text className='ch7-case-step-date'>2023.03</Text>
              <Text className='ch7-case-step-text'>被迫折价出售债券 → 亏损 $18 亿 → 挤兑 → 48 小时内倒闭</Text>
            </View>
          </View>
          <View className='ch7-case-lesson'>
            <Text className='ch7-case-lesson-text'>
              教训："无风险"资产 ≠ 无价格风险。持有至到期确实本金无损，但期间的市值波动可以致命——久期风险是教材最低估的风险。
            </Text>
          </View>
        </View>
      </View>

      {/* ── 国债拍卖实时数据 ─────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>🔔 国债拍卖实时数据</Text>
        <Text className='ch7-section-desc'>
          数据直连美国财政部 Fiscal Data API。每场拍卖揭示市场对美债的真实需求，是观察供需关系的最直接窗口。
        </Text>

        {/* 指标解读卡片 */}
        <View className='ch7-metric-guide'>
          <View className='ch7-metric-guide-item'>
            <View className='ch7-metric-guide-head'>
              <Text className='ch7-metric-guide-icon'>💰</Text>
              <Text className='ch7-metric-guide-name'>得标利率 (High Yield)</Text>
            </View>
            <Text className='ch7-metric-guide-desc'>
              最高被接受的投标利率，决定本场拍卖的最终融资成本。
            </Text>
            <View className='ch7-metric-guide-signals'>
              <View className='ch7-signal-row'>
                <Text className='ch7-signal-tag ch7-signal--up'>↑ 上行</Text>
                <Text className='ch7-signal-text'>融资成本上升 → 财政部利息支出增加 → 长端利率压力，股债双杀风险</Text>
              </View>
              <View className='ch7-signal-row'>
                <Text className='ch7-signal-tag ch7-signal--down'>↓ 下行</Text>
                <Text className='ch7-signal-text'>需求回升或避险情绪升温 → 利于债券价格反弹</Text>
              </View>
            </View>
          </View>

          <View className='ch7-metric-guide-item'>
            <View className='ch7-metric-guide-head'>
              <Text className='ch7-metric-guide-icon'>📊</Text>
              <Text className='ch7-metric-guide-name'>投标倍数 (Bid-to-Cover)</Text>
            </View>
            <Text className='ch7-metric-guide-desc'>
              总投标金额 ÷ 实际接受金额。是衡量需求强弱的"温度计"。
            </Text>
            <View className='ch7-btc-scale'>
              <View className='ch7-btc-band ch7-btc-band--weak'>
                <Text className='ch7-btc-range'>{'< 2.0x'}</Text>
                <Text className='ch7-btc-label'>需求疲软</Text>
                <Text className='ch7-btc-impact'>拍卖"尾巴"风险，利率飙升</Text>
              </View>
              <View className='ch7-btc-band ch7-btc-band--ok'>
                <Text className='ch7-btc-range'>2.0-2.5x</Text>
                <Text className='ch7-btc-label'>需求正常</Text>
                <Text className='ch7-btc-impact'>市场平稳消化</Text>
              </View>
              <View className='ch7-btc-band ch7-btc-band--good'>
                <Text className='ch7-btc-range'>{'> 2.5x'}</Text>
                <Text className='ch7-btc-label'>需求强劲</Text>
                <Text className='ch7-btc-impact'>避险情绪+流动性充裕</Text>
              </View>
            </View>
            <Text className='ch7-metric-guide-note'>
              历史警戒线：2023.08 30Y 拍卖 BTC 跌破 2.4x → 长债收益率飙升 30bp，股市单日跌 1.4%。
            </Text>
          </View>

          <View className='ch7-metric-guide-item'>
            <View className='ch7-metric-guide-head'>
              <Text className='ch7-metric-guide-icon'>🌍</Text>
              <Text className='ch7-metric-guide-name'>投资者结构</Text>
            </View>
            <Text className='ch7-metric-guide-desc'>
              不同买家的占比反映需求质量，比 Bid-to-Cover 更能揭示长期趋势。
            </Text>
            <View className='ch7-bidder-types'>
              <View className='ch7-bidder-type'>
                <View className='ch7-bidder-dot ch7-bidder-dot--direct' />
                <View className='ch7-bidder-info'>
                  <Text className='ch7-bidder-name'>直接投标 (Direct)</Text>
                  <Text className='ch7-bidder-desc'>大型投资机构、对冲基金 — 自主参与</Text>
                </View>
              </View>
              <View className='ch7-bidder-type'>
                <View className='ch7-bidder-dot ch7-bidder-dot--indirect' />
                <View className='ch7-bidder-info'>
                  <Text className='ch7-bidder-name'>间接投标 (Indirect)</Text>
                  <Text className='ch7-bidder-desc'>境外央行、外国基金、共同基金 — 通过一级商代投，是海外需求晴雨表</Text>
                </View>
              </View>
              <View className='ch7-bidder-type'>
                <View className='ch7-bidder-dot ch7-bidder-dot--dealer' />
                <View className='ch7-bidder-info'>
                  <Text className='ch7-bidder-name'>一级交易商 (Dealer)</Text>
                  <Text className='ch7-bidder-desc'>20+ 家承销商兜底 — 占比飙升 = 真实需求疲弱的危险信号</Text>
                </View>
              </View>
            </View>
            <Text className='ch7-metric-guide-note'>
              关键观察：间接投标占比 65%+ = 海外需求旺盛；占比连续下滑 = 去美元化压力显现。
            </Text>
          </View>
        </View>

        <AuctionBoard />

        {/* 市场信号解读 */}
        <View className='ch7-signals-card'>
          <Text className='ch7-signals-title'>📡 如何用拍卖数据判读市场？</Text>
          <View className='ch7-signal-scenario'>
            <Text className='ch7-signal-scenario-tag ch7-signal-scenario--bull'>看多债市</Text>
            <Text className='ch7-signal-scenario-text'>
              连续多场 BTC ≥ 2.6x + 间接投标占比 ≥ 65% + 得标利率低于 WI 报价 → 需求强劲，利率有下行空间，利好长债 ETF (TLT/IEF)。
            </Text>
          </View>
          <View className='ch7-signal-scenario'>
            <Text className='ch7-signal-scenario-tag ch7-signal-scenario--bear'>警惕风险</Text>
            <Text className='ch7-signal-scenario-text'>
              BTC 跌破 2.0x + 一级交易商占比 ＞30% + 得标利率高于 WI ("尾巴") → 需求崩盘信号，往往触发长端利率跳升、股债联跌。
            </Text>
          </View>
          <View className='ch7-signal-scenario'>
            <Text className='ch7-signal-scenario-tag ch7-signal-scenario--watch'>结构警告</Text>
            <Text className='ch7-signal-scenario-text'>
              间接投标占比连续 3 场低于 55% → 海外央行减持美债（如 2022 中日抛售），暗示去美元化或汇率干预，影响美元中长期走势。
            </Text>
          </View>
          <View className='ch7-signal-scenario'>
            <Text className='ch7-signal-scenario-tag ch7-signal-scenario--macro'>宏观联动</Text>
            <Text className='ch7-signal-scenario-text'>
              30Y 拍卖最敏感（期限风险最大）；2Y 拍卖反映 Fed 短期利率预期；7Y/10Y 是机构最爱配置的久期。重点关注每月中旬的 10Y/30Y 标售。
            </Text>
          </View>
        </View>
      </View>

      {/* ── 日美对比 ─────────────────────────────────────────────────── */}
      <View className='section'>
        <Text className='section-title'>🇯🇵🇺🇸 日美国债对比：同债不同命</Text>
        <View className='ch7-compare-card'>
          <View className='ch7-compare-header'>
            <Text className='ch7-compare-header-cell'></Text>
            <Text className='ch7-compare-header-cell'>🇺🇸 美国</Text>
            <Text className='ch7-compare-header-cell'>🇯🇵 日本</Text>
          </View>
          <View className='ch7-compare-row'>
            <Text className='ch7-compare-label'>债务/GDP</Text>
            <Text className='ch7-compare-val'>~120%</Text>
            <Text className='ch7-compare-val'>~260%</Text>
          </View>
          <View className='ch7-compare-row'>
            <Text className='ch7-compare-label'>10Y 利率</Text>
            <Text className='ch7-compare-val ch7-compare--high'>~4.5%</Text>
            <Text className='ch7-compare-val ch7-compare--low'>~0.9%</Text>
          </View>
          <View className='ch7-compare-row'>
            <Text className='ch7-compare-label'>通胀预期</Text>
            <Text className='ch7-compare-val'>2-3%</Text>
            <Text className='ch7-compare-val'>~1%</Text>
          </View>
          <View className='ch7-compare-row'>
            <Text className='ch7-compare-label'>央行立场</Text>
            <Text className='ch7-compare-val'>紧缩 QT</Text>
            <Text className='ch7-compare-val'>宽松 YCC</Text>
          </View>
          <View className='ch7-compare-insight'>
            <Text className='ch7-compare-insight-text'>
              日本债务/GDP 是美国两倍多，但利率不到 1/4。关键差异：持续的低通胀 + 央行大量购债。债务规模本身不决定利率——通胀预期和央行政策才是定价核心。
            </Text>
          </View>
        </View>
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
