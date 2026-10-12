import React, { useState, useEffect, useCallback } from 'react';
import { NewsArticle, NewsResponse } from '../types/trading';
import { 
  Newspaper, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  TrendingUp,
  Tag
} from 'lucide-react';

interface MarketNewsProps {
  onAskAboutNews: (headline: string, publisher: string) => void;
}

export const MarketNews: React.FC<MarketNewsProps> = ({ onAskAboutNews }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [sourceAttribution, setSourceAttribution] = useState<string>('Indian Financial Media Feed');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'NIFTY 50' | 'SENSEX' | 'MACRO'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (query: string = 'Nifty 50 Indian stock market') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/news?query=${encodeURIComponent(query)}&count=10`);
      if (!res.ok) {
        throw new Error(`Failed to load news (status ${res.status})`);
      }
      const data: NewsResponse = await res.json();
      setArticles(data.articles || []);
      setSourceAttribution(data.source || 'Financial News Syndicate');
      setLastUpdated(
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' IST'
      );
    } catch (err: any) {
      console.warn('Could not fetch market news:', err);
      setError(err?.message || 'Unable to load real-time headlines.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews('Nifty 50 Indian stock market');
  }, [fetchNews]);

  // Filter articles by category
  const filteredArticles = articles.filter((a) => {
    if (selectedCategory === 'ALL') return true;
    return a.category === selectedCategory;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>🇮🇳</span> Market News & Headlines
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE HEADLINES
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-world financial reporting covering Nifty 50, Sensex, and macroeconomic developments
            </p>
          </div>
        </div>

        {/* Refresh & Timestamp */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastUpdated && (
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{lastUpdated}</span>
            </span>
          )}
          <button
            onClick={() => fetchNews(selectedCategory === 'ALL' ? 'Nifty 50 Indian stock market' : selectedCategory)}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition disabled:opacity-50"
            title="Refresh Headlines"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {(['ALL', 'NIFTY 50', 'SENSEX', 'MACRO'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
            }`}
          >
            {cat === 'ALL' ? 'All Headlines' : cat}
          </button>
        ))}
      </div>

      {/* Content Stream */}
      {isLoading && articles.length === 0 ? (
        <div className="space-y-2.5 py-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 animate-pulse space-y-2">
              <div className="h-3 bg-slate-700/60 rounded w-3/4" />
              <div className="h-2.5 bg-slate-700/40 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : error && articles.length === 0 ? (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 text-center space-y-2">
          <p>{error}</p>
          <button
            onClick={() => fetchNews()}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded text-[11px] font-semibold transition"
          >
            Retry News Feed
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 rounded-lg p-3 transition flex flex-col justify-between group"
            >
              <div>
                {/* Meta Bar */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-mono">
                  <span className="font-semibold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/50">
                    {article.publisher}
                  </span>
                  <span>{article.publishedTimeAgo}</span>
                </div>

                {/* Headline Title */}
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition line-clamp-2 leading-snug flex items-start gap-1"
                >
                  <span>{article.title}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition" />
                </a>
              </div>

              {/* Action & Tags Footer */}
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5" />
                    {article.category}
                  </span>
                  {article.relatedTickers.slice(0, 2).map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono bg-slate-900 text-slate-400 px-1 py-0.2 rounded border border-slate-800"
                    >
                      {t.replace('.NS', '')}
                    </span>
                  ))}
                </div>

                {/* Ask AI Button */}
                <button
                  onClick={() => onAskAboutNews(article.title, article.publisher)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline shrink-0"
                  title="Ask TradeWise AI to analyze the impact of this headline on Indian stocks"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Ask AI Impact</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attribution Footer */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
        <span>Source: {sourceAttribution}</span>
        <span>Free public market news aggregator</span>
      </div>
    </div>
  );
};
