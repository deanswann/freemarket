import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDXr4ryOOT-OHX1np8KIPER6_Nk60okylw',
  authDomain: 'freemarket-68274.firebaseapp.com',
  projectId: 'freemarket-68274',
  storageBucket: 'freemarket-68274.firebasestorage.app',
  messagingSenderId: '130108525153',
  appId: '1:130108525153:web:69fcce32c2f6eefbb93820',
  measurementId: 'G-F6N8GLFK45'
};

const app=getApps().length?getApp():initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
const functions=getFunctions(app);
const placeBet=httpsCallable(functions,'placeBet');

function readLocal(){try{return JSON.parse(localStorage.getItem('freemarket-v4'))||null}catch(e){return null}}
function writeLocal(game){localStorage.setItem('freemarket-v4',JSON.stringify(game))}

function cloudTimeMs(value){
  if(!value)return 0;
  if(typeof value.toMillis==='function')return value.toMillis();
  if(value.seconds)return value.seconds*1000;
  return Number(value)||0;
}

function installBrandMetadata(){
  const head=document.head;
  const ensureLink=(rel,href,extra={})=>{
    let el=head.querySelector(`link[rel="${rel}"]`);
    if(!el){el=document.createElement('link');el.rel=rel;head.appendChild(el);}
    el.href=href;Object.entries(extra).forEach(([k,v])=>el.setAttribute(k,v));
  };
  const ensureMeta=(selector,attrs)=>{
    let el=head.querySelector(selector);
    if(!el){el=document.createElement('meta');head.appendChild(el);}
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
  };
  ensureLink('icon','/favicon.svg',{type:'image/svg+xml'});
  ensureLink('manifest','/site.webmanifest');
  ensureLink('canonical','https://probora.org/');
  ensureMeta('meta[name="description"]',{name:'description',content:'Probora is a play-money prediction market for forecasting sports, markets, politics, technology and more.'});
  ensureMeta('meta[name="theme-color"]',{name:'theme-color',content:'#0b0d10'});
  ensureMeta('meta[property="og:title"]',{property:'og:title',content:'Probora — Play-money prediction markets'});
  ensureMeta('meta[property="og:description"]',{property:'og:description',content:'Predict what happens next with virtual points across sports, markets, politics, technology and more.'});
  ensureMeta('meta[property="og:type"]',{property:'og:type',content:'website'});
  ensureMeta('meta[property="og:url"]',{property:'og:url',content:'https://probora.org/'});
  ensureMeta('meta[property="og:image"]',{property:'og:image',content:'https://probora.org/favicon.svg'});
  ensureMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary'});
  ensureMeta('meta[name="twitter:title"]',{name:'twitter:title',content:'Probora — Play-money prediction markets'});
  ensureMeta('meta[name="twitter:description"]',{name:'twitter:description',content:'Predict what happens next with virtual points.'});
  ensureMeta('meta[name="twitter:image"]',{name:'twitter:image',content:'https://probora.org/favicon.svg'});
}

