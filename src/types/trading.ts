export interface Candle {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketQuote {
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

export interface SampleStock {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'INDEX';
  sector: string;
  description: string;
  learningFocus: string;
  data: Candle[];
  quote?: MarketQuote;
}

export interface TechnicalAnalysisData {
  symbol: string;
  calculationTimestamp: string;
  timeframe: string;
  dataPointsUsed: number;
  currentPrice: number;
  priceChanges: {
    oneDay: number;
    fiveDay: number;
    oneMonth: number;
    threeMonth: number;
  };
  movingAverages: {
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    ema20: number | null;
    ema50: number | null;
    trendAlignment: string;
  };
  rsi: {
    period: number;
    value: number | null;
    condition: string;
  };
  levels: {
    support: number;
    resistance: number;
    range: number;
  };
  dataLimitations: string[];
}

export interface VirtualHolding {
  symbol: string;
  name: string;
  shares: number;
  averageBuyPrice: number;
  totalCost: number;
}

export interface VirtualTransaction {
  id: string;
  timestamp: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  totalAmount: number;
  status: 'SIMULATED FILL';
}

export interface VirtualPortfolio {
  cash: number;
  initialCash: number;
  holdings: Record<string, VirtualHolding>;
  transactions: VirtualTransaction[];
}

export type ChatbotRole = 'technical_analyst' | 'risk_coach' | 'trading_tutor';
export type GeminiModelChoice = 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite' | 'gemini-3.8-flash';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  role?: ChatbotRole;
  modelUsed?: string;
  suggestedFollowUps?: string[];
  contextStock?: string;
  isError?: boolean;
}
