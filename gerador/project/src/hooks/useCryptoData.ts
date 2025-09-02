import { useState, useEffect } from 'react';
import { BinanceTicker, CryptoPair } from '../types/crypto';

export const useCryptoData = () => {
  const [pairs, setPairs] = useState<CryptoPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopUSDT = async (): Promise<string[]> => {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!response.ok) {
      throw new Error('Failed to fetch data from Binance');
    }
    
    const data: BinanceTicker[] = await response.json();
    
    // Filter pairs ending with USDT
    const usdtPairs = data.filter(item => item.symbol.endsWith('USDT'));
    
    // Sort by trading volume (quoteVolume) in descending order
    usdtPairs.sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
    
    // Get top 500
    const top500 = usdtPairs.slice(0, 500);
    return top500.map(item => item.symbol);
  };

  const loadPairs = async () => {
    try {
      setLoading(true);
      setError(null);
      const pairSymbols = await fetchTopUSDT();
      const pairsWithRank = pairSymbols.map((symbol, index) => ({
        symbol,
        rank: index + 1
      }));
      setPairs(pairsWithRank);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPairs();
  }, []);

  return { pairs, loading, error, refetch: loadPairs };
};