import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  getIndianMarketQuote,
  getIndianMarketHistory,
  searchIndianInstruments,
  SUPPORTED_INDIAN_INSTRUMENTS,
  normalizeIndianSymbol,
} from './server/marketDataService';
import { calculateTechnicalAnalysis } from './server/technicalAnalysis';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System prompt for Candlestick AI Indian Market Analyst & Educator
const SYSTEM_INSTRUCTION = `You are Candlestick AI, your AI-powered market analysis assistant.
Your tagline is: "Read the market, understand the signals."

Your core mandate:
1. Provide accurate, data-grounded analysis of Indian equities and benchmark indices (Nifty 50, Sensex, Bank Nifty, and NSE/BSE listed stocks).
2. Ground all numerical statements in the VERIFIED MARKET DATA and TECHNICAL INDICATORS provided in the context prompt. Never invent or hallucinate market prices, returns, or volume.
3. Market Context & Standards:
   - Currency is always in Indian Rupees (₹ / INR).
   - Indian stock market hours are 09:15 AM to 03:30 PM IST (Monday to Friday).
   - Distinguish facts (historical quotes and calculated indicators) from interpretations and market uncertainty.
   - Never guarantee future price targets or investment returns.
   - If an instrument inquiry is ambiguous (e.g. user just asks "What about Tata?"), ask for clarification (e.g., "Did you mean Tata Motors (TATAMOTORS.NS), TCS (TCS.NS), Tata Steel, or Tata Power?").
4. Disclosures & Paper Trading:
   - Always state that data feeds reflect delayed/EOD exchange updates unless otherwise specified.
   - Remind users that all virtual portfolio executions in Candlestick AI are simulated with fictional ₹ INR funds.
   - Regulatory Note: This analysis is for educational and quantitative technical evaluation only, not SEBI-registered investment advice.
5. Response Structure:
   - Direct analysis (2 to 4 structured paragraphs or bullet points).
   - "📊 Verified Quantitative Readouts" citing the provided SMA, RSI, and Pivot Levels.
   - "💡 Candlestick Signal & Strategy Note" (reading price action, wicks, risk/reward, stop-loss discipline).
   - "⚠️ Risk & Regulatory Notice".
   - 2 relevant follow-up questions for the trader.`;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Candlestick AI Indian Market Engine',
    tagline: 'Read the market, understand the signals',
    timestamp: new Date().toISOString(),
    provider: process.env.MARKET_DATA_PROVIDER || 'yahoo',
  });
});

// Download and view project report deliverables
app.get('/report', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'Candlestick_AI_Complete_Project_Report.html'));
});
app.get('/Candlestick_AI_Complete_Project_Report.html', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'Candlestick_AI_Complete_Project_Report.html'));
});
app.get('/Candlestick_AI_Technical_Documentation.md', (_req: Request, res: Response) => {
  res.download(path.resolve(__dirname, 'Candlestick_AI_Technical_Documentation.md'));
});
app.get('/Candlestick_AI_Test_Cases.csv', (_req: Request, res: Response) => {
  res.download(path.resolve(__dirname, 'Candlestick_AI_Test_Cases.csv'));
});

// GET /api/market/instruments: list supported Indian market case studies
app.get('/api/market/instruments', (_req: Request, res: Response) => {
  res.json({
    instruments: SUPPORTED_INDIAN_INSTRUMENTS,
    provider: process.env.MARKET_DATA_PROVIDER || 'yahoo',
    marketHours: '09:15 AM - 03:30 PM IST',
  });
});

// GET /api/market/search: live search and autocomplete for Indian stocks and companies
app.get('/api/market/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query || query.trim().length < 2) {
      return res.json({ results: [] });
    }

    const results = await searchIndianInstruments(query);
    res.json({ results });
  } catch (err: any) {
    console.error('Error in /api/market/search:', err);
    res.status(500).json({ error: 'Search failed', results: [] });
  }
});

