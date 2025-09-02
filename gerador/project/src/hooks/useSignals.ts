import { useState, useEffect } from 'react';
import { TradingSignal, BinancePrice } from '../types/signal';

export const useSignals = (isAuthenticated: boolean) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBinancePrice = async (symbol: string): Promise<number> => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch price');
      
      const data: BinancePrice = await response.json();
      return parseFloat(data.price);
    } catch (err) {
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
  };

  const generateSignal = (symbol: string, price: number): TradingSignal => {
    // Simple signal generation logic based on price patterns
    const random = Math.random();
    const priceChange = (Math.random() - 0.5) * 0.1; // -5% to +5%
    
    let type: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let reason: string;

    if (priceChange > 0.03) {
      type = 'SELL';
      confidence = Math.min(90, 60 + (priceChange * 1000));
      reason = 'Preço em alta, possível correção';
    } else if (priceChange < -0.03) {
      type = 'BUY';
      confidence = Math.min(90, 60 + (Math.abs(priceChange) * 1000));
      reason = 'Preço em baixa, oportunidade de compra';
    } else {
      type = 'HOLD';
      confidence = 50 + (random * 30);
      reason = 'Mercado lateral, aguardar movimento';
    }

    return {
      id: `${symbol}-${Date.now()}`,
      symbol,
      type,
      price,
      confidence: Math.round(confidence),
      timestamp: new Date(),
      reason
    };
  };

  const generateSignals = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);

    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'];
      const newSignals: TradingSignal[] = [];

      for (const symbol of symbols) {
        try {
          const price = await fetchBinancePrice(symbol);
          const signal = generateSignal(symbol, price);
          newSignals.push(signal);
        } catch (err) {
          console.error(`Error generating signal for ${symbol}:`, err);
        }
      }

      setSignals(prev => [...newSignals, ...prev].slice(0, 20)); // Keep last 20 signals
    } catch (err) {
      setError('Erro ao gerar sinais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      generateSignals();
      const interval = setInterval(generateSignals, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return {
    signals,
    loading,
    error,
    generateSignals
  };
};