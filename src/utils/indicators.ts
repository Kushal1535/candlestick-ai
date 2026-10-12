/**
 * Technical Indicator Calculation Engine
 * Implements standard mathematical formulas for financial technical indicators.
 * Real mathematical calculations in application code (not AI generated values).
 */

/**
 * Calculates Simple Moving Average (SMA)
 * SMA_t = (sum of last N closing prices) / N
 */
export function calculateSMA(prices: number[], period: number): (number | null)[] {
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

/**
 * Calculates Exponential Moving Average (EMA)
 * Multiplier = 2 / (period + 1)
 * EMA_t = (Close_t * Multiplier) + (EMA_prev * (1 - Multiplier))
 */
export function calculateEMA(prices: number[], period: number): (number | null)[] {
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

/**
 * Calculates Relative Strength Index (RSI) using Wilder's Smoothed Moving Average
 * standard 14 periods.
 * RSI = 100 - (100 / (1 + RS)) where RS = Average Gain / Average Loss
 */
export function calculateRSI(prices: number[], period: number = 14): (number | null)[] {
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

  result.push(null); // first index has no prior price

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
      // Wilder's smoothing
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

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 * MACD Line = EMA(12) - EMA(26)
 * Signal Line = EMA(9) of MACD Line
 * MACD Histogram = MACD Line - Signal Line
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  const macdLine: (number | null)[] = [];
  const validMacdValues: number[] = [];
  const validMacdIndices: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    const fast = fastEMA[i];
    const slow = slowEMA[i];

    if (fast !== null && slow !== null) {
      const diff = Number((fast - slow).toFixed(2));
      macdLine.push(diff);
      validMacdValues.push(diff);
      validMacdIndices.push(i);
    } else {
      macdLine.push(null);
    }
  }

  // Calculate EMA(9) of the valid MACD values
  const signalOfValid = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | null)[] = prices.map(() => null);
  const histogram: (number | null)[] = prices.map(() => null);

  for (let k = 0; k < validMacdIndices.length; k++) {
    const originalIndex = validMacdIndices[k];
    const sigVal = signalOfValid[k];
    signalLine[originalIndex] = sigVal;

    const macdVal = macdLine[originalIndex];
    if (macdVal !== null && sigVal !== null) {
      histogram[originalIndex] = Number((macdVal - sigVal).toFixed(2));
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Bollinger Bands (20 periods, 2 standard deviations)
 * Middle Band = 20-day SMA
 * Upper Band = 20-day SMA + (2 * Standard Deviation)
 * Lower Band = 20-day SMA - (2 * Standard Deviation)
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateSMA(prices, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    const mid = middle[i];
    if (mid === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      // Calculate population variance for the slice
      let sumSquaredDiffs = 0;
      for (let j = 0; j < period; j++) {
        const diff = prices[i - j] - mid;
        sumSquaredDiffs += diff * diff;
      }
      const variance = sumSquaredDiffs / period;
      const stdDev = Math.sqrt(variance);

      upper.push(Number((mid + stdDevMultiplier * stdDev).toFixed(2)));
      lower.push(Number((mid - stdDevMultiplier * stdDev).toFixed(2)));
    }
  }

  return { upper, middle, lower };
}

/**
 * Identifies key Support and Resistance levels from recent pivot highs and lows
 */
export function calculateSupportResistance(prices: number[], window: number = 5): {
  support: number;
  resistance: number;
} {
  if (prices.length === 0) return { support: 0, resistance: 0 };
  const recent = prices.slice(-Math.min(30, prices.length));
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  return {
    support: Number(min.toFixed(2)),
    resistance: Number(max.toFixed(2)),
  };
}

/**
 * Interpretation helpers to translate raw indicator numbers into beginner-friendly explanations
 */
export function interpretRSI(rsi: number | null): {
  label: string;
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'overbought' | 'oversold';
  explanation: string;
} {
  if (rsi === null) {
    return {
      label: 'Calculating...',
      sentiment: 'neutral',
      explanation: 'Need at least 14 days of historical candles to compute standard RSI.',
    };
  }

  if (rsi >= 70) {
    return {
      label: `Overbought (${rsi.toFixed(1)})`,
      sentiment: 'overbought',
      explanation: 'RSI is above 70. The asset has surged rapidly. Buyers are very aggressive, but a pullback or consolidation often follows.',
    };
  } else if (rsi <= 30) {
    return {
      label: `Oversold (${rsi.toFixed(1)})`,
      sentiment: 'oversold',
      explanation: 'RSI is below 30. The asset has dropped significantly. Heavy selling pressure may be exhausting, sometimes indicating a potential rebound.',
    };
  } else if (rsi > 55) {
    return {
      label: `Moderate Bullish (${rsi.toFixed(1)})`,
      sentiment: 'bullish',
      explanation: 'RSI is between 55 and 70. Momentum leans positive with steady buying volume.',
    };
  } else if (rsi < 45) {
    return {
      label: `Moderate Bearish (${rsi.toFixed(1)})`,
      sentiment: 'bearish',
      explanation: 'RSI is between 30 and 45. Selling pressure mildly outweighs buying, but not yet oversold.',
    };
  } else {
    return {
      label: `Neutral (${rsi.toFixed(1)})`,
      sentiment: 'neutral',
      explanation: 'RSI is centered near 50. Buying and selling forces are relatively balanced.',
    };
  }
}

export function interpretSMA(price: number, sma20: number | null, sma50: number | null): {
  label: string;
  trend: 'uptrend' | 'downtrend' | 'consolidation';
  explanation: string;
} {
  if (sma20 === null || sma50 === null) {
    return {
      label: 'Accumulating data',
      trend: 'consolidation',
      explanation: 'Requires 50 trading periods to evaluate the golden/death cross status.',
    };
  }

  if (price > sma20 && sma20 > sma50) {
    return {
      label: 'Bullish Alignment (Price > SMA20 > SMA50)',
      trend: 'uptrend',
      explanation: 'Short-term and medium-term averages are ascending. Classic uptrend structure.',
    };
  } else if (price < sma20 && sma20 < sma50) {
    return {
      label: 'Bearish Alignment (Price < SMA20 < SMA50)',
      trend: 'downtrend',
      explanation: 'Price is lagging below both moving averages. The prevailing momentum points downward.',
    };
  } else {
    return {
      label: 'Mixed / Sideways Consolidation',
      trend: 'consolidation',
      explanation: 'Price is oscillating around the moving averages. Often seen in range-bound market phases.',
    };
  }
}
