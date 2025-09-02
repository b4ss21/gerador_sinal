(function(){
  // Pequeno painel para ajustar pesos de algoritmos externos
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function createPanel(){
  const host = document.getElementById('tv_chart'); if(!host) return;
  // Evitar duplicar painel caso múltiplos eventos disparem
  if (host.querySelector('#algoWeightsPanel')) return;
    const panel = document.createElement('div');
  panel.id = 'algoWeightsPanel';
    panel.style.position='absolute';
    panel.style.right='10px';
    panel.style.top='10px';
    panel.style.zIndex='3';
    panel.style.background='rgba(20,26,42,0.92)';
    panel.style.border='1px solid rgba(255,255,255,0.12)';
    panel.style.borderRadius='10px';
    panel.style.padding='8px';
    panel.style.fontSize='12px';
    panel.style.color='#fff';
    panel.style.minWidth='180px';

    const header=document.createElement('div');
    header.textContent='Pesos Algoritmos';
    header.style.fontWeight='600';
    header.style.marginBottom='6px';
    panel.appendChild(header);

    const body=document.createElement('div');
    body.style.display='grid';
    body.style.gap='6px';
    panel.appendChild(body);

    function refresh(){
      if(!(window.SignalAlgos)) return;
      body.innerHTML='';
      const algos = (window.SignalAlgos.listAlgos&&window.SignalAlgos.listAlgos())||[];
      algos.forEach(name => {
        const row=document.createElement('div');
        row.style.display='flex';
        row.style.alignItems='center';
        row.style.justifyContent='space-between';
        row.style.gap='6px';
        const label=document.createElement('span');
        label.textContent=name; label.style.maxWidth='110px'; label.style.overflow='hidden'; label.style.textOverflow='ellipsis'; label.style.whiteSpace='nowrap';
        const input=document.createElement('input');
        input.type='number'; input.min='0'; input.step='0.1'; input.style.width='60px';
        try { input.value = (window.SignalAlgos.getWeight(name) || 1).toString(); } catch(e) { input.value='1'; }
        input.addEventListener('change', () => {
          const v=parseFloat(input.value); if(isNaN(v) || v<=0) return; try { window.SignalAlgos.setWeight(name, v); } catch(e){}
        });
        row.appendChild(label); row.appendChild(input); body.appendChild(row);
      });
    }

    const footer=document.createElement('div');
    footer.style.display='flex';
    footer.style.gap='6px';
    footer.style.marginTop='6px';
    const btn=document.createElement('button');
    btn.textContent='Atualizar';
    btn.style.padding='6px 8px'; btn.style.background='#2a3246'; btn.style.color='#fff'; btn.style.border='1px solid rgba(255,255,255,0.14)'; btn.style.borderRadius='8px';
    btn.addEventListener('click', refresh);
    footer.appendChild(btn);

    const hide=document.createElement('button');
    hide.textContent='Ocultar';
    hide.style.padding='6px 8px'; hide.style.background='transparent'; hide.style.color='#fff'; hide.style.border='1px solid rgba(255,255,255,0.14)'; hide.style.borderRadius='8px';
    hide.addEventListener('click', ()=>{ panel.style.display='none'; });
    footer.appendChild(hide);

    panel.appendChild(footer);

    host.appendChild(panel);
    refresh();

    // Atalho: tecla "w" alterna exibição do painel
    window.addEventListener('keydown', (ev)=>{
      if ((ev.key||'').toLowerCase() === 'w') {
        const cur = panel.style.display !== 'none';
        panel.style.display = cur ? 'none' : 'block';
      }
    });
  }

  ready(()=>{
    // Tentar no tvChartReady e também fallback após 2s
    window.addEventListener('tvChartReady', createPanel);
    setTimeout(createPanel, 2000);
  });
})();
