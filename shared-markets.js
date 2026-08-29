import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDXr4ryOOT-OHX1np8KIPER6_Nk60okylw',
  authDomain: 'freemarket-68274.firebaseapp.com',
  projectId: 'freemarket-68274',
  storageBucket: 'freemarket-68274.firebasestorage.app',
  messagingSenderId: '130108525153',
  appId: '1:130108525153:web:69fcce32c2f6eefbb93820',
  measurementId: 'G-F6N8GLFK45'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function readLocal(){try{return JSON.parse(localStorage.getItem('freemarket-v4'))||null}catch(e){return null}}
function writeLocal(game){localStorage.setItem('freemarket-v4',JSON.stringify(game))}

async function seedMarketsFromLocal(){
  const game=readLocal();
  if(!game?.markets?.length)return;
  for(const m of game.markets){
    const ref=doc(db,'markets',m.id);
    const snap=await getDoc(ref);
    if(!snap.exists()){
      await setDoc(ref,{title:m.title||'',category:m.category||'',ends:m.ends||'',prior:Number(m.prior)||50,yesStake:0,noStake:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    }
  }
}

function applyMarketSnapshot(snapshot){
  const game=readLocal();
  if(!game?.markets)return;
  const map=new Map(snapshot.docs.map(d=>[d.id,d.data()]));
  let changed=false;
  game.markets=game.markets.map(m=>{
    const cloud=map.get(m.id);
    if(!cloud)return m;
    const yesStake=Number(cloud.yesStake)||0,noStake=Number(cloud.noStake)||0;
    if((m.yesStake||0)!==yesStake||(m.noStake||0)!==noStake)changed=true;
    return {...m,yesStake,noStake};
  });
  if(changed){writeLocal(game);location.reload()}
}

async function placeSharedTradeFromUi(){
  const user=auth.currentUser;
  if(!user)throw new Error('Please log in before placing a prediction.');
  const selected=window.eval('selected');
  const side=window.eval('side');
  const amountInput=document.getElementById('amount');
  const amt=Math.floor(Number(amountInput?.value)||0);
  if(!selected||amt<=0)throw new Error('Invalid prediction.');
  const price=Number(String(document.getElementById('quoteChance')?.textContent||'0').replace('%',''))||0;
  const shares=price>0?amt/(price/100):0;
  const marketRef=doc(db,'markets',selected.id);
  const userRef=doc(db,'users',user.uid);

  await runTransaction(db,async tx=>{
    const [marketSnap,userSnap]=await Promise.all([tx.get(marketRef),tx.get(userRef)]);
    if(!marketSnap.exists())throw new Error('Market not found.');
    if(!userSnap.exists())throw new Error('Account not found.');
    const u=userSnap.data();
    const balance=Number(u.balance)||0;
    if(balance<amt)throw new Error('Not enough balance.');
    const m=marketSnap.data();
    const yesStake=Number(m.yesStake)||0,noStake=Number(m.noStake)||0;
    const positions=Array.isArray(u.positions)?u.positions.slice():[];
    positions.push({marketId:selected.id,side,amount:amt,price,shares,time:Date.now()});
    tx.update(userRef,{balance:balance-amt,positions,updatedAt:serverTimestamp()});
    tx.update(marketRef,side==='YES'?{yesStake:yesStake+amt,updatedAt:serverTimestamp()}:{noStake:noStake+amt,updatedAt:serverTimestamp()});
  });

  const game=readLocal();
  if(game){
    game.balance=Math.max(0,(Number(game.balance)||0)-amt);
    game.positions=Array.isArray(game.positions)?game.positions:[];
    game.positions.push({marketId:selected.id,side,amount:amt,price,shares,time:Date.now()});
    writeLocal(game);
  }
  window.eval('closeModal()');
  window.eval(`toast('Placed ${side} prediction for ◈ ${amt.toLocaleString('en-US')}')`);
}

let unsubscribe=null;
async function startSharedMarkets(){
  try{
    await seedMarketsFromLocal();
    if(unsubscribe)unsubscribe();
    unsubscribe=onSnapshot(collection(db,'markets'),applyMarketSnapshot,e=>console.error('Shared market listener failed',e));
    window.placeTrade=async()=>{
      const btn=document.getElementById('submitTrade');
      if(btn)btn.disabled=true;
      try{await placeSharedTradeFromUi()}catch(e){console.error(e);alert(e.message||'Prediction failed.')}finally{if(btn)btn.disabled=false}
    };
  }catch(e){console.error('Shared market setup failed',e)}
}

startSharedMarkets();
