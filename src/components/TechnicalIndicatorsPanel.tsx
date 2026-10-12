import React from 'react';
import { SampleStock, MarketQuote } from '../types/trading';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateSupportResistance,
  interpretRSI,
  interpretSMA,
} from '../utils/indicators';
import { 
  Gauge, 
  TrendingUp, 
  Activity, 
  MessageSquare,
  Clock,
  AlertCircle
} from 'lucide-react';

interface TechnicalIndicatorsPanelProps {
  stock: SampleStock;
  liveQuote?: MarketQuote | null;
  onAskAboutIndicator: (indicatorName: string, contextSummary: string) => void;
}

export const TechnicalIndicatorsPanel: React.FC<TechnicalIndicatorsPanelProps> = ({
  stock,
  liveQuote,
  onAskAboutIndicator,
}) => {
  const candles = stock?.data || [];
  const prices = candles.map((c) => c.close);
  const latestPrice = liveQuote ? liveQuote.price : (prices[prices.length - 1] ?? 100);

  // Mathematical calculations in code
  const sma20Series = calculateSMA(prices, 20);
  const sma50Series = calculateSMA(prices, 50);
  const ema20Series = calculateEMA(prices, 20);
  const rsiSeries = calculateRSI(prices, 14);
  const bollingerSeries = calculateBollingerBands(prices, 20, 2);
  const sr = calculateSupportResistance(prices, 5);

  const currentSMA20 = sma20Series[sma20Series.length - 1];
  const currentSMA50 = sma50Series[sma50Series.length - 1];
  const currentRSI = rsiSeries[rsiSeries.length - 1];
  const currentBBUpper = bollingerSeries.upper[bollingerSeries.upper.length - 1];
  const currentBBLower = bollingerSeries.lower[bollingerSeries.lower.length - 1];

  const rsiInterpretation = interpretRSI(currentRSI);
  const smaInterpretation = interpretSMA(latestPrice, currentSMA20, currentSMA50);

  const calcTimestamp = new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="bg-[#070e1e] border border-[#162544] rounded-xl p-4 shadow-xl shadow-black/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#162544]">
        <div>
          <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
            <span>⚡</span> Quantitative Signal Engine (NSE & BSE)
          </span>
          <h2 className="text-sm font-semibold text-white">
            Calculated Candlestick & Trend Indicators for {stock?.symbol}
          </h2>
        </div>
        <div className="text-xs text-slate-300 flex items-center gap-2 font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Signals evaluated at {calcTimestamp} IST (1D Timeframe)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: RSI */}
        <div className="bg-[#09142b] border border-[#172748] rounded-lg p-3 flex flex-col justify-between hover:border-cyan-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wide">RSI (14 Period)</h3>
                  <span className="text-[10px] text-slate-400">Momentum Oscillator</span>
                </div>
              </div>
              <span className="font-mono text-base font-black text-cyan-300">
                {currentRSI !== null ? currentRSI : 'N/A'}
              </span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="w-full bg-[#050c18] h-2 rounded-full overflow-hidden my-2 relative border border-[#15233e]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentRSI && currentRSI >= 70
                    ? 'bg-rose-500'
                    : currentRSI && currentRSI <= 30
                    ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                    : 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, currentRSI || 50))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-2">
              <span>0 (Oversold)</span>
              <span>50</span>
              <span>100 (Overbought)</span>
            </div>

            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
              <strong className="text-cyan-300">{rsiInterpretation.label}: </strong>
              {rsiInterpretation.explanation}
            </p>
          </div>

          <button
            onClick={() =>
              onAskAboutIndicator(
                'Relative Strength Index (RSI)',
                `The 14-day RSI for ${stock.symbol} is calculated at ${currentRSI}. How does Candlestick AI interpret this momentum signal?`
              )
            }
            className="mt-2 w-full py-1.5 px-2 text-xs font-medium bg-[#0b1833] hover:bg-[#12254d] text-cyan-200 rounded border border-[#1b2f57] flex items-center justify-center gap-1.5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Candlestick AI About RSI</span>
          </button>
        </div>

        {/* Card 2: Moving Averages */}
        <div className="bg-[#09142b] border border-[#172748] rounded-lg p-3 flex flex-col justify-between hover:border-emerald-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wide">Moving Averages</h3>
                  <span className="text-[10px] text-slate-400">Trend Alignment Filter</span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-300">
                P: ₹{Number(latestPrice).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 my-2 font-mono text-xs bg-[#050c18] p-2 rounded border border-[#15233e]">
              <div>
                <span className="text-[10px] text-amber-400 block font-sans">SMA 20 (Short):</span>
                <span className="text-slate-200 font-bold">₹{currentSMA20 ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-cyan-400 block font-sans">SMA 50 (Medium):</span>
                <span className="text-slate-200 font-bold">₹{currentSMA50 ?? 'N/A'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
              <strong className="text-emerald-300">{smaInterpretation.label}: </strong>
              {smaInterpretation.explanation}
            </p>
          </div>

          <button
            onClick={() =>
              onAskAboutIndicator(
                'Simple Moving Averages (SMA)',
                `For ${stock.symbol}, current price is ₹${Number(latestPrice).toFixed(2)}, SMA 20 is ₹${currentSMA20}, and SMA 50 is ₹${currentSMA50}. How do moving average signals guide Indian equity trends?`
              )
            }
            className="mt-2 w-full py-1.5 px-2 text-xs font-medium bg-[#0b1833] hover:bg-[#12254d] text-emerald-200 rounded border border-[#1b2f57] flex items-center justify-center gap-1.5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ask Candlestick AI About SMA</span>
          </button>
        </div>

        {/* Card 3: Volatility & Levels */}
        <div className="bg-[#09142b] border border-[#172748] rounded-lg p-3 flex flex-col justify-between hover:border-cyan-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wide">Volatility & Levels</h3>
                  <span className="text-[10px] text-slate-400">Bollinger Bands & Pivot Zones</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 my-2 text-xs font-mono bg-[#050c18] p-2 rounded border border-[#15233e]">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans text-[11px]">Upper Band (+2σ):</span>
                <span className="text-purple-300">₹{currentBBUpper ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans text-[11px]">Lower Band (-2σ):</span>
                <span className="text-purple-300">₹{currentBBLower ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between border-t border-[#15233e] pt-1">
                <span className="text-slate-400 font-sans text-[11px]">30D Support (Floor):</span>
                <span className="text-emerald-400 font-bold">₹{sr.support}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans text-[11px]">30D Resistance (Ceiling):</span>
                <span className="text-rose-400 font-bold">₹{sr.resistance}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
              Price testing upper band suggests statistical exhaustion. Key accumulation floor is located at ₹{sr.support}.
            </p>
          </div>

          <button
            onClick={() =>
              onAskAboutIndicator(
                'Bollinger Bands and Support/Resistance',
                `For ${stock.symbol}, Support is at ₹${sr.support} and Resistance is at ₹${sr.resistance}. How should an Indian market trader plan stop-loss and targets around these signals?`
              )
            }
            className="mt-2 w-full py-1.5 px-2 text-xs font-medium bg-[#0b1833] hover:bg-[#12254d] text-cyan-200 rounded border border-[#1b2f57] flex items-center justify-center gap-1.5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Candlestick AI About Levels</span>
          </button>
        </div>
      </div>

      {/* Indicator Calculation Disclosures */}
      <div className="mt-3 pt-2 border-t border-[#162544] flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400/80" />
          Technical engine: Wilder’s RSI(14), SMA(20,50), Population Standard Deviation for Bollinger Bands(20, 2σ).
        </span>
        <span className="text-cyan-400 font-mono font-semibold">
          Exchange: {stock.exchange || 'NSE'}
        </span>
      </div>
    </div>
  );
};
