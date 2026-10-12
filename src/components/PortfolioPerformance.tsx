import React from 'react';
import { VirtualPortfolio, SampleStock, MarketQuote } from '../types/trading';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart, 
  Sparkles,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface PortfolioPerformanceProps {
  portfolio: VirtualPortfolio;
  selectedStock: SampleStock;
  liveQuote?: MarketQuote | null;
  onAskAIReview: (prompt: string) => void;
  onResetPortfolio: () => void;
}

export const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({
  portfolio,
  selectedStock,
  liveQuote,
  onAskAIReview,
  onResetPortfolio,
}) => {
  const initialCash = typeof portfolio?.initialCash === 'number' && portfolio.initialCash > 0 
    ? portfolio.initialCash 
    : 1000000;
  const cash = typeof portfolio?.cash === 'number' ? portfolio.cash : 1000000;
  const holdings = portfolio?.holdings || {};
  const transactions = portfolio?.transactions || [];

  const activePrice = liveQuote ? liveQuote.price : (selectedStock?.data?.slice(-1)[0]?.close ?? 100);

  // Total current market value of all held stocks
  const totalHoldingsValue = Object.entries(holdings).reduce((sum, [sym, hold]) => {
    const price = sym === selectedStock?.symbol ? activePrice : (hold.averageBuyPrice || 0);
    return sum + (hold.shares || 0) * price;
  }, 0);

  const totalPortfolioValue = Number((cash + totalHoldingsValue).toFixed(2));
  const netPL = Number((totalPortfolioValue - initialCash).toFixed(2));
  const netPLPercent = Number(((netPL / initialCash) * 100).toFixed(2));
  const isPositive = netPL >= 0;

  // Capital allocation percentages
  const investedPercent = totalPortfolioValue > 0 
    ? Math.min(100, Math.max(0, Number(((totalHoldingsValue / totalPortfolioValue) * 100).toFixed(1))))
    : 0;
  const cashPercent = Number((100 - investedPercent).toFixed(1));

  // Progress relative to starting baseline (100% = ₹10 Lakhs)
  // Scaled from 50% to 150% visual span (or clamped)
  const performanceRatio = (totalPortfolioValue / initialCash) * 100;
  const clampedProgress = Math.min(100, Math.max(5, (performanceRatio / 120) * 100));

  const buyFills = transactions.filter((t) => t.type === 'BUY').length;
  const sellFills = transactions.filter((t) => t.type === 'SELL').length;

  return (
    <div className="bg-[#070e1e] border border-[#162544] rounded-xl p-4 shadow-xl shadow-black/40">
      {/* Header with Title and Session Gain/Loss */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#162544]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Portfolio Performance</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                ₹10,00,000 BASELINE
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">
              Live equity tracking & capital utilization since session inception
            </p>
          </div>
        </div>

        {/* Big P&L Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-md ${
              isPositive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300 shadow-rose-950/40'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
            <span>
              {isPositive ? '+' : ''}₹{netPL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] opacity-90">
              ({isPositive ? '+' : ''}{netPLPercent}%)
            </span>
          </div>

          <button
            onClick={onResetPortfolio}
            className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-[#122244] rounded-lg transition"
            title="Reset Portfolio to ₹10,00,000"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Numerical Metrics 4-Col Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-3.5">
        {/* Total Value */}
        <div className="bg-[#09142b] border border-[#172748] rounded-lg p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Account Equity
          </span>
          <span className="font-mono text-base font-black text-white">
            ₹{totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-300 block mt-0.5">
            Initial: ₹{initialCash.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Liquid Cash */}
        <div className="bg-[#09142b] border border-[#172748] rounded-lg p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
            <Wallet className="w-3 h-3 text-emerald-400" /> Liquid Cash
          </span>
          <span className="font-mono text-base font-black text-emerald-300">
            ₹{cash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-300 block mt-0.5">
            {cashPercent}% of total funds
          </span>
        </div>

        {/* Invested Holdings Value */}
        <div className="bg-[#09142b] border border-[#172748] rounded-lg p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Invested in Stocks
          </span>
          <span className="font-mono text-base font-black text-cyan-300">
            ₹{totalHoldingsValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-300 block mt-0.5">
            {investedPercent}% allocated ({Object.keys(holdings).length} stocks)
          </span>
        </div>

        {/* Simulated Trades Executed */}
        <div className="bg-[#09142b] border border-[#172748] rounded-lg p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Session Fills
          </span>
          <span className="font-mono text-base font-black text-slate-200">
            {transactions.length} Trades
          </span>
          <span className="text-[10px] text-slate-300 block mt-0.5">
            {buyFills} Buys • {sellFills} Sells
          </span>
        </div>
      </div>

      {/* Visual Progress Bar: Current Value vs ₹10 Lakh Baseline */}
      <div className="space-y-1.5 my-3">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-300 flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">Equity vs. Baseline Progress:</span>
            <span className="text-white font-bold">{performanceRatio.toFixed(2)}% of Baseline</span>
          </span>
          <span className={isPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {isPositive ? '▲ Capital Expansion' : '▼ Capital Drawdown'}
          </span>
        </div>

        {/* Dual Layer Progress Bar */}
        <div className="relative w-full h-4 bg-[#050c18] rounded-full overflow-hidden border border-[#17294d] p-0.5">
          {/* 100% Baseline Vertical Marker (at ~83.3% of 120% scale) */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400/80 z-20 shadow-[0_0_6px_#00f0ff]"
            style={{ left: `${(100 / 120) * 100}%` }}
            title="₹10,00,000 Baseline (100%)"
          />

          {/* Progress Fill */}
          <div
            className={`h-full rounded-full transition-all duration-700 relative z-10 ${
              isPositive
                ? 'bg-gradient-to-r from-cyan-500 via-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
            }`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>₹6,00,000 (-40%)</span>
          <span className="text-cyan-300 font-semibold">| ₹10,00,000 Starting Baseline (100%)</span>
          <span>₹12,00,000 (+20%)</span>
        </div>
      </div>

      {/* Capital Distribution Breakdown Bar (Cash vs Invested) */}
      <div className="bg-[#050c18] border border-[#152442] rounded-lg p-2.5 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex-1">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">Asset Allocation Breakdown:</span>
            <span className="font-mono text-slate-400">
              <strong className="text-emerald-300">Cash: {cashPercent}%</strong> |{' '}
              <strong className="text-cyan-300">Equities: {investedPercent}%</strong>
            </span>
          </div>

          <div className="w-full h-2 bg-[#09142b] rounded-full overflow-hidden flex border border-[#1b2b4d]">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${cashPercent}%` }}
              title={`Liquid Cash: ${cashPercent}%`}
            />
            <div
              className="h-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${investedPercent}%` }}
              title={`Invested Equities: ${investedPercent}%`}
            />
          </div>
        </div>

        {/* AI Portfolio Audit Button */}
        <button
          onClick={() =>
            onAskAIReview(
              `Please evaluate my Candlestick AI virtual portfolio performance:
- Total Account Value: ₹${totalPortfolioValue.toLocaleString('en-IN')}
- Starting Baseline: ₹${initialCash.toLocaleString('en-IN')}
- Net P&L: ₹${netPL.toLocaleString('en-IN')} (${netPLPercent}%)
- Cash Allocation: ₹${cash.toLocaleString('en-IN')} (${cashPercent}%)
- Active Stock Positions: ${Object.keys(holdings).length} stocks (Total ₹${totalHoldingsValue.toLocaleString('en-IN')})
What risk management advice and position sizing recommendations do you have for my current Indian market setup?`
            )
          }
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b1b38] hover:bg-[#122850] text-cyan-300 border border-cyan-500/30 transition text-xs font-semibold shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Audit Portfolio with AI</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
        <span>
          Paper-trading performance is tracked in simulated Indian Rupees (₹) with zero real capital risk.
        </span>
      </div>
    </div>
  );
};
