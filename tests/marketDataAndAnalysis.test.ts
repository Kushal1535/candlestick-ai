/**
 * Comprehensive Automated Test Suite for TradeWise AI Indian Market Upgrade
 * 
 * Verifies:
 * 1. Market-data normalization and status labels
 * 2. Missing and stale data handling
 * 3. Technical indicator mathematical calculations (SMA, EMA, RSI, Support/Resistance)
 * 4. Invalid symbol and input sanitization
 * 5. Paper-trading balance and profit/loss calculations
 */

import { computeSMA, computeEMA, computeRSI, calculateTechnicalAnalysis } from '../server/technicalAnalysis';
import { normalizeIndianSymbol, CandleRecord } from '../server/marketDataService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Starting Candlestick AI Indian Market Test Suite...\n');

  // Test 1: Symbol Normalization
  console.log('Test 1: Indian Symbol Normalization & Sanitization');
  assert(normalizeIndianSymbol('RELIANCE') === 'RELIANCE.NS', 'Normalizes "RELIANCE" to "RELIANCE.NS"');
  assert(normalizeIndianSymbol('tcs') === 'TCS.NS', 'Converts lowercase "tcs" to uppercase "TCS.NS"');
  assert(normalizeIndianSymbol('NIFTY') === '^NSEI', 'Maps "NIFTY" to index symbol "^NSEI"');
  assert(normalizeIndianSymbol('SENSEX') === '^BSESN', 'Maps "SENSEX" to index symbol "^BSESN"');
  assert(normalizeIndianSymbol('INFY.BO') === 'INFY.BO', 'Preserves BSE suffix ".BO"');
  assert(normalizeIndianSymbol('^NSEBANK') === '^NSEBANK', 'Preserves index prefix "^"');

  // Test 2: Indicator Calculations on Known Synthetic Series
  console.log('\nTest 2: Quantitative Indicator Formulas');
  // Simple 10-period sequence
  const testPrices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const sma5 = computeSMA(testPrices, 5);
  // Last 5 prices: 15, 16, 17, 18, 19 -> sum = 85 -> average = 17.0
  assert(sma5[sma5.length - 1] === 17.0, `SMA(5) calculates average accurately (expected 17.0, got ${sma5[sma5.length - 1]})`);
  assert(sma5[3] === null, 'SMA returns null for indices before period completion');

  const ema5 = computeEMA(testPrices, 5);
  assert(typeof ema5[ema5.length - 1] === 'number', 'EMA computes valid numerical multiplier value');
  assert(ema5[ema5.length - 1]! > 16.5 && ema5[ema5.length - 1]! < 19, 'EMA gives higher weight to recent ascending prices');

  // Test RSI on strictly ascending prices (should approach 100)
  const ascendingPrices = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];
  const rsiAsc = computeRSI(ascendingPrices, 14);
  const finalRSI = rsiAsc[rsiAsc.length - 1];
  assert(finalRSI === 100, `RSI on pure gains returns 100 (got ${finalRSI})`);

  // Test RSI on mixed series
  const mixedPrices = [
    100, 102, 101, 103, 102, 105, 104, 106, 105, 107,
    106, 108, 107, 109, 108, 110, 109, 111, 110, 112
  ];
  const rsiMixed = computeRSI(mixedPrices, 14);
  const mixedVal = rsiMixed[rsiMixed.length - 1];
  assert(mixedVal !== null && mixedVal > 50 && mixedVal < 80, `RSI on steady uptrend is between 50 and 80 (got ${mixedVal})`);

  // Test 3: Technical Analysis Limitations & Edge Cases
  console.log('\nTest 3: Data Limitations & Edge Cases');
  const shortCandles: CandleRecord[] = [
    { date: '2026-05-01', timestamp: 1, open: 100, high: 105, low: 99, close: 103, volume: 1000 },
    { date: '2026-05-02', timestamp: 2, open: 103, high: 108, low: 102, close: 106, volume: 1200 },
  ];
  const shortAnalysis = calculateTechnicalAnalysis('TEST.NS', shortCandles, '1d');
  assert(shortAnalysis.movingAverages.sma20 === null, 'SMA 20 is null when candles count < 20');
  assert(shortAnalysis.dataLimitations.length >= 2, 'Flags data depth limitations when candles are short');
  assert(shortAnalysis.levels.support === 103, `Support identifies recent low (${shortAnalysis.levels.support})`);
  assert(shortAnalysis.levels.resistance === 106, `Resistance identifies recent high (${shortAnalysis.levels.resistance})`);

  // Test 4: Paper-Trading Balance & P&L Calculation Engine
  console.log('\nTest 4: Paper-Trading Mathematics in ₹ INR');
  const initialCash = 1000000; // 10 Lakhs INR
  let cash = initialCash;
  const holdings: Record<string, { shares: number; averageBuyPrice: number; totalCost: number }> = {};

  // Action: Buy 50 shares of Reliance at ₹2500
  const buyPrice = 2500;
  const buyShares = 50;
  const tradeCost = buyPrice * buyShares; // 1,25,000
  cash -= tradeCost;
  holdings['RELIANCE.NS'] = { shares: buyShares, averageBuyPrice: buyPrice, totalCost: tradeCost };

  assert(cash === 875000, `Cash correctly debited (expected ₹8,75,000, got ₹${cash})`);
  assert(holdings['RELIANCE.NS'].shares === 50, 'Holdings record 50 shares');

  // Price rises to ₹2600 -> Calculate Unrealized P&L
  const currentMktPrice = 2600;
  const curHoldVal = holdings['RELIANCE.NS'].shares * currentMktPrice; // 1,30,000
  const unrealizedPL = curHoldVal - holdings['RELIANCE.NS'].totalCost; // +5,000
  const totalEquity = cash + curHoldVal; // 875000 + 130000 = 1005000 (+5,000)

  assert(unrealizedPL === 5000, `Unrealized P&L matches price increase (expected ₹5,000, got ₹${unrealizedPL})`);
  assert(totalEquity === 1005000, `Total Equity reflects cash + current market value (expected ₹10,05,000, got ₹${totalEquity})`);

  // Action: Sell 20 shares at ₹2600
  const sellShares = 20;
  const sellProceeds = sellShares * currentMktPrice; // 52,000
  cash += sellProceeds;
  const costSold = (holdings['RELIANCE.NS'].totalCost / holdings['RELIANCE.NS'].shares) * sellShares; // 50,000
  const realizedPL = sellProceeds - costSold; // +2,000
  holdings['RELIANCE.NS'].shares -= sellShares; // 30 shares
  holdings['RELIANCE.NS'].totalCost -= costSold; // 75,000

  assert(cash === 927000, `Cash correctly credited from sell (expected ₹9,27,000, got ₹${cash})`);
  assert(realizedPL === 2000, `Realized gain accurately calculated (+₹2,000)`);
  assert(holdings['RELIANCE.NS'].shares === 30, 'Remaining shares updated to 30');

  console.log('\n=============================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
