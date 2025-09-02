(function(){
  // Gráfico alternativo (Lightweight Charts) para garantir marcadores no candle
  const state={ chart:null, series:null, markers:[] };
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  function create(){
    const el=document.getElementById('lw_chart');
    if(!el || state.chart) return;
    try{
      // eslint-disable-next-line no-undef
      state.chart = LightweightCharts.createChart(el,{ layout:{ background:{type:'solid', color:'#0b0f1a'}, textColor:'#fff' }, rightPriceScale:{ borderVisible:false }, timeScale:{ borderVisible:false }, grid:{ vertLines:{ color:'rgba(255,255,255,0.06)' }, horzLines:{ color:'rgba(255,255,255,0.06)' } } });
      state.series = state.chart.addCandlestickSeries({ upColor:'#17b26a', downColor:'#ef4444', borderUpColor:'#17b26a', borderDownColor:'#ef4444', wickUpColor:'#17b26a', wickDownColor:'#ef4444' });
    }catch(e){}
  }

  async function fetchK(symbol, interval, limit=500){
    const urls=[`https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`];
    let lastErr; for(const u of urls){ try{ const r=await fetch(u,{cache:'no-store'}); if(!r.ok){lastErr=new Error('HTTP '+r.status); continue;} const d=await r.json(); if(!Array.isArray(d)){lastErr=new Error('Formato'); continue;} return d.map(x=>({ time: Math.floor(x[0]/1000), open:+x[1], high:+x[2], low:+x[3], close:+x[4] })); }catch(e){ lastErr=e; } } throw lastErr||new Error('Falha'); }

  function toSymbol(pair){ const m={ 'BTC/USDT':'BTCUSDT','ETH/USDT':'ETHUSDT','SOL/USDT':'SOLUSDT','ONDO/USDT':'ONDOUSDT','PAXG/USDT':'PAXGUSDT','WIF/USDT':'WIFUSDT','BCH/USDT':'BCHUSDT','BTC/BRL':'BTCBRL','ETH/BRL':'ETHBRL','SOL/BRL':'SOLBRL' }; return m[pair]||'BTCUSDT'; }
  function toInt(tf){ const m={'1m':'1m','3m':'3m','5m':'5m','15m':'15m','1h':'1h'}; return m[tf]||'1m'; }

  async function sync(pair, tf){
    if(!state.chart) create();
    const bars=await fetchK(toSymbol(pair), toInt(tf), 300);
    state.series.setData(bars);
    // aplicar marcadores pendentes
    if(state.markers.length){ state.series.setMarkers(state.markers); }
  }

  // API pública para desenhar marcadores
  window.LWChart = {
    show(){ const tv=document.getElementById('tv_chart'); const lw=document.getElementById('lw_chart'); if(lw){ lw.style.display='block'; } if(tv){ tv.style.display='none'; } create(); },
    hide(){ const tv=document.getElementById('tv_chart'); const lw=document.getElementById('lw_chart'); if(lw){ lw.style.display='none'; } if(tv){ tv.style.display='block'; } },
    async set(pair, tf){ await sync(pair, tf); },
    mark(timeSec, price, side){
      if(!state.series) return;
      const color = side==='buy'? '#17b26a' : '#ef4444';
      const shape = side==='buy'? 'arrowUp' : 'arrowDown';
      const m={ time: timeSec, position: side==='buy'? 'belowBar':'aboveBar', color, shape, text: side==='buy'? 'COMPRA':'VENDA' };
      state.markers.push(m); state.series.setMarkers(state.markers);
    }
  };

  ready(create);
})();
