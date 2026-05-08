/**
 * formulas.ts
 * Pure calculation functions for macro economics interactive learning app.
 * Used across chapter simulators (Ch1, Ch2, Ch4, Ch6-Ch12).
 *
 * Conventions:
 *   - No side effects, no DOM/storage access.
 *   - Rates are in PERCENT (e.g. 5 for 5%) unless explicitly noted otherwise
 *     in the function's own doc comment.
 *   - "rate as decimal" exceptions: npv(), irr(), wacc() — noted per function.
 */

// ---------------------------------------------------------------------------
// 1. NPV Calculator (Ch1, Ch7, Ch9)
//    rate: decimal (e.g. 0.05 for 5%)
//    cashflows[0] is the initial outflow (usually negative)
// ---------------------------------------------------------------------------
export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

// ---------------------------------------------------------------------------
// 2. IRR Calculator (Ch4, Ch10)
//    Newton-Raphson method, max 100 iterations, tolerance 1e-7.
//    rate returned as decimal (e.g. 0.12 for 12%).
//    Returns NaN if no convergence.
// ---------------------------------------------------------------------------
export function irr(cashflows: number[], guess: number = 0.1): number {
  const MAX_ITER = 100;
  const TOLERANCE = 1e-7;

  let rate = guess;

  for (let i = 0; i < MAX_ITER; i++) {
    // f(r)  = sum [ CF_t / (1+r)^t ]
    // f'(r) = sum [ -t * CF_t / (1+r)^(t+1) ]
    let f = 0;
    let df = 0;

    for (let t = 0; t < cashflows.length; t++) {
      const discountFactor = Math.pow(1 + rate, t);
      f += cashflows[t] / discountFactor;
      df -= (t * cashflows[t]) / (discountFactor * (1 + rate));
    }

    if (Math.abs(df) < 1e-12) return NaN; // derivative too small, cannot continue

    const newRate = rate - f / df;

    if (Math.abs(newRate - rate) < TOLERANCE) {
      return newRate;
    }

    rate = newRate;
  }

  return NaN; // did not converge
}

// ---------------------------------------------------------------------------
// 3. WACC Calculator (Ch2, Ch9)
//    All rate inputs as decimals (e.g. 0.08 for 8%).
//    deRatio = D / E
//    Formula: WACC = Ke * E/(E+D) + Kd*(1-T) * D/(E+D)
// ---------------------------------------------------------------------------
export function wacc(
  equityCost: number,
  debtCost: number,
  taxRate: number,
  deRatio: number
): number {
  // D/E = deRatio  =>  E/(E+D) = 1/(1+deRatio),  D/(E+D) = deRatio/(1+deRatio)
  const eWeight = 1 / (1 + deRatio);
  const dWeight = deRatio / (1 + deRatio);
  return equityCost * eWeight + debtCost * (1 - taxRate) * dWeight;
}

// ---------------------------------------------------------------------------
// 4. Bond Price (Ch7 — Treasury pricing)
//    All rate inputs in PERCENT (e.g. 5 for 5%).
// ---------------------------------------------------------------------------
export function bondPrice(
  faceValue: number,
  couponRate: number,
  ytm: number,
  years: number
): number {
  const c = (couponRate / 100) * faceValue; // annual coupon payment
  const r = ytm / 100; // yield as decimal

  let price = 0;
  for (let t = 1; t <= years; t++) {
    price += c / Math.pow(1 + r, t);
  }
  price += faceValue / Math.pow(1 + r, years);

  return price;
}

// ---------------------------------------------------------------------------
// 5. Modified Duration (Ch7)
//    All rate inputs in PERCENT (e.g. 5 for 5%).
//    Modified Duration = Macaulay Duration / (1 + ytm/100)
// ---------------------------------------------------------------------------
export function modifiedDuration(
  faceValue: number,
  couponRate: number,
  ytm: number,
  years: number
): number {
  const c = (couponRate / 100) * faceValue;
  const r = ytm / 100;
  const price = bondPrice(faceValue, couponRate, ytm, years);

  if (price === 0) return 0;

  // Macaulay Duration = sum[ t * PV(CF_t) ] / Price
  let macaulayDuration = 0;
  for (let t = 1; t <= years; t++) {
    const pv = c / Math.pow(1 + r, t);
    macaulayDuration += t * pv;
  }
  // Add final principal cash flow
  macaulayDuration += years * (faceValue / Math.pow(1 + r, years));
  macaulayDuration /= price;

  return macaulayDuration / (1 + r);
}

// ---------------------------------------------------------------------------
// 6. Taylor Rule (Ch11)
//    All inputs in PERCENT (e.g. 2 for 2%).
//    i = r* + π + 0.5*(π - π*) + 0.5*gap
// ---------------------------------------------------------------------------
export function taylorRule(
  inflation: number,
  inflationTarget: number,
  outputGap: number,
  rStar: number
): number {
  return rStar + inflation + 0.5 * (inflation - inflationTarget) + 0.5 * outputGap;
}

