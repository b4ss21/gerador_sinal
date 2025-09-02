export interface BinancePrice {
  symbol: string;
  price: string;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  confidence: number;
  timestamp: Date;
  reason: string;
}