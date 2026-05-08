export interface Chapter {
  num: number
  title: string
  emoji: string
  brief: string
  difficulty: 1 | 2 | 3 | 4 | 5
  duration?: string
  implemented: boolean
  pagePath?: string
  hook?: string
  tier?: 'mvp' | 'basic'
}

export interface Part {
  num: number
  title: string
  desc: string
  range: string
  chapters: Chapter[]
}

export const parts: Part[] = [
  {
    num: 1,
    title: '全球经济篇',
    desc: '系统梳理美国、欧洲、日本及新兴市场的经济分析框架，构建全球宏观视野',
    range: 'Ch1–5',
    chapters: [
      {
        num: 1,
        title: '美国经济分析框架',
        emoji: '🇺🇸',
        brief: '五大指标全亮红灯却没衰退',
        difficulty: 3,
        implemented: false,
        pagePath: '/pages/ch1/index',
        hook: '当就业、制造业、消费、信贷、房市五大先行指标同时发出衰退警报，美国经济为何依然韧性十足？揭开"假阳性"背后的结构性逻辑。',
        tier: 'mvp',
      },
      {
        num: 2,
        title: '欧洲经济分析框架',
        emoji: '🇪🇺',
        brief: '统一货币没统一风险，利差飙550bp',
        difficulty: 3,
        implemented: false,
        pagePath: '/pages/ch2/index',
        hook: '欧元区共用一套货币政策，却无法消弭成员国间的财政裂痕——德国与希腊国债利差一度突破550bp，货币联盟的内生矛盾如何读懂？',
        tier: 'basic',
      },
      {
        num: 3,
        title: '日本经济分析框架',
        emoji: '🇯🇵',
        brief: '不是流动性陷阱，是没贬够',
        difficulty: 4,
        implemented: false,
        pagePath: '/pages/ch3/index',
        hook: '零利率、QQE、YCC轮番上阵，日本经济仍在通缩边缘徘徊三十年。问题真的是"流动性陷阱"，还是汇率传导机制从未被彻底打通？',
        tier: 'basic',
      },
      {
        num: 4,
        title: '新兴市场经济分析',
        emoji: '🌍',
        brief: '资本进来要一年，出去只要一周',
        difficulty: 4,
        implemented: false,
        pagePath: '/pages/ch4/index',
        hook: '外资流入往往历经数季度的基本面改善才姗姗来迟，而一旦美联储加息或风险情绪逆转，资本外流可以在一周内完成——非对称性如何重塑新兴市场分析框架？',
        tier: 'mvp',
      },
      {
        num: 5,
        title: '全球分析框架综合',
        emoji: '🌐',
        brief: 'G7占全球GDP已从65%降到43%',
        difficulty: 3,
        implemented: false,
        pagePath: '/pages/ch5/index',
        hook: '二十年间，G7在全球经济版图中的份额从三分之二骤降至不足一半。传统以发达国家为锚的全球宏观框架，正在面临怎样的范式重构？',
        tier: 'basic',
      },
    ],
  },
  {
    num: 2,
    title: '大类资产篇',
    desc: '深入解析美元、美债、美股、原油、黄金五大核心资产的定价逻辑与异常案例',
    range: 'Ch6–10',
    chapters: [
      {
        num: 6,
        title: '美元',
        emoji: '💵',
        brief: '美国增长放缓但美元因ECB QE涨20%',
        difficulty: 4,
        implemented: false,
        pagePath: '/pages/ch6/index',
        hook: '教科书告诉你经济强则货币强，但2014–2015年美国增速明显放缓，美元指数却因欧央行QE预期狂飙20%。驱动美元的究竟是本国基本面还是对手方政策？',
        tier: 'mvp',
      },
      {
        num: 7,
        title: '美国国债',
        emoji: '📊',
        brief: 'GDP年化-31%但10Y仅从1.9%降到0.6%',
        difficulty: 5,
        implemented: false,
        pagePath: '/pages/ch7/index',
        hook: '2020年Q2美国GDP年化暴跌31%，创历史最大单季跌幅，但10年期美债收益率仅从1.9%小幅下行至0.6%。当经济崩塌遇上货币政策天花板，利率还能告诉我们什么？',
        tier: 'mvp',
      },
      {
        num: 8,
        title: '美股',
        emoji: '📈',
        brief: 'Mag7贡献S&P 60%涨幅，均值分析失效',
        difficulty: 4,
        implemented: false,
        pagePath: '/pages/ch8/index',
        hook: '当七家科技巨头贡献了标普500指数近60%的年度涨幅，等权重指数与市值加权指数的裂口持续扩大——传统基于均值的市场分析框架为何正在系统性失效？',
        tier: 'basic',
      },
      {
        num: 9,
        title: '原油',
        emoji: '🛢️',
        brief: '页岩油让油价重回均值回归——第三范式',
        difficulty: 4,
        implemented: false,
        pagePath: '/pages/ch9/index',
        hook: '从OPEC垄断定价到地缘政治溢价，原油经历了两个截然不同的定价范式。页岩油革命带来的边际成本锚定机制，如何开启了第三范式——均值回归时代？',
        tier: 'mvp',
      },
      {
        num: 10,
        title: '黄金',
        emoji: '🥇',
        brief: '实际利率涨3%金价反涨33%——模型脱钩',
        difficulty: 5,
        implemented: false,
        pagePath: '/pages/ch10/index',
        hook: '实际利率与黄金价格负相关是教科书定论，但2022年美联储激进加息推动实际利率上行近300bp，金价却逆势上涨33%。当模型集体脱钩，是模型错了还是世界变了？',
        tier: 'mvp',
      },
    ],
  },
  {
    num: 3,
    title: '货币政策与汇率篇',
    desc: '解构各国央行政策工具的传导机制，并通过汇率危机案例揭示制度切换的非线性风险',
    range: 'Ch11–12',
    chapters: [
      {
        num: 11,
        title: '各国央行货币政策',
        emoji: '🏛️',
        brief: 'Repo利率一夜飙到10%——走廊也有下水道',
        difficulty: 5,
        implemented: false,
        pagePath: '/pages/ch11/index',
        hook: '2019年9月美国回购市场利率在一夜之间从2%飙升至10%，即便利率走廊机制运转正常。当"技术性"流动性危机突破制度护栏，央行工具箱的边界究竟在哪里？',
        tier: 'mvp',
      },
      {
        num: 12,
        title: '汇率案例分析',
        emoji: '🔄',
        brief: '从固定到浮动的切换本身就是危机触发器',
        difficulty: 4,
        implemented: false,
        pagePath: '/pages/ch12/index',
        hook: '无论是泰铢、阿根廷比索还是人民币汇改，历史反复证明：汇率制度的切换时机与方式，往往本身就是危机的引爆点，而非解决方案。',
        tier: 'basic',
      },
    ],
  },
]

export const totalChapters = parts.reduce((sum, p) => sum + p.chapters.length, 0)

export const mvpChapters: Chapter[] = parts
  .flatMap((p) => p.chapters)
  .filter((c) => c.tier === 'mvp')

export function findChapter(num: number): Chapter | undefined {
  return parts.flatMap((p) => p.chapters).find((c) => c.num === num)
}
