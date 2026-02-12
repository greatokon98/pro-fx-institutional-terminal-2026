
import { SessionInfo, Timeframe } from './types';

export const ASSETS = [
  { symbol: "XAUUSD=X", name: "GOLD (SPOT)", initial: 2352.40 },
  { symbol: "V75-INDEX", name: "VOLATILITY 75", initial: 452100.00 },
  { symbol: "US30", name: "DOW JONES 30", initial: 39240.00 },
  { symbol: "NAS100", name: "NASDAQ 100", initial: 18240.00 },
  { symbol: "EURUSD=X", name: "EUR/USD", initial: 1.0854 },
  { symbol: "GBPUSD=X", name: "GBP/USD", initial: 1.2672 },
  { symbol: "BTC-USD", name: "BITCOIN", initial: 67240.00 }
];

export const TIMEFRAMES: Timeframe[] = ['30S', '2M', '5M', '10M', '15M', '30M', '1H', '4H', '1D'];

export const SESSIONS: SessionInfo[] = [
  { name: 'London', start: '08:00', end: '16:00', isOpen: false, timezone: 'Europe/London' },
  { name: 'New York', start: '13:00', end: '21:00', isOpen: false, timezone: 'America/New York' },
  { name: 'Sydney', start: '22:00', end: '06:00', isOpen: false, timezone: 'Australia/Sydney' },
  { name: 'Tokyo', start: '00:00', end: '08:00', isOpen: false, timezone: 'Asia/Tokyo' }
];
