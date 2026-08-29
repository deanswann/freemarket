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

function syncRuntimeFromLocal(){
  try{
    window.eval("state = JSON.parse(localStorage.getItem('freemarket-v4')); render()");
  }catch(e){
    console.error('Runtime market refresh failed',e);
  }
}

function applyMarketSnapshot(snapshot){
  const game=readLocal();
  if(!game?.markets)return;
  const map=new Map(snapshot.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
  let changed=false;

  game.markets=game.markets.map(m=>{
    const cloud=map.get(m.id);
    if(!cloud)return m;
    const next={
      ...m,
      title:cloud.title||m.title,
      category:cloud.category||m.category,
      prior:Number(cloud.prior)||m.prior||50,
      yesStake:Number(cloud.yesStake)||0,
      noStake:Number(cloud.noStake)||0,
      status:cloud.status||'open',
      result:cloud.result||null,
      closeAtMs:cloudTimeMs(cloud.closeAt)||Number(cloud.closeAtMs)||0,
      resolutionRule:cloud.resolutionRule||'',
      source:cloud.source||''
    };
    if(JSON.stringify(next)!==JSON.stringify(m))changed=true;
    return next;
  });

  for(const [id,cloud] of map){
    if(game.markets.some(m=>m.id===id))continue;
    game.markets.push({
      id,
      title:cloud.title||id,
      category:cloud.category||'Other',
      ends:cloud.closeAt?.toDate?cloud.closeAt.toDate().toLocaleString(): '',
      prior:Number(cloud.prior)||50,
      yesStake:Number(cloud.yesStake)||0,
      noStake:Number(cloud.noStake)||0,
      status:cloud.status||'open',
      result:cloud.result||null,
      closeAtMs:cloudTimeMs(cloud.closeAt)||0,
      resolutionRule:cloud.resolutionRule||'',
      source:cloud.source||''
    });
    changed=true;
  }

  if(changed){
    writeLocal(game);
    syncRuntimeFromLocal();
  }
}

async function placeSharedTradeFromUi(){
  if(!auth.currentUser)throw new Error('Please log in before placing a prediction.');
  const selected=window.eval('selected');
  const side=window.eval('side');
  const amt=Math.floor(Number(document.getElementById('amount')?.value)||0);
  if(!selected||amt<=0)throw new Error('Invalid prediction.');
  if(selected.status&&selected.status!=='open')throw new Error('This market is closed.');
  if(selected.closeAtMs&&Date.now()>=selected.closeAtMs)throw new Error('This market has reached its closing time.');

  const result=await placeBet({marketId:selected.id,side,amount:amt});
  window.eval('closeModal()');
  window.eval(`toast('Placed ${side} prediction for ◈ ${amt.toLocaleString('en-US')}')`);
  return result.data;
}

let unsubscribe=null;
function startSharedMarkets(){
  if(unsubscribe)unsubscribe();
  unsubscribe=onSnapshot(collection(db,'markets'),applyMarketSnapshot,e=>console.error('Shared market listener failed',e));
  window.placeTrade=async()=>{
    const btn=document.getElementById('submitTrade');
    if(btn)btn.disabled=true;
    try{await placeSharedTradeFromUi()}catch(e){console.error(e);alert((e.message||'Prediction failed.').replace('FirebaseError: ',''));}finally{if(btn)btn.disabled=false}
  };
}

startSharedMarkets();
