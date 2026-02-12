
import React from 'react';
import { SessionInfo, Timeframe } from './types';

export const ASSETS = [
  { symbol: "EURUSD=X", name: "EUR/USD", initial: 1.0854 },
  { symbol: "GBPUSD=X", name: "GBP/USD", initial: 1.2672 },
  { symbol: "USDJPY=X", name: "USD/JPY", initial: 151.42 },
  { symbol: "GC=F", name: "GOLD", initial: 2345.60 },
  { symbol: "BTC-USD", name: "BITCOIN", initial: 67240.00 }
];

export const TIMEFRAMES: Timeframe[] = ['1M', '5M', '1H', '4H', '1D', '1W'];

export const SESSIONS: SessionInfo[] = [
  { name: 'London', start: '08:00', end: '16:00', isOpen: false, timezone: 'Europe/London' },
  { name: 'New York', start: '13:00', end: '21:00', isOpen: false, timezone: 'America/New York' },
  { name: 'Sydney', start: '22:00', end: '06:00', isOpen: false, timezone: 'Australia/Sydney' },
  { name: 'Tokyo', start: '00:00', end: '08:00', isOpen: false, timezone: 'Asia/Tokyo' }
];
