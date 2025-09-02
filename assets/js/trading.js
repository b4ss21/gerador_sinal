// Integração simples com TradingView para gráfico, timeframes e pares
(function () {
  // Conversão de par "BTC/BRL" -> símbolo TradingView comum
  function toTVSymbol(pair) {
    // Heurística simples: mapear alguns conhecidos para Binance
    const map = {
      'BTC/USDT': 'BINANCE:BTCUSDT',
      'ETH/USDT': 'BINANCE:ETHUSDT',
      'SOL/USDT': 'BINANCE:SOLUSDT',
      'BTC/BRL': 'BINANCE:BTCBRL',
      'ETH/BRL': 'BINANCE:ETHBRL',
      'SOL/BRL': 'BINANCE:SOLBRL',
    };
    return map[pair] || 'BINANCE:BTCUSDT';
  }

  // Conversão timeframe UI -> intervalo TV
  function toTVInterval(tf) {
    const m = {
      '1m': '1',
      '3m': '3',
      '5m': '5',
      '15m': '15',
      '1h': '60',
    };
    return m[tf] || '1';
  }

  const state = {
    pair: 'BTC/BRL',
    interval: '1m',
    widget: null,
  };

  function setTitle() {
    const el = document.getElementById('pairTitle');
    if (el) el.textContent = state.pair;
  }

  function initTV(retryCount = 0) {
    const containerId = 'tv_chart';
    const symbol = toTVSymbol(state.pair);
    const interval = toTVInterval(state.interval);
    // Aguardar TradingView carregar
    if (!(window.TradingView && window.TradingView.widget)) {
      if (retryCount < 20) { // ~2s total com passos de 100ms
        return setTimeout(() => initTV(retryCount + 1), 100);
      }
      console.warn('TradingView não carregou a tempo');
      return;
    }
    // Destruir anterior se existir
    if (state.widget) {
      try { state.widget.remove(); } catch (e) {}
      state.widget = null;
    }
    // eslint-disable-next-line no-undef
  state.widget = new TradingView.widget({
      symbol,
      interval,
      container_id: containerId,
      locale: 'br',
      timezone: 'America/Sao_Paulo',
      theme: 'dark',
      autosize: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      withdateranges: true,
      allow_symbol_change: false,
      details: false,
      hotlist: false,
      calendar: false,
      studies: [],
    });
    // Expor e avisar quando o gráfico estiver pronto
    try {
      window.TVWidget = state.widget;
      state.widget.onChartReady(function() {
        try { window.dispatchEvent(new CustomEvent('tvChartReady', { detail: { pair: state.pair, interval: state.interval } })); } catch (e) {}
      });
    } catch (e) {}
  }

  function selectChip(groupSelector, target) {
    document.querySelectorAll(groupSelector).forEach((el) => el.classList.remove('active'));
    target.classList.add('active');
  }

  function bindUI() {
    // Timeframes
    document.querySelectorAll('[data-time]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.interval = btn.getAttribute('data-time');
        selectChip('[data-time]', btn);
  try { window.dispatchEvent(new CustomEvent('intervalChange', { detail: { interval: state.interval } })); } catch (e) {}
        if (state.widget) {
          const tvInterval = toTVInterval(state.interval);
          try { state.widget.chart().setResolution(tvInterval); } catch (e) { initTV(); }
        } else {
          initTV();
        }
      });
    });

    // Pares
    document.querySelectorAll('[data-pair]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.pair = btn.getAttribute('data-pair');
        selectChip('[data-pair]', btn);
        setTitle();
  try { window.dispatchEvent(new CustomEvent('pairChange', { detail: { pair: state.pair } })); } catch (e) {}
        if (state.widget) {
          const symbol = toTVSymbol(state.pair);
          try { state.widget.chart().setSymbol(symbol); } catch (e) { initTV(); }
        } else {
          initTV();
        }
      });
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }

  ready(() => {
    // Ativar chips iniciais
    const firstTF = document.querySelector('[data-time][data-time="1m"]') || document.querySelector('[data-time]');
    if (firstTF) firstTF.classList.add('active');
    const firstPair = document.querySelector('[data-pair]');
    if (firstPair) firstPair.classList.add('active');
    setTitle();
    bindUI();
    initTV();
    // Eventos iniciais
    try {
      window.dispatchEvent(new CustomEvent('pairChange', { detail: { pair: state.pair } }));
      window.dispatchEvent(new CustomEvent('intervalChange', { detail: { interval: state.interval } }));
    } catch (e) {}
  });
})();