function installHomepageV2(){
  if(document.getElementById('homepageV2Styles'))return;
  installBrandMetadata();
  document.title='Probora — Play-money prediction markets';
  const homeBrand=document.querySelector('.topbar .brand');
  if(homeBrand)homeBrand.innerHTML='Pro<span>bora</span>';
  const accountLabel=document.querySelector('#authModal .category');
  if(accountLabel)accountLabel.textContent='PROBORA ACCOUNT';
  const style=document.createElement('style');
  style.id='homepageV2Styles';
  style.textContent=`
    .tabs{gap:8px;padding-top:12px;padding-bottom:12px}.tab{display:inline-flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid transparent;border-radius:999px;background:#11161b;transition:.15s ease}.tab:hover{border-color:#313b46;color:#fff}.tab.active{background:#0e2a20;border-color:#176b4b;color:#9af0c8}
    .hero{grid-template-columns:minmax(0,1.45fr) minmax(270px,.55fr);margin-bottom:30px}.hero-main{padding:34px}.hero h1{max-width:680px;font-size:44px}.hero p{max-width:720px}.hero-side{display:flex;flex-direction:column;justify-content:center}.hero-side .notice{margin-top:16px;background:#111820;border-color:#25333e;color:#b9c6d0}
    #marketView>.section-head{align-items:end;margin:4px 0 16px}#marketView>.section-head h2{font-size:24px}#marketView>.section-head>span{display:none}
    .category-explorer{display:grid;grid-template-columns:repeat(7,1fr);gap:9px;margin-bottom:34px}.category-tile{border:1px solid var(--border);background:#11151a;border-radius:13px;padding:13px 12px;color:#fff;cursor:pointer;text-align:left;transition:.15s ease}.category-tile:hover{transform:translateY(-1px);border-color:#3b4653;background:#141a20}.category-icon{font-size:17px;display:block;margin-bottom:8px}.category-name{display:block;font-weight:800;font-size:13px}.category-count{display:block;color:var(--muted);font-size:11px;margin-top:3px}
    #markets.home-sections{display:block}.market-section{margin:0 0 34px}.market-section-head{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:12px}.market-section-head h2{font-size:21px;margin:0 0 4px}.market-section-head p{margin:0;color:var(--muted);font-size:12px}.view-all{border:0;background:transparent;color:#9fe8c8;font-weight:750;cursor:pointer;padding:6px 0}.view-all:hover{color:#c8f7e4}.section-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    .footer{margin-top:54px;padding:28px 0 12px;border-top:1px solid var(--border);text-align:left}.footer-inner{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.footer-brand{font-size:18px;font-weight:850;color:#fff}.footer-brand span{color:var(--green)}.footer-copy{max-width:480px;line-height:1.55;margin-top:7px}.footer-links{display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:flex-end}.footer-links a{color:var(--muted);text-decoration:none}.footer-links a:hover{color:#fff}.footer-legal{margin-top:18px;color:#6f7b86;font-size:11px}
    @media(max-width:1000px){.category-explorer{grid-template-columns:repeat(4,1fr)}}@media(max-width:900px){.section-grid{grid-template-columns:1fr 1fr}.hero h1{font-size:38px}}@media(max-width:620px){.category-explorer{grid-template-columns:repeat(2,1fr)}.section-grid{grid-template-columns:1fr}.footer-inner{flex-direction:column}.footer-links{justify-content:flex-start}.hero-main{padding:24px}.hero h1{font-size:32px}}
  `;
  document.head.appendChild(style);

  const heroMain=document.querySelector('.hero-main');
  if(heroMain){
    heroMain.querySelector('.eyebrow').textContent='● PREDICT. TRADE. TRACK.';
    heroMain.querySelector('h1').textContent='What do you think happens next?';
    heroMain.querySelector('p').textContent='Explore live play-money prediction markets across sports, markets, politics, technology and more. Pick a side, follow the crowd, and see how your calls perform.';
  }
  const heroSide=document.querySelector('.hero-side');
  if(heroSide){
    const p=heroSide.querySelector('p');if(p)p.textContent='Virtual points only — no deposits, withdrawals, transfers, prizes or cash value.';
    const notice=heroSide.querySelector('.notice');if(notice)notice.innerHTML='<b>Secure cloud account:</b> your balance, positions and global markets sync through the protected backend.';
  }
  const sectionHead=document.querySelector('#marketView>.section-head');
  if(sectionHead){
    const left=sectionHead.querySelector('div');
    if(left){left.innerHTML='<h2>Explore markets</h2><span>Browse highlights below or jump straight into a category.</span>';}
    const explorer=document.createElement('div');explorer.id='categoryExplorer';explorer.className='category-explorer';sectionHead.insertAdjacentElement('afterend',explorer);
  }
  const footer=document.querySelector('.footer');
  if(footer)footer.innerHTML='<div class="footer-inner"><div><div class="footer-brand">Pro<span>bora</span></div><div class="footer-copy">Independent play-money prediction markets for forecasting and entertainment. Virtual points have no monetary value.</div></div><div class="footer-links"><a href="./about.html">About</a><a href="./rules.html">How it works</a><a href="./terms.html">Terms</a><a href="./privacy.html">Privacy</a></div></div><div class="footer-legal">Probora · Play-money only · Opening probabilities are estimates, not guarantees or financial advice.</div>';

  window.eval(`
    function homepageOpenMarkets(){return state.markets.filter(m=>(!m.status||m.status==='open')&&(!m.closeAtMs||Date.now()<m.closeAtMs));}
    function homepageCounts(){return homepageOpenMarkets().reduce((o,m)=>(o[m.category]=(o[m.category]||0)+1,o),{});}
    function tabs(){
      const counts=homepageCounts();const icons={All:'⌂',Sports:'🏆',Politics:'🏛',Economy:'◫',Markets:'↗',Technology:'⌘',Space:'✦',Culture:'◉'};
      document.getElementById('tabs').innerHTML=cats.map(c=>'<div class="tab '+(view==='markets'&&c===activeCat?'active':'')+'" onclick="activeCat=\\''+c+'\\';showMarkets()">'+icons[c]+' '+c+(c==='All'?'':' · '+(counts[c]||0))+'</div>').join('');
    }
    function homepageSection(title,subtitle,list,category){
      if(!list.length)return '';
      const button=category?'<button class="view-all" onclick="activeCat=\\''+category+'\\';showMarkets()">View all '+category+' →</button>':'';
      return '<section class="market-section"><div class="market-section-head"><div><h2>'+title+'</h2><p>'+subtitle+'</p></div>'+button+'</div><div class="section-grid">'+list.map(card).join('')+'</div></section>';
    }
    function renderCategoryExplorer(){
      const root=document.getElementById('categoryExplorer');if(!root)return;const counts=homepageCounts();
      const meta={Sports:['🏆','Sports'],Politics:['🏛','Politics'],Economy:['◫','Economy'],Markets:['↗','Markets'],Technology:['⌘','Technology'],Space:['✦','Space'],Culture:['◉','Culture']};
      root.innerHTML=Object.keys(meta).map(c=>'<button class="category-tile" onclick="activeCat=\\''+c+'\\';showMarkets()"><span class="category-icon">'+meta[c][0]+'</span><span class="category-name">'+meta[c][1]+'</span><span class="category-count">'+(counts[c]||0)+' active markets</span></button>').join('');
    }
    function render(){
      tabs();balanceTop.textContent=fmt(state.balance);balanceHero.textContent=fmt(state.balance);const active=homepageOpenMarkets();marketCount.textContent=active.length;positionsCount.textContent=state.positions.filter(p=>!p.settled&&!p.cashedOut).length;volumeTotal.textContent='◈ '+fmt(active.reduce((a,m)=>a+marketVolume(m),0));filterLabel.textContent=activeCat==='All'?'Curated home':activeCat;renderCategoryExplorer();
      const q=document.getElementById('search').value.trim().toLowerCase();
      if(activeCat!=='All'||q){markets.className='grid';markets.innerHTML=filtered().map(card).join('');}
      else{
        markets.className='home-sections';const byVolume=[...active].sort((a,b)=>marketVolume(b)-marketVolume(a));const featured=byVolume.slice(0,6);const soon=[...active].filter(m=>m.closeAtMs).sort((a,b)=>a.closeAtMs-b.closeAtMs).filter(m=>!featured.some(f=>f.id===m.id)).slice(0,6);let html=homepageSection('Trending now','Markets drawing the most play volume.',featured,'');html+=homepageSection('Closing soon','Time-sensitive markets approaching their trading cutoff.',soon,'');
        for(const c of ['Sports','Markets','Politics','Economy','Technology','Space','Culture']){const list=active.filter(m=>m.category===c).sort((a,b)=>marketVolume(b)-marketVolume(a)).slice(0,6);if(list.length)html+=homepageSection(c,'A quick look at active '+c.toLowerCase()+' markets.',list,c);}markets.innerHTML=html||'<div class="empty">No active markets.</div>';
      }
      renderPortfolio();
    }
  `);
}

