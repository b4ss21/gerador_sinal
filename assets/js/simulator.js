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
  position: null, // { side: 'long'|'short', qty, entry, margin }
  timer: null,
  tif: 'GTC',
  orderType: 'market', // market | limit | stop
  orders: [],
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
  el('#tif').addEventListener('change', () => { state.tif = el('#tif').value; });
  el('#bbo').addEventListener('click', () => { if (state.price) { el('#price').value = state.price; updateEstimates(); } });
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
      const isStop = mode === 'stop';
      el('[data-field-stop]').style.display = isStop ? '' : 'none';
      state.orderType = mode;
    };
    document.querySelectorAll('[data-order-tab]').forEach(b => b.addEventListener('click', () => setMode(b.getAttribute('data-order-tab'))));
    setMode('market');

    const toast = (msg) => {
      console.log('[SIM]', msg);
    };
    el('#buyBtn').addEventListener('click', () => placeOrder('long'));
    el('#sellBtn').addEventListener('click', () => placeOrder('short'));
  el('#closePos').addEventListener('click', closePosition);
    el('#tpls').addEventListener('change', () => {
      const on = el('#tpls').checked;
      el('#tplsFields').style.display = on ? '' : 'none';
    });
    el('#cancelAll').addEventListener('click', () => { state.orders = []; renderOrders(); });

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
  // Ao trocar de par, fechar posição simulada, se houver
  if (state.position) closePosition();
    });
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(async () => {
    bind();
    // Estado inicial com par default do trading.js
    const ev = new CustomEvent('pairChange', { detail: { pair: 'BTC/BRL' } });
    window.dispatchEvent(ev);
    startTicker();
  });

  function openPosition(side) {
    const qty = Number(el('#qty').value || 0);
    const price = Number((el('#price').value || state.price) || 0);
    if (!qty || !price || state.position) return;
    const notional = qty * price;
    const margin = notional / state.leverage;
    state.position = { side, qty, entry: price, margin };
    state.balance -= margin; if (state.balance < 0) state.balance = 0;
    renderPosition();
  }

  function placeOrder(side) {
    const qty = Number(el('#qty').value || 0);
    if (!qty) return;
    const now = Date.now();
    const base = {
      id: 'o' + now,
      pair: state.pair,
      side,
      qty,
      tif: state.tif,
      reduceOnly: el('#reduce').checked,
      tp: el('#tpls').checked ? Number(el('#tp').value || 0) : 0,
      sl: el('#tpls').checked ? Number(el('#sl').value || 0) : 0,
      status: 'open',
    };

    if (state.orderType === 'market') {
      el('#price').value = state.price;
      updateEstimates();
      openPosition(side);
      return;
    }

    if (state.orderType === 'limit') {
      const limit = Number(el('#price').value || 0);
      if (!limit) return;
      state.orders.push({ ...base, type: 'limit', limit });
    } else if (state.orderType === 'stop') {
      const stop = Number(el('#stopPrice').value || 0);
      const limit = Number(el('#limitAfterStop').value || 0);
      if (!stop || !limit) return;
      state.orders.push({ ...base, type: 'stop', stop, limit });
    }
    renderOrders();
  }

  function closePosition() {
    if (!state.position) return;
    // liberar margem e PnL no saldo
    const pnl = calcPnl();
    state.balance += state.position.margin + pnl;
    state.position = null;
    renderPosition();
  }

  function calcPnl() {
    if (!state.position || !state.price) return 0;
    const { side, qty, entry } = state.position;
    const diff = side === 'long' ? (state.price - entry) : (entry - state.price);
    return diff * qty;
  }

  function renderPosition() {
    syncUI();
    const card = el('#position');
    if (!state.position) { card.style.display = 'none'; return; }
    card.style.display = '';
    el('#posSide').textContent = state.position.side.toUpperCase();
    el('#posQty').textContent = `${state.position.qty} ${state.base}`;
    el('#posEntry').textContent = fmt(state.position.entry, state.quote);
    el('#posMargin').textContent = fmt(state.position.margin, state.quote);
    el('#posMark').textContent = fmt(state.price, state.quote);
    const pnl = calcPnl();
    const roe = state.position.margin ? (pnl / state.position.margin) * 100 : 0;
    const pnlEl = el('#posPnl');
    pnlEl.textContent = `${fmt(pnl, state.quote)}  (${roe.toFixed(2)}%)`;
    pnlEl.classList.toggle('positive', pnl >= 0);
    pnlEl.classList.toggle('negative', pnl < 0);
  }

  async function tick() {
    if (!state.pair) return;
    const data = await fetchPrice(state.pair);
    if (data.price) state.price = data.price;
    el('#refPrice').textContent = state.price ? `${fmt(state.price, state.quote)} / ${state.quote}` : '—';
    if (state.position) renderPosition();
  matchOrders();
  }
  function startTicker() {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(tick, 2500);
    tick();
  }

  function matchOrders() {
    if (!state.orders.length || !state.price) return;
    const rest = [];
    for (const o of state.orders) {
      if (o.type === 'limit') {
        const hit = o.side === 'long' ? state.price <= o.limit : state.price >= o.limit;
        if (hit) { el('#price').value = o.limit; updateEstimates(); openPosition(o.side); continue; }
      } else if (o.type === 'stop') {
        const trig = o.side === 'long' ? state.price >= o.stop : state.price <= o.stop;
        if (trig) { el('#price').value = o.limit; updateEstimates(); openPosition(o.side); continue; }
      }
      rest.push(o);
    }
    state.orders = rest;
    renderOrders();
  }

  function renderOrders() {
    const box = el('#orders');
    const list = el('#ordersList');
    if (!list) return;
    list.innerHTML = '';
    if (!state.orders.length) { box.style.display = 'none'; return; }
    box.style.display = '';
    for (const o of state.orders) {
      const row = document.createElement('div');
      row.className = 'order';
      const priceTxt = o.type === 'limit' ? o.limit : `${o.stop} → ${o.limit}`;
      row.innerHTML = `<div><strong>${o.side.toUpperCase()}</strong> <small>${o.type}</small><br/><small>${o.qty} ${state.base} @ ${priceTxt}</small></div>`;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const cancel = document.createElement('button');
      cancel.className = 'btn btn--ghost';
      cancel.textContent = 'Cancelar';
      cancel.addEventListener('click', () => { state.orders = state.orders.filter(x => x.id !== o.id); renderOrders(); });
      actions.appendChild(cancel);
      row.appendChild(actions);
      list.appendChild(row);
    }
  }
})();
