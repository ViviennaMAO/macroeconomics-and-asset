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
// 11. Trilemma Score (Ch12)
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
