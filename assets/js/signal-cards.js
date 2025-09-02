(function(){
  // Painel de cartões de sinais no canto da tela
  const PAIRS = ['BTC/USDT','ETH/USDT','SOL/USDT','ONDO/USDT','PAXG/USDT','WIF/USDT','BCH/USDT'].map(p=>p.replace('/','/'));
  const MAP = { 'BTC/USDT':'BTCUSDT','ETH/USDT':'ETHUSDT','SOL/USDT':'SOLUSDT','ONDO/USDT':'ONDOUSDT','PAXG/USDT':'PAXGUSDT','WIF/USDT':'WIFUSDT','BCH/USDT':'BCHUSDT' };
  const TF = '1h';

  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  function ensurePanel(){
  let host = document.getElementById('signalsPanel');
  if (host) return host;
  host = document.createElement('div');
  host.id = 'signalsPanel';
  host.style.position='fixed';
  host.style.right='16px';
  host.style.bottom='16px';
  host.style.width='360px';
  host.style.maxHeight='70vh';
  host.style.overflow='auto';
  host.style.zIndex='2147483647';
  host.style.display='grid';
  host.style.gap='12px';
  document.body.appendChild(host);
  return host;
  }

  async function fetchK(symbol, interval='1h', limit=300){
    const urls=[
      `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    ];
    let lastErr;
    for(const u of urls){
      try{ const r=await fetch(u,{cache:'no-store'}); if(!r.ok){lastErr=new Error('HTTP '+r.status); continue;} const d=await r.json(); if(!Array.isArray(d)){lastErr=new Error('Formato'); continue;} return d.map(x=>({t:x[0],o:+x[1],h:+x[2],l:+x[3],c:+x[4]})); }catch(e){lastErr=e;}
    }
    throw lastErr || new Error('Falha dados');
  }
  function SMA(a,p){const o=Array(a.length).fill(null);let s=0;for(let i=0;i<a.length;i++){s+=a[i];if(i>=p)s-=a[i-p];if(i>=p-1)o[i]=s/p;}return o;}
  function EMA(a,p){const o=Array(a.length).fill(null);const k=2/(p+1);let prev=null;for(let i=0;i<a.length;i++){const v=a[i];if(prev==null)prev=v;prev=v*k+prev*(1-k);o[i]=prev;}return o;}
  function RSI(c,p=14){const o=Array(c.length).fill(null);let g=0,l=0;for(let i=1;i<c.length;i++){const ch=c[i]-c[i-1];const ga=Math.max(ch,0),lo=Math.max(-ch,0);if(i<=p){g+=ga;l+=lo;if(i===p){g/=p;l/=p;o[i]=100-(100/(1+(g/(l||1e-9))))}}else{g=(g*(p-1)+ga)/p;l=(l*(p-1)+lo)/p;o[i]=100-(100/(1+(g/(l||1e-9))))}}return o;}
  function Boll(c,p=20,m=2){const ma=SMA(c,p);const o=Array(c.length).fill(null);for(let i=0;i<c.length;i++){if(i<p-1){o[i]=null;continue;}const s=c.slice(i-p+1,i+1);const mean=ma[i];const varc=s.reduce((a,v)=>a+Math.pow(v-mean,2),0)/p;const sd=Math.sqrt(varc);o[i]={mid:mean,up:mean+m*sd,low:mean-m*sd};}return o;}
  function ATR(b,p=14){const o=Array(b.length).fill(null);let pc=b[0]?.c??null;let q=[];for(let i=0;i<b.length;i++){const x=b[i];const tr=Math.max(x.h-x.l, pc!=null?Math.abs(x.h-pc):0, pc!=null?Math.abs(x.l-pc):0);pc=x.c;q.push(tr);if(q.length>p)q.shift();if(q.length===p){o[i]=q.reduce((a,v)=>a+v,0)/p}}return o;}

  function decide(bars){
    const c=bars.map(b=>b.c); const h=bars.map(b=>b.h); const e9=EMA(c,9); const e21=EMA(c,21); const bb=Boll(c,20,2); const rsi=RSI(c,14); const atr=ATR(bars,14);
    const i=bars.length-1; const crossUp=e9[i]>e21[i] && e9[i-1]<=e21[i-1]; const crossDn=e9[i]<e21[i] && e9[i-1]>=e21[i-1];
    const nearLow=bb[i]&&c[i]<=bb[i].low*1.01; const nearUp=bb[i]&&c[i]>=bb[i].up*0.99; const rsiUp=rsi[i]>50; const rsiDn=rsi[i]<50;
    const buy=(crossUp||nearLow)&&rsiUp; const sell=(crossDn||nearUp)&&rsiDn;
    const side= buy&&!sell? 'buy' : (sell&&!buy? 'sell': null);
    if(!side) return null;
    const price=c[i]; const a=atr[i]||price*0.005; let entry=price, sl, r;
    if(side==='buy'){ sl=entry-a; r=entry-sl; } else { sl=entry+a; r=sl-entry; }
    const tps=[0.618,1.0,1.618].map(f=> side==='buy'? entry+f*r : entry - f*r);
    // confiança simples baseada na distância até a banda oposta e força do cruzamento de EMAs
    let conf=0.65; if(side==='buy' && crossUp) conf+=0.2; if(side==='sell' && crossDn) conf+=0.2; if(bb[i]){const rng=bb[i].up-bb[i].low; if(rng>0){const dist=Math.abs(c[i]-(side==='buy'?bb[i].low:bb[i].up)); conf+=Math.min(0.15, dist/rng*0.15);} }
    conf=Math.max(0.5, Math.min(0.95, conf));
    const gainPct=Math.abs((tps[1]-entry)/entry)*100; // alvo 1.0R
    return { side, entry, sl, tps, time:bars[i].t, indicators:{ rsi:rsi[i], ema9:e9[i], ema21:e21[i] }, gainPct, confidence:conf };
  }

  function fmt(n){ return (n>=1? n.toFixed(4): n.toFixed(6)); }

  function renderTitle(host){
    const bar=document.createElement('div');
    bar.style.background='rgba(20,26,42,0.92)';
    bar.style.border='1px solid rgba(255,255,255,0.12)';
    bar.style.borderRadius='10px';
    bar.style.padding='8px 10px';
    bar.style.color='#fff';
    bar.style.fontWeight='700';
    bar.textContent='Sinais Gerados';
    host.appendChild(bar);
  }

  function renderCard(host, pair, tf, sig){
    const box=document.createElement('div');
    box.className='card';
    box.style.background='#141A2A';
    box.style.border='1px solid rgba(255,255,255,0.08)';
    box.style.borderRadius='12px';
    box.style.padding='12px';
    box.style.color='#fff';
    box.style.display='grid';
    box.style.gap='8px';

    const header=document.createElement('div'); header.style.display='flex'; header.style.justifyContent='space-between'; header.style.alignItems='center';
  const title=document.createElement('div'); title.textContent=`${pair} • ${tf}`; title.style.fontWeight='700';
  const conf=document.createElement('div'); conf.textContent=`${Math.round(sig.confidence*100)}% Confiança`; conf.style.fontSize='12px'; conf.style.padding='4px 6px'; conf.style.borderRadius='999px'; conf.style.background= sig.side==='buy'? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)';
    header.appendChild(title); header.appendChild(conf);

    const grid=document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='1fr 1fr'; grid.style.gap='8px';
  const e=document.createElement('div'); e.className='card'; e.style.padding='8px'; e.innerHTML=`<div style="opacity:.8;font-size:12px">Entrada</div><div style="font-weight:700">$${fmt(sig.entry)}</div>`;
  const t=document.createElement('div'); t.className='card'; t.style.padding='8px'; t.innerHTML=`<div style="opacity:.8;font-size:12px">Alvo</div><div style="font-weight:700;color:#22c55e">$${fmt(sig.tps[1])} (+${sig.gainPct.toFixed(2)}%)</div>`;
  const s=document.createElement('div'); s.className='card'; s.style.padding='8px'; s.innerHTML=`<div style="opacity:.8;font-size:12px">Stop</div><div style="font-weight:700;color:#ef4444">$${fmt(sig.sl)}</div>`;
  const g=document.createElement('div'); g.className='card'; g.style.padding='8px'; g.innerHTML=`<div style="opacity:.8;font-size:12px">Ganho Estimado</div><div style="font-weight:700">${sig.gainPct.toFixed(2)}%</div>`;
    grid.appendChild(e); grid.appendChild(t); grid.appendChild(s); grid.appendChild(g);

  const btn=document.createElement('button');
  btn.textContent='Ver no gráfico';
    btn.className='btn';
    btn.style.justifyContent='center';
    btn.addEventListener('click', ()=>{
      try {
        if (window.TVControls) {
          window.TVControls.setPair(pair);
          window.TVControls.setInterval(tf);
        }
        setTimeout(()=>{
          const detail={ entry:sig.entry, sl:sig.sl, tps:sig.tps, time:sig.time, side:sig.side };
          window.dispatchEvent(new CustomEvent('showSignalOverlay',{detail}));
        }, 800);
      } catch(e){}
    });

    box.appendChild(header); box.appendChild(grid); box.appendChild(btn);
    host.appendChild(box);
  }

  async function generate(){
    const host=ensurePanel(); host.innerHTML='';
    renderTitle(host);
    let count=0;
    for(const pair of PAIRS){
      try{
        const bars=await fetchK(MAP[pair], TF, 300);
        const sig=decide(bars);
        if(sig){ renderCard(host, pair, TF, sig); count++; }
      }catch(e){ /* ignora par que falhar */ }
    }
    if(count===0){
      const empty=document.createElement('div');
      empty.className='card';
      empty.style.background='#141A2A';
      empty.style.border='1px solid rgba(255,255,255,0.08)';
      empty.style.borderRadius='12px';
      empty.style.padding='12px';
      empty.style.color='#fff';
      empty.textContent='Sem sinais no momento.';
      host.appendChild(empty);
    }
  }

  ready(()=>{
    // pequena espera para TV iniciar
    setTimeout(generate, 1200);
  // atualizar a cada 1 minuto para feedback mais rápido
  setInterval(generate, 60*1000);
  });
})();
