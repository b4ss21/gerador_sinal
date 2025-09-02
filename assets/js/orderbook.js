// Orderbook em tempo real via WebSocket da Binance (stream depth)
(function () {
  let ws = null;
  const MAX_ROWS = 14;
  const el = (id) => document.getElementById(id);
  const fmt = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 8 });

  function symbolForWS(pair) {
    const [base, quote] = pair.split('/');
    const q = quote === 'USDT' || quote === 'BRL' ? quote : 'USDT';
    return (base + q).toLowerCase();
  }

  function connect(pair) {
    cleanup();
    const sym = symbolForWS(pair);
    const url = `wss://stream.binance.com:9443/ws/${sym}@depth20@100ms`;
    ws = new WebSocket(url);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        render(data);
      } catch {}
    };
    ws.onerror = () => {};
  }

  function cleanup() {
    if (ws) { try { ws.close(1000); } catch {} ws = null; }
  }

  function render(depth) {
    const asks = depth.asks?.slice(0, MAX_ROWS) || [];
    const bids = depth.bids?.slice(0, MAX_ROWS) || [];
    const aBox = el('obAsks');
    const bBox = el('obBids');
    if (!aBox || !bBox) return;
    aBox.innerHTML = '';
    bBox.innerHTML = '';
    for (const [p, q] of asks) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span>${fmt(p)}</span><small>${fmt(q)}</small>`;
      aBox.appendChild(row);
    }
    for (const [p, q] of bids) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span>${fmt(p)}</span><small>${fmt(q)}</small>`;
      bBox.appendChild(row);
    }
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(() => {
    window.addEventListener('pairChange', (ev) => connect(ev.detail?.pair || 'BTC/USDT'));
    connect('BTC/BRL');
  });
})();
