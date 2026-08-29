const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const marketId=String(process.argv[2]||'').trim();
if(!marketId){
  console.error('Usage: node functions/audit-market.js <market-id>');
  process.exit(1);
}

initializeApp({credential:applicationDefault()});
const db=getFirestore();

(async()=>{
  const marketSnap=await db.collection('markets').doc(marketId).get();
  console.log('MARKET');
  if(!marketSnap.exists){
    console.log(JSON.stringify({exists:false,marketId},null,2));
  }else{
    const m=marketSnap.data();
    console.log(JSON.stringify({exists:true,marketId,status:m.status||null,result:m.result||null,yesStake:Number(m.yesStake)||0,noStake:Number(m.noStake)||0},null,2));
  }

  const users=await db.collection('users').get();
  let matches=0;
  console.log('\nMATCHING POSITIONS');
  for(const userDoc of users.docs){
    const data=userDoc.data();
    const positions=Array.isArray(data.positions)?data.positions:[];
    positions.forEach((p,index)=>{
      if(String(p?.marketId||'')!==marketId)return;
      matches++;
      console.log(JSON.stringify({
        uid:userDoc.id,
        balance:Number(data.balance)||0,
        index,
        marketId:p.marketId,
        side:p.side,
        amount:Number(p.amount)||0,
        price:Number(p.price)||0,
        shares:Number(p.shares)||0,
        settled:p.settled===true,
        result:p.result||null,
        won:typeof p.won==='boolean'?p.won:null,
        payout:Number(p.payout)||0
      },null,2));
    });
  }
  console.log(`\nTOTAL MATCHES: ${matches}`);
  process.exit(0);
})().catch(err=>{
  console.error(err);
  process.exit(1);
});
