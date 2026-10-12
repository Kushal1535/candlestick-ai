import { Candle, SampleStock } from '../types/trading';

/**
 * Generates realistic candlestick simulation data for educational purposes
 * as a fallback baseline when network feeds are initializing.
 */
function generateCandleSeries(
  startDate: string,
  startPrice: number,
  days: number,
  trendFactor: number,
  volatility: number,
  cycleLength: number = 20
): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = startPrice;
  const baseDate = new Date(startDate);

  for (let i = 0; i < days; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);

    // Skip weekends for realistic trading schedule
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateStr = d.toISOString().split('T')[0];
    const cycle = Math.sin((i / cycleLength) * Math.PI * 2) * (volatility * 0.5);
    const randomWalk = (Math.random() - 0.48) * volatility;
    const dailyDrift = trendFactor * (volatility * 0.2);

    const open = Number((currentPrice + (Math.random() - 0.5) * (volatility * 0.3)).toFixed(2));
    const delta = (Math.random() - 0.47) * volatility + dailyDrift + cycle;
    let close = Number((open + delta).toFixed(2));
    if (close <= 1) close = 1.5;

    const wickUp = Math.random() * (volatility * 0.7);
    const wickDown = Math.random() * (volatility * 0.7);

    const high = Number((Math.max(open, close) + wickUp).toFixed(2));
    const low = Number((Math.max(0.5, Math.min(open, close) - wickDown)).toFixed(2));

    const baseVolume = 1800000;
    const volumeMultiplier = 0.5 + Math.random() * 1.5 + (Math.abs(close - open) / open) * 10;
    const volume = Math.floor(baseVolume * volumeMultiplier);

    candles.push({
      date: dateStr,
      timestamp: d.getTime(),
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

export const SAMPLE_STOCKS: SampleStock[] = [
  {
    symbol: '^NSEI',
    name: 'NIFTY 50 (NSE Benchmark)',
    exchange: 'INDEX',
    sector: 'Broad Market National Index',
    description: 'Flagship index of the National Stock Exchange of India, representing 50 largest blue-chip Indian companies across 13 economic sectors.',
    learningFocus: 'Ideal for understanding overall Indian market momentum, institutional support levels, and comparing stock trends against the national benchmark.',
    data: generateCandleSeries('2026-05-01', 22100.0, 95, 0.4, 180.0, 25),
  },
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    sector: 'Energy, Retail & Telecommunications (Jio)',
    description: 'India’s largest corporate heavyweight by market valuation, spanning petrochemicals, oil-to-chemicals, digital services, and nationwide retail.',
    learningFocus: 'Practice evaluating institutional trendlines, moving average crossovers (SMA 20/50), and volume breakouts on India’s biggest market mover.',
    data: generateCandleSeries('2026-05-01', 1140.0, 95, 0.35, 14.0, 22),
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services Ltd',
    exchange: 'NSE',
    sector: 'Information Technology Services & Consulting',
    description: 'Flagship company of the Tata Group and a global IT powerhouse with steady operating margins and consistent institutional dividend yield.',
    learningFocus: 'Learn how to detect support floors during IT sector consolidation phases and evaluate RSI swings near the 30 oversold zone.',
    data: generateCandleSeries('2026-05-01', 3820.0, 95, 0.3, 38.0, 28),
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    sector: 'Private Sector Banking',
    description: 'India’s premier private sector bank with massive weightage in both the Nifty 50 and Bank Nifty indices.',
    learningFocus: 'Master the interaction between bank heavyweight rallies and broader index movements, focusing on breakout pullback retests.',
    data: generateCandleSeries('2026-05-01', 1520.0, 95, 0.25, 16.0, 30),
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Ltd',
    exchange: 'NSE',
    sector: 'Information Technology Services',
    description: 'Global technology consulting and digital services pioneer listed on NSE and NYSE, highly sensitive to US tech sentiment and quarterly earnings guidance.',
    learningFocus: 'Analyze post-earnings gap-ups and gap-downs, Bollinger Band squeezes, and moving average reversion.',
    data: generateCandleSeries('2026-05-01', 1480.0, 95, 0.45, 18.0, 20),
  },
  {
    symbol: 'FCL.NS',
    name: 'Fineotex Chemical Limited',
    exchange: 'NSE',
    sector: 'Specialty Chemicals & Manufacturing',
    description: 'Premier manufacturer of specialty chemicals and enzymes for textile, water treatment, and detergent industries listed on NSE as FCL.',
    learningFocus: 'Monitor mid-cap specialty chemical momentum breakouts, volume surges, and support retests.',
    data: generateCandleSeries('2026-05-01', 54.0, 95, 0.4, 2.5, 20),
  },
  {
    symbol: 'TATAMOTORS.NS',
    name: 'Tata Motors Ltd',
    exchange: 'NSE',
    sector: 'Automotive & EV Manufacturing',
    description: 'Leading automaker producing commercial vehicles, passenger cars, and electric vehicles, parent company of Jaguar Land Rover.',
    learningFocus: 'Understand high-beta swing setups, volatile candlestick wicks (rejections of daily highs and lows), and MACD trend shifts.',
    data: generateCandleSeries('2026-05-01', 940.0, 95, 0.5, 15.0, 18),
  },
];
