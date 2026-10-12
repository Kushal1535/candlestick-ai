/**
 * Modular Server-Side Market Data Service for Indian Equity Markets (NSE & BSE)
 * 
 * Supports:
 * - Real-world live/delayed quotes and historical candles for Indian instruments (Nifty 50, Sensex, Equities)
 * - Intelligent search and symbol resolution for Indian companies (e.g. "Fineotex" -> FCL.NS, "Tata Motors" -> TATAMOTORS.NS)
 * - Rate-limit management, in-memory caching, request timeouts, and response normalization
 * - Clear data status labels: 'live' | 'delayed' | 'historical' | 'unavailable'
 * - Never silently fabricates prices: errors and EOD statuses are explicitly reported
 */

export interface NormalizedQuote {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'INDEX';
  currency: 'INR';
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketSource: string;
  exchangeTimestamp: string;
  retrievalTimestamp: string;
  dataStatus: 'live' | 'delayed' | 'historical' | 'unavailable';
  errorMessage?: string;
}

export interface CandleRecord {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NormalizedHistory {
  symbol: string;
  exchange: string;
  timeframe: string;
  candles: CandleRecord[];
  retrievalTimestamp: string;
  dataStatus: 'live' | 'delayed' | 'historical' | 'unavailable';
  marketSource: string;
  errorMessage?: string;
}

export interface SearchResultItem {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'INDEX';
  typeDisp?: string;
}

// In-memory cache entries
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const quoteCache = new Map<string, CacheEntry<NormalizedQuote>>();
const historyCache = new Map<string, CacheEntry<NormalizedHistory>>();
const searchCache = new Map<string, CacheEntry<SearchResultItem[]>>();

const QUOTE_CACHE_TTL_MS = 20 * 1000; // 20 seconds cache for quotes
const HISTORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache for candles
const SEARCH_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache for search queries

// Well-known Indian Market Instruments dictionary
export const SUPPORTED_INDIAN_INSTRUMENTS: Array<{
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'INDEX';
  sector: string;
  description: string;
}> = [
  {
    symbol: '^NSEI',
    name: 'NIFTY 50',
    exchange: 'INDEX',
    sector: 'National Stock Exchange Benchmark',
    description: 'Flagship index of the National Stock Exchange of India, representing 50 largest blue-chip Indian companies across 13 sectors.',
  },
  {
    symbol: '^BSESN',
    name: 'S&P BSE SENSEX',
    exchange: 'INDEX',
    sector: 'Bombay Stock Exchange Benchmark',
    description: 'The oldest stock market benchmark in India, tracking 30 financially sound and well-established companies listed on BSE.',
  },
  {
    symbol: '^NSEBANK',
    name: 'NIFTY BANK',
    exchange: 'INDEX',
    sector: 'Banking & Financial Services',
    description: 'Tracks the 12 most liquid and capitalized Indian banking stocks on the NSE.',
  },
  {
    symbol: 'FCL.NS',
    name: 'Fineotex Chemical Limited',
    exchange: 'NSE',
    sector: 'Specialty Chemicals & Manufacturing',
    description: 'Leading manufacturer of specialty chemicals and enzymes for textile, water treatment, and cleaning industries listed on NSE as FCL.',
  },
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    sector: 'Energy, Retail & Telecommunications',
    description: 'India’s largest corporation by market capitalization, spanning oil-to-chemicals, telecom (Jio), and organized retail.',
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services Ltd',
    exchange: 'NSE',
    sector: 'Information Technology Services',
    description: 'Leading global IT services and consulting enterprise, flagship firm of the Tata Group.',
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    sector: 'Private Sector Banking',
    description: 'India’s largest private sector bank by assets and market cap with nationwide retail and corporate banking.',
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Ltd',
    exchange: 'NSE',
    sector: 'Information Technology Services',
    description: 'Pioneering Indian multinational information technology services and consulting giant.',
  },
  {
    symbol: 'TATAMOTORS.NS',
    name: 'Tata Motors Ltd',
    exchange: 'NSE',
    sector: 'Automotive & Commercial Vehicles',
    description: 'Major automotive manufacturer producing cars, commercial vehicles, and electric vehicles, parent of Jaguar Land Rover.',
  },
  {
    symbol: 'SBIN.NS',
    name: 'State Bank of India',
    exchange: 'NSE',
    sector: 'Public Sector Banking',
    description: 'India’s largest public sector bank and Fortune 500 financial services corporation.',
  },
  {
    symbol: 'BHARTIARTL.NS',
    name: 'Bharti Airtel Ltd',
    exchange: 'NSE',
    sector: 'Telecommunications',
    description: 'Global telecom conglomerate operating in 18 countries across South Asia and Africa.',
  },
  {
    symbol: 'ITC.NS',
    name: 'ITC Ltd',
    exchange: 'NSE',
    sector: 'Consumer Goods & Hospitality',
    description: 'Multi-business enterprise spanning FMCG, hotels, paperboards, packaging, and agri-business.',
  },
];

