# Candlestick AI

> **"Read the market, understand the signals."**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0.1-61dafb.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v22-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Google GenAI](https://img.shields.io/badge/Google_GenAI-Gemini-4285f4.svg?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Tests-28%20Passed-10b981.svg)]()

**Live Application:** [https://candlestick-ai.ai.studio](https://candlestick-ai.ai.studio)

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Project Objectives](#project-objectives)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Local Setup & Installation](#local-setup--installation)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [AI & Analytical Methodology](#ai--analytical-methodology)
- [Responsible-Use & Regulatory Disclaimer](#responsible-use--regulatory-disclaimer)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Candlestick AI** is an AI-powered financial technology web platform engineered for quantitative market data visualization, technical indicator computation, and risk-free paper trading on Indian equities (**National Stock Exchange [NSE]** and **Bombay Stock Exchange [BSE]**).

The application couples responsive SVG-based candlestick charting with a modular market-data backend, mathematical indicator algorithms (SMA, EMA, Wilder's RSI, Bollinger Bands), and an AI market analyst powered by Google's Gemini models via the official `@google/genai` SDK. All AI interactions are grounded in server-validated quotes and statistical readings, preventing hallucinated prices and outdated market claims.

---

## Problem Statement

1. **Visual and Technical Overload:** Commercial trading terminals present complex interfaces, dense order books, and jargon without intuitive guidance for beginners and retail investors.
2. **High Capital Risk for Beginners:** Studies published by the Securities and Exchange Board of India (SEBI) show that over 90% of individual derivative traders incur net financial losses. Novice traders frequently enter positions at statistical extremes without basic risk management.
3. **AI Hallucinations in Financial Contexts:** Off-the-shelf LLMs frequently invent stock prices, misstate dividend yields, or quote foreign exchange rates when asked about Indian equities.
4. **Ticker Confusion:** Equities on Indian exchanges trade under symbols that often differ from popular company names (e.g., Fineotex Chemical trades as `FCL.NS`, not `FINEOTEX.NS`), causing search failures and data errors on generic platforms.

---

## Project Objectives

- **Grounded Financial Intelligence:** Provide conversational market analysis where every numerical claim (price, RSI, moving average) is retrieved from verified exchange feeds before being analyzed by the AI.
- **Accurate Indian Market Coverage:** Support benchmark indices (Nifty 50, Sensex, Bank Nifty) and listed equities with automated company name-to-ticker resolution.
- **Pure SVG Financial Visualization:** Deliver interactive candlestick and line charts with dynamic multi-scale pricing, volume histograms, indicator overlays, and crosshairs without heavy third-party canvas dependencies.
- **Zero-Risk Simulation:** Enable simulated paper trading denominated in Indian Rupees (₹) with an initial baseline of ₹10,00,000, real-time unrealized/realized P&L accounting, and asset-allocation telemetry.
- **Strict Security Hygiene:** Keep all API keys and credentials server-side, eliminating client-side secret exposure.

---

## Key Features

### 1. Interactive SVG Candlestick & Technical Chart
- Custom SVG rendering engine supporting daily candlestick bars (bullish emerald green, bearish rose red, wicks) and smoothed gradient line views.
- Dynamic auto-scaling accommodating instruments from ₹50 small-caps to 24,000+ index levels.
- Interactive crosshair HUD displaying Date, Open, High, Low, Close, and Volume (in Lakhs).
- **Overlays:** 20-day SMA (Amber), 50-day SMA (Sky Blue), 2-sigma Bollinger Bands (Purple), and Volume histograms.
- **Sub-Charts:** 14-period RSI with 70 Overbought / 30 Oversold thresholds and MACD (12, 26, 9) histogram.

### 2. Intelligent Indian Stock Lookup & Autocomplete
- Dedicated `/api/market/search` endpoint providing debounced search as you type.
- Smart resolution mapping company names to exchange tickers (e.g., *"Fineotex"* &rarr; `FCL.NS`, *"Reliance"* &rarr; `RELIANCE.NS`, *"Tata Motors"* &rarr; `TATAMOTORS.NS`).
- Quick-access case-study cards for Nifty 50, Sensex, Reliance, TCS, HDFC Bank, Infosys, Fineotex Chemical, and Tata Motors.

### 3. Quantitative Indicator Engine
- Mathematical calculations performed in application code (`server/technicalAnalysis.ts` & `src/utils/indicators.ts`).
- Wilder's Smoothed RSI(14), Simple Moving Averages (20, 50, 200), Exponential Moving Averages (20, 50), and 30-session rolling Support/Resistance pivot floors.
- Transparent calculation timestamps (IST) and data-depth edge case disclosures.

### 4. Grounded AI Market Analyst (`@google/genai`)
- Integrates Google Gemini (`gemini-3.1-flash-lite` primary model with automatic failover chain).
- Server-side context injection: user questions are pre-grounded with current market prices, computed indicators, and portfolio holdings before the model responds.
- Tailored dynamic educational safety net ensuring non-repetitive explanations across RSI, moving averages, stop-loss strategy, candlestick patterns, and market structure.

### 5. Portfolio Performance & ₹ INR Paper-Trading Simulator
- Pre-funded with **₹10,00,000 (10 Lakhs INR)** in fictional capital.
- Visual **Portfolio Performance** progress bar with a central 100% baseline marker tracking capital expansion vs. drawdown.
- Dual-tone asset allocation breakdown (Liquid Cash % vs. Invested Equities %).
- Simulated Buy/Sell order tickets, position sizing calculator, holdings table with unrealized P&L, and transaction history.
- Client-side persistence via browser `localStorage` under key `candlestick_ai_virtual_portfolio_inr`.

### 6. Design System & User Experience
- **Midnight Navy** primary palette (`#050c1a` / `#070e1e` / `#09142b`) with **Electric Cyan** (`#00f0ff` / `#06b6d4`) and **Emerald Green** (`#10b981` / `#059669`) accents.
- Custom SVG Candlestick + AI Neural Network logo.
- Real-time Indian Standard Time (IST) clock with market trading session status (`09:15 – 15:30 IST`).
- Built-in **Report & Documentation Viewer** (`/report`) with one-click export for Technical Markdown, QA Test Matrix (.CSV), and Print-to-PDF.

---

## System Architecture

```
[ User Browser (Google Chrome / Desktop / Mobile) ]
                         │
                         ▼
           [ Nginx Gateway / Reverse Proxy ]
                         │  (Port 8080)
                         ▼
     [ Express Full-Stack Server (server.ts : 3000) ]
        ├── Vite SPA Middlewares (Client Delivery)
        ├── In-Memory Cache (20s Quotes, 5m History, 30m Search)
        ├── Market Data Service (server/marketDataService.ts)
        ├── Quantitative Math Engine (server/technicalAnalysis.ts)
        └── Server-Side Gemini Client (@google/genai)
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[ Yahoo Finance API ]            [ Google Gemini API ]
  - Quotes (Delayed/EOD)           - Model: gemini-3.1-flash-lite
  - Daily OHLCV Candles            - Failover: gemini-flash-latest / 3.8-flash
  - Autocomplete Search            - Grounded Financial Persona
```

---

## How It Works

1. **Instrument Selection / Search:**  
   The user selects a preset card or searches a company name in the lookup bar. If a name like *"Fineotex"* is typed, the backend searches and resolves the symbol to `FCL.NS`.
2. **Data Ingestion & Normalization:**  
   The backend retrieves quotes and historical daily candles. Data is validated, cached in-memory, and returned with clear status flags (`delayed` or `closed` EOD price).
3. **Indicator Computation:**  
   Mathematical routines compute SMAs, EMAs, Wilder's RSI, and pivot floors. These values are displayed on both the chart HUD and the quantitative panel.
4. **Context-Grounded AI Analysis:**  
   When the user asks a question, the server detects the stock mentioned, queries its current metrics, injects them into the prompt envelope, and requests an analysis from Gemini.
5. **Simulated Execution:**  
   Paper trades are validated against available cash, updated in the portfolio state, and persisted in browser storage.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `19.0.1` | Declarative component UI |
| **Language** | TypeScript | `7.0.2` | End-to-end static typing |
| **Styling** | Tailwind CSS | `4.3.3` | Utility-first styling & dark midnight navy theme |
| **Build Tool & Bundler** | Vite | `8.3.0` | Development server & production bundling |
| **Backend Server** | Express | `4.21.2` | REST API routing and middleware mounting |
| **Runtime & Execution** | Node.js / tsx | `v22` / `4.21.0` | Server-side execution without pre-compilation |
| **AI SDK** | `@google/genai` | `2.4.0` | Official Google Gemini TypeScript SDK |
| **Icons** | Lucide React | `0.546.0` | Financial, telemetry, and UI icons |
| **Animation** | Motion | `12.23.24` | UI transitions and loading states |
| **Market Data** | Yahoo Finance Feed | REST | Public delayed/EOD feeds for NSE and BSE |

---

## Directory Structure

```
candlestick-ai/
├── server.ts                             # Express server entry point & API routes
├── index.html                            # HTML entry point with metadata
├── package.json                          # Dependencies & NPM scripts
├── metadata.json                         # AI Studio capability configuration
├── tsconfig.json                         # TypeScript compiler configuration
├── vite.config.ts                        # Vite configuration
├── Candlestick_AI_Technical_Documentation.md # Full technical specification
├── Candlestick_AI_Test_Cases.csv         # Complete QA test case matrix
├── Candlestick_AI_Complete_Project_Report.html # Printable client report
├── server/
│   ├── marketDataService.ts              # Data fetching, caching, symbol resolution
│   └── technicalAnalysis.ts              # Server-side quantitative formulas & pivot logic
├── tests/
│   └── marketDataAndAnalysis.test.ts     # Automated test suite (28 assertions)
└── src/
    ├── main.tsx                          # React entry point
    ├── App.tsx                           # Main workspace & layout coordinator
    ├── index.css                         # Tailwind CSS imports & base styles
    ├── types/
    │   └── trading.ts                    # TypeScript domain interfaces
    ├── data/
    │   └── sampleStocks.ts               # Preset Indian instruments & baseline candles
    ├── utils/
    │   └── indicators.ts                 # Client-side indicator calculations
    └── components/
        ├── CandlestickLogo.tsx           # Custom neural candlestick SVG emblem
        ├── Header.tsx                    # Header with IST clock & session status
        ├── StockSelector.tsx             # Preset cards & debounced search dropdown
        ├── StockChart.tsx                # Interactive SVG chart & indicator overlays
        ├── TechnicalIndicatorsPanel.tsx  # Calculated indicators HUD & formulas
        ├── PortfolioPerformance.tsx      # Progress bar vs. ₹10 Lakh baseline
        ├── PaperTradingPanel.tsx         # Order ticket, holdings table, trade log
        ├── ChatbotPanel.tsx              # Grounded Gemini chat assistant
        └── EducationalModal.tsx          # Candlestick anatomy & SEBI disclosures
```

---

## Local Setup & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended; verified on v22).
- **Package Manager:** `npm` (v9+).
- **Google Gemini API Key:** Required for AI chat functionality ([Get an API key](https://aistudio.google.com/)).

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/candlestick-ai.git
   cd candlestick-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   MARKET_DATA_PROVIDER=yahoo
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000).

6. **Production build:**
   ```bash
   npm run build
   npm start
   ```

---

## Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `3000` | Port on which the Express server listens. |
| `GEMINI_API_KEY` | Yes | *None* | Google Gemini API key used by `@google/genai`. |
| `MARKET_DATA_PROVIDER`| No | `yahoo` | Data provider selector (default: Yahoo Finance). |
| `NODE_ENV` | No | `development`| Execution environment (`development` or `production`). |

> **Note:** Never commit `.env` or expose API keys in client-side code. The application accesses `GEMINI_API_KEY` strictly inside `server.ts`.

---

## API Reference

| Endpoint | Method | Params / Body | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | *None* | Health check, service name, IST timestamp, and provider status. |
| `/api/market/instruments` | `GET` | *None* | List of supported preset Indian instruments and market hours. |
| `/api/market/search` | `GET` | `?q=query` | Live autocomplete search returning matching `.NS` and `.BO` equities. |
| `/api/market/quote/:symbol` | `GET` | `:symbol` | Normalized market quote in ₹ INR with Open, High, Low, Volume, and status. |
| `/api/market/history/:symbol` | `GET` | `?range=3mo&interval=1d` | Array of daily OHLCV candlestick records. |
| `/api/market/analysis/:symbol`| `GET` | `:symbol` | Mathematical calculation of SMAs, EMAs, RSI, and Support/Resistance. |
| `/api/chat` | `POST` | `{ message, history, context }` | Gemini-powered financial assistant grounded in live stock metrics. |
| `/report` | `GET` | *None* | Printable client-ready project report and documentation page. |

---

## Testing & Quality Assurance

The codebase includes an automated test suite verifying mathematical accuracy, symbol normalization, and accounting rules:

```bash
npm test
```

### Verified Test Summary (28 Assertions)

```
Test 1: Indian Symbol Normalization & Sanitization
  ✅ Normalizes "RELIANCE" to "RELIANCE.NS"
  ✅ Converts lowercase "tcs" to uppercase "TCS.NS"
  ✅ Maps "NIFTY" to index symbol "^NSEI"
  ✅ Maps "SENSEX" to index symbol "^BSESN"
  ✅ Preserves BSE suffix ".BO"
  ✅ Preserves index prefix "^"

Test 2: Quantitative Indicator Formulas
  ✅ SMA(5) calculates average accurately (expected 17.0)
  ✅ SMA returns null for indices before period completion
  ✅ EMA computes valid numerical multiplier value
  ✅ EMA gives higher weight to recent ascending prices
  ✅ RSI on pure gains returns 100
  ✅ RSI on steady uptrend is between 50 and 80

Test 3: Data Limitations & Edge Cases
  ✅ SMA 20 is null when candles count < 20
  ✅ Flags data depth limitations when candles are short
  ✅ Support identifies recent low
  ✅ Resistance identifies recent high

Test 4: Paper-Trading Mathematics in ₹ INR
  ✅ Cash correctly debited on Buy (₹8,75,000)
  ✅ Holdings record correct share count
  ✅ Unrealized P&L matches price increase (+₹5,000)
  ✅ Total Equity reflects cash + current market value (₹10,05,000)
  ✅ Cash correctly credited from Sell (₹9,27,000)
  ✅ Realized gain accurately calculated (+₹2,000)
  ✅ Remaining shares updated correctly (30 shares)

Test 5: Live API & Integration Checks
  ✅ Autocomplete search resolves "Fineotex" to FCL.NS
  ✅ Quote endpoint returns verified ₹ INR market data
  ✅ Gemini proxy responds with "isFallback": false
  ✅ TypeScript strict compilation (zero errors via tsc --noEmit)
```

---

## AI & Analytical Methodology

### Grounding Envelope Pattern
To eliminate hallucination risks, the backend intercepts every user chat request and prepares a structured grounding envelope:

```
[ User Query: "What is the RSI of Reliance?" ]
                     │
                     ▼
  [ Backend detectIndianSymbolInPrompt ]
                     │ (Detects RELIANCE.NS)
                     ▼
  [ Fetch Quote + Compute Technical Analysis ]
  - Price: ₹1,174.60
  - RSI(14): 58.40
  - SMA(20): ₹1,162.30 | SMA(50): ₹1,148.10
  - Support: ₹1,120.00 | Resistance: ₹1,210.00
                     │
                     ▼
  [ Injected into Gemini System Prompt Envelope ]
  "You are Candlestick AI. Ground your response in these verified numbers.
   Never invent prices. Explain the signals clearly in ₹ INR."
                     │
                     ▼
  [ Response Returned to Client with Zero Hallucination ]
```

---

## Responsible-Use & Regulatory Disclaimer

- **Educational & Simulation Only:** Candlestick AI is an educational platform designed for financial literacy, technical indicator study, and simulated paper trading.
- **Not SEBI Registered:** Candlestick AI is **not** a SEBI-registered Research Analyst (RA) or Investment Advisor (RIA). None of the outputs, chart overlays, or AI messages constitute financial, investment, legal, or tax advice.
- **Fictional Funds:** All orders and portfolio balances are simulated using fictional Indian Rupee funds. No real money is deposited, transacted, or at risk.
- **Delayed Feeds:** Market data feeds for Indian equities reflect 15-minute delayed or End-of-Day (EOD) exchange reports provided by public market-data vendors.

---

## Roadmap

- [ ] **Phase 1: Multi-User Cloud Persistence** — Integration with Cloud SQL / Firebase for cross-device portfolio sync.
- [ ] **Phase 2: Intraday Candlestick Intervals** — 5-minute, 15-minute, and 1-hour timeframe views.
- [ ] **Phase 3: Chart Drawing Tools** — Trendlines, horizontal support/resistance rays, and Fibonacci retracement overlays.
- [ ] **Phase 4: Multi-Stock Watchlists** — Custom user-created Indian market watchlists with price alerts.
- [ ] **Phase 5: Production Deployment** — Containerized deployment on Google Cloud Run with automated CI/CD.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Ensure all tests pass (`npm test` and `npm run lint`).
5. Push to the branch (`git push origin feature/amazing-feature`).
6. Open a Pull Request.

---

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

---

## Author & Project Links

- **Live Application:** [https://candlestick-ai.ai.studio](https://candlestick-ai.ai.studio)
- **Repository:** [https://github.com/your-username/candlestick-ai](https://github.com/your-username/candlestick-ai)
- **Documentation & Report:** Available at `/report` in the running application.
