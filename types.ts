
export type Timeframe = '1M' | '5M' | '1H' | '4H' | '1D' | '1W';

export interface PricePoint {
  time: string;
  price: number;
  ema: number;
  volume: number;
}

export interface AssetData {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  history: PricePoint[];
}

export interface SessionInfo {
  name: string;
  start: string; // HH:mm UTC
  end: string;   // HH:mm UTC
  isOpen: boolean;
  timezone: string;
}

export interface AnalysisResult {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  reasoning: string;
  institutionalInsights: string[];
}
