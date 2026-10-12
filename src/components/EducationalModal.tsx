import React from 'react';
import { X, BookOpen, Shield, TrendingUp } from 'lucide-react';
import { CandlestickLogo } from './CandlestickLogo';

interface EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskQuestion: (question: string) => void;
}

export const EducationalModal: React.FC<EducationalModalProps> = ({
  isOpen,
  onClose,
  onAskQuestion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#070e1e] border border-[#1a2d52] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#162544] flex items-center justify-between bg-[#09142b]">
          <div className="flex items-center gap-3">
            <CandlestickLogo size={36} />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Candlestick AI Signal & Market Guide
              </h2>
              <p className="text-xs text-slate-300">Read the market, understand the signals • NSE & BSE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#122244] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm bg-[#070e1e]">
          {/* Section 1: Candlestick Signals & Anatomy */}
          <div className="bg-[#09142b] border border-[#172748] rounded-xl p-4">
            <h3 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              1. Reading Candlestick Signals & Anatomy
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              Candlesticks visually reveal the emotional tug-of-war between aggressive buyers and sellers across a trading session:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-[#050c18] p-3 rounded-lg border border-[#14233e]">
                <span className="font-bold text-emerald-400 block mb-1">Bullish Body</span>
                <span className="text-slate-300 font-semibold block mb-0.5">Close &gt; Open</span>
                <p className="text-slate-400">Buyers took control from the opening bell and forced price higher into the session close.</p>
              </div>

              <div className="bg-[#050c18] p-3 rounded-lg border border-[#14233e]">
                <span className="font-bold text-rose-400 block mb-1">Bearish Body</span>
                <span className="text-slate-300 font-semibold block mb-0.5">Close &lt; Open</span>
                <p className="text-slate-400">Sellers rejected higher prices and dumped inventory, closing beneath the opening print.</p>
              </div>

              <div className="bg-[#050c18] p-3 rounded-lg border border-cyan-500/30">
                <span className="font-bold text-cyan-300 block mb-1">Upper / Lower Wicks</span>
                <span className="text-slate-300 font-semibold block mb-0.5">Price Rejection</span>
                <p className="text-slate-400">Long lower wicks indicate sudden buyer absorption (support); long upper wicks indicate overhead supply.</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onAskQuestion('Explain how to read long wick rejections on Indian candlestick charts');
              }}
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1"
            >
              Ask Candlestick AI how to trade wick rejection signals &rarr;
            </button>
          </div>

          {/* Section 2: Indian Market Hours */}
          <div className="bg-[#09142b] border border-[#172748] rounded-xl p-4">
            <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              2. NSE & BSE Market Sessions (IST)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-[#050c18] p-3 rounded-lg border border-[#14233e]">
                <span className="font-bold text-white block mb-1">09:00 - 09:15 AM</span>
                <span className="text-amber-400 font-semibold block mb-0.5">Pre-Open Session</span>
                <p className="text-slate-400">Call auction discovers the equilibrium opening price.</p>
              </div>
              <div className="bg-[#050c18] p-3 rounded-lg border border-emerald-500/30">
                <span className="font-bold text-white block mb-1">09:15 AM - 03:30 PM</span>
                <span className="text-emerald-400 font-semibold block mb-0.5">Continuous Trading</span>
                <p className="text-slate-400">Active session with real-time liquidity on NSE & BSE.</p>
              </div>
              <div className="bg-[#050c18] p-3 rounded-lg border border-[#14233e]">
                <span className="font-bold text-white block mb-1">03:40 - 04:00 PM</span>
                <span className="text-cyan-400 font-semibold block mb-0.5">Post-Closing</span>
                <p className="text-slate-400">Execution at the volume-weighted average closing price.</p>
              </div>
            </div>
          </div>

          {/* Section 3: SEBI Risk Disclosures & Trading Discipline */}
          <div className="bg-[#09142b] border border-[#172748] rounded-xl p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              3. SEBI Risk Awareness & Virtual Simulation
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <div>
                  <strong>SEBI Study Disclosure:</strong> Studies by the Securities and Exchange Board of India (SEBI) reveal that over 90% of individual traders in derivatives lose money. Using Candlestick AI's virtual paper simulator with fictional ₹ funds helps you practice risk management without real loss.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <div>
                  <strong>Position Sizing & Stop-Loss:</strong> Never risk more than 1% to 2% of total virtual equity on any single swing trade. Let the calculated support and resistance levels define your protective stop.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onAskQuestion('Can you teach me how to calculate risk-to-reward ratio for an Indian swing trade?');
              }}
              className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1"
            >
              Ask Candlestick AI to calculate a 1:2 risk-to-reward setup &rarr;
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#162544] bg-[#09142b] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-[#0c1833] hover:bg-[#12254d] text-cyan-200 rounded-lg border border-cyan-500/30 transition shadow-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
