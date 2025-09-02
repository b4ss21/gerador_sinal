// Simulador simples de futuros: preço via API pública, custo e liquidação aproximada
(function () {
  const el = (sel) => document.querySelector(sel);
  const fmt = (n, cur) => {
    if (n == null || Number.isNaN(n)) return '—';
    return new Intl.NumberFormat('pt-BR', { style: cur ? 'currency' : 'decimal', currency: cur || 'USD', maximumFractionDigits: 8 }).format(n);
  };

  const state = {
    pair: 'BTC/BRL',
    base: 'BTC',
    quote: 'BRL',
    price: 0,
    leverage: 20,
    mode: 'cross',
    balance: 12000, // saldo demo em moeda de cotação
  };

  function parsePair(pair) {
    const [base, quote] = pair.split('/');
    return { base, quote };
  }

  async function fetchPrice(pair) {
    const { base, quote } = parsePair(pair);
    const isBRL = quote === 'BRL';
    let symbol;
    if (quote === 'USDT') symbol = `${base}USDT`;
    else if (quote === 'BRL') symbol = `${base}BRL`;
    else symbol = `${base}USDT`;
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const price = Number(data.price);
      return { price, base, quote: isBRL ? 'BRL' : 'USDT' };
    } catch (e) {
      return { price: 0, base, quote };
    }
  }

  function syncUI() {
    el('#quote').textContent = state.quote;
    el('#base').textContent = state.base;
    el('#balanceLine').textContent = `Disponível ${fmt(state.balance, state.quote)}`;
    el('#refPrice').textContent = state.price ? `${fmt(state.price, state.quote)} / ${state.quote}` : '—';
  }

  function updateEstimates() {
    const qty = Number(el('#qty').value || 0);
    const price = Number((el('#price').value || state.price) || 0);
    const lev = state.leverage;
    if (!qty || !price) { el('#cost').textContent = '—'; el('#liq').textContent = '—'; return; }

    const notional = qty * price; // em quote
    const initialMargin = notional / lev;
    const maintenanceRate = 0.005; // 0.5% simples (demo)
    const maintMargin = notional * maintenanceRate;
    const liqPriceLong = price * (1 - (initialMargin - maintMargin) / notional);

    el('#cost').textContent = `${fmt(initialMargin, state.quote)} (margem inicial)`;
    el('#liq').textContent = `${fmt(liqPriceLong, state.quote)} (Long aprox.)`;
  }

  function bind() {
    el('#leverage').addEventListener('change', () => {
      state.leverage = Number(el('#leverage').value.replace('x','')) || 20;
      updateEstimates();
    });
    el('#mode').addEventListener('change', () => {
      state.mode = el('#mode').value;
    });
    el('#qty').addEventListener('input', updateEstimates);
    el('#price').addEventListener('input', updateEstimates);
    el('#qtyRange').addEventListener('input', () => {
      // range define % do saldo convertido em notional estimado
      const pct = Number(el('#qtyRange').value) / 100; // 0..1
      const notionalTarget = state.balance * pct * state.leverage;
      const qty = state.price ? (notionalTarget / state.price) : 0;
      el('#qty').value = qty.toFixed(4);
      updateEstimates();
    });

    const setMode = (mode) => {
      document.querySelectorAll('[data-order-tab]').forEach(b => b.classList.remove('active'));
      document.querySelector(`[data-order-tab="${mode}"]`)?.classList.add('active');
      const isLimit = mode === 'limit';
      el('[data-field-limit]').style.display = isLimit ? '' : 'none';
    };
    document.querySelectorAll('[data-order-tab]').forEach(b => b.addEventListener('click', () => setMode(b.getAttribute('data-order-tab'))));
    setMode('market');

    const toast = (msg) => {
      console.log('[SIM]', msg);
    };
    el('#buyBtn').addEventListener('click', () => {
      updateEstimates();
      toast('Simulação: posição Long aberta.');
    });
    el('#sellBtn').addEventListener('click', () => {
      updateEstimates();
      toast('Simulação: posição Short aberta.');
    });

    // Ouvir mudanças de par vindas do gráfico/UI
    window.addEventListener('pairChange', async (ev) => {
      const pair = ev.detail?.pair || 'BTC/USDT';
      state.pair = pair;
      const { base, quote } = parsePair(pair);
      state.base = base; state.quote = quote;
      const data = await fetchPrice(pair);
      state.price = data.price;
      syncUI();
      // Preencher inputs
      if (state.price) el('#price').value = state.price;
      updateEstimates();
    });
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(async () => {
    bind();
    // Estado inicial com par default do trading.js
    const ev = new CustomEvent('pairChange', { detail: { pair: 'BTC/BRL' } });
    window.dispatchEvent(ev);
  });
})();
