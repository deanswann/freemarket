const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

function timeMs(value){
  if(!value)return 0;
  if(typeof value.toMillis==='function')return value.toMillis();
  if(value.seconds)return Number(value.seconds)*1000;
  const n=Number(value);
  return Number.isFinite(n)?n:0;
}
function closeAtMs(m){return timeMs(m?.closeAt)||timeMs(m?.closeAtMs);}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

(async()=>{
  const now=Date.now();
  const marketSnap=await db.collection('markets').get();
  const userSnap=await db.collection('users').get();
  const markets=marketSnap.docs.map(d=>({id:d.id,...d.data()}));
  const byId=new Map(markets.map(m=>[m.id,m]));

  const missingClose=[];
  const expiredOpen=[];
  const missingRule=[];
  const missingSource=[];
  const badStatus=[];
  const badPrior=[];
  const duplicateTitles=[];
  const titleMap=new Map();

  for(const m of markets){
    const status=String(m.status||'open');
    const close=closeAtMs(m);
    if(status==='open'&&!close)missingClose.push(m);
    if(status==='open'&&close&&close<=now)expiredOpen.push(m);
    if(!String(m.resolutionRule||'').trim())missingRule.push(m);
    if(!String(m.source||'').trim())missingSource.push(m);
    if(!['open','closed','resolving','resolved'].includes(status))badStatus.push(m);
    const prior=Number(m.prior);
    if(!Number.isFinite(prior)||prior<1||prior>99)badPrior.push(m);
    const tk=String(m.title||'').trim().toLowerCase();
    if(tk){
      if(titleMap.has(tk))duplicateTitles.push([titleMap.get(tk),m.id,String(m.title||'')]);
      else titleMap.set(tk,m.id);
    }
  }

  const openPositionStake=new Map();
  const positionProblems=[];
  let users=0,positions=0,openPositions=0;
  for(const userDoc of userSnap.docs){
    users++;
    const data=userDoc.data();
    const list=Array.isArray(data.positions)?data.positions:[];
    positions+=list.length;
    list.forEach((p,index)=>{
      if(!p||typeof p!=='object')return;
      const marketId=String(p.marketId||'');
      if(!marketId||!byId.has(marketId))positionProblems.push({uid:userDoc.id,index,marketId,problem:'market missing'});
      if(p.settled===true||p.cashedOut===true)return;
      openPositions++;
      if(p.side!=='YES'&&p.side!=='NO')positionProblems.push({uid:userDoc.id,index,marketId,problem:'invalid side'});
      if(num(p.amount)<=0||num(p.shares)<=0)positionProblems.push({uid:userDoc.id,index,marketId,problem:'invalid amount/shares'});
      const key=marketId+'|'+p.side;
      openPositionStake.set(key,(openPositionStake.get(key)||0)+Math.max(0,num(p.amount)));
    });
  }

  const stakeProblems=[];
  for(const m of markets){
    if(String(m.status||'open')!=='open')continue;
    const expectedYes=openPositionStake.get(m.id+'|YES')||0;
    const expectedNo=openPositionStake.get(m.id+'|NO')||0;
    const actualYes=Math.max(0,num(m.yesStake));
    const actualNo=Math.max(0,num(m.noStake));
    if(Math.abs(expectedYes-actualYes)>0.01||Math.abs(expectedNo-actualNo)>0.01){
      stakeProblems.push({id:m.id,expectedYes,actualYes,expectedNo,actualNo});
    }
  }

  function printMarkets(label,list){
    console.log(`\n${label}: ${list.length}`);
    for(const m of list)console.log(`- ${m.id} | ${m.status||'open'} | ${m.title||'(no title)'} | close=${closeAtMs(m)?new Date(closeAtMs(m)).toISOString():'NONE'}`);
  }

  console.log('PROBORA READ-ONLY PRODUCTION AUDIT');
  console.log('Generated:',new Date(now).toISOString());
  console.log(`Markets: ${markets.length} | Users: ${users} | Positions: ${positions} | Open positions: ${openPositions}`);
  printMarkets('OPEN MARKETS WITHOUT CLOSE TIME',missingClose);
  printMarkets('EXPIRED BUT STILL OPEN',expiredOpen);
  printMarkets('MARKETS WITHOUT RESOLUTION RULE',missingRule);
  printMarkets('MARKETS WITHOUT SOURCE',missingSource);
  printMarkets('MARKETS WITH INVALID STATUS',badStatus);
  printMarkets('MARKETS WITH INVALID PRIOR',badPrior);

  console.log(`\nDUPLICATE TITLES: ${duplicateTitles.length}`);
  duplicateTitles.forEach(x=>console.log('-',x));
  console.log(`\nPOSITION PROBLEMS: ${positionProblems.length}`);
  positionProblems.slice(0,100).forEach(x=>console.log('-',x));
  if(positionProblems.length>100)console.log(`... ${positionProblems.length-100} more`);
  console.log(`\nOPEN STAKE / POSITION MISMATCHES: ${stakeProblems.length}`);
  stakeProblems.slice(0,100).forEach(x=>console.log('-',x));
  if(stakeProblems.length>100)console.log(`... ${stakeProblems.length-100} more`);

  const critical=expiredOpen.length+badStatus.length+positionProblems.length+stakeProblems.length;
  const cleanup=missingClose.length+missingRule.length+missingSource.length+badPrior.length+duplicateTitles.length;
  console.log('\nSUMMARY');
  console.log(JSON.stringify({critical,cleanup,missingClose:missingClose.length,expiredOpen:expiredOpen.length,missingRule:missingRule.length,missingSource:missingSource.length,badStatus:badStatus.length,badPrior:badPrior.length,duplicateTitles:duplicateTitles.length,positionProblems:positionProblems.length,stakeProblems:stakeProblems.length},null,2));
  console.log('\nREAD ONLY: no Firestore data was changed.');
})().catch(err=>{console.error(err);process.exitCode=1;});
