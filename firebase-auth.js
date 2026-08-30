import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
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

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const authPersistenceReady=setPersistence(auth,browserLocalPersistence).catch(e=>{
  console.error('Could not enable persistent login',e);
});
const db=getFirestore(app);
const functions=getFunctions(app);
const cashOutPositionFn=httpsCallable(functions,'cashOutPosition');
let unsubscribeUser=null;

function message(text,ok=false){
  const el=document.getElementById('authMessage');
  if(!el)return;
  el.textContent=text;
  el.style.color=ok?'#9af0c8':'#ff9aa6';
}

function allPositions(account){
  return Array.isArray(account?.positions)?account.positions:[];
}

function readLocalGame(){try{return JSON.parse(localStorage.getItem('freemarket-v4'))||null}catch(e){return null}}
function writeLocalAccount(account){
  const current=readLocalGame()||{};
  current.balance=Number.isFinite(account?.balance)?account.balance:10000;
  current.positions=allPositions(account);
  localStorage.setItem('freemarket-v4',JSON.stringify(current));
  return current;
}

function fmt2(n){return (Number(n)||0).toLocaleString('en-US',{maximumFractionDigits:2})}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function ensureNavLinks(){
  const actions=document.querySelector('.topbar .actions');
  const portfolio=document.getElementById('portfolioBtn');
  if(!actions||!portfolio)return;
  if(!document.getElementById('leaderboardBtn')){
    const a=document.createElement('a');a.id='leaderboardBtn';a.className='btn';a.href='./leaderboard.html';a.textContent='Leaderboard';a.style.textDecoration='none';
    portfolio.insertAdjacentElement('afterend',a);
  }
  if(!document.getElementById('profileBtn')){
    const a=document.createElement('a');a.id='profileBtn';a.className='btn';a.href='./profile.html';a.textContent='Profile';a.style.textDecoration='none';
    document.getElementById('leaderboardBtn').insertAdjacentElement('afterend',a);
  }
}

window.cashOutPortfolioPosition=async(index,marketId)=>{
  if(!auth.currentUser){alert('Log in first.');return;}
  if(!confirm('Cash out this position at its current server-calculated value? A 2% cash-out fee applies.'))return;
  try{
    const res=await cashOutPositionFn({positionIndex:Number(index),marketId:String(marketId)});
    const d=res.data||{};
    alert(`Cash out complete.\nExit price: ${fmt2(d.exitPrice)}%\nFee: ◈ ${fmt2(d.fee)}\nCredited: ◈ ${fmt2(d.payout)}`);
  }catch(e){
    alert((e.message||'Cash out failed.').replace('FirebaseError: ',''));
  }
};

function enhancedPortfolio(){
  const game=readLocalGame()||{};
  const indexed=(Array.isArray(game.positions)?game.positions:[]).map((p,index)=>({...p,__index:index}));
  const open=indexed.filter(p=>!p?.settled&&!p?.cashedOut);
  const history=indexed.filter(p=>p?.settled||p?.cashedOut);
  const markets=Array.isArray(game.markets)?game.markets:[];
  const byId=new Map(markets.map(m=>[m.id,m]));

  const balance=document.getElementById('portfolioBalance');
  const invested=document.getElementById('portfolioInvested');
  const potential=document.getElementById('portfolioPayout');
  const rows=document.getElementById('positions');
  if(balance)balance.textContent=fmt2(game.balance);
  if(invested)invested.textContent=fmt2(open.reduce((a,p)=>a+(Number(p.amount)||0),0));
  if(potential)potential.textContent=fmt2(open.reduce((a,p)=>a+(Number(p.shares)||0),0));

  if(rows){
    rows.innerHTML=open.length?open.slice().reverse().map(p=>{
      const m=byId.get(p.marketId);
      const href='./market.html?id='+encodeURIComponent(String(p.marketId||''));
      const cashoutAllowed=(!m?.status||m.status==='open')&&(!m?.closeAtMs||Date.now()<Number(m.closeAtMs));
      const cashButton=cashoutAllowed?`<button type="button" onclick="cashOutPortfolioPosition(${p.__index},'${esc(String(p.marketId||''))}')" style="margin-top:7px;padding:5px 8px;border:1px solid #3a4652;border-radius:7px;background:#1a222a;color:#dce5ec;cursor:pointer;font-size:11px;font-weight:800">Cash out · 2% fee</button>`:'';
      return `<div class="position"><div><div class="pos-title"><a href="${href}" style="color:inherit;text-decoration:none">${esc(m?.title||p.marketId||'Unknown market')}</a></div><div class="pos-sub">Your prediction: <b>${esc(p.side)}</b></div>${cashButton}</div><div><b>◈ ${fmt2(p.amount)}</b></div><div class="payout">◈ ${fmt2(p.shares)}</div><div>${fmt2(p.price)}%</div></div>`;
    }).join(''):'<div class="empty">No open positions.</div>';
  }

  const list=document.querySelector('#portfolioView .portfolio-list');
  if(list&&!document.getElementById('historyPositions')){
    const title=document.createElement('div');
    title.id='historyTitle';
    title.style.cssText='margin:28px 0 10px;font-size:20px;font-weight:800';
    title.textContent='History';
    const historyList=document.createElement('div');
    historyList.className='portfolio-list';
    historyList.innerHTML='<div class="portfolio-head"><div>Market / prediction</div><div>Result</div><div>Payout</div><div>Entry odds</div></div><div id="historyPositions"></div>';
    list.insertAdjacentElement('afterend',title);
    title.insertAdjacentElement('afterend',historyList);
  }

  const historyRows=document.getElementById('historyPositions');
  if(historyRows){
    historyRows.innerHTML=history.length?history.slice().reverse().map(p=>{
      const m=byId.get(p.marketId);
      const href='./market.html?id='+encodeURIComponent(String(p.marketId||''));
      if(p.cashedOut){
        return `<div class="position"><div><div class="pos-title"><a href="${href}" style="color:inherit;text-decoration:none">${esc(m?.title||p.marketId||'Unknown market')}</a></div><div class="pos-sub">Cashed out <b>${esc(p.side)}</b> at ${fmt2(p.exitPrice)}% · fee ◈ ${fmt2(p.cashoutFee)}</div></div><div style="font-weight:850;color:#f1b84b">CASHED OUT</div><div class="payout">◈ ${fmt2(p.payout)}</div><div>${fmt2(p.price)}%</div></div>`;
      }
      const won=p.won===true;
      return `<div class="position"><div><div class="pos-title"><a href="${href}" style="color:inherit;text-decoration:none">${esc(m?.title||p.marketId||'Unknown market')}</a></div><div class="pos-sub">Your prediction: <b>${esc(p.side)}</b> • Result: <b>${esc(p.result||'—')}</b></div></div><div style="font-weight:850;color:${won?'#18c37e':'#ff5b6e'}">${won?'WON':'LOST'}</div><div class="payout">◈ ${fmt2(p.payout)}</div><div>${fmt2(p.price)}%</div></div>`;
    }).join(''):'<div class="empty">No resolved predictions yet.</div>';
  }

  const count=document.getElementById('positionsCount');
  if(count)count.textContent=String(open.length);
}