// Common Indian Company Name to Symbol Mapping dictionary
const INDIAN_NAME_ALIASES: Record<string, string> = {
  'FINEOTEX': 'FCL.NS',
  'FINEOTEX CHEMICAL': 'FCL.NS',
  'FINEOTEX CHEMICALS': 'FCL.NS',
  'FINEOTEX CHEMICAL LIMITED': 'FCL.NS',
  'FCL': 'FCL.NS',
  'NIFTY': '^NSEI',
  'NIFTY 50': '^NSEI',
  'NIFTY50': '^NSEI',
  'SENSEX': '^BSESN',
  'BANKNIFTY': '^NSEBANK',
  'NIFTY BANK': '^NSEBANK',
  'RELIANCE': 'RELIANCE.NS',
  'TCS': 'TCS.NS',
  'HDFC': 'HDFCBANK.NS',
  'HDFC BANK': 'HDFCBANK.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'INFY': 'INFY.NS',
  'INFOSYS': 'INFY.NS',
  'ICICI': 'ICICIBANK.NS',
  'ICICI BANK': 'ICICIBANK.NS',
  'ICICIBANK': 'ICICIBANK.NS',
  'TATA MOTORS': 'TATAMOTORS.NS',
  'TATAMOTORS': 'TATAMOTORS.NS',
  'TATA STEEL': 'TATASTEEL.NS',
  'TATASTEEL': 'TATASTEEL.NS',
  'TATA POWER': 'TATAPOWER.NS',
  'TATAPOWER': 'TATAPOWER.NS',
  'SBI': 'SBIN.NS',
  'STATE BANK OF INDIA': 'SBIN.NS',
  'SBIN': 'SBIN.NS',
  'AIRTEL': 'BHARTIARTL.NS',
  'BHARTI AIRTEL': 'BHARTIARTL.NS',
  'BHARTIARTL': 'BHARTIARTL.NS',
  'ITC': 'ITC.NS',
  'WIPRO': 'WIPRO.NS',
  'SUZLON': 'SUZLON.NS',
  'SUZLON ENERGY': 'SUZLON.NS',
  'IRFC': 'IRFC.NS',
  'ADANI ENTERPRISES': 'ADANIENT.NS',
  'ADANI PORTS': 'ADANIPORTS.NS',
  'ZOMATO': 'ETERNAL.NS',
};

/**
 * Fast synchronous symbol normalization for basic inputs
 */
export function normalizeIndianSymbol(rawSymbol: string): string {
  const clean = rawSymbol.trim().toUpperCase();
  if (INDIAN_NAME_ALIASES[clean]) {
    return INDIAN_NAME_ALIASES[clean];
  }

  if (clean.endsWith('.NS') || clean.endsWith('.BO') || clean.startsWith('^')) {
    return clean;
  }

  return `${clean}.NS`;
}

/**
 * Intelligent search function querying Indian exchange instruments
 */