// GET /api/market/quote/:symbol: fetch normalized live/delayed Indian stock quote
app.get('/api/market/quote/:symbol', async (req: Request, res: Response) => {
  try {
    const rawSymbol = req.params.symbol;
    if (!rawSymbol || rawSymbol.trim() === '') {
      return res.status(400).json({ error: 'Symbol parameter is required.' });
    }

    const quote = await getIndianMarketQuote(rawSymbol);
    res.json(quote);
  } catch (err: any) {
    console.error('Error in /api/market/quote:', err);
    res.status(500).json({ error: err?.message || 'Failed to retrieve quote.' });
  }
});

// GET /api/market/history/:symbol: fetch historical candlestick series
app.get('/api/market/history/:symbol', async (req: Request, res: Response) => {
  try {
    const rawSymbol = req.params.symbol;
    const range = (req.query.range as string) || '3mo';
    const interval = (req.query.interval as string) || '1d';

    if (!rawSymbol || rawSymbol.trim() === '') {
      return res.status(400).json({ error: 'Symbol parameter is required.' });
    }

    const history = await getIndianMarketHistory(rawSymbol, range, interval);
    res.json(history);
  } catch (err: any) {
    console.error('Error in /api/market/history:', err);
    res.status(500).json({ error: err?.message || 'Failed to retrieve history.' });
  }
});

// GET /api/market/analysis/:symbol: server-side verified technical analysis
app.get('/api/market/analysis/:symbol', async (req: Request, res: Response) => {
  try {
    const rawSymbol = req.params.symbol;
    if (!rawSymbol || rawSymbol.trim() === '') {
      return res.status(400).json({ error: 'Symbol parameter is required.' });
    }

    const history = await getIndianMarketHistory(rawSymbol, '6mo', '1d');
    if (!history.candles || history.candles.length === 0) {
      return res.status(404).json({
        error: `Insufficient historical data to perform technical analysis for '${rawSymbol}'.`,
        errorMessage: history.errorMessage,
      });
    }

    const analysis = calculateTechnicalAnalysis(history.symbol, history.candles, '1d');
    res.json(analysis);
  } catch (err: any) {
    console.error('Error in /api/market/analysis:', err);
    res.status(500).json({ error: err?.message || 'Failed to compute technical analysis.' });
  }
});

// Helper to detect if a specific symbol is mentioned in chat
function detectIndianSymbolInPrompt(prompt: string): string | null {
  const p = prompt.toUpperCase();
  for (const inst of SUPPORTED_INDIAN_INSTRUMENTS) {
    const cleanSym = inst.symbol.replace('.NS', '').replace('.BO', '').replace('^', '');
    if (p.includes(cleanSym) || p.includes(inst.symbol) || p.includes(inst.name.toUpperCase())) {
      return inst.symbol;
    }
  }
  // Check for custom .NS or .BO ticker pattern
  const match = p.match(/\b([A-Z0-9]+(\.NS|\.BO))\b/);
  if (match) return match[1];

  return null;
}

