import React, { useState, useEffect, useRef } from 'react';
import { SampleStock, MarketQuote } from '../types/trading';
import { Sparkles, Search, Info, Loader2, ArrowRight } from 'lucide-react';

interface SearchResultItem {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'INDEX';
  typeDisp?: string;
}

interface StockSelectorProps {
  stocks: SampleStock[];
  selectedStock: SampleStock;
  liveQuote?: MarketQuote | null;
  isLoadingLiveQuote: boolean;
  searchError?: string | null;
  onSelectStock: (stock: SampleStock) => void;
  onSearchSymbol: (customSymbol: string) => void;
  onAskAboutStock: (stock: SampleStock) => void;
}

export const StockSelector: React.FC<StockSelectorProps> = ({
  stocks,
  selectedStock,
  liveQuote,
  isLoadingLiveQuote,
  searchError,
  onSelectStock,
  onSearchSymbol,
  onAskAboutStock,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [localSearchError, setLocalSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced live search autocomplete as user types
  useEffect(() => {
    const query = searchInput.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn('Search autocomplete error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;

    setShowDropdown(false);
    setLocalSearchError(null);
    onSearchSymbol(clean);
  };

  const activeError = searchError || localSearchError;

  const handleSelectSuggestion = (item: SearchResultItem) => {
    setSearchInput(item.name || item.symbol);
    setShowDropdown(false);
    onSearchSymbol(item.symbol);
  };

  return (
    <div className="bg-[#070e1e] border border-[#162544] rounded-xl p-4 space-y-4 shadow-xl shadow-black/40">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-[#162544]">
        <div>
          <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
            <span>⚡</span> Real-World Indian Market Instruments (NSE & BSE)
          </span>
          <h2 className="text-sm font-semibold text-white">
            Select an Instrument or Search Any Indian Share (e.g. Fineotex, Reliance, Tata)
          </h2>
        </div>

        {/* Custom Stock Search Bar with Live Autocomplete */}
        <div className="flex items-center gap-2 relative" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search share e.g. Fineotex, SBIN, ITC..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                className="bg-[#0b1730] border border-[#1d3056] rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-mono w-56 sm:w-64 transition"
              />
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-2.5" />
              {isSearching && (
                <Loader2 className="w-3 h-3 text-cyan-400 absolute right-2.5 top-2.5 animate-spin" />
              )}
            </div>
            <button
              type="submit"
              disabled={isLoadingLiveQuote}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-cyan-950/40 flex items-center gap-1"
            >
              {isLoadingLiveQuote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Lookup</span>}
            </button>
          </form>

          {/* Autocomplete Dropdown List */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-10 left-0 right-14 bg-[#09152b] border border-cyan-500/40 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto overflow-x-hidden backdrop-blur-md">
              <div className="p-1.5 text-[10px] uppercase font-bold text-cyan-400/80 border-b border-[#14233e] px-2.5 flex justify-between">
                <span>Matching Indian Equities</span>
                <span>Click to Select</span>
              </div>
              <div className="divide-y divide-[#13233f]">
                {suggestions.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3 py-2 hover:bg-[#0e2042] transition flex items-center justify-between group"
                  >
                    <div className="truncate mr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-white group-hover:text-cyan-300">
                          {item.symbol}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-semibold">
                          {item.exchange}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">
                        {item.name}
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onAskAboutStock(selectedStock)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-[#0c1a38] hover:bg-[#122650] border border-cyan-500/30 rounded-lg transition shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Ask Candlestick AI</span>
          </button>
        </div>
      </div>

      {activeError && (
        <div className="p-2 bg-rose-950/60 border border-rose-500/30 rounded text-xs text-rose-300">
          {activeError}
        </div>
      )}

      {/* Preset Indian Instrument Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {stocks.map((stock) => {
          const isSelected = stock.symbol === selectedStock.symbol;
          const candles = stock.data || [];
          const latestCandle = candles[candles.length - 1] || { close: 100 };
          const prevCandle = candles[candles.length - 2] || latestCandle;

          const activeQuote = isSelected && liveQuote ? liveQuote : stock.quote;
          const currentPrice = activeQuote ? activeQuote.price : latestCandle.close;
          const change = activeQuote ? activeQuote.change : currentPrice - prevCandle.close;
          const changePercent = activeQuote
            ? activeQuote.changePercent
            : prevCandle.close
            ? Number(((change / prevCandle.close) * 100).toFixed(2))
            : 0;

          const isPositive = change >= 0;

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className={`p-2.5 rounded-lg text-left border transition relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0c1a38] border-cyan-500/80 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/50'
                  : 'bg-[#091329] border-[#162544] hover:bg-[#0e1c3a] hover:border-[#1e335c]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs text-white truncate mr-1" title={stock.symbol}>
                  {stock.symbol.replace('.NS', '')}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded shrink-0 ${
                    isPositive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {changePercent}%
                </span>
              </div>

              <div className="text-[10px] text-slate-300 truncate mb-1.5" title={stock.name}>
                {stock.name.split(' (')[0]}
              </div>

              <div className="flex items-baseline justify-between mt-auto pt-1 border-t border-[#162544]">
                <span className="font-mono text-xs font-bold text-slate-100">
                  ₹{Number(currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] font-mono text-cyan-400 font-semibold uppercase">
                  {stock.exchange || 'NSE'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Instrument Learning Focus & Exchange Metadata */}
      <div className="bg-[#091328] border border-[#172748] rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300">{selectedStock.name} ({selectedStock.symbol}): </strong>
            <span>{selectedStock.learningFocus}</span>
          </div>
        </div>

        {liveQuote && (
          <div className="text-[11px] text-slate-300 shrink-0 flex items-center gap-2 font-mono">
            <span className="px-2 py-0.5 rounded bg-[#060e1f] border border-[#162544] text-cyan-300">
              Source: {liveQuote.marketSource}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
