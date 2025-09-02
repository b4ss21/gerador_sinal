(function(){
  // Port simplificado baseado no TechnicalAnalysisService do outro projeto
  function calculateSMA(prices, period){ if(prices.length<period) return prices.at(-1)||0; const recent=prices.slice(-period); return recent.reduce((a,v)=>a+v,0)/period; }
  function calculateEMA(prices, period){ if(prices.length<period) return prices.at(-1)||0; const k=2/(period+1); let ema=calculateSMA(prices.slice(0,period), period); for(let i=period;i<prices.length;i++){ ema = prices[i]*k + ema*(1-k);} return ema; }
  function calculateRSI(prices, period=14){ if(prices.length<period+1) return 50; const gains=[],losses=[]; for(let i=1;i<prices.length;i++){ const d=prices[i]-prices[i-1]; gains.push(d>0?d:0); losses.push(d<0?-d:0);} let avgGain=gains.slice(0,period).reduce((a,v)=>a+v,0)/period; let avgLoss=losses.slice(0,period).reduce((a,v)=>a+v,0)/period; for(let i=period;i<gains.length;i++){ avgGain=((avgGain*(period-1))+gains[i])/period; avgLoss=((avgLoss*(period-1))+losses[i])/period; } if(avgLoss===0) return 100; const rs=avgGain/avgLoss; return 100 - (100/(1+rs)); }
  function calculateStochastic(candles,kP=14,dP=3){ if(candles.length<kP) return {k:50,d:50}; const recent=candles.slice(-kP); const close=candles.at(-1).c; const hh=Math.max(...recent.map(c=>c.h)); const ll=Math.min(...recent.map(c=>c.l)); const k=((close-ll)/(hh-ll))*100; const kVals=[]; for(let i=Math.max(0,candles.length-dP); i<candles.length;i++){ const seg=candles.slice(Math.max(0,i-kP+1), i+1); if(seg.length===kP){ const ph=Math.max(...seg.map(c=>c.h)); const pl=Math.min(...seg.map(c=>c.l)); kVals.push(((seg.at(-1).c - pl)/(ph-pl))*100); } } const d=kVals.length>0? kVals.reduce((a,v)=>a+v,0)/kVals.length : k; return {k,d}; }
  function calculateBollinger(prices, period=20, stdDev=2){ if(prices.length<period){ const avg = prices.reduce((a,v)=>a+v,0)/prices.length; const dev=avg*0.02; return { upper: avg+dev, middle: avg, lower: avg-dev }; } const recent=prices.slice(-period); const sma = recent.reduce((a,v)=>a+v,0)/period; const variance = recent.reduce((a,v)=> a+Math.pow(v-sma,2),0)/period; const sd=Math.sqrt(variance); return { upper: sma+sd*stdDev, middle: sma, lower: sma - sd*stdDev } }
  function calculateMACD(prices, fp=12, sp=26, sig=9){ const emaF=calculateEMA(prices,fp), emaS=calculateEMA(prices,sp); const macd = emaF - emaS; const macdVals=[]; for(let i=sp;i<=prices.length;i++){ const seg=prices.slice(0,i); macdVals.push(calculateEMA(seg,fp)-calculateEMA(seg,sp)); } const signal = calculateEMA(macdVals, sig); const histogram = macd - signal; return {macd, signal, histogram}; }
  function calculateVolatility(candles){ if(candles.length<2) return 0; const rets=candles.slice(1).map((c,i)=> Math.log(c.c/candles[i].c)); const avg = rets.reduce((a,v)=>a+v,0)/rets.length; const varr = rets.reduce((a,v)=> a+Math.pow(v-avg,2),0)/rets.length; return Math.sqrt(varr)*Math.sqrt(365)*100; }
  function calculateVolumeProfile(candles){ if(candles.length<10) return 1; const vols=candles.slice(-10).map(c=>c.v); const avg = vols.reduce((a,v)=>a+v,0)/vols.length; const cur = candles.at(-1).v; return cur/avg; }

  function analyzeIndicators(bars){ const prices=bars.map(b=>b.c); return {
    ema12: calculateEMA(prices,12),
    ema26: calculateEMA(prices,26),
    ema50: calculateEMA(prices,50),
    rsi: calculateRSI(prices),
    stochastic: calculateStochastic(bars),
    bollingerBands: calculateBollinger(prices),
    macd: calculateMACD(prices),
    volatility: calculateVolatility(bars),
    volumeProfile: calculateVolumeProfile(bars)
  };}

  function generateSignal(symbol, bars, ind, btcCorrelation, timeframe){ if(bars.length<50) return null; const current=bars.at(-1).c; const prev=bars.at(-2).c; const priceChange=(current-prev)/prev*100; let type=null; let confidence=0; const reasons=[]; const emaBull = ind.ema12>ind.ema26 && ind.ema26>ind.ema50; const emaBear = ind.ema12<ind.ema26 && ind.ema26<ind.ema50; if(emaBull){ confidence+=25; type='BUY'; reasons.push('EMA Bullish Alignment (12>26>50)'); } else if(emaBear){ confidence+=25; type='SELL'; reasons.push('EMA Bearish Alignment (12<26<50)'); }
    if(ind.rsi < 25){ confidence+=30; if(type!=='SELL') type='BUY'; reasons.push(`RSI Extremely Oversold (${ind.rsi.toFixed(1)})`); } else if (ind.rsi > 75){ confidence+=30; if(type!=='BUY') type='SELL'; reasons.push(`RSI Extremely Overbought (${ind.rsi.toFixed(1)})`); } else if (ind.rsi < 35 && type==='BUY'){ confidence+=15; reasons.push(`RSI Oversold Support (${ind.rsi.toFixed(1)})`);} else if (ind.rsi > 65 && type==='SELL'){ confidence+=15; reasons.push(`RSI Overbought Resistance (${ind.rsi.toFixed(1)})`);} 
    const stOversold = ind.stochastic.k < 20 && ind.stochastic.d < 20; const stOverbought = ind.stochastic.k > 80 && ind.stochastic.d > 80; const stBullCross = ind.stochastic.k > ind.stochastic.d && ind.stochastic.k < 50; const stBearCross = ind.stochastic.k < ind.stochastic.d && ind.stochastic.k > 50; if(stOversold){ confidence+=20; if(type!=='SELL') type='BUY'; reasons.push('Stochastic Oversold Zone'); } else if (stOverbought){ confidence+=20; if(type!=='BUY') type='SELL'; reasons.push('Stochastic Overbought Zone'); } else if (stBullCross && type==='BUY'){ confidence+=15; reasons.push('Stochastic Bullish Cross'); } else if (stBearCross && type==='SELL'){ confidence+=15; reasons.push('Stochastic Bearish Cross'); }
    const bbPos = (current - ind.bollingerBands.lower)/(ind.bollingerBands.upper - ind.bollingerBands.lower); if (bbPos <= 0.1){ confidence+=25; if(type!=='SELL') type='BUY'; reasons.push('Price at Lower Bollinger Band'); } else if (bbPos >= 0.9){ confidence+=25; if(type!=='BUY') type='SELL'; reasons.push('Price at Upper Bollinger Band'); }
    const macdBull = ind.macd.macd > ind.macd.signal && ind.macd.histogram > 0; const macdBear = ind.macd.macd < ind.macd.signal && ind.macd.histogram < 0; if(macdBull && type==='BUY'){ confidence+=20; reasons.push('MACD Bullish Divergence'); } else if (macdBear && type==='SELL'){ confidence+=20; reasons.push('MACD Bearish Divergence'); }
    if (ind.volumeProfile > 1.5){ confidence+=15; reasons.push(`High Volume Confirmation (${ind.volumeProfile.toFixed(1)}x avg)`);} else if (ind.volumeProfile < 0.5){ confidence-=10; reasons.push('Low Volume Warning'); }
    if (ind.volatility > 100){ confidence-=15; reasons.push('High Volatility Risk'); } else if (ind.volatility < 30){ confidence+=10; reasons.push('Low Volatility Environment'); }
    if (Math.abs(btcCorrelation) > 0.8){ confidence+=15; reasons.push(`Strong BTC Correlation (${(btcCorrelation*100).toFixed(1)}%)`);} else if (Math.abs(btcCorrelation) < 0.3){ confidence+=10; reasons.push('Independent from BTC Movement'); }
    const momentum = Math.abs(priceChange); if (momentum > 2){ if((priceChange>0 && type==='BUY') || (priceChange<0 && type==='SELL')){ confidence+=15; reasons.push(`Strong Momentum (${priceChange.toFixed(2)}%)`);} else { confidence-=10; reasons.push('Conflicting Momentum'); } }
    // trend strength simplificado
    const ema20 = calculateEMA(bars.map(b=>b.c),20), ema50 = calculateEMA(bars.map(b=>b.c),50); const priceVsEma20 = (current - ema20)/ema20; const emaAlign = (ema20 - ema50)/ema50; const trendStrength = (priceVsEma20 + emaAlign)/2; if (trendStrength > 0.7 && type==='BUY'){ confidence+=20; reasons.push('Strong Uptrend Confirmation'); } else if (trendStrength < -0.7 && type==='SELL'){ confidence+=20; reasons.push('Strong Downtrend Confirmation'); }
    if(!type || confidence < 65) return null;
    // alvo/stop aproximados por volatilidade
    const volMult = Math.min(ind.volatility/50, 2); const baseTP = 0.02 + volMult*0.01; const baseSL = 0.015 + volMult*0.005; const targetMult = type==='BUY' ? (1+baseTP) : (1-baseTP); const stopMult = type==='BUY' ? (1-baseSL) : (1+baseSL);
    return { type, entryPrice: current, targetPrice: current*targetMult, stopLoss: current*stopMult, confidence: Math.min(confidence,95), reason: reasons.join(', ') };
  }

  window.TechnicalAnalysis = {
    evaluate: async (ctx) => {
      const bars = ctx.bars; const closes = ctx.closes;
      const ind = analyzeIndicators(bars);
      // BTC correlation: avisar 0 como placeholder (ou ctx.btcCorrelation se fornecido)
      const btcCorr = typeof ctx.btcCorrelation === 'number' ? ctx.btcCorrelation : 0;
      const sig = generateSignal(ctx.pair || ctx.symbol || '', bars, ind, btcCorr, ctx.tf || ctx.timeframe || '');
      if(!sig) return null;
      return { side: sig.type?.toLowerCase() };
    }
  };
})();