// ---------------------------------------------------------------------------
// 7. Dollar Dual Factor (Ch6)
//    All inputs in PERCENT (e.g. 2.5 for 2.5%).
//    realFactor      = usGrowth - globalGrowth
//    nominalFactor   = usInflation - globalInflation
//    compositeIndex  = 100 + realFactor*3 + nominalFactor*1.5
// ---------------------------------------------------------------------------
export function dollarDualFactor(
  usGrowth: number,
  globalGrowth: number,
  usInflation: number,
  globalInflation: number
): { realFactor: number; nominalFactor: number; compositeIndex: number } {
  const realFactor = usGrowth - globalGrowth;
  const nominalFactor = usInflation - globalInflation;
  const compositeIndex = 100 + realFactor * 3 + nominalFactor * 1.5;
  return { realFactor, nominalFactor, compositeIndex };
}

// ---------------------------------------------------------------------------
// 8. EPS-PE Decomposition (Ch8)
//    revenue: total revenue
//    shares: shares outstanding
//    profitMargin: in PERCENT (e.g. 15 for 15%)
//    peRatio: price-to-earnings ratio (dimensionless)
// ---------------------------------------------------------------------------
export function epsPeDecomposition(
  revenue: number,
  shares: number,
  profitMargin: number,
  peRatio: number
): { eps: number; targetPrice: number; revenuePerShare: number } {
  const revenuePerShare = shares > 0 ? revenue / shares : 0;
  const eps = revenuePerShare * (profitMargin / 100);
  const targetPrice = eps * peRatio;
  return { eps, targetPrice, revenuePerShare };
}

// ---------------------------------------------------------------------------
// 9. Oil Project NPV (Ch9)
//    oilPrice, costPerBarrel: USD per barrel
//    dailyProduction: barrels per day
//    waccRate: PERCENT (e.g. 8 for 8%)
//    years: project life in years
// ---------------------------------------------------------------------------
export function oilProjectNpv(
  oilPrice: number,
  costPerBarrel: number,
  dailyProduction: number,
  waccRate: number,
  years: number
): { annualCashflow: number; projectNpv: number; breakeven: number } {
  const DAYS_PER_YEAR = 365;
  const annualCashflow = (oilPrice - costPerBarrel) * dailyProduction * DAYS_PER_YEAR;

  const r = waccRate / 100;
  // NPV of an annuity (no upfront capex modeled here; caller may subtract separately)
  const projectNpv =
    r > 0
      ? annualCashflow * ((1 - Math.pow(1 + r, -years)) / r)
      : annualCashflow * years;

  // Breakeven oil price: margin needed so NPV = 0 (i.e. annualCashflow = 0)
  const breakeven = costPerBarrel;

  return { annualCashflow, projectNpv, breakeven };
}

// ---------------------------------------------------------------------------
// 10. Gold Fair Value (Ch10)
//     realRate: PERCENT (e.g. 1.5 for 1.5%)
//     dxyIndex: DXY dollar index level (e.g. 103)
//     centralBankBuying: annual net purchases in tonnes
//
//     modelPrice = 2000 - 300*realRate - (dxyIndex-100)*10 + centralBankBuying*0.5
// ---------------------------------------------------------------------------
export function goldFairValue(
  realRate: number,
  dxyIndex: number,
  centralBankBuying: number
): {
  modelPrice: number;
  realRateComponent: number;
  dxyComponent: number;
  cbComponent: number;
} {
  const realRateComponent = -300 * realRate;
  const dxyComponent = -(dxyIndex - 100) * 10;
  const cbComponent = centralBankBuying * 0.5;
  const modelPrice = 2000 + realRateComponent + dxyComponent + cbComponent;
  return { modelPrice, realRateComponent, dxyComponent, cbComponent };
}

// ---------------------------------------------------------------------------
// 12. Sovereign Spread (Ch2 — Eurozone fragmentation)
//     debtToGdp: %, fiscalDeficit: % of GDP, ecbBaseRate: %
//     spread (bps) = max(0, 30*(debtToGdp-60) + 80*fiscalDeficit + politicalRisk*100 - bondBuyingFactor)
//     where political risk in 0..1, bondBuyingFactor reduces spread (ECB intervention)
// ---------------------------------------------------------------------------
export function sovereignSpread(
  debtToGdp: number,
  fiscalDeficit: number,
  politicalRisk: number,
  ecbIntervention: number
): { spreadBps: number; debtComponent: number; fiscalComponent: number; politicalComponent: number } {
  const debtComponent = Math.max(0, (debtToGdp - 60) * 3);
  const fiscalComponent = Math.max(0, fiscalDeficit * 25);
  const politicalComponent = politicalRisk * 200;
  const interventionEffect = ecbIntervention * 150; // 0..1 scale
  const spreadBps = Math.max(
    0,
    debtComponent + fiscalComponent + politicalComponent - interventionEffect
  );
  return { spreadBps, debtComponent, fiscalComponent, politicalComponent };
}

