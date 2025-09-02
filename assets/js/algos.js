// Registro de algoritmos externos para análise técnica
(function () {
  const registry = [];
  function registerAlgo(name, fn) { registry.push({ name, fn }); }
  function listAlgos() { return registry.map(r => r.name); }
  async function runAll(ctx) {
    const results = [];
    for (const r of registry) {
      try { const out = await r.fn(ctx); if (out) results.push({ name: r.name, ...out }); } catch (e) { console.warn('algo failed', r.name, e); }
    }
    return results;
  }
  window.SignalAlgos = { registerAlgo, listAlgos, runAll };

  // Tentativa de carregar um arquivo opcional (externo) se existir em /custom-algos.js
  try {
    const s = document.createElement('script');
    s.src = 'custom-algos.js';
    s.defer = true;
    s.onerror = () => {};
    document.head.appendChild(s);
  } catch (e) {}
})();
