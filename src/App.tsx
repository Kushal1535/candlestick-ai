/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { SAMPLE_STOCKS } from './data/sampleStocks';
import { 
  SampleStock, 
  VirtualPortfolio, 
  ChatMessage, 
  VirtualHolding, 
  VirtualTransaction,
  MarketQuote 
} from './types/trading';
import { calculateSMA, calculateRSI } from './utils/indicators';
import { Header } from './components/Header';
import { StockSelector } from './components/StockSelector';
import { StockChart } from './components/StockChart';
import { TechnicalIndicatorsPanel } from './components/TechnicalIndicatorsPanel';
import { PaperTradingPanel } from './components/PaperTradingPanel';
import { PortfolioPerformance } from './components/PortfolioPerformance';
import { ChatbotPanel } from './components/ChatbotPanel';
import { EducationalModal } from './components/EducationalModal';
import { ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { CandlestickLogo } from './components/CandlestickLogo';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Candlestick AI ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('candlestick_ai_virtual_portfolio_inr');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050c1a] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0a152d] border border-cyan-500/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex justify-center">
              <CandlestickLogo size={54} />
            </div>
            <h2 className="text-lg font-bold text-white">Candlestick AI</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Read the market, understand the signals. We encountered an unexpected rendering condition. Click below to refresh your session.
            </p>
            <div className="p-2.5 bg-[#050b16] rounded-lg text-[11px] font-mono text-rose-300 text-left overflow-auto max-h-24 border border-[#162544]">
              {this.state.error?.message || 'Unknown render error'}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-950/50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Reload Candlestick AI</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initial ₹10,00,000 (10 Lakhs INR) fictional funds
const INITIAL_PORTFOLIO: VirtualPortfolio = {
  cash: 1000000,
  initialCash: 1000000,
  holdings: {},
  transactions: [],
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg',
    sender: 'assistant',
    text: `Hello, I'm Candlestick AI, your AI-powered market analysis assistant.

**Tagline:** *Read the market, understand the signals.*

I synthesize real-world Indian equity feeds from the **National Stock Exchange (NSE)** and **Bombay Stock Exchange (BSE)** with neural technical analysis to decode market behavior for you.

#### ⚡ What you can analyze right now:
- **Price Action & Candlestick Signals:** Inspect daily high/low wick rejections, momentum bars, and trend consolidation on **Nifty 50 (^NSEI)**, **Reliance (RELIANCE.NS)**, **TCS**, and all NSE equities.
- **Quantitative Technicals in ₹ INR:** Review verified 20/50-day **SMAs**, 14-day **RSI**, and pivot **Support/Resistance** calculated mathematically in application code.
- **Risk-Free Paper Trading:** Execute simulated orders with **₹10,00,000 in virtual paper cash** to test position sizing and stop-loss strategies safely.

Select any instrument above, search any NSE/BSE stock ticker, or pick one of the signal prompts below to start decoding the market!`,
    timestamp: 'Just now',
    suggestedFollowUps: [
      'Analyze Nifty 50 trend and key support levels',
      'What is the RSI of Reliance on NSE and what does it indicate?',
      'How do I read candlestick wicks and rejection signals?',
    ],
  },
];

