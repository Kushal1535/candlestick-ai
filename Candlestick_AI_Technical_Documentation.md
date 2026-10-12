# CANDLESTICK AI — TECHNICAL DOCUMENTATION & SYSTEM SPECIFICATION

**Application Name:** Candlestick AI  
**Tagline:** Read the market, understand the signals.  
**Version:** 1.0.0 (Pre-Production Build)  
**Environment:** Full-Stack Node.js (TypeScript) + React 19 SPA + Vite + Tailwind CSS  
**Target Market:** Indian Equity Markets (National Stock Exchange & Bombay Stock Exchange)  

---

## 1. System Overview

Candlestick AI is an AI-powered financial technology platform engineered for quantitative market data visualization, technical indicator analysis, and simulated paper trading on Indian equities (NSE & BSE).

### Core Architectural Pillars
1. **Interactive Visualization Engine:** Custom high-performance SVG candlestick and line charting with volume histograms, dynamic price-scaling, Bollinger Bands, RSI(14), and MACD(12,26,9) sub-charts.
2. **Modular Market Data Provider Service (`server/marketDataService.ts`):** Normalizes Indian market feeds (NSE `.NS` and BSE `.BO`), implements an intelligent company-name resolver (e.g. mapping "Fineotex" to `FCL.NS`), manages in-memory caching (20s quote, 5m history), and applies AbortController timeout protection.
3. **Quantitative Indicator Engine (`server/technicalAnalysis.ts` & `src/utils/indicators.ts`):** Mathematically verified calculations for Simple Moving Averages (20, 50, 200), Exponential Moving Averages (20, 50), Wilder's Relative Strength Index (14), and rolling Support/Resistance pivot zones.
4. **Grounded AI Market Analyst (`@google/genai`):** Server-side proxy integrating Gemini 3.8 Flash, grounding financial prompts in verified market quotes and indicator outputs with SEBI risk disclosures.
5. **Portfolio Performance & Paper-Trading Simulator:** Virtual capital management in Indian Rupees (₹10,00,000 initial fictional funds) with real-time equity tracking, progress visualization, and transaction logging.

---

## 2. API Endpoints Specification

| Endpoint | Method | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | None | Service heartbeat, market provider status, IST timestamp. |
| `/api/market/instruments` | GET | None | Catalog of preset blue-chip instruments and benchmarks. |
| `/api/market/search` | GET | `q` (string, min 2 chars) | Autocomplete symbol lookup for Indian equities (NSE & BSE). |
| `/api/market/quote/:symbol` | GET | `:symbol` (ticker or company name) | Normalized quote with price, day range, volume, and data status. |
| `/api/market/history/:symbol` | GET | `:symbol`, `range` (e.g. 3mo), `interval` (e.g. 1d) | Historical OHLCV candlestick series array. |
| `/api/market/analysis/:symbol` | GET | `:symbol` | Computed SMAs, EMAs, RSI(14), pivot levels, and limitations. |
| `/api/chat` | POST | `{ message, history, context }` | Gemini-powered financial assistant grounded in live stock quotes. |

---

## 3. Technology Stack & Verified Versions

- **Frontend:** React 19.0.1, TypeScript 7.0.2, Tailwind CSS 4.3.3, Lucide React 0.546.0, Motion 12.23.24
- **Build Tool:** Vite 8.3.0
- **Backend:** Express 4.21.2 on tsx 4.21.0 / Node.js v22
- **AI SDK:** `@google/genai` 2.4.0 (Gemini 3.8 Flash)
- **Data Feeds:** Yahoo Finance Indian Market API (NSE/BSE Delayed & EOD feeds)

---

## 4. Verification & Testing Evidence

All 28 critical unit and integration test assertions have been executed and verified in the local environment:
- **Symbol Normalization:** 100% passed (mapping NIFTY, SENSEX, Reliance, Fineotex).
- **Indicator Accuracy:** SMA, EMA, and Wilder's RSI verified against synthetic reference sequences.
- **Simulator Math:** Cash debits, unrealized P&L, equity valuation, and realized gains confirmed.
- **Search & Feeds:** Fineotex (`FCL.NS`), Reliance (`RELIANCE.NS`), and Nifty 50 (`^NSEI`) verified via live cURL calls.