// ---------------------------------------------------------------------------
// 13. Yen Inflation Pass-through (Ch3 — Japan)
//     usdJpy: 80..200, oilPrice: USD/bbl, wageGrowth: %, importShare: % of CPI basket
//     coreInflation = wageGrowth*0.4 + (yen_depreciation_yoy * importShare/100 * 0.6)
//     where yen_depreciation_yoy = (usdJpy/baseline - 1) * 100, baseline = 110
// ---------------------------------------------------------------------------
export function yenInflation(
  usdJpy: number,
  oilPrice: number,
  wageGrowth: number,
  importShare: number
): { headlineCpi: number; coreCpi: number; fxComponent: number; oilComponent: number; wageComponent: number } {
  const baseline = 110;
  const yenDepreciation = ((usdJpy - baseline) / baseline) * 100; // %
  const fxComponent = yenDepreciation * (importShare / 100) * 0.6;
  const oilBaseline = 70;
  const oilComponent = ((oilPrice - oilBaseline) / oilBaseline) * 100 * 0.15;
  const wageComponent = wageGrowth * 0.4;
  const coreCpi = wageComponent + fxComponent * 0.5; // core excludes oil
  const headlineCpi = coreCpi + oilComponent;
  return { headlineCpi, coreCpi, fxComponent, oilComponent, wageComponent };
}

// ---------------------------------------------------------------------------
// 14. Global GDP Weighted Growth (Ch5)
//     mode: 'market' uses market FX weights, 'ppp' uses PPP weights
//     usGrowth, euGrowth, chinaGrowth, indiaGrowth, otherGrowth: %
//     2024 weights:
//       Market FX: US 26%, EU 17%, CN 17%, IN 4%, Other 36%
//       PPP:       US 15%, EU 14%, CN 19%, IN 8%, Other 44%
// ---------------------------------------------------------------------------
export function globalGdpWeighted(
  mode: 'market' | 'ppp',
  usGrowth: number,
  euGrowth: number,
  chinaGrowth: number,
  indiaGrowth: number,
  otherGrowth: number
): { weightedGrowth: number; weights: { us: number; eu: number; cn: number; in: number; other: number } } {
  const weights =
    mode === 'market'
      ? { us: 0.26, eu: 0.17, cn: 0.17, in: 0.04, other: 0.36 }
      : { us: 0.15, eu: 0.14, cn: 0.19, in: 0.08, other: 0.44 };
  const weightedGrowth =
    usGrowth * weights.us +
    euGrowth * weights.eu +
    chinaGrowth * weights.cn +
    indiaGrowth * weights.in +
    otherGrowth * weights.other;
  return { weightedGrowth, weights };
}

// ---------------------------------------------------------------------------
// 15. Mag7 Concentration Effect (Ch8 — US Equities)
//     mag7Weight: % weight of Mag7 in S&P 500 (~30 in 2024)
//     mag7Return: % YTD return of Mag7
//     restReturn: % YTD return of remaining 493 stocks
//     Returns: indexReturn, contributionFromMag7 (% points), restContribution (% points)
// ---------------------------------------------------------------------------
export function mag7Concentration(
  mag7Weight: number,
  mag7Return: number,
  restReturn: number
): { indexReturn: number; mag7Contribution: number; restContribution: number; concentrationRatio: number } {
  const w = mag7Weight / 100;
  const mag7Contribution = w * mag7Return;
  const restContribution = (1 - w) * restReturn;
  const indexReturn = mag7Contribution + restContribution;
  // Concentration ratio = how much of the index move comes from Mag7
  const concentrationRatio = indexReturn !== 0 ? (mag7Contribution / indexReturn) * 100 : 0;
  return { indexReturn, mag7Contribution, restContribution, concentrationRatio };
}

// ---------------------------------------------------------------------------
// 16. Trilemma Score (Ch12)
//     capitalOpenness, exchangeFlexibility, monetaryIndependence: 0–100
//     tension = max(0, sum - 200)   (the impossible trinity constraint)
//     feasible = tension <= 0
// ---------------------------------------------------------------------------
export function trilemmaScore(
  capitalOpenness: number,
  exchangeFlexibility: number,
  monetaryIndependence: number
): { feasible: boolean; tension: number } {
  const sum = capitalOpenness + exchangeFlexibility + monetaryIndependence;
  const tension = Math.max(0, sum - 200);
  const feasible = tension <= 0;
  return { feasible, tension };
}
