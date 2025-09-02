(function(){
  if(!(window && window.SignalAlgos && typeof window.SignalAlgos.registerAlgo==='function')) return;
  const { registerAlgo } = window.SignalAlgos;

  function EMA(arr, p){
    const out = Array(arr.length).fill(null);
    const k = 2/(p+1); let prev = null;
    for(let i=0;i<arr.length;i++){ const v = arr[i]; if(prev==null) prev=v; prev = v*k + prev*(1-k); out[i]=prev; }
    return out;
  }
  function SMA(arr, p){
    const out = Array(arr.length).fill(null); let sum=0;
    for(let i=0;i<arr.length;i++){ sum+=arr[i]; if(i>=p) sum-=arr[i-p]; if(i>=p-1) out[i]=sum/p; }
    return out;
  }

  registerAlgo('EMATrend', async (ctx)=>{
    const c = ctx.closes || []; if(c.length < 200) return;
    const e9 = EMA(c,9), e21 = EMA(c,21), s200 = SMA(c,200); const i=c.length-1;
    const up = e9[i] != null && e21[i] != null && s200[i] != null && (e9[i] > e21[i]) && (c[i] > s200[i]);
    const dn = e9[i] != null && e21[i] != null && s200[i] != null && (e9[i] < e21[i]) && (c[i] < s200[i]);
    if(up) return { side:'buy', confidence:0.6 };
    if(dn) return { side:'sell', confidence:0.6 };
  });

  registerAlgo('MACDCross', async (ctx)=>{
    const c = ctx.closes || []; if(c.length < 35) return;
    const ema12 = EMA(c,12), ema26 = EMA(c,26);
    const macdArr = c.map((_,i)=> (ema12[i]!=null && ema26[i]!=null) ? (ema12[i]-ema26[i]) : null);
    const safe = macdArr.map(x=> x==null? 0 : x);
    const signal = EMA(safe, 9); const i=c.length-1;
    if(i>0 && macdArr[i-1] != null && signal[i-1] != null && macdArr[i] != null && signal[i] != null){
      const bull = macdArr[i-1] <= signal[i-1] && macdArr[i] > signal[i];
      const bear = macdArr[i-1] >= signal[i-1] && macdArr[i] < signal[i];
      if(bull) return { side:'buy', confidence:0.5 };
      if(bear) return { side:'sell', confidence:0.5 };
    }
  });

  registerAlgo('BollingerRebound', async (ctx)=>{
    const c = ctx.closes || []; if(c.length < 22) return;
    const p=20, m=2; const sma=SMA(c,p); const i=c.length-1; if(i<p-1) return;
    const mean = sma[i]; const slice = c.slice(i-p+1,i+1);
    const sd = Math.sqrt(slice.reduce((a,v)=> a + Math.pow(v-mean,2), 0)/p);
    const up = mean + m*sd; const low = mean - m*sd;
    const last=c[i], prev=c[i-1];
    if(prev!=null && last!=null){
      if(prev < low*1.01 && last > prev) return { side:'buy', confidence:0.4 };
      if(prev > up*0.99 && last < prev) return { side:'sell', confidence:0.4 };
    }
  });
})();
