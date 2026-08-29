import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

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
const db=getFirestore(app);
let unsubscribeUser=null;

function message(text,ok=false){
  const el=document.getElementById('authMessage');
  if(!el)return;
  el.textContent=text;
  el.style.color=ok?'#9af0c8':'#ff9aa6';
}

function openPositions(account){
  return Array.isArray(account?.positions)?account.positions.filter(p=>!p?.settled):[];
}

function readLocalGame(){try{return JSON.parse(localStorage.getItem('freemarket-v4'))||null}catch(e){return null}}
function writeLocalAccount(account){
  const current=readLocalGame()||{};
  current.balance=Number.isFinite(account?.balance)?account.balance:10000;
  current.positions=openPositions(account);
  localStorage.setItem('freemarket-v4',JSON.stringify(current));
  return current;
}

function pushAccountToRuntime(account){
  try{
    window.__freemarketAccount={...account,positions:openPositions(account)};
    window.eval(`
      state.balance = Number.isFinite(window.__freemarketAccount.balance) ? window.__freemarketAccount.balance : state.balance;
      state.positions = Array.isArray(window.__freemarketAccount.positions) ? window.__freemarketAccount.positions : state.positions;
      render();
      const activeMarkets=state.markets.filter(m=>!m.status || m.status==='open');
      marketCount.textContent=activeMarkets.length;
      positionsCount.textContent=state.positions.length;
    `);
    delete window.__freemarketAccount;
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
    if(notice)notice.innerHTML='<b>Secure cloud account:</b> balance and portfolio are server-authoritative and sync across devices. Bets and global market state are handled through the protected backend.';
  },e=>console.error('Account listener failed',e));
}

window.openAuth=()=>{document.getElementById('authModal')?.classList.add('show');message('')};
window.closeAuth=()=>document.getElementById('authModal')?.classList.remove('show');
window.registerAccount=async()=>{
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value||'';
  if(!email||password.length<6){message('Enter a valid email and a password with at least 6 characters.');return;}
  try{
    await createUserWithEmailAndPassword(auth,email,password);
    message('Account created.',true);
    setTimeout(()=>location.reload(),350);
  }catch(e){message(e.message.replace('Firebase: ','').replace(/\(auth\/.+\)\.?/,'').trim())}
};
window.loginAccount=async()=>{
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value||'';
  try{
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

import('./shared-markets.js?v=20260829-5').catch(e=>console.error('Shared markets module failed',e));
