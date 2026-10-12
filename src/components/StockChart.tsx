import React, { useState, useMemo } from 'react';
import { SampleStock, MarketQuote } from '../types/trading';
import {
  calculateSMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
} from '../utils/indicators';
import { Layers, TrendingUp, BarChart2, Radio } from 'lucide-react';

interface StockChartProps {
  stock: SampleStock;
  liveQuote?: MarketQuote | null;
  onAskAboutIndicator: (indicatorName: string, value: string) => void;
}

export const StockChart: React.FC<StockChartProps> = ({ stock, liveQuote, onAskAboutIndicator }) => {
  const [chartMode, setChartMode] = useState<'candlestick' | 'line'>('candlestick');
  const [timeRange, setTimeRange] = useState<'30D' | '60D' | 'ALL'>('60D');
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [subChart, setSubChart] = useState<'rsi' | 'macd' | 'none'>('rsi');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter candle data based on timeRange
  const candles = useMemo(() => {
    const all = stock?.data || [];
    if (timeRange === '30D') return all.slice(-30);
    if (timeRange === '60D') return all.slice(-60);
    return all;
  }, [stock?.data, timeRange]);

  // Extract closing prices
  const closingPrices = useMemo(() => candles.map((c) => c.close), [candles]);

  // Calculated indicator values
  const sma20 = useMemo(() => calculateSMA(closingPrices, 20), [closingPrices]);
  const sma50 = useMemo(() => calculateSMA(closingPrices, 50), [closingPrices]);
  const bollinger = useMemo(() => calculateBollingerBands(closingPrices, 20, 2), [closingPrices]);
  const rsi = useMemo(() => calculateRSI(closingPrices, 14), [closingPrices]);
  const macd = useMemo(() => calculateMACD(closingPrices, 12, 26, 9), [closingPrices]);

  // Find min and max for price scaling
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let volMax = 0;

    candles.forEach((c, idx) => {
      min = Math.min(min, c.low);
      max = Math.max(max, c.high);
      volMax = Math.max(volMax, c.volume);

      if (showBollinger) {
        if (bollinger.upper[idx] !== null) max = Math.max(max, bollinger.upper[idx]!);
        if (bollinger.lower[idx] !== null) min = Math.min(min, bollinger.lower[idx]!);
      }
      if (showSMA20 && sma20[idx] !== null) {
        min = Math.min(min, sma20[idx]!);
        max = Math.max(max, sma20[idx]!);
      }
      if (showSMA50 && sma50[idx] !== null) {
        min = Math.min(min, sma50[idx]!);
        max = Math.max(max, sma50[idx]!);
      }
    });

    if (min === Infinity || max === -Infinity) {
      min = 100;
      max = 200;
    }

    const padding = (max - min) * 0.08 || 5;
    return {
      minPrice: Math.max(0.1, min - padding),
      maxPrice: max + padding,
      maxVolume: volMax || 1,
    };
  }, [candles, showBollinger, showSMA20, showSMA50, bollinger, sma20, sma50]);

  // Chart dimensions in SVG coordinate space
  const svgWidth = 800;
  const mainChartHeight = 320;
  const subChartHeight = subChart === 'none' ? 0 : 100;
  const totalSvgHeight = mainChartHeight + subChartHeight + (subChart !== 'none' ? 24 : 0);

  const paddingLeft = 10;
  const paddingRight = 75; // wider for ₹ currency values
  const paddingTop = 20;
  const paddingBottom = 25;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = mainChartHeight - paddingTop - paddingBottom;

  // Scale functions
  const count = candles.length;
  const getX = (index: number) => paddingLeft + (index / (count - 1 || 1)) * plotWidth;
  const getY = (price: number) => {
    return (
      paddingTop +
      plotHeight -
      ((price - minPrice) / (maxPrice - minPrice || 1)) * plotHeight
    );
  };

  // Hover target
  const activeIndex = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < count ? hoverIndex : count - 1;
  const activeCandle = candles[activeIndex] || candles[0] || {
    date: 'N/A',
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
  };

  // Helper for line paths
  const generatePath = (data: (number | null)[]) => {
    let path = '';
    let started = false;
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      if (val !== null) {
        const x = getX(i);
        const y = getY(val);
        if (!started) {
          path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          started = true;
        } else {
          path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      }
    }
    return path;
  };

  // Bollinger Bands shaded area polygon
  const bollingerShadePath = useMemo(() => {
    if (!showBollinger) return '';
    const pointsUpper: string[] = [];
    const pointsLower: string[] = [];
    for (let i = 0; i < candles.length; i++) {
      const u = bollinger.upper[i];
      const l = bollinger.lower[i];
      if (u !== null && l !== null) {
        pointsUpper.push(`${getX(i).toFixed(1)},${getY(u).toFixed(1)}`);
        pointsLower.unshift(`${getX(i).toFixed(1)},${getY(l).toFixed(1)}`);
      }
    }
    if (pointsUpper.length === 0) return '';
    return `M ${pointsUpper.join(' L ')} L ${pointsLower.join(' L ')} Z`;
  }, [candles, showBollinger, bollinger]);

  const dataStatusLabel = liveQuote?.dataStatus || 'delayed';

  return (
    <div className="bg-[#070e1e] border border-[#162544] rounded-xl p-4 flex flex-col shadow-xl shadow-black/40">
      {/* Top Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#162544]">
        {/* Active Candle Overview HUD with ₹ INR */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-slate-400">Date: </span>
            <span className="font-mono text-slate-200 font-medium">{activeCandle?.date || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400">O: </span>
            <span className="font-mono text-slate-200 font-semibold">
              ₹{Number(activeCandle?.open ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-400">H: </span>
            <span className="font-mono text-emerald-400 font-semibold">
              ₹{Number(activeCandle?.high ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-400">L: </span>
            <span className="font-mono text-rose-400 font-semibold">
              ₹{Number(activeCandle?.low ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-400">C: </span>
            <span
              className={`font-mono font-bold ${
                (activeCandle?.close ?? 0) >= (activeCandle?.open ?? 0) ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ₹{Number(activeCandle?.close ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Vol: </span>
            <span className="font-mono text-cyan-300 font-medium">
              {(Number(activeCandle?.volume ?? 0) / 100000).toFixed(2)} Lakh
            </span>
          </div>
        </div>

        {/* Chart View Controls & Data Status Badge */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Feed Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b1528] border border-[#1c2d52] text-[10px] font-mono text-cyan-300">
            <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
            <span className="uppercase font-semibold">
              {liveQuote?.price ? `${liveQuote.exchange} FEED ACTIVE` : 'MARKET FEED READY'}
            </span>
          </div>

          {/* Timeframe switch */}
          <div className="flex bg-[#0b1730] p-0.5 rounded-lg border border-[#1a2d52] text-xs font-medium">
            {(['30D', '60D', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === r
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Mode switch (Candlestick vs Line) */}
          <div className="flex bg-[#0b1730] p-0.5 rounded-lg border border-[#1a2d52] text-xs font-medium">
            <button
              onClick={() => setChartMode('candlestick')}
              className={`px-2.5 py-1 rounded-md transition ${
                chartMode === 'candlestick'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartMode('line')}
              className={`px-2.5 py-1 rounded-md transition ${
                chartMode === 'line'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Line
            </button>
          </div>
        </div>
      </div>

      {/* Indicator Overlay Toggles Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs border-b border-[#162544]/80">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-cyan-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> Overlays:
          </span>

          <button
            onClick={() => setShowSMA20(!showSMA20)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
              showSMA20
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-[#0a1429] border-[#162544] text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>SMA 20 ({sma20[activeIndex] !== null ? `₹${sma20[activeIndex]}` : '-'})</span>
          </button>

          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
              showSMA50
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-[#0a1429] border-[#162544] text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>SMA 50 ({sma50[activeIndex] !== null ? `₹${sma50[activeIndex]}` : '-'})</span>
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
              showBollinger
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                : 'bg-[#0a1429] border-[#162544] text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Bollinger Bands</span>
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
              showVolume
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-[#0a1429] border-[#162544] text-slate-400'
            }`}
          >
            <BarChart2 className="w-3 h-3 text-emerald-400" />
            <span>Volume</span>
          </button>
        </div>

        {/* Sub-chart selector */}
        <div className="flex items-center gap-1 bg-[#09152b] p-0.5 rounded border border-[#1b2b4d]">
          <span className="text-[10px] text-slate-400 px-1 font-semibold">Signals:</span>
          {(['rsi', 'macd', 'none'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSubChart(mode)}
              className={`px-2 py-0.5 text-[11px] rounded transition uppercase ${
                subChart === mode
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden select-none mt-2">
        {/* Subtle Brand Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
          <span className="text-4xl md:text-7xl font-black uppercase tracking-widest text-cyan-400">
            CANDLESTICK AI
          </span>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${totalSvgHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const index = Math.round(((relX - paddingLeft) / plotWidth) * (count - 1));
            if (index >= 0 && index < count) {
              setHoverIndex(index);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="volGradBull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="volGradBear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid lines and Price Axis Labels in ₹ */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const price = minPrice + (maxPrice - minPrice) * (1 - pct);
            const y = paddingTop + plotHeight * pct;
            return (
              <g key={pct}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#172648"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
                <text
                  x={svgWidth - paddingRight + 6}
                  y={y + 3}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ₹{price >= 1000 ? price.toFixed(0) : price.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Volume bars */}
          {showVolume &&
            candles.map((c, i) => {
              const x = getX(i);
              const barWidth = Math.max(2, (plotWidth / count) * 0.7);
              const volHeight = (c.volume / maxVolume) * (plotHeight * 0.22);
              const y = paddingTop + plotHeight - volHeight;
              const isBull = c.close >= c.open;

              return (
                <rect
                  key={`vol-${i}`}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={volHeight}
                  fill={isBull ? 'url(#volGradBull)' : 'url(#volGradBear)'}
                />
              );
            })}

          {/* Bollinger Bands */}
          {showBollinger && bollingerShadePath && (
            <path d={bollingerShadePath} fill="#a855f7" fillOpacity="0.08" />
          )}
          {showBollinger && (
            <>
              <path
                d={generatePath(bollinger.upper)}
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
              <path
                d={generatePath(bollinger.lower)}
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
            </>
          )}

          {/* Price Candles or Line */}
          {chartMode === 'line' ? (
            <>
              <path
                d={`${generatePath(closingPrices)} L ${getX(count - 1)} ${paddingTop + plotHeight} L ${getX(0)} ${paddingTop + plotHeight} Z`}
                fill="url(#lineGrad)"
              />
              <path
                d={generatePath(closingPrices)}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />
            </>
          ) : (
            candles.map((c, i) => {
              const x = getX(i);
              const isBull = c.close >= c.open;
              const candleColor = isBull ? '#10b981' : '#f43f5e';
              const yOpen = getY(c.open);
              const yClose = getY(c.close);
              const yHigh = getY(c.high);
              const yLow = getY(c.low);

              const barWidth = Math.max(3, (plotWidth / count) * 0.7);
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

              return (
                <g key={`candle-${i}`}>
                  {/* Upper and Lower Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth="1.5"
                  />
                  {/* Real Body */}
                  <rect
                    x={x - barWidth / 2}
                    y={bodyTop}
                    width={barWidth}
                    height={bodyHeight}
                    fill={isBull ? '#064e3b' : '#881337'}
                    stroke={candleColor}
                    strokeWidth="1"
                    rx="1"
                  />
                </g>
              );
            })
          )}

          {/* SMA 20 Overlay Line */}
          {showSMA20 && (
            <path
              d={generatePath(sma20)}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.8"
            />
          )}

          {/* SMA 50 Overlay Line */}
          {showSMA50 && (
            <path
              d={generatePath(sma50)}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.8"
            />
          )}

          {/* Crosshair indicator on hover */}
          {activeIndex !== null && (
            <g>
              <line
                x1={getX(activeIndex)}
                y1={paddingTop}
                x2={getX(activeIndex)}
                y2={paddingTop + plotHeight}
                stroke="#38bdf8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={paddingLeft}
                y1={getY(activeCandle.close)}
                x2={svgWidth - paddingRight}
                y2={getY(activeCandle.close)}
                stroke="#38bdf8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={getX(activeIndex)}
                cy={getY(activeCandle.close)}
                r="4.5"
                fill="#00f0ff"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* ================= SUB CHART (RSI or MACD) ================= */}
          {subChart !== 'none' && (
            <g transform={`translate(0, ${mainChartHeight + 20})`}>
              <line
                x1={paddingLeft}
                y1={0}
                x2={svgWidth - paddingRight}
                y2={0}
                stroke="#172648"
                strokeWidth="1"
              />

              {subChart === 'rsi' ? (
                <>
                  <text x={paddingLeft} y={12} fill="#94a3b8" fontSize="10" fontWeight="bold">
                    RSI (14):{' '}
                    <tspan fill="#00f0ff">
                      {rsi[activeIndex] !== null ? rsi[activeIndex] : 'N/A'}
                    </tspan>
                  </text>

                  <line
                    x1={paddingLeft}
                    y1={14 + 80 * 0.3}
                    x2={svgWidth - paddingRight}
                    y2={14 + 80 * 0.3}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    strokeOpacity="0.7"
                  />
                  <text
                    x={svgWidth - paddingRight + 4}
                    y={14 + 80 * 0.3 + 3}
                    fill="#f43f5e"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    70 OB
                  </text>

                  <line
                    x1={paddingLeft}
                    y1={14 + 80 * 0.5}
                    x2={svgWidth - paddingRight}
                    y2={14 + 80 * 0.5}
                    stroke="#475569"
                    strokeDasharray="2 2"
                    strokeOpacity="0.5"
                  />

                  <line
                    x1={paddingLeft}
                    y1={14 + 80 * 0.7}
                    x2={svgWidth - paddingRight}
                    y2={14 + 80 * 0.7}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    strokeOpacity="0.7"
                  />
                  <text
                    x={svgWidth - paddingRight + 4}
                    y={14 + 80 * 0.7 + 3}
                    fill="#10b981"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    30 OS
                  </text>

                  {/* RSI line */}
                  {(() => {
                    let path = '';
                    let started = false;
                    for (let i = 0; i < rsi.length; i++) {
                      const val = rsi[i];
                      if (val !== null) {
                        const rx = getX(i);
                        const ry = 14 + 80 * (1 - val / 100);
                        if (!started) {
                          path += `M ${rx.toFixed(1)} ${ry.toFixed(1)}`;
                          started = true;
                        } else {
                          path += ` L ${rx.toFixed(1)} ${ry.toFixed(1)}`;
                        }
                      }
                    }
                    return (
                      <path
                        d={path}
                        fill="none"
                        stroke="#00f0ff"
                        strokeWidth="1.8"
                      />
                    );
                  })()}

                  {rsi[activeIndex] !== null && (
                    <circle
                      cx={getX(activeIndex)}
                      cy={14 + 80 * (1 - rsi[activeIndex]! / 100)}
                      r="3.5"
                      fill="#22d3ee"
                    />
                  )}
                </>
              ) : (
                <>
                  <text x={paddingLeft} y={12} fill="#94a3b8" fontSize="10" fontWeight="bold">
                    MACD (12, 26, 9) | Line:{' '}
                    <tspan fill="#38bdf8">{macd.macdLine[activeIndex] ?? 'N/A'}</tspan> | Sig:{' '}
                    <tspan fill="#fbbf24">{macd.signalLine[activeIndex] ?? 'N/A'}</tspan>
                  </text>

                  <line
                    x1={paddingLeft}
                    y1={55}
                    x2={svgWidth - paddingRight}
                    y2={55}
                    stroke="#334155"
                    strokeDasharray="2 2"
                  />

                  {macd.histogram.map((h, i) => {
                    if (h === null) return null;
                    const x = getX(i);
                    const barW = Math.max(2, (plotWidth / count) * 0.6);
                    const hScaled = Math.min(35, Math.abs(h) * 8);
                    const y = h >= 0 ? 55 - hScaled : 55;
                    return (
                      <rect
                        key={`hist-${i}`}
                        x={x - barW / 2}
                        y={y}
                        width={barW}
                        height={hScaled}
                        fill={h >= 0 ? '#10b981' : '#f43f5e'}
                        opacity="0.8"
                      />
                    );
                  })}
                </>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Quick Indicator Callout Button for Chat */}
      <div className="mt-3 pt-2 border-t border-[#162544] flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          Tip: Hover over candles to inspect historical signals on that date.
        </span>
        <button
          onClick={() =>
            onAskAboutIndicator(
              'RSI and Moving Averages',
              `Read the signals for ${stock.symbol}: RSI is currently ${rsi[activeIndex] ?? 'N/A'}, Price is ₹${Number(activeCandle?.close ?? 0).toFixed(2)}, SMA 20 is ₹${sma20[activeIndex] ?? 'N/A'}. What is the candlestick signal setup?`
            )
          }
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 flex items-center gap-1 transition"
        >
          Ask Candlestick AI to Decode Current Setup &rarr;
        </button>
      </div>
    </div>
  );
};
