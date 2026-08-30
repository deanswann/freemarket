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

  function removeLegacyReset(){
    document.querySelectorAll('[onclick*="resetDemo"]').forEach(el=>el.remove());
    try{window.resetDemo=()=>{console.warn('Legacy demo reset is disabled.');};}catch{}
  }

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

  // True phone layout. !important is intentional here because shared-markets.js
  // injects responsive rules later and must not be able to restore desktop columns.
  const style=document.createElement('style');
  style.id='proboraMobileSingleColumn';
  style.textContent=`
    @media(max-width:760px){
      html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important}
      body *{max-width:100%}
      .shell{width:100%!important;max-width:100%!important;padding:18px 12px 38px!important;margin:0!important}

      .topbar{position:static!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:9px!important;padding:12px!important;width:100%!important}
      .topbar .brand{align-self:flex-start!important}
      .topbar .search{display:none!important}
      .topbar .actions{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:7px!important;width:100%!important;margin:0!important}
      .topbar .actions .btn,.topbar .user-box{width:100%!important;max-width:100%!important;justify-content:center!important}
      .topbar .balance{display:none!important}
      #userEmail{max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}

      .tabs{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;gap:6px!important;overflow:visible!important;padding:9px 12px!important;width:100%!important}
      .tab{display:flex!important;width:100%!important;min-width:0!important;flex:0 0 auto!important;justify-content:flex-start!important;text-align:left!important}

      .hero,.grid,.section-grid,.category-explorer,.portfolio-summary,.quote{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-auto-flow:row!important;width:100%!important;max-width:100%!important}
      .hero{gap:12px!important}
      .hero-main,.hero-side,.card,.market,.summary-card,.market-section{width:100%!important;min-width:0!important;max-width:100%!important}
      .hero-main{padding:22px 18px!important}
      .hero-side{padding:18px!important}
      .hero h1,.portfolio-title{font-size:30px!important;line-height:1.08!important;overflow-wrap:anywhere!important;word-break:normal!important}
      .hero p,.portfolio-intro,.notice{overflow-wrap:anywhere!important}
      .stats{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important;width:100%!important}

      .section-head,.market-section-head,.footer-inner{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;width:100%!important}
      .section-head>*,.market-section-head>*{min-width:0!important;max-width:100%!important}
      .category-explorer{gap:8px!important}
      .category-tile{display:block!important;width:100%!important;min-width:0!important}

      #markets,#markets.home-sections{display:block!important;width:100%!important}
      .market-section{display:block!important;margin-bottom:26px!important}
      .section-grid{gap:10px!important}
      .market{display:block!important;padding:14px!important;margin:0!important}
      .market-top{display:flex!important;align-items:flex-start!important;gap:10px!important;width:100%!important}
      .market-top>div:first-child{min-width:0!important;flex:1 1 auto!important}
      .market h3{font-size:16px!important;overflow-wrap:anywhere!important;word-break:break-word!important;white-space:normal!important}
      .prob{flex:0 0 auto!important;font-size:25px!important}
      .meta{display:flex!important;flex-direction:column!important;gap:4px!important;align-items:flex-start!important;width:100%!important}
      .choices{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:7px!important;width:100%!important}
      .choice{width:100%!important;min-width:0!important}

      .portfolio-summary{gap:10px!important}
      .portfolio-list{display:block!important;width:100%!important;max-width:100%!important;overflow:visible!important}
      .portfolio-head{display:none!important}
      .position{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;padding:15px!important;border-top:1px solid var(--border)!important}
      .position>div{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;margin-top:8px!important}
      .position>div:first-child{margin-top:0!important}
      .pos-title,.pos-sub,.position a{overflow-wrap:anywhere!important;word-break:break-word!important;white-space:normal!important}

      .modal-backdrop{padding:8px!important;align-items:flex-start!important;overflow-y:auto!important}
      .modal{width:100%!important;max-width:100%!important;max-height:none!important;margin:8px 0!important;padding:17px!important;overflow:hidden!important}
      .modal-head{gap:8px!important}
      .modal-head>div{min-width:0!important}
      .modal h2{overflow-wrap:anywhere!important;white-space:normal!important}
      .auth-actions,.trade-switch,.quick{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:7px!important;width:100%!important}
      .amount-label{gap:8px!important;flex-wrap:wrap!important}
      .amount-line input{min-width:0!important}

      .footer{width:100%!important}
      .footer-links{justify-content:flex-start!important}
      .toast{left:10px!important;right:10px!important;bottom:10px!important;text-align:center!important}
    }
  `;
  document.head.appendChild(style);

  removeLegacyReset();
  document.addEventListener('DOMContentLoaded',removeLegacyReset,{once:true});
})();