function MainApp() {
  const [stocksList, setStocksList] = useState<SampleStock[]>(SAMPLE_STOCKS);
  const [selectedStock, setSelectedStock] = useState<SampleStock>(() => SAMPLE_STOCKS[0]);
  const [liveQuote, setLiveQuote] = useState<MarketQuote | null>(null);
  const [isLoadingLiveQuote, setIsLoadingLiveQuote] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);

  // Virtual Paper Portfolio State in ₹ INR
  const [portfolio, setPortfolio] = useState<VirtualPortfolio>(() => {
    try {
      const saved = localStorage.getItem('candlestick_ai_virtual_portfolio_inr') || localStorage.getItem('tradewise_virtual_portfolio_inr');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            cash: typeof parsed.cash === 'number' ? parsed.cash : 1000000,
            initialCash: typeof parsed.initialCash === 'number' ? parsed.initialCash : 1000000,
            holdings: parsed.holdings && typeof parsed.holdings === 'object' ? parsed.holdings : {},
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          };
        }
      }
    } catch (e) {
      console.warn('Could not load portfolio from storage:', e);
    }
    return INITIAL_PORTFOLIO;
  });

  useEffect(() => {
    try {
      localStorage.setItem('candlestick_ai_virtual_portfolio_inr', JSON.stringify(portfolio));
    } catch (e) {
      console.warn('Could not save portfolio to storage:', e);
    }
  }, [portfolio]);

  // Fetch real quote & historical candles whenever selectedStock changes
  const fetchLiveInstrumentData = useCallback(async (symbol: string) => {
    setIsLoadingLiveQuote(true);
    try {
      // 1. Fetch Quote
      const quoteRes = await fetch(`/api/market/quote/${encodeURIComponent(symbol)}`);
      let fetchedQuote: MarketQuote | null = null;
      if (quoteRes.ok) {
        fetchedQuote = await quoteRes.json();
        setLiveQuote(fetchedQuote);
      }

      // 2. Fetch History Candles
      const histRes = await fetch(`/api/market/history/${encodeURIComponent(symbol)}?range=3mo&interval=1d`);
      if (histRes.ok) {
        const histData = await histRes.json();
        if (histData.candles && histData.candles.length > 0) {
          setSelectedStock((prev) => ({
            ...prev,
            data: histData.candles,
            quote: fetchedQuote || prev.quote,
          }));

          // Also update in stock list
          setStocksList((prev) =>
            prev.map((s) =>
              s.symbol === symbol
                ? { ...s, data: histData.candles, quote: fetchedQuote || s.quote }
                : s
            )
          );
        }
      }
    } catch (err) {
      console.warn('Could not fetch live market data for', symbol, err);
    } finally {
      setIsLoadingLiveQuote(false);
    }
  }, []);

  // Initial fetch on mount for default selected stock
  useEffect(() => {
    if (selectedStock?.symbol) {
      fetchLiveInstrumentData(selectedStock.symbol);
    }
  }, [selectedStock.symbol, fetchLiveInstrumentData]);

  const [searchError, setSearchError] = useState<string | null>(null);

  // Handle custom Indian symbol search (e.g. "Fineotex", "SBIN", "ITC", "WIPRO")
  const handleSearchSymbol = async (customSymbol: string) => {
    setIsLoadingLiveQuote(true);
    setSearchError(null);
    try {
      const quoteRes = await fetch(`/api/market/quote/${encodeURIComponent(customSymbol)}`);
      if (!quoteRes.ok) {
        const errData = await quoteRes.json().catch(() => ({}));
        throw new Error(errData.error || `Symbol or company '${customSymbol}' not found on NSE/BSE.`);
      }

      const quote: MarketQuote = await quoteRes.json();
      if (!quote || quote.price === 0 && quote.dataStatus === 'unavailable') {
        throw new Error(quote?.errorMessage || `No market quote available for '${customSymbol}'.`);
      }

      const histRes = await fetch(`/api/market/history/${encodeURIComponent(quote.symbol)}?range=3mo&interval=1d`);
      const histData = histRes.ok ? await histRes.json() : { candles: [] };

      const newStock: SampleStock = {
        symbol: quote.symbol,
        name: quote.name || quote.symbol,
        exchange: quote.exchange,
        sector: 'Indian Equities',
        description: `Market data retrieved from ${quote.marketSource}.`,
        learningFocus: `Analyzing candlestick patterns, momentum and support/resistance on ${quote.symbol}.`,
        data: histData.candles && histData.candles.length > 0 ? histData.candles : selectedStock.data,
        quote,
      };

      // Add to stocks list if not already present
      setStocksList((prev) => {
        const exists = prev.some((s) => s.symbol === quote.symbol);
        return exists ? prev.map(s => s.symbol === quote.symbol ? newStock : s) : [newStock, ...prev];
      });

      setSelectedStock(newStock);
      setLiveQuote(quote);
    } catch (err: any) {
      console.warn('Symbol lookup failed:', err.message);
      setSearchError(err?.message || 'Symbol lookup failed.');
    } finally {
      setIsLoadingLiveQuote(false);
    }
  };

  // Current selected stock technical readings
  const closingPrices = useMemo(() => (selectedStock?.data || []).map((c) => c.close), [selectedStock]);
  const currentPrice = liveQuote ? liveQuote.price : (closingPrices[closingPrices.length - 1] ?? 100);
  const prevPrice = liveQuote ? liveQuote.previousClose : (closingPrices[closingPrices.length - 2] || currentPrice);
  const changePercent = liveQuote ? liveQuote.changePercent : (prevPrice > 0 ? Number((((currentPrice - prevPrice) / prevPrice) * 100).toFixed(2)) : 0);

  const sma20Series = useMemo(() => calculateSMA(closingPrices, 20), [closingPrices]);
  const sma50Series = useMemo(() => calculateSMA(closingPrices, 50), [closingPrices]);
  const rsiSeries = useMemo(() => calculateRSI(closingPrices, 14), [closingPrices]);

  const currentSMA20 = sma20Series[sma20Series.length - 1] ?? null;
  const currentSMA50 = sma50Series[sma50Series.length - 1] ?? null;
  const currentRSI = rsiSeries[rsiSeries.length - 1] ?? null;

  // Send message to Gemini server-side endpoint
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsgId = 'usr-' + Date.now();
      const userMessage: ChatMessage = {
        id: userMsgId,
        sender: 'user',
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Build context package for Candlestick AI in ₹ INR
      const holdings = portfolio?.holdings || {};
      const totalHoldingsVal = Object.entries(holdings).reduce((sum, [sym, hold]) => {
        return sum + (hold.shares || 0) * (sym === selectedStock.symbol ? currentPrice : (hold.averageBuyPrice || 0));
      }, 0);

      const context = {
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        exchange: selectedStock.exchange,
        currentPrice,
        changePercent,
        rsi: currentRSI,
        sma20: currentSMA20,
        sma50: currentSMA50,
        dataStatus: liveQuote?.dataStatus || 'delayed',
        marketSource: liveQuote?.marketSource || 'NSE/BSE Feeds',
        portfolio: {
          cash: portfolio.cash,
          totalValue: portfolio.cash + totalHoldingsVal,
          holdingCount: Object.keys(holdings).length,
        },
      };

      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text.trim(),
            history,
            context,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned error (${response.status})`);
        }

        const data = await response.json();

        const assistantMsg: ChatMessage = {
          id: 'bot-' + Date.now(),
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
          suggestedFollowUps: data.suggestedFollowUps,
          contextStock: selectedStock.symbol,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        console.error('Failed to receive response from Candlestick AI:', err);
        const errMsg = err?.message || 'Network error connecting to AI market tutor.';
        setError(errMsg);

        const errorResponse: ChatMessage = {
          id: 'bot-err-' + Date.now(),
          sender: 'assistant',
          text: `⚠️ **Unable to connect to Candlestick AI analyst:** ${errMsg} \n\nPlease verify your connection and try asking again!`,
          timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };
        setMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      portfolio,
      selectedStock,
      currentPrice,
      changePercent,
      currentRSI,
      currentSMA20,
      currentSMA50,
      liveQuote,
      messages,
    ]
  );

  // Virtual paper order execution in ₹ INR
  const handleExecuteTrade = useCallback(
    (
      symbol: string,
      stockName: string,
      type: 'BUY' | 'SELL',
      shares: number,
      price: number
    ): { success: boolean; message: string } => {
      const cost = Number((shares * price).toFixed(2));
      const currentCash = portfolio?.cash ?? 1000000;
      const holdings = portfolio?.holdings || {};

      if (type === 'BUY') {
        if (cost > currentCash) {
          return {
            success: false,
            message: `Virtual cash insufficient! You need ₹${cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, but only have ₹${currentCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          };
        }

        const currentHold = holdings[symbol];
        let updatedHolding: VirtualHolding;

        if (currentHold) {
          const totalShares = currentHold.shares + shares;
          const totalSpent = currentHold.totalCost + cost;
          const avgPrice = Number((totalSpent / totalShares).toFixed(2));
          updatedHolding = {
            symbol,
            name: stockName,
            shares: totalShares,
            averageBuyPrice: avgPrice,
            totalCost: totalSpent,
          };
        } else {
          updatedHolding = {
            symbol,
            name: stockName,
            shares,
            averageBuyPrice: price,
            totalCost: cost,
          };
        }

        const newTx: VirtualTransaction = {
          id: 'tx-' + Date.now(),
          timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) + ' IST',
          symbol,
          type: 'BUY',
          shares,
          price,
          totalAmount: cost,
          status: 'SIMULATED FILL',
        };

        setPortfolio((prev) => ({
          ...prev,
          cash: Number((prev.cash - cost).toFixed(2)),
          holdings: {
            ...prev.holdings,
            [symbol]: updatedHolding,
          },
          transactions: [...(prev.transactions || []), newTx],
        }));

        return {
          success: true,
          message: `Simulated BUY of ${shares} shares of ${symbol} executed at ₹${price.toFixed(2)} (Total: ₹${cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).`,
        };
      } else {
        // SELL
        const currentHold = holdings[symbol];
        if (!currentHold || currentHold.shares < shares) {
          return {
            success: false,
            message: `You do not own ${shares} shares of ${symbol} to sell.`,
          };
        }

        const proceeds = cost;
        const remainingShares = currentHold.shares - shares;
        const newHoldings = { ...holdings };

        if (remainingShares <= 0) {
          delete newHoldings[symbol];
        } else {
          const costReduction = (currentHold.totalCost / currentHold.shares) * shares;
          newHoldings[symbol] = {
            ...currentHold,
            shares: remainingShares,
            totalCost: Number((currentHold.totalCost - costReduction).toFixed(2)),
          };
        }

        const newTx: VirtualTransaction = {
          id: 'tx-' + Date.now(),
          timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) + ' IST',
          symbol,
          type: 'SELL',
          shares,
          price,
          totalAmount: proceeds,
          status: 'SIMULATED FILL',
        };

        setPortfolio((prev) => ({
          ...prev,
          cash: Number((prev.cash + proceeds).toFixed(2)),
          holdings: newHoldings,
          transactions: [...(prev.transactions || []), newTx],
        }));

        return {
          success: true,
          message: `Simulated SELL of ${shares} shares of ${symbol} executed at ₹${price.toFixed(2)} (Proceeds: +₹${proceeds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).`,
        };
      }
    },
    [portfolio]
  );

  // Reset virtual paper portfolio back to ₹10,00,000
  const handleResetPortfolio = useCallback(() => {
    if (window.confirm('Reset virtual paper portfolio back to initial ₹10,00,000 fictional cash?')) {
      setPortfolio(INITIAL_PORTFOLIO);
      localStorage.removeItem('candlestick_ai_virtual_portfolio_inr');
    }
  }, []);

  // Clear chat conversation
  const handleClearChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setError(null);
  }, []);

  // Retry last failed prompt
  const handleRetryLast = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.text);
    }
  }, [messages, handleSendMessage]);

  const activeDataStatus = liveQuote?.dataStatus || 'delayed';
  const activeMarketSource = liveQuote?.marketSource || 'NSE/BSE Market Data Feed';

  return (
    <div className="min-h-screen bg-[#050c1a] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* App Header */}
      <Header
        portfolio={portfolio}
        dataStatus={activeDataStatus}
        marketSource={activeMarketSource}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onResetPortfolio={handleResetPortfolio}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Indian Stock Case-Study & Symbol Search Selector */}
        <StockSelector
          stocks={stocksList}
          selectedStock={selectedStock}
          liveQuote={liveQuote}
          isLoadingLiveQuote={isLoadingLiveQuote}
          searchError={searchError}
          onSelectStock={(stk) => {
            setSelectedStock(stk);
            fetchLiveInstrumentData(stk.symbol);
          }}
          onSearchSymbol={handleSearchSymbol}
          onAskAboutStock={(stk) =>
            handleSendMessage(
              `Read the candlestick signals and provide a technical analysis breakdown for ${stk.symbol} (${stk.name}) on the Indian market. What are the key support/resistance levels and trend indicators?`
            )
          }
        />

        {/* 2-Column Responsive Layout: Market Tools (Left) & Chatbot Tutor (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Chart, Quantitative Indicators & Paper Simulator */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Interactive Candlestick / Line Chart */}
            <StockChart
              stock={selectedStock}
              liveQuote={liveQuote}
              onAskAboutIndicator={(indicatorName, contextSummary) =>
                handleSendMessage(
                  `Read the signals: Explain ${indicatorName} on ${selectedStock.symbol} in the Indian market context: ${contextSummary}`
                )
              }
            />

            {/* Calculated Technical Indicators Panel */}
            <TechnicalIndicatorsPanel
              stock={selectedStock}
              liveQuote={liveQuote}
              onAskAboutIndicator={(_indicatorName, contextSummary) =>
                handleSendMessage(contextSummary)
              }
            />

            {/* Portfolio Performance Progress & Allocation Component */}
            <PortfolioPerformance
              portfolio={portfolio}
              selectedStock={selectedStock}
              liveQuote={liveQuote}
              onAskAIReview={(promptText) => handleSendMessage(promptText)}
              onResetPortfolio={handleResetPortfolio}
            />

            {/* Virtual Paper-Trading Simulator in ₹ INR */}
            <PaperTradingPanel
              stock={selectedStock}
              liveQuote={liveQuote}
              portfolio={portfolio}
              onExecuteTrade={handleExecuteTrade}
              onResetPortfolio={handleResetPortfolio}
              onAskAboutRiskManagement={(tradeSummary) => handleSendMessage(tradeSummary)}
            />
          </div>

          {/* Right Column: Candlestick AI Chatbot Analyst (Sticky on Desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
            <ChatbotPanel
              messages={messages}
              isLoading={isLoading}
              error={error}
              selectedStock={selectedStock}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              onRetryLast={handleRetryLast}
            />
          </div>
        </div>
      </main>

      {/* Educational & Risk Disclosures Footer in Midnight Navy */}
      <footer className="mt-auto border-t border-[#121f38] bg-[#030812] py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-cyan-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Candlestick AI — Read the market, understand the signals</span>
          </div>
          <p className="leading-relaxed">
            Candlestick AI is an educational market research platform. Quotes for Indian equities (NSE & BSE) reflect delayed or EOD data provided by authorized public market-data vendors. Virtual portfolio balances use fictional ₹ INR funds. Candlestick AI is not a broker, does not route live orders to exchanges, and is not a SEBI-registered Research Analyst (RA) or Investment Advisor (RIA).
          </p>
          <p className="text-slate-400">
            Market investments are subject to market risks. Read all scheme and offer documents carefully. Past simulated results do not guarantee real financial returns.
          </p>
        </div>
      </footer>

      {/* Indian Market Knowledge Base Modal */}
      <EducationalModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        onAskQuestion={handleSendMessage}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
