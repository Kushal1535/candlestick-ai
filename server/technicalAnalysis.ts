/**
 * Server-Side Quantitative Technical Analysis Engine for Indian Markets
 * 
 * Computes verifiable technical indicators directly in application code:
 * - Simple Moving Averages (SMA 20, 50, 200)
 * - Exponential Moving Averages (EMA 20, 50)
 * - Relative Strength Index (RSI 14 Wilder)
 * - Multi-period Percentage Price Changes (1D, 5D, 1M, 3M)
 * - Support and Resistance Pivot levels
 * - Includes calculation timestamp, input timeframe, and data limitation disclosures
 */

import { CandleRecord } from './marketDataService';

export interface TechnicalAnalysisResult {
  symbol: string;
  calculationTimestamp: string;
  timeframe: string;
  dataPointsUsed: number;
  currentPrice: number;
  priceChanges: {
    oneDay: number;
    fiveDay: number;
    oneMonth: number;
    threeMonth: number;
  };
  movingAverages: {
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    ema20: number | null;
    ema50: number | null;
    trendAlignment: 'Bullish (Price > SMA20 > SMA50)' | 'Bearish (Price < SMA20 < SMA50)' | 'Consolidation / Mixed';
  };
  rsi: {
    period: number;
    value: number | null;
    condition: 'Overbought (>70)' | 'Oversold (<30)' | 'Bullish Momentum (55-70)' | 'Bearish Momentum (30-45)' | 'Neutral (45-55)';
  };
  levels: {
    support: number;
    resistance: number;
    range: number;
  };
  dataLimitations: string[];
}

export function computeSMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[i - j];
      }
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

export function computeEMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);

  let initialSMA = 0;
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[j];
      }
      initialSMA = sum / period;
      result.push(Number(initialSMA.toFixed(2)));
    } else {
      const prevEMA = result[i - 1]!;
      const currentEMA = prices[i] * k + prevEMA * (1 - k);
      result.push(Number(currentEMA.toFixed(2)));
    }
  }
  return result;
}

export function computeRSI(prices: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (prices.length <= period) {
    return prices.map(() => null);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  result.push(null);

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < prices.length; i++) {
    const gainLossIdx = i - 1;

    if (i < period) {
      result.push(null);
    } else if (i === period) {
      let sumGain = 0;
      let sumLoss = 0;
      for (let j = 0; j < period; j++) {
        sumGain += gains[j];
        sumLoss += losses[j];
      }
      avgGain = sumGain / period;
      avgLoss = sumLoss / period;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        result.push(Number(rsi.toFixed(2)));
      }
    } else {
      avgGain = (avgGain * (period - 1) + gains[gainLossIdx]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[gainLossIdx]) / period;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        result.push(Number(rsi.toFixed(2)));
      }
    }
  }

  return result;
}

export function calculateTechnicalAnalysis(
  symbol: string,
  candles: CandleRecord[],
  timeframe: string = '1d'
): TechnicalAnalysisResult {
  const prices = candles.map((c) => c.close);
  const dataCount = prices.length;
  const currentPrice = dataCount > 0 ? prices[dataCount - 1] : 0;

  const dataLimitations: string[] = [];
  if (dataCount < 20) {
    dataLimitations.push(`Only ${dataCount} historical candles available; 20-period SMA/EMA cannot be accurately calculated.`);
  }
  if (dataCount < 50) {
    dataLimitations.push(`Insufficient historical depth (${dataCount} < 50) to evaluate medium-term 50-day moving average.`);
  }
  if (dataCount < 200) {
    dataLimitations.push(`Long-term 200-day institutional SMA requires 200 daily sessions (current: ${dataCount}).`);
  }

  // Calculate percentage price changes
  const calcChange = (lookback: number): number => {
    if (dataCount <= lookback) return 0;
    const pastPrice = prices[dataCount - 1 - lookback];
    if (pastPrice <= 0) return 0;
    return Number((((currentPrice - pastPrice) / pastPrice) * 100).toFixed(2));
  };

  const oneDay = calcChange(1);
  const fiveDay = calcChange(5);
  const oneMonth = calcChange(21); // ~21 trading days in a month
  const threeMonth = calcChange(63); // ~63 trading days in a quarter

  // Moving averages
  const sma20Series = computeSMA(prices, 20);
  const sma50Series = computeSMA(prices, 50);
  const sma200Series = computeSMA(prices, 200);
  const ema20Series = computeEMA(prices, 20);
  const ema50Series = computeEMA(prices, 50);

  const sma20 = sma20Series[sma20Series.length - 1] ?? null;
  const sma50 = sma50Series[sma50Series.length - 1] ?? null;
  const sma200 = sma200Series[sma200Series.length - 1] ?? null;
  const ema20 = ema20Series[ema20Series.length - 1] ?? null;
  const ema50 = ema50Series[ema50Series.length - 1] ?? null;

  let trendAlignment: 'Bullish (Price > SMA20 > SMA50)' | 'Bearish (Price < SMA20 < SMA50)' | 'Consolidation / Mixed' = 'Consolidation / Mixed';
  if (sma20 !== null && sma50 !== null) {
    if (currentPrice > sma20 && sma20 > sma50) {
      trendAlignment = 'Bullish (Price > SMA20 > SMA50)';
    } else if (currentPrice < sma20 && sma20 < sma50) {
      trendAlignment = 'Bearish (Price < SMA20 < SMA50)';
    }
  }

  // RSI
  const rsiSeries = computeRSI(prices, 14);
  const rsiValue = rsiSeries[rsiSeries.length - 1] ?? null;
  let rsiCondition: 'Overbought (>70)' | 'Oversold (<30)' | 'Bullish Momentum (55-70)' | 'Bearish Momentum (30-45)' | 'Neutral (45-55)' = 'Neutral (45-55)';

  if (rsiValue !== null) {
    if (rsiValue >= 70) rsiCondition = 'Overbought (>70)';
    else if (rsiValue <= 30) rsiCondition = 'Oversold (<30)';
    else if (rsiValue > 55) rsiCondition = 'Bullish Momentum (55-70)';
    else if (rsiValue < 45) rsiCondition = 'Bearish Momentum (30-45)';
    else rsiCondition = 'Neutral (45-55)';
  }

  // Support and Resistance
  const recentSlice = prices.slice(-Math.min(30, prices.length));
  const support = recentSlice.length > 0 ? Number(Math.min(...recentSlice).toFixed(2)) : currentPrice;
  const resistance = recentSlice.length > 0 ? Number(Math.max(...recentSlice).toFixed(2)) : currentPrice;

  return {
    symbol,
    calculationTimestamp: new Date().toISOString(),
    timeframe,
    dataPointsUsed: dataCount,
    currentPrice: Number(currentPrice.toFixed(2)),
    priceChanges: {
      oneDay,
      fiveDay,
      oneMonth,
      threeMonth,
    },
    movingAverages: {
      sma20,
      sma50,
      sma200,
      ema20,
      ema50,
      trendAlignment,
    },
    rsi: {
      period: 14,
      value: rsiValue,
      condition: rsiCondition,
    },
    levels: {
      support,
      resistance,
      range: Number((resistance - support).toFixed(2)),
    },
    dataLimitations,
  };
}