export async function searchIndianInstruments(query: string): Promise<SearchResultItem[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  const cacheKey = clean.toUpperCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Check local preset catalog
  const localMatches: SearchResultItem[] = SUPPORTED_INDIAN_INSTRUMENTS
    .filter((i) =>
      i.name.toLowerCase().includes(clean.toLowerCase()) ||
      i.symbol.toLowerCase().includes(clean.toLowerCase())
    )
    .map((i) => ({ symbol: i.symbol, name: i.name, exchange: i.exchange }));

  // Check alias dictionary
  for (const [aliasName, sym] of Object.entries(INDIAN_NAME_ALIASES)) {
    if (aliasName.toLowerCase().includes(clean.toLowerCase()) || clean.toLowerCase().includes(aliasName.toLowerCase())) {
      const match = SUPPORTED_INDIAN_INSTRUMENTS.find((s) => s.symbol === sym);
      localMatches.push({
        symbol: sym,
        name: match ? match.name : aliasName,
        exchange: sym.endsWith('.BO') ? 'BSE' : sym.startsWith('^') ? 'INDEX' : 'NSE',
      });
    }
  }

  // 2. Query Yahoo Finance Search API for real-world NSE / BSE equities
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(clean)}&quotesCount=12&newsCount=0`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const quotes = data.quotes || [];
      const remoteMatches: SearchResultItem[] = [];

      for (const q of quotes) {
        if (!q.symbol) continue;
        const sym = q.symbol.toUpperCase();
        let exchange: 'NSE' | 'BSE' | 'INDEX' | null = null;
        if (sym.endsWith('.NS')) exchange = 'NSE';
        else if (sym.endsWith('.BO')) exchange = 'BSE';
        else if (sym.startsWith('^') && (sym.includes('NSE') || sym.includes('BSE') || sym.includes('NIFTY') || sym.includes('SENSEX'))) exchange = 'INDEX';

        if (exchange) {
          remoteMatches.push({
            symbol: sym,
            name: q.shortname || q.longname || sym,
            exchange,
            typeDisp: q.typeDisp,
          });
        }
      }

      // Merge and deduplicate
      const seen = new Set<string>();
      const combined: SearchResultItem[] = [];

      for (const item of [...localMatches, ...remoteMatches]) {
        if (!seen.has(item.symbol)) {
          seen.add(item.symbol);
          combined.push(item);
        }
      }

      searchCache.set(cacheKey, { data: combined, timestamp: Date.now() });
      return combined;
    }
  } catch (err: any) {
    console.warn(`Search API query failed for "${clean}":`, err.message);
  }

  // Fallback to local matches
  const seen = new Set<string>();
  const filteredLocal: SearchResultItem[] = [];
  for (const item of localMatches) {
    if (!seen.has(item.symbol)) {
      seen.add(item.symbol);
      filteredLocal.push(item);
    }
  }
  return filteredLocal;
}

/**
 * Resolves any user-entered text (e.g. "Fineotex", "FCL", "Reliance", "Tata Motors")
 * to its verified Indian exchange symbol (e.g. "FCL.NS", "RELIANCE.NS").
 */
export async function resolveIndianSymbol(input: string): Promise<string> {
  const clean = input.trim();
  if (!clean) return '^NSEI';

  const upper = clean.toUpperCase();

  // 1. Direct alias dictionary lookup (handles "Fineotex", "FCL", "Nifty", etc.)
  if (INDIAN_NAME_ALIASES[upper]) {
    return INDIAN_NAME_ALIASES[upper];
  }

  // Check supported instruments
  const supportedMatch = SUPPORTED_INDIAN_INSTRUMENTS.find(
    (i) => i.symbol.toUpperCase() === upper || i.name.toUpperCase() === upper
  );
  if (supportedMatch) {
    return supportedMatch.symbol;
  }

  // If already ends in valid exchange suffix or index prefix
  if (upper.endsWith('.NS') || upper.endsWith('.BO') || upper.startsWith('^')) {
    return upper;
  }

  // 2. Perform live search resolution for company names
  try {
    const searchResults = await searchIndianInstruments(clean);
    if (searchResults && searchResults.length > 0) {
      // Prioritize exact or NSE ticker match
      const nseMatch = searchResults.find((r) => r.symbol.endsWith('.NS'));
      if (nseMatch) return nseMatch.symbol;
      return searchResults[0].symbol;
    }
  } catch (err: any) {
    console.warn('Symbol resolution search failed:', err.message);
  }

  // Default fallback to NSE ticker
  return `${upper}.NS`;
}

/**
 * Resolves instrument metadata from symbol
 */
function resolveInstrumentMeta(symbol: string): { name: string; exchange: 'NSE' | 'BSE' | 'INDEX' } {
  const match = SUPPORTED_INDIAN_INSTRUMENTS.find((i) => i.symbol === symbol);
  if (match) {
    return { name: match.name, exchange: match.exchange };
  }

  if (symbol.startsWith('^')) {
    return { name: symbol, exchange: 'INDEX' };
  }
  if (symbol.endsWith('.BO')) {
    return { name: symbol.replace('.BO', ''), exchange: 'BSE' };
  }
  return { name: symbol.replace('.NS', ''), exchange: 'NSE' };
}

/**
 * Fetches real quote and candles from Yahoo Finance
 */
async function fetchFromYahooFinance(
  symbol: string,
  range: string = '3mo',
  interval: string = '1d'
): Promise<{ quote: NormalizedQuote; history: NormalizedHistory }> {
  const encodedSymbol = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=${interval}&range=${range}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000); // 9-second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 CandlestickAI/3.0',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Symbol '${symbol}' not found on Indian exchanges (NSE/BSE). Please check the ticker.`);
      }
      if (response.status === 429) {
        throw new Error('Market data rate limit reached. Please wait a few seconds before requesting again.');
      }
      throw new Error(`Market data provider returned HTTP status ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result || !result.meta) {
      throw new Error(`No market data returned for symbol '${symbol}'.`);
    }

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quoteData = result.indicators?.quote?.[0] || {};
    const opens = quoteData.open || [];
    const highs = quoteData.high || [];
    const lows = quoteData.low || [];
    const closes = quoteData.close || [];
    const volumes = quoteData.volume || [];

    // Parse candles
    const candles: CandleRecord[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      const o = opens[i];
      const h = highs[i];
      const l = lows[i];

      if (c === null || c === undefined || isNaN(c)) continue;

      const dateObj = new Date(timestamps[i] * 1000);
      const dateStr = dateObj.toISOString().split('T')[0];

      candles.push({
        date: dateStr,
        timestamp: timestamps[i] * 1000,
        open: Number((o ?? c).toFixed(2)),
        high: Number((h ?? Math.max(o ?? c, c)).toFixed(2)),
        low: Number((l ?? Math.min(o ?? c, c)).toFixed(2)),
        close: Number(c.toFixed(2)),
        volume: Number(volumes[i] || 0),
      });
    }

    // Determine latest price & changes
    const currentPrice = meta.regularMarketPrice ?? (candles.length > 0 ? candles[candles.length - 1].close : meta.previousClose ?? 0);
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? (candles.length > 1 ? candles[candles.length - 2].close : currentPrice);
    const change = Number((currentPrice - previousClose).toFixed(2));
    const changePercent = previousClose > 0 ? Number(((change / previousClose) * 100).toFixed(2)) : 0;

    const exchangeDate = meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString();

    const instrumentMeta = resolveInstrumentMeta(symbol);

    // Free feeds reflect ~15-minute delayed or latest official EOD closing price
    const dataStatus = 'delayed';

    const normalizedQuote: NormalizedQuote = {
      symbol,
      name: meta.shortName || meta.longName || instrumentMeta.name,
      exchange: instrumentMeta.exchange,
      currency: 'INR',
      price: Number(currentPrice.toFixed(2)),
      change,
      changePercent,
      open: Number((meta.regularMarketDayOpen ?? (candles.length > 0 ? candles[candles.length - 1].open : currentPrice)).toFixed(2)),
      high: Number((meta.regularMarketDayHigh ?? (candles.length > 0 ? candles[candles.length - 1].high : currentPrice)).toFixed(2)),
      low: Number((meta.regularMarketDayLow ?? (candles.length > 0 ? candles[candles.length - 1].low : currentPrice)).toFixed(2)),
      previousClose: Number(previousClose.toFixed(2)),
      volume: meta.regularMarketVolume || (candles.length > 0 ? candles[candles.length - 1].volume : 0),
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : undefined,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : undefined,
      marketSource: 'Yahoo Finance (NSE/BSE 15-min Delayed Market Feed)',
      exchangeTimestamp: exchangeDate,
      retrievalTimestamp: new Date().toISOString(),
      dataStatus,
    };

    const normalizedHistory: NormalizedHistory = {
      symbol,
      exchange: instrumentMeta.exchange,
      timeframe: interval,
      candles,
      retrievalTimestamp: new Date().toISOString(),
      dataStatus,
      marketSource: 'Yahoo Finance (NSE/BSE Historical Daily Candles)',
    };

    return { quote: normalizedQuote, history: normalizedHistory };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Connection timed out after 9 seconds while fetching market data for '${symbol}'.`);
    }
    throw err;
  }
}

