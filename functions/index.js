const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { randomBytes } = require('node:crypto');

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

function publicStats(data){
  const positions=Array.isArray(data?.positions)?data.positions:[];
  const settled=positions.filter(p=>p&&p.settled===true);
  let wins=0;
  let losses=0;
  let amountIn=0;
  let payout=0;
  for(const p of settled){
    const amount=Math.max(0,Number(p.amount)||0);
    const paid=Math.max(0,Number(p.payout)||0);
    amountIn+=amount;
    payout+=paid;
    if(p.won===true)wins++;
    else losses++;
  }
  const resolved=settled.length;
  return {
    resolved,
    wins,
    losses,
    winRate:resolved?Math.round((wins/resolved)*1000)/10:0,
    amountIn:Math.round(amountIn*100)/100,
    payout:Math.round(payout*100)/100,
    profit:Math.round((payout-amountIn)*100)/100
  };
}

function cleanDisplayName(value){
  const name=String(value||'').trim().replace(/\s+/g,' ');
  if(name.length<3||name.length>24) throw new HttpsError('invalid-argument','Display name must be 3-24 characters.');
  if(!/^[\p{L}\p{N} _.-]+$/u.test(name)) throw new HttpsError('invalid-argument','Display name contains unsupported characters.');
  return name;
}

function displayNameKey(name){
  return name.normalize('NFKC').toLocaleLowerCase('en-US');
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
    const marketStatus=market.status||'open';
    if(marketStatus!=='open') throw new HttpsError('failed-precondition','Market is closed.');
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
      status:marketStatus,
      updatedAt:FieldValue.serverTimestamp()
    }:{
      noStake:(Number(market.noStake)||0)+amount,
      status:marketStatus,
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
  if(market.status==='resolved'&&market.result&&market.result!==result){
    throw new HttpsError('failed-precondition','Market was already resolved with a different result.');
  }

  if(market.status!=='resolved'){
    await marketRef.update({status:'resolving',result,updatedAt:FieldValue.serverTimestamp()});
  }

  const users=await db.collection('users').get();
  let batch=db.batch();
  let writes=0;
  let paidUsers=0;
  let settledPositions=0;
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
        settledPositions++;
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

  await marketRef.update({status:'resolved',result,resolvedAt:market.resolvedAt||FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  return {ok:true,marketId,result,paidUsers,settledPositions,totalPayout};
});

exports.updatePublicProfile = onCall(async request => {
  const auth=requireUser(request);
  const displayName=cleanDisplayName(request.data?.displayName);
  const leaderboardOptIn=request.data?.leaderboardOptIn===true;
  const key=displayNameKey(displayName);
  const generatedPublicId=randomBytes(12).toString('hex');
  const userRef=db.collection('users').doc(auth.uid);
  const nameRef=db.collection('profileNames').doc(key);

  await db.runTransaction(async tx=>{
    const [userSnap,nameSnap]=await Promise.all([tx.get(userRef),tx.get(nameRef)]);
    if(!userSnap.exists) throw new HttpsError('failed-precondition','Account not found.');
    if(nameSnap.exists&&nameSnap.data()?.uid!==auth.uid) throw new HttpsError('already-exists','That display name is already taken.');

    const userData=userSnap.data();
    const oldKey=String(userData.displayNameKey||'');
    if(oldKey&&oldKey!==key){
      const oldRef=db.collection('profileNames').doc(oldKey);
      const oldSnap=await tx.get(oldRef);
      if(oldSnap.exists&&oldSnap.data()?.uid===auth.uid)tx.delete(oldRef);
    }

    const publicId=String(userData.publicId||generatedPublicId);
    tx.set(nameRef,{uid:auth.uid,displayName,updatedAt:FieldValue.serverTimestamp()});
    tx.update(userRef,{displayName,displayNameKey:key,publicId,leaderboardOptIn,updatedAt:FieldValue.serverTimestamp()});
  });

  return {ok:true,displayName,leaderboardOptIn};
});

exports.getMyProfile = onCall(async request => {
  const auth=requireUser(request);
  const snap=await db.collection('users').doc(auth.uid).get();
  if(!snap.exists) throw new HttpsError('failed-precondition','Account not found.');
  const data=snap.data();
  return {
    displayName:String(data.displayName||''),
    leaderboardOptIn:data.leaderboardOptIn===true,
    balance:Number(data.balance)||0,
    openPositions:(Array.isArray(data.positions)?data.positions:[]).filter(p=>!p?.settled).length,
    stats:publicStats(data)
  };
});

exports.getLeaderboard = onCall(async request => {
  const users=await db.collection('users').get();
  const rows=[];
  for(const userDoc of users.docs){
    const data=userDoc.data();
    if(data.leaderboardOptIn!==true)continue;
    const displayName=String(data.displayName||'').trim();
    const publicId=String(data.publicId||'').trim();
    if(!displayName||!publicId)continue;
    const stats=publicStats(data);
    rows.push({publicId,displayName,stats});
  }
  rows.sort((a,b)=>b.stats.profit-a.stats.profit||b.stats.winRate-a.stats.winRate||b.stats.resolved-a.stats.resolved||a.displayName.localeCompare(b.displayName));
  return {rows:rows.slice(0,100).map((r,i)=>({rank:i+1,...r}))};
});

exports.getPublicProfile = onCall(async request => {
  const publicId=cleanText(request.data?.publicId,80);
  const result=await db.collection('users').where('publicId','==',publicId).limit(1).get();
  if(result.empty) throw new HttpsError('not-found','Profile not found.');
  const data=result.docs[0].data();
  if(data.leaderboardOptIn!==true||!String(data.displayName||'').trim()) throw new HttpsError('not-found','Profile not public.');
  return {publicId,displayName:String(data.displayName).trim(),stats:publicStats(data)};
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
