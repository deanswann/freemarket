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

function accountSnapshot(game){
  return JSON.stringify({
    balance:Number.isFinite(game?.balance)?game.balance:10000,
    positions:Array.isArray(game?.positions)?game.positions:[]
  });
}

function writeLocalAccount(account){
  const current=readLocalGame()||{};
  const before=accountSnapshot(current);
  current.balance=Number.isFinite(account.balance)?account.balance:10000;
  current.positions=Array.isArray(account.positions)?account.positions:[];
  localStorage.setItem('freemarket-v4',JSON.stringify(current));
  return before!==accountSnapshot(current);
}

async function ensureCloudAccount(user){
  const ref=doc(db,'users',user.uid);
  const snap=await getDoc(ref);
  if(!snap.exists()){
    const account={
      email:user.email||'',
      balance:10000,
      positions:[],
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    };
    await setDoc(ref,account);
    return {changed:writeLocalAccount(account)};
  }
  const data=snap.data();
  const account={
    balance:Number.isFinite(data.balance)?data.balance:10000,
    positions:Array.isArray(data.positions)?data.positions:[]
  };
  return {changed:writeLocalAccount(account)};
}

async function saveCloudGame(){
  if(!activeUser||!cloudReady)return;
  const local=readLocalGame();
  if(!local)return;
  try{
    await setDoc(doc(db,'users',activeUser.uid),{
      email:activeUser.email||'',
      balance:Number.isFinite(local.balance)?local.balance:10000,
      positions:Array.isArray(local.positions)?local.positions:[],
      updatedAt:serverTimestamp()
    },{merge:true});
  }catch(e){
    console.error('Firestore save failed',e);
  }
}

function installSaveHook(){
  if(window.__freeMarketCloudSaveHook||typeof window.save!=='function')return;
  const localSave=window.save;
  window.save=function(){
    const result=localSave.apply(this,arguments);
    saveCloudGame();
    return result;
  };
  window.__freeMarketCloudSaveHook=true;
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
window.logoutAccount=()=>signOut(auth);

installSaveHook();

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
      if(result.changed){
        location.reload();
        return;
      }
      const notice=document.querySelector('.hero-side .notice');
      if(notice)notice.innerHTML='<b>Cloud account connected:</b> your 10,000-point starting balance and portfolio now sync with Firestore when you are signed in. Market activity is still local until the shared market backend is added.';
    }catch(e){
      console.error('Firestore account setup failed',e);
      const notice=document.querySelector('.hero-side .notice');
      if(notice)notice.innerHTML='<b>Account signed in, but Firestore could not load.</b> Check the published Firestore rules and database configuration.';
    }
  }else{
    if(login)login.style.display='inline-flex';
    if(userBox)userBox.style.display='none';
    if(userEmail)userEmail.textContent='';
  }
});
