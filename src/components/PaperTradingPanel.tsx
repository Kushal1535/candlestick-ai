import React, { useState } from 'react';
import { SampleStock, VirtualPortfolio, MarketQuote } from '../types/trading';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  AlertCircle,
  CheckCircle2,
  Briefcase
} from 'lucide-react';

interface PaperTradingPanelProps {
  stock: SampleStock;
  liveQuote?: MarketQuote | null;
  portfolio: VirtualPortfolio;
  onExecuteTrade: (
    symbol: string,
    stockName: string,
    type: 'BUY' | 'SELL',
    shares: number,
    price: number
  ) => { success: boolean; message: string };
  onResetPortfolio: () => void;
  onAskAboutRiskManagement: (tradeSummary: string) => void;
}

export const PaperTradingPanel: React.FC<PaperTradingPanelProps> = ({
  stock,
  liveQuote,
  portfolio,
  onExecuteTrade,
  onAskAboutRiskManagement,
}) => {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [sharesInput, setSharesInput] = useState<string>('10');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const candles = stock?.data || [];
  const latestPrice = liveQuote ? liveQuote.price : (candles[candles.length - 1]?.close ?? 100);
  const holdings = portfolio?.holdings || {};
  const transactions = portfolio?.transactions || [];
  const cash = typeof portfolio?.cash === 'number' ? portfolio.cash : 1000000;
  const initialCash = typeof portfolio?.initialCash === 'number' ? portfolio.initialCash : 1000000;

  const currentHolding = holdings[stock?.symbol || ''];
  const sharesOwned = currentHolding ? currentHolding.shares : 0;

  const sharesNumber = parseInt(sharesInput, 10) || 0;
  const totalCost = Number((sharesNumber * latestPrice).toFixed(2));

  // Max shares user can buy with remaining fictional INR cash
  const maxAffordableShares = Math.floor(cash / (latestPrice || 1));

  // Total portfolio market value calculation
  const totalHoldingsValue = Object.entries(holdings).reduce((sum, [sym, hold]) => {
    return sum + (hold.shares || 0) * (sym === stock?.symbol ? latestPrice : (hold.averageBuyPrice || 0));
  }, 0);
  const totalAccountValue = cash + totalHoldingsValue;
  const totalProfitLoss = totalAccountValue - initialCash;
  const totalProfitLossPercent = initialCash > 0 ? (totalProfitLoss / initialCash) * 100 : 0;

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (sharesNumber <= 0) {
      setFeedback({ type: 'error', message: 'Please enter at least 1 share to trade.' });
      return;
    }

    if (tradeType === 'BUY' && totalCost > cash) {
      setFeedback({
        type: 'error',
        message: `Insufficient virtual cash. Estimated cost is ₹${totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, but you only have ₹${cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
      });
      return;
    }

    if (tradeType === 'SELL' && sharesNumber > sharesOwned) {
      setFeedback({
        type: 'error',
        message: `You only own ${sharesOwned} shares of ${stock?.symbol} to sell.`,
      });
      return;
    }

    const res = onExecuteTrade(stock.symbol, stock.name, tradeType, sharesNumber, latestPrice);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setSharesInput('5');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="bg-[#070e1e] border border-[#162544] rounded-xl p-4 shadow-xl shadow-black/40">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[#162544]">
        <div>
          <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
            <span>⚡</span> Candlestick AI Portfolio Simulator
          </span>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Virtual Execution & Position Sizing (₹ INR)</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              SIMULATED FILLS ONLY
            </span>
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Total Virtual Equity</span>
          <span className="font-mono text-base font-bold text-white">
            ₹{totalAccountValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            className={`text-[11px] font-mono font-semibold ml-2 ${
              totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalProfitLoss >= 0 ? '+' : ''}
            ₹{totalProfitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalProfitLossPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Simulator Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Order Ticket (Left 5 cols) */}
        <div className="lg:col-span-5 bg-[#09142b] border border-[#172748] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200">
              Order Ticket: <strong className="text-cyan-300">{stock?.symbol}</strong>
            </span>
            <span className="font-mono text-xs font-bold text-cyan-300">
              ₹{Number(latestPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / share
            </span>
          </div>

          {/* Buy / Sell Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-[#050c18] p-1 rounded-lg border border-[#14233e] mb-3">
            <button
              type="button"
              onClick={() => {
                setTradeType('BUY');
                setFeedback(null);
              }}
              className={`py-1.5 text-xs font-bold rounded-md transition ${
                tradeType === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simulated Buy (₹)
            </button>
            <button
              type="button"
              onClick={() => {
                setTradeType('SELL');
                setFeedback(null);
              }}
              className={`py-1.5 text-xs font-bold rounded-md transition ${
                tradeType === 'SELL'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simulated Sell (₹)
            </button>
          </div>

          {/* Order Form */}
          <form onSubmit={handleTrade} className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <label htmlFor="sharesInput" className="font-medium">Number of Shares (Qty)</label>
                <span className="text-slate-400">
                  {tradeType === 'BUY'
                    ? `Max: ${maxAffordableShares} shares`
                    : `Holding: ${sharesOwned} shares`}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  id="sharesInput"
                  type="number"
                  min="1"
                  max={tradeType === 'BUY' ? maxAffordableShares || 1 : sharesOwned || 1}
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value)}
                  className="w-full bg-[#050c18] border border-[#182a4d] rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setSharesInput(tradeType === 'BUY' ? String(Math.max(1, maxAffordableShares)) : String(sharesOwned))}
                  className="px-2.5 py-1 text-xs font-medium text-cyan-200 bg-[#0c1a38] hover:bg-[#122650] rounded-lg border border-cyan-500/30 transition"
                >
                  Max
                </button>
              </div>

              {/* Indian Market Lot Quick Buttons */}
              <div className="flex gap-1.5 mt-1.5">
                {['5', '10', '25', '50'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSharesInput(amt)}
                    className="flex-1 py-1 text-[11px] font-mono bg-[#0c1833] hover:bg-[#132752] text-cyan-200 rounded border border-[#1c3057] transition"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-[#050c18] rounded-lg p-2.5 border border-[#152440] text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Estimated Order Value:</span>
                <span className="text-white font-mono">
                  ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Virtual Cash Remaining:</span>
                <span className="text-slate-300 font-mono">
                  ₹{(tradeType === 'BUY' ? cash - totalCost : cash + totalCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-sans pt-1 border-t border-[#152440]">
                <span>Signal Execution:</span>
                <span className="text-cyan-400 text-[11px]">Instant Simulated Fill</span>
              </div>
            </div>

            {/* Status Feedback Banner */}
            {feedback && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-[#09221d] border border-emerald-500/40 text-emerald-200'
                    : 'bg-[#291218] border border-rose-500/40 text-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Submit Execution Button */}
            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                tradeType === 'BUY'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-950/50'
              }`}
            >
              {tradeType === 'BUY' ? (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Execute Simulated Buy (₹)</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Execute Simulated Sell (₹)</span>
                </>
              )}
            </button>
          </form>

          {/* Ask AI Risk Management Callout */}
          <button
            onClick={() =>
              onAskAboutRiskManagement(
                `Candlestick AI: I just executed a simulated ${tradeType} of ${sharesNumber} shares of ${stock.symbol} at ₹${latestPrice.toFixed(2)} (Total: ₹${totalCost.toFixed(2)}). How should I read the candlestick signals to place a stop-loss?`
              )
            }
            className="mt-3 w-full text-center text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition"
          >
            Ask Candlestick AI how to size & place stop-loss &rarr;
          </button>
        </div>

        {/* Holdings & Transaction History (Right 7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Holdings Section */}
          <div className="bg-[#09142b] border border-[#172748] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                Virtual Holdings
              </span>
              <span className="text-[11px] text-slate-400">
                {Object.keys(holdings).length} Positions Active
              </span>
            </div>

            {Object.keys(holdings).length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-[#172748] rounded-lg">
                No virtual stocks owned yet. Use the ticket on the left to simulate your first purchase!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-[#172748]">
                      <th className="pb-1.5 font-medium">Symbol</th>
                      <th className="pb-1.5 font-medium">Qty</th>
                      <th className="pb-1.5 font-medium">Avg Price</th>
                      <th className="pb-1.5 font-medium">Market Value</th>
                      <th className="pb-1.5 font-medium text-right">Unrealized P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#13223f]">
                    {Object.values(holdings).map((holding) => {
                      const curPrice = holding.symbol === stock?.symbol ? latestPrice : (holding.averageBuyPrice || 0);
                      const curVal = (holding.shares || 0) * curPrice;
                      const plDollar = curVal - (holding.totalCost || 0);
                      const plPercent = holding.totalCost > 0 ? (plDollar / holding.totalCost) * 100 : 0;
                      const isProfit = plDollar >= 0;

                      return (
                        <tr key={holding.symbol} className="font-mono text-slate-200">
                          <td className="py-2 font-bold text-white font-sans">{holding.symbol.replace('.NS', '')}</td>
                          <td className="py-2">{holding.shares}</td>
                          <td className="py-2">₹{Number(holding.averageBuyPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                          <td className="py-2">₹{curVal.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                          <td className={`py-2 text-right ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? '+' : ''}₹{plDollar.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ({plPercent.toFixed(1)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transactions Log Section */}
          <div className="bg-[#09142b] border border-[#172748] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                Simulated Transaction History
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {transactions.length} Fills Logged
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-[#172748] rounded-lg">
                No simulated executions recorded yet.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {transactions.slice(-6).reverse().map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 rounded bg-[#050c18] border border-[#152440] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          tx.type === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {tx.type}
                      </span>
                      <span className="font-bold text-white">{tx.symbol.replace('.NS', '')}</span>
                      <span className="text-slate-400 font-sans text-[11px]">
                        {tx.shares} @ ₹{Number(tx.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-bold">
                        ₹{Number(tx.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] text-cyan-400 uppercase bg-[#0c1a38] px-1 py-0.5 rounded font-sans border border-cyan-500/20">
                        Simulated
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
