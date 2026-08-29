import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDXr4ryOOT-OHX1np8KIPER6_Nk60okylw',
  authDomain: 'freemarket-68274.firebaseapp.com',
  projectId: 'freemarket-68274',
  storageBucket: 'freemarket-68274.firebasestorage.app',
  messagingSenderId: '130108525153',
  appId: '1:130108525153:web:69fcce32c2f6eefbb93820',
  measurementId: 'G-F6N8GLFK45'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let activeUser = null;
let cloudReady = false;
let lastCloudSnapshot = '';
let saveInFlight = false;
let saveAgain = false;

function message(text, ok=false){
  const el=document.getElementById('authMessage');
  if(!el)return;
  el.textContent=text;
  el.style.color=ok?'#9af0c8':'#ff9aa6';
}

function readLocalGame(){
  try{
    const raw=localStorage.getItem('freemarket-v4');
    return raw?JSON.parse(raw):null;
  }catch(e){return null;}
}

function normalizedAccount(game){
  return {
    balance:Number.isFinite(game?.balance)?game.balance:10000,
    positions:Array.isArray(game?.positions)?game.positions:[]
  };
}

function accountSnapshot(game){
  return JSON.stringify(normalizedAccount(game));
}

function writeLocalAccount(account){
  const current=readLocalGame()||{};
  const before=accountSnapshot(current);
  const clean=normalizedAccount(account);
  current.balance=clean.balance;
  current.positions=clean.positions;
  localStorage.setItem('freemarket-v4',JSON.stringify(current));
  return before!==accountSnapshot(current);
}

async function ensureCloudAccount(user){
  const ref=doc(db,'users',user.uid);
  const snap=await getDoc(ref);
  let account;

  if(!snap.exists()){
    account={balance:10000,positions:[]};
    await setDoc(ref,{
      email:user.email||'',
      ...account,
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
  }else{
    account=normalizedAccount(snap.data());
  }

  lastCloudSnapshot=accountSnapshot(account);
  const changed=writeLocalAccount(account);
  localStorage.setItem('freemarket-last-user',user.uid);
  return {account,changed};
}

async function saveCloudGame(){
  if(!activeUser||!cloudReady)return;
  const local=readLocalGame();
  if(!local)return;
  const snapshot=accountSnapshot(local);
  if(snapshot===lastCloudSnapshot)return;

  if(saveInFlight){
    saveAgain=true;
    return;
  }

  saveInFlight=true;
  try{
    const clean=normalizedAccount(local);
    await setDoc(doc(db,'users',activeUser.uid),{
      email:activeUser.email||'',
      balance:clean.balance,
      positions:clean.positions,
      updatedAt:serverTimestamp()
    },{merge:true});
    lastCloudSnapshot=accountSnapshot(clean);
  }catch(e){
    console.error('Firestore save failed',e);
  }finally{
    saveInFlight=false;
    if(saveAgain){
      saveAgain=false;
      saveCloudGame();
    }
  }
}

function installSaveHook(){
  if(window.__freeMarketCloudSaveHook||typeof window.save!=='function')return;
  const localSave=window.save;
  window.save=function(){
    const result=localSave.apply(this,arguments);
    queueMicrotask(saveCloudGame);
    return result;
  };
  window.__freeMarketCloudSaveHook=true;
}

function startDirtyWatcher(){
  if(window.__freeMarketDirtyWatcher)return;
  window.__freeMarketDirtyWatcher=setInterval(()=>{
    if(!activeUser||!cloudReady)return;
    const local=readLocalGame();
    if(local&&accountSnapshot(local)!==lastCloudSnapshot)saveCloudGame();
  },750);
}

window.openAuth=()=>{document.getElementById('authModal')?.classList.add('show');message('')};
window.closeAuth=()=>document.getElementById('authModal')?.classList.remove('show');
window.registerAccount=async()=>{
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value||'';
  if(!email||password.length<6){message('Enter a valid email and a password with at least 6 characters.');return;}
  try{await createUserWithEmailAndPassword(auth,email,password);message('Account created.',true);setTimeout(window.closeAuth,500)}catch(e){message(e.message.replace('Firebase: ','').replace(/\(auth\/.+\)\.?/,'').trim())}
};
window.loginAccount=async()=>{
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value||'';
  try{await signInWithEmailAndPassword(auth,email,password);message('Logged in.',true);setTimeout(window.closeAuth,500)}catch(e){message('Email or password is incorrect.')}
};
window.logoutAccount=async()=>{
  await saveCloudGame();
  return signOut(auth);
};

installSaveHook();
startDirtyWatcher();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveCloudGame()});

onAuthStateChanged(auth,async user=>{
  const login=document.getElementById('loginBtn');
  const userBox=document.getElementById('userBox');
  const userEmail=document.getElementById('userEmail');
  activeUser=user||null;
  cloudReady=false;

  if(user){
    if(login)login.style.display='none';
    if(userBox)userBox.style.display='flex';
    if(userEmail)userEmail.textContent=user.email||'Account';
    try{
      const result=await ensureCloudAccount(user);
      cloudReady=true;
      installSaveHook();
      startDirtyWatcher();
      if(result.changed){
        location.reload();
        return;
      }
      const notice=document.querySelector('.hero-side .notice');
      if(notice)notice.innerHTML='<b>Cloud account connected:</b> balance and portfolio are loaded from Firestore and changes sync automatically across devices. Global market odds and volume are shared through Firestore when market rules are enabled.';
    }catch(e){
      console.error('Firestore account setup failed',e);
      const notice=document.querySelector('.hero-side .notice');
      if(notice)notice.innerHTML='<b>Account signed in, but Firestore could not load.</b> Check the published Firestore rules and database configuration.';
    }
  }else{
    lastCloudSnapshot='';
    if(login)login.style.display='inline-flex';
    if(userBox)userBox.style.display='none';
    if(userEmail)userEmail.textContent='';
  }
});

import('./shared-markets.js').catch(e=>console.error('Shared markets module failed',e));
