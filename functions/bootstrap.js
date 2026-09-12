'use strict';

const base=require('./index');
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {onSchedule}=require('firebase-functions/v2/scheduler');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {settleMarket}=require('./settlement');
const {determineAutomaticResult}=require('./auto-resolver');

const db=getFirestore();
const out={...base};

function requireAdmin(request){
  if(!request.auth)throw new HttpsError('unauthenticated','Log in first.');
  if(request.auth.token.admin!==true)throw new HttpsError('permission-denied','Admin access required.');
}
function cleanMarketId(value){
  const id=String(value||'').trim();
  if(!id||id.length>120)throw new HttpsError('invalid-argument','Invalid market id.');
  return id;
}
function cleanResult(value){
  if(value!=='YES'&&value!=='NO')throw new HttpsError('invalid-argument','Invalid result.');
  return value;
}

out.resolveMarket=onCall(async request=>{
  requireAdmin(request);
  const marketId=cleanMarketId(request.data?.marketId);
  const result=cleanResult(request.data?.result);
  try{
    return await settleMarket({db,FieldValue,marketId,result,mode:'admin'});
  }catch(err){
    console.error('resolveMarket failed',marketId,err);
    const message=String(err?.message||'Resolution failed.');
    if(message==='Market not found.')throw new HttpsError('not-found',message);
    if(message.includes('different result'))throw new HttpsError('failed-precondition',message);
    throw new HttpsError('internal','Resolution failed safely; no duplicate payout was made.');
  }
});

async function autoResolveSweep(){
  const [closedSnap,resolvingSnap]=await Promise.all([
    db.collection('markets').where('status','==','closed').get(),
    db.collection('markets').where('status','==','resolving').get()
  ]);
  const docs=[...closedSnap.docs,...resolvingSnap.docs];
  const seen=new Set();
  const summary={checked:0,resolved:0,pending:0,unsupported:0,blocked:0,errors:0};

  for(const doc of docs){
    if(seen.has(doc.id))continue;
    seen.add(doc.id);
    summary.checked++;
    const market=doc.data();
    try{
      const decision=await determineAutomaticResult(doc.id,market,Date.now());
      if(decision.state==='resolved'){
        const settled=await settleMarket({db,FieldValue,marketId:doc.id,result:decision.result,mode:'automatic',evidence:decision.evidence});
        summary.resolved++;
        console.log('AUTO_RESOLVED',doc.id,decision.result,settled);
      }else if(decision.state==='pending'){
        summary.pending++;
      }else if(decision.state==='blocked'){
        summary.blocked++;
        console.warn('AUTO_RESOLVE_BLOCKED',doc.id,decision.reason);
      }else if(decision.state==='unsupported'){
        summary.unsupported++;
      }
    }catch(err){
      summary.errors++;
      console.error('AUTO_RESOLVE_ERROR',doc.id,String(err?.stack||err));
    }
  }
  console.log('autoResolveSweep',summary);
  return summary;
}

out.autoResolveMarkets=onSchedule({
  schedule:'every 15 minutes',
  timeZone:'UTC',
  retryCount:0,
  maxInstances:1
},autoResolveSweep);

out.runAutoResolveSweep=onCall(async request=>{
  requireAdmin(request);
  return {ok:true,...await autoResolveSweep()};
});

module.exports=out;
