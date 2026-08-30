// Probora frontend hardening layer. No market math, payout, balance, or resolution mechanics live here.
(function(){
  'use strict';

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }

  function safeMarketId(value){
    const id=String(value ?? '');
    return /^[a-z0-9-]{1,120}$/.test(id) ? id : '';
  }

  // Remove the obsolete local-demo reset control. Server-authoritative accounts must
  // never present a control that suggests balances/positions can be reset locally.
  function removeLegacyReset(){
    document.querySelectorAll('[onclick*="resetDemo"]').forEach(el=>el.remove());
    try{window.resetDemo=()=>{console.warn('Legacy demo reset is disabled.');};}catch{}
  }

  // The original prototype card renderer used cloud-backed text inside an HTML string.
  // Keep the exact visual/mechanical behavior, but HTML-escape all cloud-controlled text.
  if(typeof window.card==='function' && typeof window.yesChance==='function' && typeof window.marketVolume==='function' && typeof window.fmt==='function'){
    window.card=function secureMarketCard(m){
      const id=safeMarketId(m?.id);
      if(!id)return '';
      const y=window.yesChance(m),v=window.marketVolume(m);
      const category=escapeHtml(m?.category || 'Other');
      const title=escapeHtml(m?.title || id);
      const ends=escapeHtml(m?.ends || '—');
      return `<article class="market" onclick="openMarket('${id}')"><div class="market-top"><div><div class="category">${category}</div><h3>${title}</h3></div><div class="prob">${y}%</div></div><div class="bar"><i style="width:${y}%"></i></div><div class="meta"><span>◈ ${window.fmt(v)} volume</span><span>Ends ${ends}</span></div><div class="choices"><button class="choice yes" onclick="event.stopPropagation();openMarket('${id}','YES')">YES ${y}%</button><button class="choice no" onclick="event.stopPropagation();openMarket('${id}','NO')">NO ${100-y}%</button></div></article>`;
    };
  }

  removeLegacyReset();
  document.addEventListener('DOMContentLoaded',removeLegacyReset,{once:true});
})();
