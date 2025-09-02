// Analisador de sinais: calcula indicadores e marca setas no gráfico TradingView
(function () {
  const state = {
    pair: 'BTC/BRL',
    interval: '1m',
    timer: null,
    lastDrawKey: '',
  };

  function tvChart() {
    try { return (window.TVWidget && (window.TVWidget.chart ? window.TVWidget.chart() : window.TVWidget.activeChart())); } catch (e) { return null; }
  }

  function mapInterval(tf) {
    const m = { '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '1h': '1h' };
    return m[tf] || '1m';
  }
  function intervalSeconds(tf) {
    switch (tf) {
      case '1m': return 60; case '3m': return 180; case '5m': return 300; case '15m': return 900; case '1h': return 3600;
      default: return 60;
    }
  }
  function toBinance(pair) {
    const map = {
      'BTC/USDT': 'BTCUSDT', 'ETH/USDT': 'ETHUSDT', 'SOL/USDT': 'SOLUSDT',
      'BTC/BRL': 'BTCBRL', 'ETH/BRL': 'ETHBRL', 'SOL/BRL': 'SOLBRL',
    };
    return map[pair] || 'BTCUSDT';
  }

  async function fetchKlines(symbol, interval, limit = 500) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json();
    // Cada item: [ openTime, open, high, low, close, volume, closeTime, ... ]
    return data.map(d => ({ t: d[0], o: +d[1], h: +d[2], l: +d[3], c: +d[4], v: +d[5] }));
  }

  // Indicadores
  function SMA(arr, p) {
    const out = Array(arr.length).fill(null);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
      if (i >= p) sum -= arr[i - p];
      if (i >= p - 1) out[i] = sum / p;
    }
    return out;
  }
  function EMA(arr, p) {
    const out = Array(arr.length).fill(null);
    const k = 2 / (p + 1);
    let prev = null;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (prev == null) prev = v;
      prev = v * k + prev * (1 - k);
      out[i] = prev;
    }
    return out;
  }
  function ATR(bars, p = 14) {
    const out = Array(bars.length).fill(null);
    let trQueue = [];
    let prevClose = bars[0]?.c ?? null;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const tr = Math.max(
        b.h - b.l,
        prevClose != null ? Math.abs(b.h - prevClose) : 0,
        prevClose != null ? Math.abs(b.l - prevClose) : 0
      );
      prevClose = b.c;
      trQueue.push(tr);
      if (trQueue.length > p) trQueue.shift();
      if (trQueue.length === p) {
        const sum = trQueue.reduce((a, v) => a + v, 0);
        out[i] = sum / p;
      }
    }
    return out;
  }
  function RSI(closes, p = 14) {
    const out = Array(closes.length).fill(null);
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i < closes.length; i++) {
      const ch = closes[i] - closes[i - 1];
      const gain = Math.max(ch, 0);
      const loss = Math.max(-ch, 0);
      if (i <= p) { avgGain += gain; avgLoss += loss; if (i === p) { avgGain /= p; avgLoss /= p; out[i] = 100 - (100 / (1 + (avgGain / (avgLoss || 1e-9)))); } }
      else {
        avgGain = (avgGain * (p - 1) + gain) / p;
        avgLoss = (avgLoss * (p - 1) + loss) / p;
        out[i] = 100 - (100 / (1 + (avgGain / (avgLoss || 1e-9))));
      }
    }
    return out;
  }
  function StochRSI(closes, rsiLen = 14, stochLen = 14, smoothK = 3) {
    const r = RSI(closes, rsiLen);
    const k = Array(closes.length).fill(null);
    for (let i = 0; i < r.length; i++) {
      const from = Math.max(0, i - stochLen + 1);
      const slice = r.slice(from, i + 1).filter(x => x != null);
      if (slice.length < 2) { k[i] = null; continue; }
      const min = Math.min(...slice), max = Math.max(...slice);
      k[i] = max === min ? 0 : ((r[i] - min) / (max - min)) * 100;
    }
    // Suavização simples
    const ks = SMA(k.map(x => x == null ? 0 : x), smoothK);
    return ks;
  }
  function Bollinger(closes, p = 20, mult = 2) {
    const ma = SMA(closes, p);
    const out = Array(closes.length).fill(null).map(() => ({ mid: null, up: null, low: null }));
    for (let i = 0; i < closes.length; i++) {
      if (i < p - 1) continue;
      const slice = closes.slice(i - p + 1, i + 1);
      const mean = ma[i];
      const variance = slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / p;
      const sd = Math.sqrt(variance);
      out[i] = { mid: mean, up: mean + mult * sd, low: mean - mult * sd };
    }
    return out;
  }
  function higherHighs(highs, lookback = 3, count = 2) {
    // Encontra últimos 'count' topos locais
    const tops = [];
    for (let i = lookback; i < highs.length - lookback; i++) {
      const h = highs[i];
      let isTop = true;
      for (let j = i - lookback; j <= i + lookback; j++) if (highs[j] > h) { isTop = false; break; }
      if (isTop) tops.push({ i, h });
    }
    if (tops.length < count) return false;
    const last = tops.slice(-count);
    for (let k = 1; k < last.length; k++) if (!(last[k].h > last[k - 1].h)) return false;
    return true;
  }
  function lowerHighs(highs, lookback = 3, count = 2) {
    const tops = [];
    for (let i = lookback; i < highs.length - lookback; i++) {
      const h = highs[i];
      let isTop = true;
      for (let j = i - lookback; j <= i + lookback; j++) if (highs[j] > h) { isTop = false; break; }
      if (isTop) tops.push({ i, h });
    }
    if (tops.length < count) return false;
    const last = tops.slice(-count);
    for (let k = 1; k < last.length; k++) if (!(last[k].h < last[k - 1].h)) return false;
    return true;
  }

  function crosses(upArr, downArr, i) {
    if (i < 1) return { up: false, down: false };
    const up = upArr[i - 1] != null && downArr[i - 1] != null && upArr[i] != null && downArr[i] != null && upArr[i - 1] <= downArr[i - 1] && upArr[i] > downArr[i];
    const down = upArr[i - 1] != null && downArr[i - 1] != null && upArr[i] != null && downArr[i] != null && upArr[i - 1] >= downArr[i - 1] && upArr[i] < downArr[i];
    return { up, down };
  }

  function ensureBadge() {
    const host = document.getElementById('tv_chart');
    if (!host) return null;
    let b = host.querySelector('.signal-badge');
    if (!b) {
      b = document.createElement('div');
      b.className = 'signal-badge';
      host.appendChild(b);
    }
    return b;
  }

  function recentPivotLow(bars, lookback = 20) {
    const L = bars.length;
    let idx = -1, val = Infinity;
    for (let i = Math.max(0, L - lookback); i < L; i++) {
      if (bars[i].l < val) { val = bars[i].l; idx = i; }
    }
    return idx >= 0 ? { i: idx, price: val } : null;
  }
  function recentPivotHigh(bars, lookback = 20) {
    const L = bars.length;
    let idx = -1, val = -Infinity;
    for (let i = Math.max(0, L - lookback); i < L; i++) {
      if (bars[i].h > val) { val = bars[i].h; idx = i; }
    }
    return idx >= 0 ? { i: idx, price: val } : null;
  }
  function fmt(n) { return (n >= 1 ? n.toFixed(2) : n.toFixed(6)); }
  function pct(a, b) { return ((a - b) / b) * 100; }

  async function analyzeAndDraw() {
    const chart = tvChart();
    if (!chart) return;
    const sym = toBinance(state.pair);
    const tf = mapInterval(state.interval);
    const bars = await fetchKlines(sym, tf, 500);
    if (!bars.length) return;

    const closes = bars.map(b => b.c);
    const highs = bars.map(b => b.h);
    const ema9 = EMA(closes, 9);
    const ema21 = EMA(closes, 21);
    const sma200 = SMA(closes, 200);
    const bb = Bollinger(closes, 20, 2);
  const stoch = StochRSI(closes, 14, 14, 3);
  const atr = ATR(bars, 14);

    // Tendência via BTCUSDT EMA9>EMA21
    const refBars = await fetchKlines('BTCUSDT', tf, 200);
    const refCloses = refBars.map(b => b.c);
    const refE9 = EMA(refCloses, 9), refE21 = EMA(refCloses, 21);
    const refUp = refE9.at(-1) > refE21.at(-1);

    const hh = higherHighs(highs);
    const lh = lowerHighs(highs);

    const last = bars.length - 1;
    const cross = crosses(ema9, ema21, last);
    const nearLower = bb[last]?.low && closes[last] <= bb[last].low * 1.01;
    const nearUpper = bb[last]?.up && closes[last] >= bb[last].up * 0.99;
    const stUp = stoch[last] != null && stoch[last] > 20 && stoch[last - 1] != null && stoch[last - 1] <= 20;
    const stDown = stoch[last] != null && stoch[last] < 80 && stoch[last - 1] != null && stoch[last - 1] >= 80;

    const baseBuy = (cross.up || stUp || nearLower) && (refUp || state.pair.startsWith('BTC')) && (hh || cross.up);
    const baseSell = (cross.down || stDown || nearUpper) && (!refUp || state.pair.startsWith('BTC')) && (lh || cross.down);

    // Consultar algoritmos externos (opcional)
    let extVotes = [];
    try {
      if (window.SignalAlgos && typeof window.SignalAlgos.runAll === 'function') {
        const ctx = { pair: state.pair, tf, bars, closes, highs, lows: bars.map(b => b.l), time: bars.at(-1).t, price: closes.at(-1) };
        extVotes = await window.SignalAlgos.runAll(ctx);
      }
    } catch (e) {}
    // Votos ponderados por confiança (0..1 ou 0..100)
    const weighted = (extVotes || []).map(v => {
      const side = String(v.side || v.signal || '').toLowerCase();
      let w = typeof v.confidence === 'number' ? v.confidence : (typeof v.score === 'number' ? v.score : 1);
      if (w > 1) w = w / 100;
      if (!(w >= 0)) w = 0; // NaN -> 0
      return { name: v.name, side, w };
    });
    const sumBuy = weighted.filter(x => x.side === 'buy').reduce((a, b) => a + b.w, 0);
    const sumSell = weighted.filter(x => x.side === 'sell').reduce((a, b) => a + b.w, 0);
    // Decisão: mantém sinal base; se neutro, usa ponderado com limiar mínimo
    let buy = baseBuy;
    let sell = baseSell;
    if (!buy && !sell) {
      if (sumBuy > sumSell && sumBuy >= 0.5) buy = true;
      else if (sumSell > sumBuy && sumSell >= 0.5) sell = true;
    }

    // Evitar redesenhar igual
    const key = `${state.pair}|${state.interval}|${bars[last].t}`;
    if (state.lastDrawKey === key) return;
    state.lastDrawKey = key;

    // Limpar shapes antigos recentes para não poluir
    try { chart.removeAllShapes(); } catch (e) {}

    // Recriar estudos base (best-effort)
    try {
      chart.createStudy('Moving Average Exponential', false, false, [9]);
      chart.createStudy('Moving Average Exponential', false, false, [21]);
      chart.createStudy('Bollinger Bands', false, false, [20, 2]);
      chart.createStudy('Stochastic RSI', false, false, [14, 14, 3, 3, 14]);
      chart.createStudy('Moving Average', false, false, [200]);
    } catch (e) {}

    const ts = Math.floor(bars[last].t / 1000);
    const priceAt = closes[last];
    let overlayLines = [];
    if (buy || sell) {
      const isLong = buy && !sell;
      const atrVal = atr[last] || (closes[last] * 0.005);
      const pivotLow = recentPivotLow(bars, 30);
      const pivotHigh = recentPivotHigh(bars, 30);
      let entry = priceAt;
      let sl, r;
      if (isLong) {
        sl = pivotLow ? Math.min(pivotLow.price, entry - atrVal) : entry - atrVal;
        r = Math.max(0.0000001, entry - sl);
      } else {
        sl = pivotHigh ? Math.max(pivotHigh.price, entry + atrVal) : entry + atrVal;
        r = Math.max(0.0000001, sl - entry);
      }
      const fibs = [0.618, 1.0, 1.618];
      const tps = fibs.map(f => isLong ? entry + f * r : entry - f * r);

      try {
        chart.createShape({ time: ts, price: priceAt }, {
          shape: isLong ? 'arrow_up' : 'arrow_down',
          text: isLong ? 'BUY' : 'SELL',
          lock: true, disableSelection: true,
          overrides: { color: isLong ? '#17b26a' : '#ef4444' }
        });
      } catch (e) {}

      function hline(price, text, color) {
        try {
          chart.createShape({ time: ts, price }, { shape: 'horizontal_line', text, lock: true, disableSelection: true, overrides: { color } });
        } catch (e) {
          try { chart.createShape({ time: ts, price }, { shape: 'price_label', text, lock: true, disableSelection: true, overrides: { color } }); } catch (e2) {}
        }
      }
  hline(entry, `ENTRY ${fmt(entry)}`, '#00bcd4');
  const slPct = Math.abs(pct(sl, entry));
  hline(sl, `SL ${fmt(sl)} (-${fmt(slPct)}%)`, '#ef4444');
      tps.forEach((tp, i) => {
        const rr = fibs[i];
        const p = fmt(Math.abs(pct(tp, entry)));
        hline(tp, `TP${i + 1} ${fmt(tp)} (${rr.toFixed(3)}R, ${p}%)`, '#17b26a');
      });

      overlayLines = [{ k: 'ENTRY', v: entry }, { k: 'SL', v: sl }].concat(tps.map((v, i) => ({ k: `TP${i + 1}`, v })));
    }

    // Fallback visual (badge) caso shapes não apareçam
    const badge = ensureBadge();
    if (badge) {
      if (buy || sell) {
        const isLong = buy && !sell;
        const linesTxt = overlayLines.map(x => `${x.k}: ${fmt(x.v)}`).join(' | ');
        const voteTxt = (extVotes && extVotes.length)
          ? ` • algos: ${extVotes.map(v => v.name + ':' + (v.side || v.signal || '?')).join(', ')} • ΣB:${sumBuy.toFixed(2)} ΣS:${sumSell.toFixed(2)}`
          : '';
        badge.textContent = `${isLong ? 'BUY' : 'SELL'} • ${linesTxt}${voteTxt}`;
        badge.dataset.side = isLong ? 'buy' : 'sell';
        badge.style.display = 'inline-flex';
      } else { badge.style.display = 'none'; }
    }
  }

  function schedule() {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(analyzeAndDraw, 6000);
    analyzeAndDraw();
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(() => {
    window.addEventListener('pairChange', (ev) => { state.pair = ev.detail?.pair || 'BTC/USDT'; state.lastDrawKey = ''; schedule(); });
    window.addEventListener('intervalChange', (ev) => { state.interval = ev.detail?.interval || '1m'; state.lastDrawKey = ''; schedule(); });
    window.addEventListener('tvChartReady', () => schedule());
  });
})();