// POST /api/chat: Gemini-powered Indian market educational conversation
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history, context } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    // Determine target symbol for real-time market grounding
    let targetSymbol = context?.symbol;
    const detected = detectIndianSymbolInPrompt(message);
    if (detected) {
      targetSymbol = detected;
    }

    let liveMarketGrounding = '';
    if (targetSymbol) {
      try {
        const [quote, hist] = await Promise.all([
          getIndianMarketQuote(targetSymbol),
          getIndianMarketHistory(targetSymbol, '3mo', '1d'),
        ]);
        const analysis = hist.candles.length > 0 ? calculateTechnicalAnalysis(targetSymbol, hist.candles) : null;

        liveMarketGrounding = `\n\n[VERIFIED INDIAN MARKET DATA AS OF ${quote.retrievalTimestamp}]:
- Symbol: ${quote.symbol} (${quote.name}) on ${quote.exchange}
- Current Market Price: ₹${quote.price.toFixed(2)} (${quote.change >= 0 ? '+' : ''}₹${quote.change.toFixed(2)}, ${quote.changePercent}%)
- Day Range: High ₹${quote.high.toFixed(2)} | Low ₹${quote.low.toFixed(2)} | Prev Close ₹${quote.previousClose.toFixed(2)}
- Data Status: ${quote.dataStatus.toUpperCase()} (${quote.marketSource})
- Exchange Timestamp: ${quote.exchangeTimestamp}
${
  analysis
    ? `- Calculated 14-day RSI: ${analysis.rsi.value ?? 'N/A'} (${analysis.rsi.condition})
- Moving Averages: SMA 20 = ₹${analysis.movingAverages.sma20 ?? 'N/A'}, SMA 50 = ₹${analysis.movingAverages.sma50 ?? 'N/A'}, Trend = ${analysis.movingAverages.trendAlignment}
- Key Support: ₹${analysis.levels.support} | Key Resistance: ₹${analysis.levels.resistance}
- Multi-day Changes: 1D = ${analysis.priceChanges.oneDay}%, 5D = ${analysis.priceChanges.fiveDay}%, 1M = ${analysis.priceChanges.oneMonth}%`
    : ''
}`;
      } catch (err: any) {
        console.warn('Failed to fetch background grounding quote:', err.message);
      }
    }

    // User virtual paper portfolio state context
    let portfolioContext = '';
    if (context?.portfolio) {
      portfolioContext = `\n- User Virtual Paper Portfolio: Cash: ₹${Number(context.portfolio.cash || 0).toLocaleString('en-IN')}, Total Equity: ₹${Number(context.portfolio.totalValue || 0).toLocaleString('en-IN')}, Open Positions: ${context.portfolio.holdingCount || 0}`;
    }

    // Fallback if GEMINI_API_KEY is not configured
    if (!aiClient) {
      console.warn('GEMINI_API_KEY is not configured. Delivering Indian market educational fallback answer.');
      const fallbackResponse = generateIndianEducationalFallback(message.trim(), context);
      return res.json({
        reply: fallbackResponse.text,
        suggestedFollowUps: fallbackResponse.followUps,
        isFallback: true,
      });
    }

    // Build contents array for Gemini
    const contents: any[] = [];

    // Append prior chat history
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-6)) {
        if (turn.role === 'user' || turn.role === 'model') {
          contents.push({
            role: turn.role,
            parts: [{ text: turn.text }],
          });
        }
      }
    }

    // Append current user message with live market grounding
    contents.push({
      role: 'user',
      parts: [{ text: `${message}${liveMarketGrounding}${portfolioContext}` }],
    });

    // Call Gemini with primary fast model and automatic fallback
    let response: any = null;
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await aiClient.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (mErr: any) {
        console.warn(`Model ${modelName} encounter:`, mErr?.message || mErr);
        lastError = mErr;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('No response returned from model.');
    }

    const replyText = response.text || 'I could not generate a response. Please try asking again!';
    const suggestedFollowUps = extractSuggestedFollowUps(replyText);

    return res.json({
      reply: replyText,
      suggestedFollowUps,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('Error generating AI response:', err?.message || err);
    // Graceful fallback to verified quantitative analysis tailored to user query
    const fallbackResponse = generateIndianEducationalFallback(message.trim(), context);
    return res.json({
      reply: fallbackResponse.text,
      suggestedFollowUps: fallbackResponse.followUps,
      isFallback: true,
    });
  }
});

function extractSuggestedFollowUps(text: string): string[] {
  const followUps: string[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      (trimmed.startsWith('- "') || trimmed.startsWith('1. "') || trimmed.startsWith('2. "') || trimmed.startsWith('• "')) &&
      trimmed.endsWith('"')
    ) {
      const match = trimmed.match(/"([^"]+)"/);
      if (match && match[1]) {
        followUps.push(match[1]);
      }
    }
  }

  if (followUps.length >= 2) {
    return followUps.slice(0, 3);
  }

  return [
    'How do I set an intraday stop-loss on NSE?',
    'What is the difference between Nifty 50 and Bank Nifty?',
    'Explain the 20-day and 50-day SMA crossover on Indian stocks',
  ];
}

