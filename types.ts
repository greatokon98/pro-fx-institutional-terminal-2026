
export type Timeframe = '30S' | '2M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D';

export interface PricePoint {
  time: string;
  price: number;
  ema: number;
  smaFast: number;
  smaSlow: number;
  volume: number;
  isReversal?: 'BUY' | 'SELL' | null;
}

export interface Zone {
  type: 'SUPPLY' | 'DEMAND';
  price: number;
  strength: number;
}

export interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry: number;
  sl: number;
  tp: number;
  lots: number;
  pnl: number;
  status: 'OPEN' | 'CLOSED';
}

export interface AssetData {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  history: PricePoint[];
  zones: Zone[];
}

export interface AnalysisResult {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  reasoning: string;
  institutionalInsights: string[];
  recommendedAction: 'BUY' | 'SELL' | 'WAIT';
}

export interface SessionInfo {
  name: string;
  start: string;
  end: string;
  isOpen: boolean;
  timezone: string;
}
