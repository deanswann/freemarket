'use strict';

function validResult(value){
  if(value!=='YES'&&value!=='NO') throw new Error('Invalid settlement result.');
  return value;
}

async function settleMarket({db,FieldValue,marketId,result,mode='admin',evidence=null}){
  result=validResult(result);
  const marketRef=db.collection('markets').doc(marketId);

  const claim=await db.runTransaction(async tx=>{
    const snap=await tx.get(marketRef);
    if(!snap.exists) throw new Error('Market not found.');
    const market=snap.data();
    if(market.status==='resolved'){
      if(market.result!==result) throw new Error('Market was already resolved with a different result.');
      return {alreadyResolved:true,market};
    }
    if(market.status==='resolving'&&market.result&&market.result!==result){
      throw new Error('Market is already resolving with a different result.');
    }
    tx.update(marketRef,{
      status:'resolving',
      result,
      resolutionMode:mode,
      resolutionEvidence:evidence||null,
      resolutionStartedAt:market.resolutionStartedAt||FieldValue.serverTimestamp(),
      updatedAt:FieldValue.serverTimestamp()
    });
    return {alreadyResolved:false,market};
  });

  if(claim.alreadyResolved){
    return {ok:true,marketId,result,alreadyResolved:true,paidUsers:0,settledPositions:0,totalPayout:0};
  }

  const users=await db.collection('users').get();
  let paidUsers=0,settledPositions=0,totalPayout=0;

  for(const userDoc of users.docs){
    const outcome=await db.runTransaction(async tx=>{
      const snap=await tx.get(userDoc.ref);
      if(!snap.exists)return {changed:false,payout:0,count:0};
      const data=snap.data();
      const positions=Array.isArray(data.positions)?data.positions.map(p=>p&&typeof p==='object'?{...p}:p):[];
      let payout=0,count=0,changed=false;
      for(const p of positions){
        if(!p||typeof p!=='object')continue;
        if(String(p.marketId||'')!==marketId)continue;
        if(p.settled===true||p.cashedOut===true||p.voided===true)continue;
        p.settled=true;
        p.result=result;
        p.won=p.side===result;
        p.payout=p.won?(Number(p.shares)||0):0;
        p.settledAtMs=Date.now();
        p.settlementMode=mode;
        if(p.won)payout+=p.payout;
        count++;
        changed=true;
      }
      if(!changed)return {changed:false,payout:0,count:0};
      tx.update(userDoc.ref,{
        balance:(Number(data.balance)||0)+payout,
        positions,
        updatedAt:FieldValue.serverTimestamp()
      });
      return {changed:true,payout,count};
    });
    if(outcome.changed){
      settledPositions+=outcome.count;
      totalPayout+=outcome.payout;
      if(outcome.payout>0)paidUsers++;
    }
  }

  const finalSnap=await marketRef.get();
  if(!finalSnap.exists)throw new Error('Market disappeared during settlement.');
  const finalMarket=finalSnap.data();
  if(finalMarket.result&&finalMarket.result!==result)throw new Error('Resolution result changed during settlement.');
  const resolvedTimeMs=finalMarket.resolvedAt?.toMillis?finalMarket.resolvedAt.toMillis():Date.now();
  const batch=db.batch();
  batch.update(marketRef,{
    status:'resolved',
    result,
    resolutionMode:mode,
    resolutionEvidence:evidence||finalMarket.resolutionEvidence||null,
    resolvedAt:finalMarket.resolvedAt||FieldValue.serverTimestamp(),
    updatedAt:FieldValue.serverTimestamp()
  });
  batch.set(marketRef.collection('history').doc('resolution'),{
    timeMs:resolvedTimeMs,
    yesChance:result==='YES'?100:0,
    volume:(Number(finalMarket.yesStake)||0)+(Number(finalMarket.noStake)||0),
    previousYesChance:null,
    previousVolume:(Number(finalMarket.yesStake)||0)+(Number(finalMarket.noStake)||0),
    kind:'resolution',
    result,
    mode
  },{merge:true});
  await batch.commit();

  return {ok:true,marketId,result,alreadyResolved:false,paidUsers,settledPositions,totalPayout};
}

module.exports={settleMarket};