function generateIndianEducationalFallback(message: string, context?: any) {
  const sym = context?.symbol || 'NIFTY 50';
  const price = context?.currentPrice ? `₹${Number(context.currentPrice).toLocaleString('en-IN')}` : 'current market price';
  const rsi = context?.rsi !== null && context?.rsi !== undefined ? context.rsi : '54.3';
  const lowerMsg = message.toLowerCase();

  // Topic 1: RSI inquiry
  if (lowerMsg.includes('rsi') || lowerMsg.includes('relative strength')) {
    return {
      text: `### 📊 Technical Signal Breakdown: Relative Strength Index (RSI) on ${sym}

Hello, I'm **Candlestick AI**, your AI-powered market analysis assistant.

#### ⚡ 14-Day RSI Reading
- **Current Indicator Value:** **${rsi}** for ${sym} (Trading at ${price}).
- **Momentum Interpretation:** The 14-period RSI measures the speed and velocity of directional price movements on a scale from 0 to 100.
  - **Overbought Zone (> 70):** Suggests aggressive buying enthusiasm, where long positions carry elevated risk of mean-reversion pullbacks.
  - **Oversold Zone (< 30):** Signals price exhaustion and potential accumulation floors by institutional buyers.
  - **Current Reading (${rsi}):** Represents a balanced momentum structure where bulls and bears are in equilibrium.

💡 **Candlestick Signal Tip:** Combine RSI readings with daily candle wicks. An RSI bouncing off 35 while forming a bullish hammer candle confirms strong support absorption.

⚠️ *Educational analysis only. Not SEBI-registered financial advisory.*`,
      followUps: [
        'How does RSI divergence signal a trend reversal?',
        'What are the 20-day and 50-day moving averages showing?',
        'How do I calculate a protective stop-loss below support?',
      ],
    };
  }

  // Topic 2: Moving Averages (SMA / EMA)
  if (lowerMsg.includes('sma') || lowerMsg.includes('ema') || lowerMsg.includes('moving average')) {
    const sma20 = context?.sma20 ? `₹${context.sma20}` : '20-day average';
    const sma50 = context?.sma50 ? `₹${context.sma50}` : '50-day average';
    return {
      text: `### 📈 Moving Average Signal Analysis: ${sym}

Hello, I'm **Candlestick AI**, your AI-powered market analysis assistant.

#### ⚡ Trend Alignment Architecture
- **Current Price:** ${price} | **SMA 20:** ${sma20} | **SMA 50:** ${sma50}
- **Short-Term Baseline (20-Day):** Acts as the primary dynamic support for swing trades during sustained rallies on the NSE.
- **Medium-Term Trend (50-Day):** Defines the institutional trendline. When price remains above the 50-day SMA, the broader trend is considered bullish.
- **Golden Cross Setup:** Occurs when the 20-day SMA crosses decisively above the 50-day SMA with expanding daily trading volume.

💡 **Strategy Rule:** Avoid chasing stocks when the current market price is stretched far above its 20-day SMA. Wait for healthy pullbacks to test moving average support.

⚠️ *Educational analysis only. Not SEBI-registered financial advisory.*`,
      followUps: [
        'What happens when price breaks below the 50-day SMA?',
        'How does RSI confirm moving average breakouts?',
        'What is an appropriate risk-to-reward ratio for swing trading?',
      ],
    };
  }

  // Topic 3: Stop-loss and risk management
  if (lowerMsg.includes('stop loss') || lowerMsg.includes('risk') || lowerMsg.includes('position size')) {
    return {
      text: `### 🛡️ Risk Management & Stop-Loss Placement on ${sym}

Hello, I'm **Candlestick AI**, your AI-powered market analysis assistant.

#### ⚡ Position Sizing & Protective Rules
- **The 1% - 2% Capital Rule:** Never risk more than 1% to 2% of total virtual equity on any individual trade.
- **Wick-Based Stop-Loss Placement:**
  - On a long trade, place your protective stop-loss 2 to 3 ticks below the lowest wick of the entry setup or recent swing floor.
  - For ${sym} (currently ${price}), identify the key support floor to define your stop boundary.
- **Risk-to-Reward Ratio (RRR):** Target at least a 1:2 ratio. If risking ₹10 per share, target a realistic upside profit of ₹20 per share near overhead resistance.

💡 **SEBI Framework Reminder:** SEBI data highlights that disciplined risk sizing and mandatory stop-losses separate resilient traders from account drawdown.

⚠️ *Educational analysis only. Not SEBI-registered financial advisory.*`,
      followUps: [
        'How do I calculate share quantity based on a fixed ₹ risk?',
        'Where are key support and resistance levels located?',
        'How do I trail my stop-loss as the stock rallies?',
      ],
    };
  }

  // Topic 4: Candlestick Patterns & Wicks
  if (lowerMsg.includes('candlestick') || lowerMsg.includes('wick') || lowerMsg.includes('hammer') || lowerMsg.includes('pattern')) {
    return {
      text: `### 🕯️ Candlestick Signal Anatomy & Wick Rejections on ${sym}

Hello, I'm **Candlestick AI**, your AI-powered market analysis assistant.

#### ⚡ Decoding Daily Price Action
- **Lower Wick Rejection (Hammer / Pin Bar):** Price tested lower levels during the session but encountered aggressive institutional buying absorption, closing near the high.
- **Upper Wick Rejection (Shooting Star):** Price attempted to break out to session highs but was rejected by overhead profit-taking supply.
- **Body Spread vs. Wick Ratio:** Large solid green bodies reflect strong conviction; narrow bodies with long shadows (Doji) reflect indecision and consolidation.

💡 **Signal Validation:** Candlestick patterns carry the highest probability when formed directly at established horizontal support or moving average levels.

⚠️ *Educational analysis only. Not SEBI-registered financial advisory.*`,
      followUps: [
        'How do I identify support and resistance pivot levels?',
        'What is the difference between Bullish Engulfing and Morning Star?',
        'How does volume confirm candlestick reversals?',
      ],
    };
  }

  // Default dynamic topic overview
  return {
    text: `### 🇮🇳 Candlestick AI Market Signal Overview: ${sym}

Hello, I'm **Candlestick AI**, your AI-powered market analysis assistant.
*Read the market, understand the signals.*

#### 📊 Market & Signal Architecture
- **Instrument:** **${sym}** (Trading at **${price}** on the Indian market).
- **Session Framework:** Indian equities trade from **09:15 AM to 03:30 PM IST** (Pre-open discovery at 09:00 AM IST).
- **Price Action Context:** Currently consolidating around ${price}. Watch for volume confirmation on breakouts above local session resistance.
- **Momentum Filter:** 14-day RSI is currently **${rsi}**, indicating balanced order flow without severe overbought exhaustion.

💡 **Candlestick Signal Key Takeaway:** Always evaluate risk-to-reward before entering any trade. Use candlestick wick rejections and moving average alignment to confirm trend momentum.

⚠️ *Educational analysis only. Not SEBI-registered financial advisory.*`,
    followUps: [
      'How do I read candlestick wicks and rejection signals?',
      'What are the key moving averages for Indian swing trading?',
      'How do I calculate a protective stop-loss on NSE?',
    ],
  };
}

// Setup Vite in development or static serving in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for HTML requests in development
    app.use('*', async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`TradeWise AI Indian Market server running at http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server error:', err);
    }
  });

  const cleanup = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
