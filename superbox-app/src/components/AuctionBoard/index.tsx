import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface AuctionRecord {
  cusip: string
  type: string
  term: string
  auctionDate: string
  offeringAmt: number
  highYield: number | null
  bidToCover: number | null
  allocPct: number | null
  directPct: number | null
  indirectPct: number | null
  dealerPct: number | null
  intRate: number | null
  status: 'announced' | 'completed'
}

const API_BASE =
  'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query'

const FIELDS = [
  'cusip', 'security_type', 'security_term', 'auction_date',
  'offering_amt', 'int_rate', 'high_yield', 'bid_to_cover_ratio',
  'allocation_pctage', 'direct_bidder_accepted',
  'indirect_bidder_accepted', 'primary_dealer_accepted',
  'total_accepted',
].join(',')

function pct(accepted: string, total: string): number | null {
  const a = parseFloat(accepted)
  const t = parseFloat(total)
  if (!t || isNaN(a) || isNaN(t)) return null
  return (a / t) * 100
}

function parseNum(v: string): number | null {
  if (!v || v === 'null') return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function fmtAmt(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  return `$${v}`
}

export default function AuctionBoard() {
  const [records, setRecords] = useState<AuctionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'completed' | 'upcoming'>('completed')

  useEffect(() => {
    fetchAuctions()
  }, [])

  async function fetchAuctions() {
    setLoading(true)
    setError(null)
    try {
      // Fetch most recent 80 auction records, then filter client-side to avoid URL encoding issues
      const res: any = await Taro.request({
        url: API_BASE,
        data: {
          sort: '-auction_date',
          'page[size]': 80,
          format: 'json',
          fields: FIELDS,
        },
        method: 'GET',
      })

      const rawData = res?.data?.data || []
      if (rawData.length === 0) {
        setError('API 返回空数据')
        setRecords([])
        return
      }

      const all = rawData
        .filter((d: any) => d.security_type === 'Note' || d.security_type === 'Bond')
        .map((d: any) => {
          const btc = parseNum(d.bid_to_cover_ratio)
          return toRecord(d, btc !== null && btc > 0 ? 'completed' : 'announced')
        })

      setRecords(all)
    } catch (e: any) {
      setError(e?.errMsg || e?.message || '请求失败')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  function toRecord(d: any, status: 'announced' | 'completed'): AuctionRecord {
    const totalAccepted = parseNum(d.total_accepted) || 0
    return {
      cusip: d.cusip,
      type: d.security_type,
      term: d.security_term,
      auctionDate: d.auction_date,
      offeringAmt: parseNum(d.offering_amt) || 0,
      highYield: parseNum(d.high_yield),
      bidToCover: parseNum(d.bid_to_cover_ratio),
      allocPct: parseNum(d.allocation_pctage),
      directPct: totalAccepted ? pct(d.direct_bidder_accepted, d.total_accepted) : null,
      indirectPct: totalAccepted ? pct(d.indirect_bidder_accepted, d.total_accepted) : null,
      dealerPct: totalAccepted ? pct(d.primary_dealer_accepted, d.total_accepted) : null,
      intRate: parseNum(d.int_rate),
      status,
    }
  }

  const completedList = records
    .filter((r) => r.status === 'completed')
    .sort((a, b) => b.auctionDate.localeCompare(a.auctionDate))
    .slice(0, 12)

  const upcomingList = records
    .filter((r) => r.status === 'announced')
    .sort((a, b) => b.auctionDate.localeCompare(a.auctionDate))
    .slice(0, 8)

  const displayList = tab === 'completed' ? completedList : upcomingList

  // Compute aggregate snapshot signals from latest completed auctions
  const recent = completedList.slice(0, 5)
  const avgBtc = recent.length
    ? recent.reduce((s, r) => s + (r.bidToCover || 0), 0) / recent.length
    : null
  const avgIndirect = recent.length
    ? recent.filter(r => r.indirectPct !== null).reduce((s, r) => s + (r.indirectPct || 0), 0) /
      Math.max(1, recent.filter(r => r.indirectPct !== null).length)
    : null

  return (
    <View className='auction-board'>
      <View className='auction-board__tabs'>
        <Text
          className={`auction-board__tab ${tab === 'completed' ? 'auction-board__tab--active' : ''}`}
          onClick={() => setTab('completed')}
        >
          最近拍卖结果
        </Text>
        <Text
          className={`auction-board__tab ${tab === 'upcoming' ? 'auction-board__tab--active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          即将拍卖
        </Text>
      </View>

      {loading ? (
        <View className='auction-board__loading'>
          <Text className='auction-board__loading-text'>⏳ 加载中...</Text>
        </View>
      ) : displayList.length === 0 ? (
        <View className='auction-board__loading'>
          <Text className='auction-board__loading-text'>
            {error ? `⚠️ ${error}` : '暂无数据'}
          </Text>
          <Text className='auction-board__retry' onClick={fetchAuctions}>点击重试</Text>
        </View>
      ) : (
        <>
          {/* Aggregate signal summary for completed tab */}
          {tab === 'completed' && avgBtc !== null && (
            <View className='auction-board__summary'>
              <View className='auction-board__summary-item'>
                <Text className='auction-board__summary-label'>近 5 场平均投标倍数</Text>
                <Text className={`auction-board__summary-value ${avgBtc >= 2.5 ? 'auction-board__summary--good' : avgBtc >= 2.0 ? 'auction-board__summary--ok' : 'auction-board__summary--weak'}`}>
                  {avgBtc.toFixed(2)}x
                </Text>
                <Text className='auction-board__summary-hint'>
                  {avgBtc >= 2.5 ? '需求强劲' : avgBtc >= 2.0 ? '需求平稳' : '需求疲软⚠️'}
                </Text>
              </View>
              {avgIndirect !== null && (
                <View className='auction-board__summary-item'>
                  <Text className='auction-board__summary-label'>境外&基金占比</Text>
                  <Text className='auction-board__summary-value'>{avgIndirect.toFixed(0)}%</Text>
                  <Text className='auction-board__summary-hint'>
                    {avgIndirect >= 65 ? '海外需求旺盛' : avgIndirect >= 55 ? '海外需求正常' : '海外需求偏弱⚠️'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <ScrollView scrollY className='auction-board__list' style={{ maxHeight: '480px' }}>
            {displayList.map((r) => (
              <View key={r.cusip} className='auction-item'>
                <View className='auction-item__header'>
                  <View className='auction-item__term-wrap'>
                    <Text className={`auction-item__type-badge auction-item__type-badge--${r.type.toLowerCase()}`}>
                      {r.type}
                    </Text>
                    <Text className='auction-item__term'>{r.term}</Text>
                  </View>
                  <Text className='auction-item__date'>{r.auctionDate}</Text>
                </View>

                {tab === 'completed' ? (
                  <View className='auction-item__metrics'>
                    <View className='auction-item__metric'>
                      <Text className='auction-item__metric-label'>得标利率</Text>
                      <Text className='auction-item__metric-value auction-item__metric--yield'>
                        {r.highYield !== null ? `${r.highYield.toFixed(3)}%` : '—'}
                      </Text>
                    </View>
                    <View className='auction-item__metric'>
                      <Text className='auction-item__metric-label'>投标倍数</Text>
                      <Text className={`auction-item__metric-value ${(r.bidToCover || 0) >= 2.5 ? 'auction-item__metric--good' : (r.bidToCover || 0) >= 2.0 ? 'auction-item__metric--ok' : 'auction-item__metric--weak'}`}>
                        {r.bidToCover !== null ? `${r.bidToCover.toFixed(2)}x` : '—'}
                      </Text>
                    </View>
                    <View className='auction-item__metric'>
                      <Text className='auction-item__metric-label'>发行规模</Text>
                      <Text className='auction-item__metric-value'>
                        {fmtAmt(r.offeringAmt)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className='auction-item__metrics'>
                    <View className='auction-item__metric'>
                      <Text className='auction-item__metric-label'>发行规模</Text>
                      <Text className='auction-item__metric-value'>{fmtAmt(r.offeringAmt)}</Text>
                    </View>
                    <View className='auction-item__metric'>
                      <Text className='auction-item__metric-label'>票息率</Text>
                      <Text className='auction-item__metric-value'>
                        {r.intRate !== null ? `${r.intRate.toFixed(3)}%` : '待定'}
                      </Text>
                    </View>
                    <View className='auction-item__metric'>
                      <Text className='auction-item__metric-label'>状态</Text>
                      <Text className='auction-item__metric-value auction-item__metric--upcoming'>预告</Text>
                    </View>
                  </View>
                )}

                {tab === 'completed' && (r.directPct !== null || r.indirectPct !== null) && (
                  <View className='auction-item__bidders'>
                    <View className='auction-item__bar-track'>
                      {r.directPct !== null && r.directPct > 0 && (
                        <View className='auction-item__bar-seg auction-item__bar--direct' style={{ width: `${r.directPct}%` }} />
                      )}
                      {r.indirectPct !== null && r.indirectPct > 0 && (
                        <View className='auction-item__bar-seg auction-item__bar--indirect' style={{ width: `${r.indirectPct}%` }} />
                      )}
                      {r.dealerPct !== null && r.dealerPct > 0 && (
                        <View className='auction-item__bar-seg auction-item__bar--dealer' style={{ width: `${r.dealerPct}%` }} />
                      )}
                    </View>
                    <View className='auction-item__bar-legend'>
                      <Text className='auction-item__legend-item auction-item__legend--direct'>
                        直接 {r.directPct?.toFixed(0)}%
                      </Text>
                      <Text className='auction-item__legend-item auction-item__legend--indirect'>
                        间接 {r.indirectPct?.toFixed(0)}%
                      </Text>
                      <Text className='auction-item__legend-item auction-item__legend--dealer'>
                        一级 {r.dealerPct?.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <Text className='auction-board__footer'>
        数据来源：U.S. Treasury Fiscal Data API · 实时更新
      </Text>
    </View>
  )
}
