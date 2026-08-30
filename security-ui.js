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

  // True mobile layout: one vertical flow, no compressed desktop columns.
  const style=document.createElement('style');
  style.id='proboraMobileSingleColumn';
  style.textContent=`
    @media(max-width:700px){
      html,body{max-width:100%;overflow-x:hidden}
      .shell{width:100%;max-width:100%;padding:18px 12px 38px}

      .topbar{position:static;display:flex;flex-direction:column;align-items:stretch;gap:10px;padding:12px}
      .topbar .brand{align-self:flex-start}
      .topbar .search{display:none!important}
      .topbar .actions{display:flex;flex-direction:column;align-items:stretch;gap:7px;width:100%}
      .topbar .actions .btn,.topbar .user-box{width:100%;max-width:none;justify-content:center}
      .topbar .balance{display:none!important}
      #userEmail{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

      .tabs{display:flex;flex-wrap:wrap;gap:7px;overflow:visible;padding:10px 12px}
      .tab{flex:1 1 calc(50% - 7px);justify-content:center;text-align:center;min-width:0}

      .hero,.grid,.section-grid,.category-explorer,.portfolio-summary,.quote{display:grid!important;grid-template-columns:1fr!important;width:100%}
      .hero{gap:12px}
      .hero-main,.hero-side,.card,.market,.summary-card{width:100%;min-width:0;max-width:100%}
      .hero-main{padding:22px 18px}
      .hero-side{padding:18px}
      .hero h1,.portfolio-title{font-size:30px;line-height:1.08;overflow-wrap:anywhere}
      .hero p,.portfolio-intro,.notice{overflow-wrap:anywhere}
      .stats{display:grid;grid-template-columns:1fr;gap:10px}

      .section-head,.market-section-head,.footer-inner{display:flex!important;flex-direction:column;align-items:flex-start!important;gap:8px}
      .section-head>*{min-width:0;max-width:100%}
      .category-explorer{gap:8px}
      .category-tile{width:100%}

      .market{padding:14px}
      .market-top{display:flex;align-items:flex-start;gap:10px}
      .market-top>div:first-child{min-width:0;flex:1}
      .market h3{font-size:16px;overflow-wrap:anywhere;word-break:break-word}
      .prob{flex:0 0 auto;font-size:25px}
      .meta{display:flex;flex-direction:column;gap:4px;align-items:flex-start}
      .choices{grid-template-columns:1fr 1fr;gap:7px}
      .choice{min-width:0}

      .portfolio-list{width:100%;overflow:visible}
      .portfolio-head{display:none!important}
      .position{display:block!important;width:100%;min-width:0;padding:15px;border-top:1px solid var(--border)}
      .position>div{display:block!important;width:100%;min-width:0;margin-top:8px}
      .position>div:first-child{margin-top:0}
      .pos-title,.pos-sub,.position a{overflow-wrap:anywhere;word-break:break-word}

      .modal-backdrop{padding:8px;align-items:flex-start;overflow-y:auto}
      .modal{width:100%;max-width:100%;max-height:none;margin:8px 0;padding:17px;overflow:hidden}
      .modal-head{gap:8px}
      .modal-head>div{min-width:0}
      .modal h2{overflow-wrap:anywhere}
      .auth-actions{grid-template-columns:1fr!important}
      .quick{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .amount-label{gap:8px;flex-wrap:wrap}
      .amount-line input{min-width:0}

      .footer{width:100%}
      .footer-links{justify-content:flex-start!important}
      .toast{left:10px;right:10px;bottom:10px;text-align:center}
    }

    @media(max-width:420px){
      .tabs{display:grid;grid-template-columns:1fr 1fr}
      .tab{width:100%}
      .choices,.quick{grid-template-columns:1fr}
      .hero h1,.portfolio-title{font-size:28px}
    }
  `;
  document.head.appendChild(style);

  removeLegacyReset();
  document.addEventListener('DOMContentLoaded',removeLegacyReset,{once:true});
})();
