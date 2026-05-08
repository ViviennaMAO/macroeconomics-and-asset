import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { markQuiz } from '../../utils/progress'
import './index.scss'

type Level = 'recall' | 'apply' | 'analyze' | 'synth'

interface Question {
  id: string
  ch: number
  level: Level
  question: string
  options: [string, string, string, string]
  answer: 0 | 1 | 2 | 3
  explain: string
}

const ALL_QUESTIONS: Question[] = [
  // Ch1 — 美国经济分析框架
  { id: 'ch1-1', ch: 1, level: 'recall', question: 'NPV（净现值）的核心公式是？', options: ['未来现金流之和', '未来现金流折现之和减去初始投资', '终值减现值', 'IRR减WACC'], answer: 1, explain: 'NPV = Σ CFₜ/(1+r)ᵗ − I₀，即折现现金流之和减去初始投资，正值表示创造价值。' },
  { id: 'ch1-2', ch: 1, level: 'apply', question: '美国五大先行指标同时发红灯时，实际结果往往是？', options: ['立即衰退', '经济韧性延续、衰退推迟', '股市大跌', '美元贬值'], answer: 1, explain: '结构性因素（超储蓄、财政刺激）可抵消先行指标悲观信号，出现"假阳性"。' },
  { id: 'ch1-3', ch: 1, level: 'analyze', question: '折现率升高对NPV有何影响？', options: ['NPV增大', 'NPV不变', 'NPV减小', '视现金流正负而定'], answer: 2, explain: '折现率升高使分母增大，每期折现值下降，NPV减小——这是利率上升压制资产估值的根本机制。' },
  { id: 'ch1-4', ch: 1, level: 'apply', question: 'IRR与WACC的关系如何判断投资价值？', options: ['IRR > WACC 表示投资创造价值', 'IRR < WACC 表示投资创造价值', 'IRR = WACC 为最优', 'IRR与WACC无关'], answer: 0, explain: 'IRR > WACC 意味着项目回报超过资本成本，NPV > 0，投资创造价值。' },
  { id: 'ch1-5', ch: 1, level: 'synth', question: '同一个项目可以同时得到"NPV>0""IRR<WACC"的结果吗？', options: ['不可能，两者必然一致', '可能，当现金流出现多次换号时', '可能，当折现率极低时', '取决于项目期限'], answer: 1, explain: '非常规现金流（多次换号）会产生多个IRR，导致IRR判断失效而NPV仍然有效——这正是"同一个NPV三个故事"的来源。' },

  // Ch2 — 欧洲经济分析框架
  { id: 'ch2-1', ch: 2, level: 'recall', question: '欧元区国债利差飙升的根本原因是？', options: ['统一货币但财政各自为政', '欧央行政策失误', '汇率波动', '贸易赤字扩大'], answer: 0, explain: '货币联盟消除了汇率调节，成员国财政状况差异直接反映为利差——德希利差一度破550bp。' },
  { id: 'ch2-2', ch: 2, level: 'analyze', question: '希腊危机期间，德国国债与希腊国债利差扩大说明？', options: ['市场认为两国信用风险趋同', '市场对希腊违约风险定价上升', '欧元区货币政策过紧', '德国经济衰退'], answer: 1, explain: '利差是市场对不同主权信用风险的定价，利差扩大反映市场对希腊债务可持续性的担忧上升。' },
  { id: 'ch2-3', ch: 2, level: 'recall', question: 'OMT（直接货币交易）计划由谁提出，主要目的是？', options: ['美联储；压低通胀', '欧洲央行；无限购买成员国国债以稳定利差', 'IMF；救助希腊', '德国央行；限制欧央行扩表'], answer: 1, explain: '2012年德拉基"不惜一切"演讲后推出OMT，宣布无限购买能力，仅靠预期就成功压缩外围国利差。' },
  { id: 'ch2-4', ch: 2, level: 'apply', question: '南欧国家在欧元区内竞争力下降的主要调整渠道是？', options: ['汇率贬值', '内部贬值（压低工资和价格）', '货币独立发行', '关税壁垒'], answer: 1, explain: '加入欧元区后汇率工具消失，调整只能靠内部贬值——即压低工资、削减成本，代价是高失业和低增长。' },
  { id: 'ch2-5', ch: 2, level: 'synth', question: '欧元区"一刀切"货币政策最核心的矛盾是？', options: ['汇率太稳定', '同一利率面对不同经济周期的成员国', '财政联盟已完成但货币未统一', '美元竞争'], answer: 1, explain: '德国过热时ECB加息、希腊衰退时同样加息——利率政策无法因地制宜，这是货币联盟的内生张力。' },

  // Ch3 — 日本经济分析框架
  { id: 'ch3-1', ch: 3, level: 'recall', question: 'YCC（收益率曲线控制）的目标是什么？', options: ['控制通货膨胀率', '将特定期限国债收益率钉在目标附近', '稳定汇率', '控制信贷增速'], answer: 1, explain: 'YCC由日本央行2016年推出，将10年国债收益率目标设为0%，通过买卖债券维持目标区间。' },
  { id: 'ch3-2', ch: 3, level: 'analyze', question: '日本三十年经济停滞的核心争议是？', options: ['人口老龄化是唯一原因', '流动性陷阱vs汇率传导不足之争', '财政政策过于宽松', '过度储蓄导致资产泡沫'], answer: 1, explain: '一派认为是"流动性陷阱"使货币政策失效；另一派认为汇率贬值幅度不足，未能充分传导至价格。' },
  { id: 'ch3-3', ch: 3, level: 'apply', question: '负利率政策（NIRP）对银行盈利能力的影响是？', options: ['存贷利差扩大，银行受益', '存贷利差压缩，银行盈利承压', '对银行无影响', '银行可通过手续费完全对冲'], answer: 1, explain: '负利率压缩银行净息差，影响其盈利和放贷意愿——这是日本和欧洲负利率实践的副作用之一。' },
  { id: 'ch3-4', ch: 3, level: 'recall', question: 'QQE（质量量化宽松）在传统QE基础上增加了什么？', options: ['购买外国资产', '购买股票ETF和REITs等风险资产', '直接向居民发钱', '负利率'], answer: 1, explain: 'QQE在大规模购债基础上加入ETF和REIT购买，旨在通过财富效应和风险偏好传导刺激经济。' },
  { id: 'ch3-5', ch: 3, level: 'synth', question: '若日元大幅贬值但物价依然未升，最可能的解释是？', options: ['进口商通过压缩利润吸收成本', '汇率传导机制在日本已失效', '日本完全自给自足', 'A和B都有可能'], answer: 3, explain: '汇率传导（Exchange Rate Pass-Through）在日本历史上偏低，进口商选择压缩利润而非提价，导致汇率贬值"漏气"。' },

  // Ch4 — 新兴市场经济分析
  { id: 'ch4-1', ch: 4, level: 'recall', question: '新兴市场资本流动最显著的非对称性是？', options: ['资本流入快、流出慢', '资本流入慢（数季度）、流出快（数天到一周）', '流入流出速度相同', '资本流出受法规限制'], answer: 1, explain: '外资建仓需要基本面改善的积累，撤资却可在美联储加息或风险事件发生后的极短时间内完成。' },
  { id: 'ch4-2', ch: 4, level: 'analyze', question: '"原罪"（Original Sin）在新兴市场融资中指什么？', options: ['历史上的债务违约记录', '无法以本币在国际市场借款，被迫以外币融资', '腐败导致的资本外流', '过度依赖大宗商品出口'], answer: 1, explain: '原罪指新兴市场国家无法发行本币计价国际债券，被迫借美元债，产生汇率-债务双重风险敞口。' },
  { id: 'ch4-3', ch: 4, level: 'apply', question: '美联储加息对新兴市场汇率的传导路径是？', options: ['美债收益率上升→美元吸引力增强→新兴市场资本外流→本币贬值', '美债收益率上升→新兴市场通胀下降→本币升值', '直接影响新兴市场央行利率', '通过贸易渠道降低新兴市场出口'], answer: 0, explain: '美债收益率上升使美元资产吸引力增强，触发资本从新兴市场回流美国，本币贬值压力随之而来。' },
  { id: 'ch4-4', ch: 4, level: 'recall', question: '新兴市场双赤字（Twin Deficits）指？', options: ['财政赤字 + 经常账户赤字', '贸易赤字 + 资本账户赤字', '通胀 + 失业同时高企', '外债 + 内债同时扩大'], answer: 0, explain: '双赤字指财政赤字（政府支出>收入）与经常账户赤字（进口>出口）同时存在，加大外部融资需求和脆弱性。' },
  { id: 'ch4-5', ch: 4, level: 'synth', question: '新兴市场应对美元流动性危机最有效的"防火墙"是？', options: ['降低本币利率', '积累充足外汇储备和签订货币互换协议', '扩大财政赤字', '加强资本管制'], answer: 1, explain: '充足的外汇储备可缓冲资本外流冲击；货币互换（如与美联储的swap line）提供紧急美元流动性。' },

  // Ch5 — 全球分析框架综合
  { id: 'ch5-1', ch: 5, level: 'recall', question: 'G7占全球GDP的比重从高峰到2020年代大约从多少降到多少？', options: ['80%→60%', '65%→43%', '50%→30%', '70%→50%'], answer: 1, explain: 'G7份额从约65%下降到约43%，新兴市场特别是中国崛起深刻改变了全球经济格局。' },
  { id: 'ch5-2', ch: 5, level: 'analyze', question: '全球供应链重构（friend-shoring）对通胀的影响是？', options: ['短期降低通胀', '中长期推高供给成本，形成结构性通胀压力', '通胀中性', '只影响新兴市场通胀'], answer: 1, explain: '将供应链从低成本地区迁移到"友好国家"增加生产成本，形成中长期通胀压力——去全球化存在通胀代价。' },
  { id: 'ch5-3', ch: 5, level: 'apply', question: '全球流动性周期的主驱动力是？', options: ['欧央行政策', '美联储资产负债表扩缩和美元周期', '日本零利率政策', '中国信贷周期'], answer: 1, explain: '美元是全球储备货币，美联储扩表→全球美元流动性宽裕→风险资产上涨；缩表→流动性收紧→新兴市场承压。' },
  { id: 'ch5-4', ch: 5, level: 'recall', question: '商品周期（Commodity Supercycle）最主要的需求驱动是？', options: ['美国消费增长', '新兴市场工业化和城镇化', '欧洲绿色转型', '科技行业扩张'], answer: 1, explain: '新兴市场（尤其中国）大规模工业化和基础设施建设带动了2000年代的大宗商品超级周期。' },
  { id: 'ch5-5', ch: 5, level: 'synth', question: '多极化货币体系对美元霸权的主要挑战来自？', options: ['欧元替代美元的贸易结算', '人民币国际化、黄金储备增持和双边结算协议的合力', '比特币超越美元', '日元升值'], answer: 1, explain: '没有单一货币能快速替代美元，但人民币国际化+央行购金+局部去美元化正在缓慢侵蚀美元主导地位。' },

  // Ch6 — 汇率与货币体系
  { id: 'ch6-1', ch: 6, level: 'recall', question: '美元指数（DXY）主要衡量美元兑哪些货币的表现？', options: ['亚洲六大货币', '欧元、日元、英镑、加元、瑞郎、瑞典克朗（欧元权重最大）', '全球所有贸易伙伴货币等权重', '仅欧元和日元'], answer: 1, explain: 'DXY中欧元权重约57.6%，日元13.6%，英镑11.9%等——欧元区经济状况对DXY影响最大。' },
  { id: 'ch6-2', ch: 6, level: 'analyze', question: '"美元强≠美国强"的核心逻辑是？', options: ['美元升值对美国出口有利', '美元升值损害新兴市场但不一定反映美国经济强劲，可能是避险需求', '美元强时美股必然上涨', '美元强时美国利率必然下降'], answer: 1, explain: '美元有时因全球避险需求上涨（如危机时期），并非源于美国基本面改善——理解美元双重属性是关键。' },
  { id: 'ch6-3', ch: 6, level: 'apply', question: '套息交易（Carry Trade）在美元走强时最可能发生什么？', options: ['套利空间扩大，交易规模增加', '日元/瑞郎等低息融资货币升值，套息仓位被平仓', '新兴市场货币同步升值', '黄金价格上涨'], answer: 1, explain: '美元走强往往伴随风险偏好下降，套息交易者被迫回补融资货币（日元等）导致其急速升值，形成"踩踏"。' },
  { id: 'ch6-4', ch: 6, level: 'recall', question: '购买力平价（PPP）理论的核心假设是？', options: ['资本自由流动', '同质商品在不同国家价格（经汇率换算后）应趋于相等', '利率平价成立', '贸易账户平衡'], answer: 1, explain: 'PPP认为汇率长期应反映两国价格水平之比，"一价定律"是其微观基础。实践中偏差可持续很长时间。' },
  { id: 'ch6-5', ch: 6, level: 'synth', question: '人民币国际化最大的结构性障碍是？', options: ['中国经济体量不够大', '资本账户管制限制了离岸人民币流动性和深度', '人民币汇率波动太大', '贸易体量不足'], answer: 1, explain: '国际储备货币需要开放的资本账户和深度流动的债券市场——中国资本账户管制是人民币国际化的核心约束。' },

  // Ch7 — 股票与债券定价
  { id: 'ch7-1', ch: 7, level: 'recall', question: 'WACC的计算涉及哪两类资本的成本？', options: ['股权成本和债务成本（按市值权重加权）', '短期债务和长期债务', '固定资产和流动资产', '国内资本和外国资本'], answer: 0, explain: 'WACC = Ke×E/(D+E) + Kd×(1-t)×D/(D+E)，综合股权资本和税后债务成本，是折现率的市场参照。' },
  { id: 'ch7-2', ch: 7, level: 'apply', question: '无风险利率上升对股票估值（DCF）有何影响？', options: ['分子现金流增加，估值上升', 'WACC上升，折现率增大，估值下降', '对高增长股影响小于低增长股', '无影响，股票与利率无关'], answer: 1, explain: '无风险利率是WACC的基础，利率升→WACC升→折现率升→未来现金流现值降→DCF估值下降，成长股尤甚。' },
  { id: 'ch7-3', ch: 7, level: 'analyze', question: '久期（Duration）为10年的债券，当收益率上升100bp，价格大约变化多少？', options: ['+10%', '-1%', '-10%', '+1%'], answer: 2, explain: '修正久期约等于价格对利率变动的敏感度：ΔP/P ≈ -Duration × Δy，即-10×0.01 = -10%。' },
  { id: 'ch7-4', ch: 7, level: 'recall', question: '股权风险溢价（ERP）代表什么？', options: ['股票相对于债券的额外回报预期', '公司的财务杠杆水平', 'P/E比率的倒数', '股息收益率'], answer: 0, explain: 'ERP = 股票预期回报率 - 无风险利率，是投资者为承担股票风险要求的补偿，也是判断股票估值贵贱的重要参数。' },
  { id: 'ch7-5', ch: 7, level: 'synth', question: '"利率上升但股市上涨"最可能发生的场景是？', options: ['衰退期间央行降息', '经济高景气、盈利增速超过利率上升对估值的压制', '通胀失控', '汇率大幅贬值'], answer: 1, explain: '当企业盈利增速足够强劲，分子（现金流）的改善超过分母（折现率）上升的负面影响，股市可以在加息中上涨。' },

  // Ch8 — 房地产与另类资产
  { id: 'ch8-1', ch: 8, level: 'recall', question: '房地产投资最重要的收益来源是？', options: ['仅资本增值', '租金收入（Cap Rate收益）+ 资本增值', '政府补贴', '汇率收益'], answer: 1, explain: '房地产总回报 = 租金净收益（NOI/价格 = Cap Rate）+ 资本增值，两者缺一不可。' },
  { id: 'ch8-2', ch: 8, level: 'analyze', question: '当无风险利率上升时，Cap Rate（资本化率）通常会？', options: ['下降，因为房价上涨', '上升，因为无风险利率是Cap Rate的定价基础', '不变', '视地区而定'], answer: 1, explain: 'Cap Rate ≈ 无风险利率 + 风险溢价，无风险利率上升驱动Cap Rate上升，意味着同等NOI对应的房产估值下降。' },
  { id: 'ch8-3', ch: 8, level: 'apply', question: 'REITs（房地产投资信托）相对直接持有房产的主要优势是？', options: ['完全规避风险', '流动性强、门槛低、强制分红', '享有税收豁免', '无杠杆风险'], answer: 1, explain: 'REITs将房产资产证券化，具备股票的流动性，同时美国REITs须将90%应税所得以股息形式分配给投资者。' },
  { id: 'ch8-4', ch: 8, level: 'recall', question: '私募股权（PE）IRR与公开市场回报比较时，最主要的注意事项是？', options: ['PE的IRR未计入管理费', 'PE的IRR受资金时序（timing）影响大，且流动性折价未体现', 'PE收益不含分红', 'PE不使用杠杆'], answer: 1, explain: '由于PE资金分批调用和分批返还，IRR对时序极为敏感；此外非流动性溢价需要额外补偿才公平比较。' },
  { id: 'ch8-5', ch: 8, level: 'synth', question: '另类资产配置对传统股债组合的主要贡献是？', options: ['消除所有风险', '提供低相关性的回报来源，改善组合有效边界', '保证绝对正收益', '提高流动性'], answer: 1, explain: '另类资产（PE、对冲基金、大宗商品等）与股债相关性较低，加入组合可在同等风险下提升预期回报——马科维兹有效边界右移。' },

  // Ch9 — 大宗商品与能源
  { id: 'ch9-1', ch: 9, level: 'recall', question: '原油定价的三种历史范式按时间顺序是？', options: ['OPEC定价→页岩油革命→市场定价', '七姐妹垄断→OPEC卡特尔→市场化定价（页岩油参与）', '市场定价→OPEC定价→政府管制', '美国单边→多边协议→自由市场'], answer: 1, explain: '三种范式：1970年代前七姐妹定价→1973年后OPEC卡特尔定价→2010年代页岩油革命后更接近竞争市场定价。' },
  { id: 'ch9-2', ch: 9, level: 'analyze', question: '页岩油的"边际成本锚"如何限制油价长期中枢？', options: ['OPEC会永久减产支撑价格', '当油价高于页岩油盈亏平衡价，页岩油快速增产压制油价', '美国政府限价', '天然气替代效应'], answer: 1, explain: '页岩油开采周期短（6-18个月），价格高于$55-65时快速扩产，形成对油价的"天花板效应"——范式断裂一。' },
  { id: 'ch9-3', ch: 9, level: 'apply', question: 'Contango（期货升水）和Backwardation（期货贴水）分别意味着什么？', options: ['前者库存充裕；后者供应紧张', '两者均反映供过于求', '前者代表市场预期油价下跌；后者预期上涨且无特殊含义', '均反映OPEC的减产预期'], answer: 0, explain: 'Contango（远期>现货）通常反映库存充裕+持有成本；Backwardation（远期<现货）反映当下供应紧张，即期溢价。' },
  { id: 'ch9-4', ch: 9, level: 'recall', question: '布伦特原油和WTI的主要区别是？', options: ['质量完全相同，仅产地不同', '布伦特为北海轻质低硫原油，代表国际基准；WTI为美国内陆轻质低硫原油，代表美国基准', '布伦特含硫量更高', 'WTI用于OPEC定价'], answer: 1, explain: '布伦特是国际原油贸易基准（约65%国际交易以此定价），WTI是美国市场基准，两者通常价差在±3美元内波动。' },
  { id: 'ch9-5', ch: 9, level: 'synth', question: '大宗商品"超级周期"结束后，均值回归预测下一个底部的核心假设是？', options: ['需求保持不变', '供给长期对价格有弹性，过高价格刺激增产最终压低价格', 'OPEC永远保持减产纪律', '页岩油成本持续下降'], answer: 1, explain: '超级周期的终结源于高价刺激供给扩张（投资增加→产量增加），均值回归成立的前提是市场长期竞争性。' },

  // Ch10 — 黄金与贵金属
  { id: 'ch10-1', ch: 10, level: 'recall', question: '驱动金价的最重要单一因素是？', options: ['美元指数', '实际利率（TIPS收益率）', '通胀预期', 'VIX恐慌指数'], answer: 1, explain: '黄金与美国实际利率（10年TIPS收益率）呈强负相关：实际利率高→持金机会成本高→金价承压；反之亦然。' },
  { id: 'ch10-2', ch: 10, level: 'analyze', question: '"实际利率涨3%，金价反涨33%"这一反常现象最可能发生在？', options: ['经济高景气时期', '货币信任危机或央行大规模购金时期', '美元走强时期', '油价暴跌时期'], answer: 1, explain: '当市场出现系统性信任危机（债务货币化担忧、去美元化），黄金的货币属性驱动需求超越实际利率的抑制作用。' },
  { id: 'ch10-3', ch: 10, level: 'apply', question: '央行购金（Central Bank Gold Buying）对金价的主要影响渠道是？', options: ['降低金矿开采成本', '直接增加实物需求，且央行不为短期价格敏感，形成稳定需求底部', '提高黄金储备的流动性', '降低黄金与美元相关性'], answer: 1, explain: '央行购金构成刚性需求——尤其新兴市场央行去美元化背景下持续购金，为金价提供长期结构性支撑。' },
  { id: 'ch10-4', ch: 10, level: 'recall', question: '黄金在资产配置中的主要功能是？', options: ['高成长资产', '危机对冲资产（负相关于风险资产，正相关于波动率）', '固定收益替代', '外汇储备唯一标准'], answer: 1, explain: '黄金在危机期间与股票等风险资产负相关，在通胀上行时抗通胀，同时与波动率（VIX）正相关——天然对冲工具。' },
  { id: 'ch10-5', ch: 10, level: 'synth', question: '若实际利率上升但金价维持高位，最合理的解释是？', options: ['数据统计有误', '央行购金、去美元化或地缘风险溢价抵消了实际利率的压制', '黄金市场出现操纵', '通胀预期下降'], answer: 1, explain: '近年央行购金规模打破历史纪录，结构性去美元化需求使金价在实际利率上升期间依然坚挺——单因子模型已不够用。' },

  // Ch11 — 货币政策与中央银行
  { id: 'ch11-1', ch: 11, level: 'recall', question: '泰勒规则的两个关键缺口是？', options: ['外贸缺口和财政缺口', '通胀缺口（实际通胀-目标）和产出缺口（实际GDP-潜在GDP）', '就业缺口和汇率缺口', '信贷缺口和资产价格缺口'], answer: 1, explain: '泰勒规则：i = r* + π + 0.5(π-π*) + 0.5(y-y*)，两个缺口共同决定政策利率建议值。' },
  { id: 'ch11-2', ch: 11, level: 'analyze', question: '"泰勒规则建议13%，Fed实际加到5.5%"——差距的原因最可能是？', options: ['美联储算错了', '美联储主观压低利率以保护政府债务成本和金融稳定', '泰勒规则本身存在误差，不必参考', '通胀数据存在严重低报'], answer: 1, explain: '政府债务规模庞大时，大幅加息会导致财政压力（利息支出飙升）；金融稳定考量也制约了加息路径——政治经济学视角。' },
  { id: 'ch11-3', ch: 11, level: 'apply', question: '美联储利率走廊中，ON RRP利率的作用是？', options: ['利率走廊的上限', '利率走廊的下限，防止市场利率跌穿政策目标区间', '直接调控长端利率', '仅用于银行间拆借'], answer: 1, explain: 'ON RRP是美联储提供给货币市场基金等非银机构的"地板"利率，防止短端利率跌破目标区间下限。' },
  { id: 'ch11-4', ch: 11, level: 'recall', question: 'QT（缩表）主要通过什么机制收紧金融条件？', options: ['直接提高政策利率', '减少准备金供给，推高长端收益率并收缩流动性', '增加银行拨备要求', '提高存款准备金率'], answer: 1, explain: 'QT减少美联储持有债券，银行准备金减少，流动性收紧；同时减少对国债的边际买方，推高长端收益率。' },
  { id: 'ch11-5', ch: 11, level: 'synth', question: '前瞻指引（Forward Guidance）最大的风险是？', options: ['市场无法理解央行语言', '承诺与实际行动不一致会损害央行公信力', '容易被媒体误读', '过于透明导致市场过度交易'], answer: 1, explain: '央行若承诺"长期低利率"后因通胀超预期被迫快速加息，将严重损害前瞻指引的有效性和市场信任——2021-2022年Fed案例。' },

  // Ch12 — 金融危机与风险管理
  { id: 'ch12-1', ch: 12, level: 'recall', question: '三元悖论（Impossible Trinity）的三个要素是？', options: ['低通胀、低失业、高增长', '固定汇率、自由资本流动、独立货币政策——三者只能同时满足两个', '财政平衡、贸易平衡、资本账户平衡', '低利率、强增长、强货币'], answer: 1, explain: '三元悖论由蒙代尔-弗莱明模型推导：三目标不可兼得。中国选择放弃资本自由流动，欧元区选择放弃独立货币政策。' },
  { id: 'ch12-2', ch: 12, level: 'analyze', question: '2008年金融危机中，CDO（担保债务凭证）的核心风险被低估的原因是？', options: ['信用评级机构故意欺骗', '分散化假设失效——危机中资产相关性趋近于1，分散效果消失', '杠杆率太低', '监管过于严格'], answer: 1, explain: '量化模型假设各地区房贷相关性较低，但系统性危机爆发时相关性趋近于1，分散化效果完全失效，AAA评级的CDO价值归零。' },
  { id: 'ch12-3', ch: 12, level: 'apply', question: 'VIX（恐慌指数）急升时，通常意味着什么交易机会？', options: ['趋势跟踪做多波动率', '波动率均值回归——VIX极高时卖出波动率（但需严格风控）', '买入高波动成长股', '做空黄金'], answer: 1, explain: 'VIX有强均值回归特性，极端高位通常对应市场恐慌顶部，历史上VIX>40时做空波动率（卖出期权）平均收益为正——但风险极大。' },
  { id: 'ch12-4', ch: 12, level: 'recall', question: '亚洲金融危机（1997-98）的导火索是？', options: ['美国次贷危机传导', '泰铢放弃固定汇率引发资本外逃多米诺效应', '日本银行体系崩溃', '石油价格暴跌'], answer: 1, explain: '1997年7月泰国放弃泰铢盯美元，资本外逃冲击依次蔓延至马来西亚、印尼、韩国，形成危机传染。' },
  { id: 'ch12-5', ch: 12, level: 'synth', question: '"三元悖论是物理定律"这一比喻强调的是？', options: ['经济学像物理学一样精确', '三元悖论是无法通过政策创新突破的硬约束，违反必然付代价', '货币体系由物理规律决定', '量化模型在经济学中完全有效'], answer: 1, explain: '无论如何设计制度，一旦同时追求三个目标，资本流动最终会迫使放弃其中之一——历史上没有国家成功例外。' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const LEVEL_LABELS: Record<Level, string> = {
  recall: '记忆',
  apply: '应用',
  analyze: '分析',
  synth: '综合',
}

const LEVEL_COLORS: Record<Level, string> = {
  recall: '#4a9eff',
  apply: '#4cd964',
  analyze: '#f5a623',
  synth: '#a855f7',
}

export default function QuizPage() {
  const chParam = Taro.getCurrentInstance().router?.params?.ch
  const chNum = chParam ? parseInt(chParam, 10) : null

  const questions = useMemo<Question[]>(() => {
    if (chNum && !isNaN(chNum)) {
      return ALL_QUESTIONS.filter(q => q.ch === chNum)
    }
    return shuffle(ALL_QUESTIONS).slice(0, 10)
  }, [chNum])

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null))
  const [done, setDone] = useState(false)

  const current = questions[idx]

  function handleOption(optIdx: number) {
    if (selected !== null) return
    setSelected(optIdx)
    const next = [...answers]
    next[idx] = optIdx
    setAnswers(next)
  }

  function handleNext() {
    if (idx < questions.length - 1) {
      setIdx(idx + 1)
      setSelected(answers[idx + 1])
    } else {
      setDone(true)
      const score = answers.filter((a, i) => a === questions[i].answer).length
      if (chNum && !isNaN(chNum)) {
        markQuiz(chNum, Math.round((score / questions.length) * 100))
      }
    }
  }

  const correctCount = answers.filter((a, i) => i < idx + 1 && a === questions[i]?.answer).length

  if (done) {
    const score = answers.filter((a, i) => a === questions[i].answer).length
    const pct = Math.round((score / questions.length) * 100)
    return (
      <ScrollView scrollY className='quiz-page'>
        <View className='page-header'>
          <Text className='page-title'>📝 测验完成</Text>
          <Text className='page-meta'>{chNum ? `第${chNum}章专项` : '随机10题综合'}</Text>
        </View>
        <View className='quiz-summary'>
          <View className='quiz-summary__score-ring'>
            <Text className='quiz-summary__score-num'>{score}/{questions.length}</Text>
            <Text className='quiz-summary__score-label'>正确</Text>
          </View>
          <Text className='quiz-summary__pct'>{pct}分</Text>
          <Text className='quiz-summary__msg'>
            {pct >= 80 ? '🎉 优秀！掌握扎实' : pct >= 60 ? '💪 良好，再复习一遍更牢固' : '📖 建议回到章节重新学习'}
          </Text>
        </View>
        <View className='quiz-review'>
          <Text className='quiz-review__title'>答题回顾</Text>
          {questions.map((q, i) => {
            const ans = answers[i]
            const correct = ans === q.answer
            return (
              <View key={q.id} className={`quiz-review-item ${correct ? 'correct' : 'wrong'}`}>
                <View className='quiz-review-item__header'>
                  <Text className='quiz-review-item__icon'>{correct ? '✓' : '✗'}</Text>
                  <Text className='quiz-review-item__q'>Q{i + 1} Ch{q.ch}</Text>
                  <Text className='quiz-review-item__level' style={{ color: LEVEL_COLORS[q.level] }}>
                    {LEVEL_LABELS[q.level]}
                  </Text>
                </View>
                <Text className='quiz-review-item__question'>{q.question}</Text>
                {!correct && (
                  <Text className='quiz-review-item__correct'>正确答案：{q.options[q.answer]}</Text>
                )}
              </View>
            )
          })}
        </View>
        <View
          className='further-cta'
          onClick={() => {
            setIdx(0)
            setSelected(null)
            setAnswers(questions.map(() => null))
            setDone(false)
          }}
        >
          <Text>再来一遍 →</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    )
  }

  return (
    <ScrollView scrollY className='quiz-page'>
      <View className='page-header'>
        <Text className='page-title'>📝 {chNum ? `Ch${chNum} 专项测验` : '综合测验'}</Text>
        <Text className='page-meta'>{idx + 1}/{questions.length} 题 · {correctCount} 答对</Text>
      </View>

      <View className='quiz-progress-bar'>
        <View
          className='quiz-progress-bar__fill'
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </View>

      <View className='quiz-card'>
        <View className='quiz-card__meta'>
          <Text className='quiz-card__ch'>Ch{current.ch}</Text>
          <Text
            className='quiz-card__level'
            style={{ color: LEVEL_COLORS[current.level], borderColor: LEVEL_COLORS[current.level] }}
          >
            {LEVEL_LABELS[current.level]}
          </Text>
        </View>
        <Text className='quiz-card__question'>{current.question}</Text>
      </View>

      <View className='quiz-options'>
        {current.options.map((opt, i) => {
          let cls = 'quiz-option'
          if (selected !== null) {
            if (i === current.answer) cls += ' quiz-option--correct'
            else if (i === selected) cls += ' quiz-option--wrong'
          }
          return (
            <View key={i} className={cls} onClick={() => handleOption(i)}>
              <Text className='quiz-option__letter'>{['A', 'B', 'C', 'D'][i]}</Text>
              <Text className='quiz-option__text'>{opt}</Text>
            </View>
          )
        })}
      </View>

      {selected !== null && (
        <View className='quiz-explain'>
          <Text className='quiz-explain__label'>💡 解析</Text>
          <Text className='quiz-explain__text'>{current.explain}</Text>
          <View className='quiz-next-btn' onClick={handleNext}>
            <Text className='quiz-next-btn__text'>
              {idx < questions.length - 1 ? '下一题 →' : '查看结果 →'}
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}
