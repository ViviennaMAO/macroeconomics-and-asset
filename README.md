# 全球宏观经济分析与大类资产研究 · 互动学习

基于陶川《全球宏观经济分析与大类资产研究》改编的 Luffa SuperBox 互动学习小程序，包含 NPV / IRR / WACC 三大核心模拟器、12 章反预期事件，以及书中统计方法论的批评性评估。

## 设计理念：6 大学习科学锚点

1. **测试效应** — 每章 5 道精选题巩固记忆
2. **生成效应** — 用户先拖滑块预测，再看结果
3. **反预期** — 每章一个"教材说 X，市场实际 Y"的冲击时刻
4. **必要难度** — 让用户先答错，错误产生学习
5. **自解释** — 每个模拟器后引导思考
6. **元认知** — 进度追踪 + 艾宾浩斯复习队列

## 章节地图

### 第一篇 · 全球经济篇
| 章 | 模拟器 | 反预期 Hook |
|---|---|---|
| 1 · 美国经济 🇺🇸 | NPV 贴现模拟器 ⭐ | 五大指标全亮红灯却没衰退 |
| 2 · 欧洲经济 🇪🇺 | (内容卡) | 利差飙至 550bp |
| 3 · 日本经济 🇯🇵 | (内容卡) | 不是流动性陷阱，是没贬够 |
| 4 · 新兴市场 🌍 | IRR 模拟器 ⭐ | 资本进来一年出去一周 |
| 5 · 全球综合 🌐 | (内容卡) | G7 占全球 GDP 从 65% 降到 43% |

### 第二篇 · 大类资产篇
| 章 | 模拟器 | 反预期 Hook |
|---|---|---|
| 6 · 美元 💵 | 双因子模拟器 ⭐ | 美国增长放缓但美元涨 25% |
| 7 · 美国国债 📊 | NPV 债券定价 ⭐ | TLT 一年跌 31% |
| 8 · 美股 📈 | (内容卡) | Mag7 贡献 S&P 60% 涨幅 |
| 9 · 原油 🛢️ | WACC 项目评估 ⭐ | 页岩油催生第三种范式 |
| 10 · 黄金 🥇 | 多因子模拟器 ⭐ | 实际利率涨 3% 金价反涨 33% |

### 第三篇 · 货币政策与汇率篇
| 章 | 模拟器 | 反预期 Hook |
|---|---|---|
| 11 · 央行政策 🏛️ | 泰勒规则模拟器 ⭐ | 泰勒说 13.35%，Fed 实际 1.75% |
| 12 · 汇率案例 🔄 | (内容卡) | 从固定到浮动的切换本身就是危机 |

⭐ = 含完整互动模拟器

## 三大核心模拟器

- **NPV** (净现值) — Ch1 美国经济、Ch7 债券定价、Ch9 石油项目
- **IRR** (内部收益率) — Ch4 新兴市场、Ch10 黄金配置
- **WACC** (加权平均资本成本) — Ch9 石油项目盈亏平衡

## 9 条学习路径

🚀 30 分钟搞懂全球宏观 · 💵 美元的两张面孔 · 📈 资产定价三件套 NPV/IRR/WACC · 🥇 黄金之谜 · 🛢️ 原油范式变迁 · 🏛️ 央行的算盘 · 🌍 新兴市场生存指南 · 🔥 危机时间线 · ⚡ 反预期速通

## 方法论批评（数据支撑）

| 书中方法 | 问题 | 优化建议 |
|---|---|---|
| 全样本相关性 (美债 r=0.7) | 忽略 QE 后结构性断裂 | 滚动窗口 + Chow 断裂检验 |
| 线性回归 (美元双因子) | 汇率非线性 | 分位数回归 / Markov regime-switching |
| 单因子归因 (黄金 vs 实际利率) | R²=0.36 | 加入央行购金 / GPR / crypto 因子 |
| ADF 检验 (油价范式) | 样本敏感 | Zivot-Andrews 内生断点检验 |
| Phillips 曲线 (日本) | 1995 后平坦化 | 非线性 Phillips / 通胀预期锚定 |
| GDP 权重 (G7 代表全球) | 已降至 43% | PPP 调整 + EM 核心指标 |
| 泰勒规则 (r* 固定) | 估计差 300bp | Holston-Laubach-Williams 时变 r* |

## 技术栈

- Taro 4.0.9 + React 18 + TypeScript 5 + Sass
- 状态管理：useState + useMemo（避免过度工程）
- 存储：Taro.getStorageSync（艾宾浩斯复习队列）
- 部署目标：Luffa SuperBox（兼容微信小程序）
- 构建大小：760 KB（SuperBox 2MB 限制内）

## 开发

```bash
cd superbox-app
npm install
npm run build:weapp     # SuperBox / 微信小程序
npm run dev:h5          # 浏览器预览
```

## 项目结构

```
superbox-app/
├── src/
│   ├── data/         # chapters, glossary, quiz, news
│   ├── utils/        # formulas, snapshots, progress
│   ├── components/   # SnapshotBar, SliderRow, PredictModal, RevealModal, ProgressCard
│   ├── pages/        # home + 12 章 + 6 个功能页
│   ├── app.tsx
│   ├── app.config.ts
│   └── app.scss
├── config/index.ts
├── babel.config.js
└── tsconfig.json
```

## 致谢

- 原书：陶川《全球宏观经济分析与大类资产研究》
- 方法论：基于 Mishkin、Rey、Holston-Laubach-Williams 等学术研究的批评与扩展
- 构建：Claude Code + Taro