window.renderPortfolio=enhancedPortfolio;
ensureNavLinks();

function pushAccountToRuntime(account){
  try{
    window.__freemarketAccount={...account,positions:allPositions(account)};
    window.eval(`
      state.balance = Number.isFinite(window.__freemarketAccount.balance) ? window.__freemarketAccount.balance : state.balance;
      state.positions = Array.isArray(window.__freemarketAccount.positions) ? window.__freemarketAccount.positions : state.positions;
      render();
      const activeMarkets=state.markets.filter(m=>(!m.status || m.status==='open') && (!m.closeAtMs || Date.now()<m.closeAtMs));
      marketCount.textContent=activeMarkets.length;
      positionsCount.textContent=state.positions.filter(p=>!p.settled&&!p.cashedOut).length;
    `);
    delete window.__freemarketAccount;
    enhancedPortfolio();
  }catch(e){
    console.error('Runtime account refresh failed',e);
  }
}

async function ensureCloudAccount(user){
  const ref=doc(db,'users',user.uid);
  const snap=await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref,{email:user.email||'',balance:10000,positions:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  }
  return ref;
}

function watchAccount(ref){
  if(unsubscribeUser)unsubscribeUser();
  unsubscribeUser=onSnapshot(ref,snap=>{
    if(!snap.exists())return;
    const account=snap.data();
    writeLocalAccount(account);
    pushAccountToRuntime(account);
    const notice=document.querySelector('.hero-side .notice');
    if(notice)notice.innerHTML='<b>Secure cloud account:</b> balance and portfolio are server-authoritative and sync across devices. Bets, cash outs, and global market state are handled through the protected backend.';
  },e=>console.error('Account listener failed',e));
}

window.openAuth=()=>{document.getElementById('authModal')?.classList.add('show');message('')};
window.closeAuth=()=>document.getElementById('authModal')?.classList.remove('show');
window.registerAccount=async()=>{
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value||'';
  if(!email||password.length<6){message('Enter a valid email and a password with at least 6 characters.');return;}
  try{
    await authPersistenceReady;
    await createUserWithEmailAndPassword(auth,email,password);
    message('Account created.',true);
    setTimeout(()=>location.reload(),350);
  }catch(e){message(e.message.replace('Firebase: ','').replace(/\(auth\/.+\)\.?/,'').trim())}
};
window.loginAccount=async()=>{
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value||'';
  try{
    await authPersistenceReady;
    await signInWithEmailAndPassword(auth,email,password);
    message('Logged in.',true);
    setTimeout(()=>location.reload(),350);
  }catch(e){message('Email or password is incorrect.')}
};
window.logoutAccount=()=>signOut(auth);

onAuthStateChanged(auth,async user=>{
  const login=document.getElementById('loginBtn');
  const userBox=document.getElementById('userBox');
  const userEmail=document.getElementById('userEmail');
  if(unsubscribeUser){unsubscribeUser();unsubscribeUser=null;}

  if(user){
    if(login)login.style.display='none';
    if(userBox)userBox.style.display='flex';
    if(userEmail)userEmail.textContent=user.email||'Account';
    try{const ref=await ensureCloudAccount(user);watchAccount(ref);}catch(e){console.error('Firestore account setup failed',e);}
  }else{
    if(login)login.style.display='inline-flex';
    if(userBox)userBox.style.display='none';
    if(userEmail)userEmail.textContent='';
  }
});

await import('./security-ui.js?v=20260830-1').catch(e=>console.error('Security/mobile layer failed',e));
import('./shared-markets.js?v=20260830-2').catch(e=>console.error('Shared markets module failed',e));