function pushRuntime(game){
  try{
    window.__freemarketCloudState=game;
    window.eval(`
      state = window.__freemarketCloudState;
      window.__freemarketIsPubliclyOpen = function(m){return (!m.status || m.status==='open') && (!m.closeAtMs || Date.now()<m.closeAtMs);};
      filtered = function(){const q=document.getElementById('search').value.trim().toLowerCase();return state.markets.filter(m=>window.__freemarketIsPubliclyOpen(m) && (activeCat==='All'||m.category===activeCat) && (!q||m.title.toLowerCase().includes(q)||m.category.toLowerCase().includes(q)));};
      render();
    `);
    delete window.__freemarketCloudState;
  }catch(e){console.error('Runtime market refresh failed',e);}
}

function applyMarketSnapshot(snapshot){
  const game=readLocal()||{balance:10000,positions:[],markets:[]};
  if(!Array.isArray(game.markets))game.markets=[];
  if(!Array.isArray(game.positions))game.positions=[];
  const map=new Map(snapshot.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
  const localMap=new Map(game.markets.map(m=>[m.id,m]));
  const merged=[];
  for(const [id,cloud] of map){
    const local=localMap.get(id)||{};
    merged.push({...local,id,title:cloud.title||local.title||id,category:cloud.category||local.category||'Other',ends:cloud.closeAt?.toDate?cloud.closeAt.toDate().toLocaleString():local.ends||'',prior:Number(cloud.prior)||Number(local.prior)||50,yesStake:Number(cloud.yesStake)||0,noStake:Number(cloud.noStake)||0,status:cloud.status||'open',result:cloud.result||null,closeAtMs:cloudTimeMs(cloud.closeAt)||Number(cloud.closeAtMs)||Number(local.closeAtMs)||0,resolutionRule:cloud.resolutionRule||local.resolutionRule||'',source:cloud.source||local.source||''});
  }
  for(const local of game.markets){if(!map.has(local.id))merged.push(local);}
  game.markets=merged;writeLocal(game);pushRuntime(game);
}

async function placeSharedTradeFromUi(){
  if(!auth.currentUser)throw new Error('Please log in before placing a prediction.');
  const selected=window.eval('selected');const side=window.eval('side');const amt=Math.floor(Number(document.getElementById('amount')?.value)||0);
  if(!selected||amt<=0)throw new Error('Invalid prediction.');
  if(selected.status&&selected.status!=='open')throw new Error('This market is closed.');
  if(selected.closeAtMs&&Date.now()>=selected.closeAtMs)throw new Error('This market has reached its closing time.');
  const result=await placeBet({marketId:selected.id,side,amount:amt});window.eval('closeModal()');window.eval(`toast('Placed ${side} prediction for ◈ ${amt.toLocaleString('en-US')}')`);return result.data;
}

function goToMarket(id,side='YES'){if(!id)return;const safeSide=side==='NO'?'NO':'YES';location.href=`./market.html?id=${encodeURIComponent(id)}&side=${safeSide}`;}

let unsubscribe=null;
function startSharedMarkets(){
  installHomepageV2();
  if(unsubscribe)unsubscribe();
  unsubscribe=onSnapshot(collection(db,'markets'),applyMarketSnapshot,e=>console.error('Shared market listener failed',e));
  window.openMarket=goToMarket;
  window.placeTrade=async()=>{const btn=document.getElementById('submitTrade');if(btn)btn.disabled=true;try{await placeSharedTradeFromUi()}catch(e){console.error(e);alert((e.message||'Prediction failed.').replace('FirebaseError: ',''));}finally{if(btn)btn.disabled=false}};
}

startSharedMarkets();