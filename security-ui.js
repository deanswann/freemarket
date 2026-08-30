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

  // Mobile-only layout improvements. Desktop rules remain untouched.
  const style=document.createElement('style');
  style.id='proboraSecurityMobileStyles';
  style.textContent=`
    @media(max-width:760px){
      .topbar{gap:9px;flex-wrap:wrap;padding:11px 12px}
      .topbar .brand{flex:0 0 auto}
      .topbar .actions{margin-left:auto;gap:6px;min-width:0;flex-wrap:wrap;justify-content:flex-end}
      .topbar .actions .btn{padding:8px 9px;font-size:12px}
      .topbar .user-box{max-width:170px;padding-left:8px;gap:5px}
      #userEmail{display:block;max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .tabs{scrollbar-width:none;-webkit-overflow-scrolling:touch}
      .tabs::-webkit-scrollbar{display:none}
      .modal-backdrop{padding:10px}
      .modal{max-height:calc(100dvh - 20px);overflow-y:auto;padding:17px}
      .modal-head{gap:10px}
      .auth-actions{grid-template-columns:1fr}
      .quick{flex-wrap:wrap}
      .quick button{flex:1 1 64px}
      .portfolio-list{overflow-x:auto;-webkit-overflow-scrolling:touch}
      .position{min-width:0}
      .pos-title,.pos-sub{overflow-wrap:anywhere}
      .toast{left:12px;right:12px;bottom:12px;text-align:center}
    }
    @media(max-width:480px){
      .topbar .actions{width:100%;margin-left:0;justify-content:flex-start}
      .topbar .actions .btn,#loginBtn{flex:1 1 auto}
      .topbar .user-box{max-width:none;flex:1 1 100%;justify-content:space-between}
      #userEmail{max-width:65vw}
      .hero-side{padding:18px}
      .market{padding:14px}
      .market h3{font-size:16px}
      .choices{gap:6px}
      .choice{padding:10px 7px}
      .section-head{align-items:flex-start}
    }
  `;
  document.head.appendChild(style);

  removeLegacyReset();
  document.addEventListener('DOMContentLoaded',removeLegacyReset,{once:true});
})();
