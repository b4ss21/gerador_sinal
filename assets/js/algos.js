// Registro de algoritmos externos para análise técnica
(function () {
  const registry = [];
  const weights = Object.create(null);
  function registerAlgo(name, fn) { registry.push({ name, fn }); }
  function listAlgos() { return registry.map(r => r.name); }
  function setWeight(name, w) { if (typeof w === 'number' && w > 0) weights[name] = w; persist(); }
  function setWeights(obj) { if (!obj) return; for (const k of Object.keys(obj)) setWeight(k, obj[k]); }
  function getWeight(name) { return weights[name] || 1; }
  function persist() { try { localStorage.setItem('algoWeights', JSON.stringify(weights)); } catch (e) {} }
  function load() { try { const v = JSON.parse(localStorage.getItem('algoWeights')||'{}'); Object.assign(weights, v||{}); } catch (e) {} }
  load();
  async function runAll(ctx) {
    const results = [];
    for (const r of registry) {
      try { const out = await r.fn(ctx); if (out) results.push({ name: r.name, ...out }); } catch (e) { console.warn('algo failed', r.name, e); }
    }
    return results;
  }
  window.SignalAlgos = { registerAlgo, listAlgos, runAll, setWeight, setWeights, getWeight };

  // Tentativa de carregar um arquivo opcional (externo) se existir em /custom-algos.js
  try {
    const s = document.createElement('script');
    s.src = 'custom-algos.js';
    s.defer = true;
    s.onerror = () => {};
    document.head.appendChild(s);
  } catch (e) {}

  // Carregar scripts externos opcionais de um projeto "outro"
  ;['external/technicalAnalysis.js','external/signalCard.js','external/index.js'].forEach(src => {
    try {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onerror = () => {};
      document.head.appendChild(s);
    } catch (e) {}
  });

  // Adaptadores: detectar e registrar regras do outro quando disponíveis
  function tryRegisterExternalOnce() {
    try {
      // 1) TechnicalAnalysis: supõe window.TechnicalAnalysis com .evaluate(ctx) ou .getSignals(ctx)
      const TA = window.TechnicalAnalysis;
      if (TA && (typeof TA.evaluate === 'function' || typeof TA.getSignals === 'function') && !tryRegisterExternalOnce._ta) {
        registerAlgo('Other.TA', async (ctx) => {
          const out = typeof TA.evaluate === 'function' ? await TA.evaluate(ctx) : await TA.getSignals(ctx);
          // out pode ser {side} ou array de {side}
          if (!out) return;
          if (Array.isArray(out)) {
            const votes = out.map(x => x && (x.side || x.signal)).filter(Boolean);
            if (!votes.length) return;
            const buy = votes.filter(v => v === 'buy').length;
            const sell = votes.filter(v => v === 'sell').length;
            return buy === sell ? undefined : { side: buy > sell ? 'buy' : 'sell' };
          }
          if (out.side || out.signal) return { side: out.side || out.signal };
        });
  // Priorizar o algoritmo do outro projeto por padrão
  if (!weights['Other.TA']) setWeight('Other.TA', 2.0);
        tryRegisterExternalOnce._ta = true;
      }
      // 2) SignalCard/OtherSignals genéricos
      const SC = window.SignalCard || window.OtherSignals || window.Signals;
      if (SC && (typeof SC.evaluate === 'function' || typeof SC.getSignals === 'function') && !tryRegisterExternalOnce._sc) {
        registerAlgo('Other.SC', async (ctx) => {
          const out = typeof SC.evaluate === 'function' ? await SC.evaluate(ctx) : await SC.getSignals(ctx);
          if (!out) return;
          if (Array.isArray(out)) {
            const votes = out.map(x => x && (x.side || x.signal)).filter(Boolean);
            if (!votes.length) return;
            const buy = votes.filter(v => v === 'buy').length;
            const sell = votes.filter(v => v === 'sell').length;
            return buy === sell ? undefined : { side: buy > sell ? 'buy' : 'sell' };
          }
          if (out.side || out.signal) return { side: out.side || out.signal };
        });
        tryRegisterExternalOnce._sc = true;
      }
    } catch (e) {}
  }
  // Tentar algumas vezes após o load para pegar scripts que carregam mais tarde
  window.addEventListener('load', () => {
    let attempts = 0;
    const iv = setInterval(() => {
      attempts++;
      tryRegisterExternalOnce();
      if (attempts >= 10) clearInterval(iv);
    }, 500);
    tryRegisterExternalOnce();
  });
})();