/**
 * Public function to get quote with intelligent symbol resolution, in-memory caching and error handling
 */
export async function getIndianMarketQuote(rawInput: string): Promise<NormalizedQuote> {
  // Resolve input (e.g. "Fineotex" -> "FCL.NS", "Reliance" -> "RELIANCE.NS")
  const symbol = await resolveIndianSymbol(rawInput);

  // Check cache
  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const { quote, history } = await fetchFromYahooFinance(symbol, '1mo', '1d');

    // Update caches
    quoteCache.set(symbol, { data: quote, timestamp: Date.now() });
    historyCache.set(symbol, { data: history, timestamp: Date.now() });

    return quote;
  } catch (err: any) {
    console.error(`Failed to fetch quote for ${rawInput} (${symbol}):`, err.message);

    // If initial fetch failed, try search resolution if we haven't already
    if (!symbol.includes('.')) {
      try {
        const searchMatches = await searchIndianInstruments(rawInput);
        if (searchMatches.length > 0) {
          const alternateSymbol = searchMatches[0].symbol;
          const { quote, history } = await fetchFromYahooFinance(alternateSymbol, '1mo', '1d');
          quoteCache.set(alternateSymbol, { data: quote, timestamp: Date.now() });
          historyCache.set(alternateSymbol, { data: history, timestamp: Date.now() });
          return quote;
        }
      } catch {
        // proceed to fallback
      }
    }

    const instrumentMeta = resolveInstrumentMeta(symbol);
    return {
      symbol,
      name: instrumentMeta.name,
      exchange: instrumentMeta.exchange,
      currency: 'INR',
      price: 0,
      change: 0,
      changePercent: 0,
      open: 0,
      high: 0,
      low: 0,
      previousClose: 0,
      volume: 0,
      marketSource: 'Market Data Provider',
      exchangeTimestamp: new Date().toISOString(),
      retrievalTimestamp: new Date().toISOString(),
      dataStatus: 'unavailable',
      errorMessage: err.message || `Unable to fetch current market price for ${rawInput}.`,
    };
  }
}

/**
 * Public function to get historical candles with intelligent symbol resolution and caching
 */
export async function getIndianMarketHistory(
  rawInput: string,
  range: string = '3mo',
  interval: string = '1d'
): Promise<NormalizedHistory> {
  const symbol = await resolveIndianSymbol(rawInput);
  const cacheKey = `${symbol}_${range}_${interval}`;

  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < HISTORY_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const { quote, history } = await fetchFromYahooFinance(symbol, range, interval);

    // Update caches
    quoteCache.set(symbol, { data: quote, timestamp: Date.now() });
    historyCache.set(cacheKey, { data: history, timestamp: Date.now() });

    return history;
  } catch (err: any) {
    console.error(`Failed to fetch history for ${rawInput} (${symbol}):`, err.message);

    const instrumentMeta = resolveInstrumentMeta(symbol);
    return {
      symbol,
      exchange: instrumentMeta.exchange,
      timeframe: interval,
      candles: [],
      retrievalTimestamp: new Date().toISOString(),
      dataStatus: 'unavailable',
      marketSource: 'Market Data Provider',
      errorMessage: err.message || `Unable to retrieve historical candlestick data for ${rawInput}.`,
    };
  }
}
