import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  BookOpen, 
  RotateCcw,
  Wallet,
  Clock,
  Radio,
  FileText
} from 'lucide-react';
import { VirtualPortfolio } from '../types/trading';
import { CandlestickLogo } from './CandlestickLogo';

interface HeaderProps {
  portfolio: VirtualPortfolio;
  dataStatus: 'live' | 'delayed' | 'historical' | 'unavailable';
  marketSource: string;
  onOpenGlossary: () => void;
  onResetPortfolio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  portfolio,
  dataStatus,
  marketSource,
  onOpenGlossary,
  onResetPortfolio,
}) => {
  const [istTime, setIstTime] = useState<string>('');
  const cashAmount = typeof portfolio?.cash === 'number' ? portfolio.cash : 1000000;

  // Real-time IST Clock
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const istString = now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        setIstTime(istString);
      } catch {
        setIstTime(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine if Indian market is in regular trading session (09:15 to 15:30 IST, Mon-Fri)
  const isMarketOpenIST = () => {
    try {
      const now = new Date();
      const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istDate.getDay();
      if (day === 0 || day === 6) return false;
      const hour = istDate.getHours();
      const min = istDate.getMinutes();
      const totalMins = hour * 60 + min;
      return totalMins >= 9 * 60 + 15 && totalMins <= 15 * 60 + 30;
    } catch {
      return false;
    }
  };

  const marketActive = isMarketOpenIST();

  return (
    <header className="border-b border-[#162544] bg-[#070e1e]/95 backdrop-blur sticky top-0 z-30 shadow-md shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Name, Logo & Tagline */}
        <div className="flex items-center gap-3">
          {/* Logo Concept: Candlestick bars integrated with AI neural network */}
          <CandlestickLogo size={42} />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center">
                <span>Candlestick</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 ml-1.5 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                  AI
                </span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shadow-sm">
                <span>🇮🇳</span> NSE & BSE
              </span>
            </div>
            {/* Tagline */}
            <p className="text-xs font-medium text-slate-300 hidden sm:block tracking-wide">
              Read the market, understand the signals.
            </p>
          </div>
        </div>

        {/* Right Action & Market Status */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* IST Market Hours Badge */}
          <div className="flex items-center gap-1.5 bg-[#0b1528] border border-[#1b2b4d] rounded-lg px-2.5 py-1.5 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">{istTime || 'IST Clock'}</span>
            <span
              className={`w-2 h-2 rounded-full ml-1 ${
                marketActive ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-500'
              }`}
              title={marketActive ? 'NSE/BSE Market Session Active' : 'NSE/BSE Market Session Closed (09:15 - 15:30 IST)'}
            />
          </div>

          {/* Feed & Market Status Indicator */}
          <div className="flex items-center gap-1.5 bg-[#0b1528] border border-[#1b2b4d] rounded-lg px-2.5 py-1.5 text-xs">
            <Radio className={`w-3 h-3 ${marketActive ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className="text-[10px] uppercase font-bold text-slate-400">Feed:</span>
            <span
              className={`font-semibold uppercase text-[11px] ${
                marketActive
                  ? 'text-emerald-400'
                  : 'text-cyan-300'
              }`}
            >
              {marketActive ? 'OPEN (15-MIN DELAYED)' : 'CLOSED (OFFICIAL EOD PRICE)'}
            </span>
          </div>

          {/* Virtual Paper Balance (₹ INR) */}
          <div className="flex items-center gap-2 bg-[#0b1528] border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs shadow-sm">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Simulated Cash</span>
              <span className="text-emerald-300 font-bold font-mono text-sm">
                ₹{cashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Guide Button */}
          <button
            onClick={onOpenGlossary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#0c1830] hover:bg-[#122244] hover:text-cyan-300 rounded-lg border border-[#1c2e54] transition shadow-sm"
            title="Open Market Guide & Candlestick Signal Glossary"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Guide</span>
          </button>

          {/* Project Report Button */}
          <a
            href="/report"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-[#0a202e] hover:bg-[#0e2c40] rounded-lg border border-emerald-500/40 transition shadow-sm"
            title="Open Complete Project Report & Documentation"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Report</span>
          </a>

          {/* Reset Portfolio Button */}
          <button
            onClick={onResetPortfolio}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-[#0c1830]/60 hover:bg-[#152547] hover:text-rose-300 rounded-lg border border-[#1c2e54]/80 transition"
            title="Reset Paper Portfolio to ₹10,00,000"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Prominent Educational Notice Banner in Midnight Navy */}
      <div className="bg-[#050c1a] border-t border-b border-[#142340] px-4 py-1.5 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-cyan-300">Candlestick AI:</strong> Real-world market analysis feeds via {marketSource || 'NSE/BSE Data Providers'}. Virtual paper trades use fictional ₹ funds only. Not SEBI-registered financial advisory.
          </span>
        </div>
      </div>
    </header>
  );
};
