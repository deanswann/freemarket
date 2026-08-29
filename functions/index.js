const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

function requireUser(request){
  if(!request.auth) throw new HttpsError('unauthenticated','Log in first.');
  return request.auth;
}

function requireAdmin(request){
  const auth=requireUser(request);
  if(auth.token.admin!==true) throw new HttpsError('permission-denied','Admin access required.');
  return auth;
}

function cleanText(value,max=180){
  const text=String(value||'').trim();
  if(!text||text.length>max) throw new HttpsError('invalid-argument','Invalid text field.');
  return text;
}

function cleanSide(value){
  if(value!=='YES'&&value!=='NO') throw new HttpsError('invalid-argument','Invalid side.');
  return value;
}

function marketChance(m){
  const priorLiquidity=Number(m.priorLiquidity)||2000;
  const prior=Math.max(1,Math.min(99,Number(m.prior)||50));
  const priorYes=priorLiquidity*(prior/100);
  const priorNo=priorLiquidity-priorYes;
  const yes=priorYes+(Number(m.yesStake)||0);
  const no=priorNo+(Number(m.noStake)||0);
  return Math.max(1,Math.min(99,Math.round((yes/(yes+no))*100)));
}

exports.placeBet = onCall(async request => {
  const auth=requireUser(request);
  const marketId=cleanText(request.data?.marketId,120);
  const side=cleanSide(request.data?.side);
  const amount=Math.floor(Number(request.data?.amount)||0);
  if(amount<1||amount>1000000) throw new HttpsError('invalid-argument','Invalid amount.');

  const marketRef=db.collection('markets').doc(marketId);
  const userRef=db.collection('users').doc(auth.uid);

  return db.runTransaction(async tx=>{
    const [marketSnap,userSnap]=await Promise.all([tx.get(marketRef),tx.get(userRef)]);
    if(!marketSnap.exists) throw new HttpsError('not-found','Market not found.');
    if(!userSnap.exists) throw new HttpsError('failed-precondition','Account not found.');

    const market=marketSnap.data();
    if(market.status!=='open') throw new HttpsError('failed-precondition','Market is closed.');
    const closeAt=market.closeAt?.toMillis?market.closeAt.toMillis():Number(market.closeAtMs)||0;
    if(closeAt&&Date.now()>=closeAt) throw new HttpsError('failed-precondition','Market has reached its closing time.');

    const user=userSnap.data();
    const balance=Number(user.balance)||0;
    if(balance<amount) throw new HttpsError('failed-precondition','Not enough balance.');

    const yesChance=marketChance(market);
    const price=side==='YES'?yesChance:100-yesChance;
    const shares=amount/(price/100);
    const positions=Array.isArray(user.positions)?user.positions.slice():[];
    positions.push({marketId,side,amount,price,shares,time:Date.now(),settled:false});

    tx.update(userRef,{balance:balance-amount,positions,updatedAt:FieldValue.serverTimestamp()});
    tx.update(marketRef,side==='YES'?{
      yesStake:(Number(market.yesStake)||0)+amount,
      updatedAt:FieldValue.serverTimestamp()
    }:{
      noStake:(Number(market.noStake)||0)+amount,
      updatedAt:FieldValue.serverTimestamp()
    });

    return {ok:true,price,shares,balance:balance-amount};
  });
});

exports.createMarket = onCall(async request => {
  const auth=requireAdmin(request);
  const id=cleanText(request.data?.id,100).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');
  const title=cleanText(request.data?.title,220);
  const category=cleanText(request.data?.category,60);
  const resolutionRule=cleanText(request.data?.resolutionRule,500);
  const source=cleanText(request.data?.source,300);
  const prior=Math.round(Number(request.data?.prior));
  const closeAtMs=Number(request.data?.closeAtMs);
  if(!id) throw new HttpsError('invalid-argument','Invalid market id.');
  if(!Number.isFinite(prior)||prior<1||prior>99) throw new HttpsError('invalid-argument','Opening probability must be 1-99.');
  if(!Number.isFinite(closeAtMs)||closeAtMs<=Date.now()) throw new HttpsError('invalid-argument','Closing time must be in the future.');

  const ref=db.collection('markets').doc(id);
  if((await ref.get()).exists) throw new HttpsError('already-exists','Market id already exists.');
  await ref.set({
    title,category,resolutionRule,source,prior,priorLiquidity:2000,
    yesStake:0,noStake:0,status:'open',result:null,
    closeAt: new Date(closeAtMs),
    createdBy:auth.uid,
    createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()
  });
  return {ok:true,id};
});

exports.resolveMarket = onCall(async request => {
  requireAdmin(request);
  const marketId=cleanText(request.data?.marketId,120);
  const result=cleanSide(request.data?.result);
  const marketRef=db.collection('markets').doc(marketId);
  const marketSnap=await marketRef.get();
  if(!marketSnap.exists) throw new HttpsError('not-found','Market not found.');
  const market=marketSnap.data();
  if(market.status==='resolved') throw new HttpsError('failed-precondition','Market already resolved.');

  await marketRef.update({status:'resolving',result,updatedAt:FieldValue.serverTimestamp()});

  const users=await db.collection('users').get();
  let batch=db.batch();
  let writes=0;
  let paidUsers=0;
  let totalPayout=0;

  for(const userDoc of users.docs){
    const data=userDoc.data();
    const positions=Array.isArray(data.positions)?data.positions.slice():[];
    let payout=0;
    let changed=false;
    for(const p of positions){
      if(p.marketId===marketId&&!p.settled){
        p.settled=true;
        p.result=result;
        p.won=p.side===result;
        p.payout=p.won?Number(p.shares)||0:0;
        if(p.won)payout+=p.payout;
        changed=true;
      }
    }
    if(!changed)continue;
    const newBalance=(Number(data.balance)||0)+payout;
    batch.update(userDoc.ref,{balance:newBalance,positions,updatedAt:FieldValue.serverTimestamp()});
    writes++;
    if(payout>0){paidUsers++;totalPayout+=payout;}
    if(writes>=400){await batch.commit();batch=db.batch();writes=0;}
  }
  if(writes>0)await batch.commit();

  await marketRef.update({status:'resolved',result,resolvedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  return {ok:true,marketId,result,paidUsers,totalPayout};
});

exports.closeMarket = onCall(async request => {
  requireAdmin(request);
  const marketId=cleanText(request.data?.marketId,120);
  const ref=db.collection('markets').doc(marketId);
  const snap=await ref.get();
  if(!snap.exists) throw new HttpsError('not-found','Market not found.');
  if(snap.data().status==='resolved') throw new HttpsError('failed-precondition','Market already resolved.');
  await ref.update({status:'closed',updatedAt:FieldValue.serverTimestamp()});
  return {ok:true};
});
