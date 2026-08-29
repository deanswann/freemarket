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

function pushRuntime(game){
  try{
    window.__freemarketCloudState=game;
    window.eval(`
      state = window.__freemarketCloudState;
      filtered = function(){
        const q=document.getElementById('search').value.trim().toLowerCase();
        return state.markets.filter(m=>(!m.status || m.status==='open') && (activeCat==='All'||m.category===activeCat) && (!q||m.title.toLowerCase().includes(q)||m.category.toLowerCase().includes(q)));
      };
      render();
    `);
    delete window.__freemarketCloudState;
  }catch(e){
    console.error('Runtime market refresh failed',e);
  }
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
    merged.push({
      ...local,
      id,
      title:cloud.title||local.title||id,
      category:cloud.category||local.category||'Other',
      ends:cloud.closeAt?.toDate?cloud.closeAt.toDate().toLocaleString():local.ends||'',
      prior:Number(cloud.prior)||Number(local.prior)||50,
      yesStake:Number(cloud.yesStake)||0,
      noStake:Number(cloud.noStake)||0,
      status:cloud.status||'open',
      result:cloud.result||null,
      closeAtMs:cloudTimeMs(cloud.closeAt)||Number(cloud.closeAtMs)||Number(local.closeAtMs)||0,
      resolutionRule:cloud.resolutionRule||local.resolutionRule||'',
      source:cloud.source||local.source||''
    });
  }

  // Keep any local seed market that has not reached Firestore yet.
  for(const local of game.markets){
    if(!map.has(local.id))merged.push(local);
  }

  game.markets=merged;
  writeLocal(game);
  pushRuntime(game);
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
