const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

initializeApp({credential:applicationDefault()});
const db=getFirestore();
const APPLY=process.argv.includes('--apply');

function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

(async()=>{
  const [marketSnap,userSnap]=await Promise.all([
    db.collection('markets').get(),
    db.collection('users').get()
  ]);

  const legacyClosed=new Map();
  for(const d of marketSnap.docs){
    const m=d.data();
    if((m.status==='closed') && m.closedReason==='legacy-missing-close-time'){
      legacyClosed.set(d.id,{ref:d.ref,data:m,refundYes:0,refundNo:0});
    }
  }

  const userPlans=[];
  let refundPositions=0,totalRefund=0;

  for(const userDoc of userSnap.docs){
    const data=userDoc.data();
    const positions=Array.isArray(data.positions)?data.positions.map(p=>p&&typeof p==='object'?{...p}:p):[];
    let refund=0,changed=false;

    for(let i=0;i<positions.length;i++){
      const p=positions[i];
      if(!p||typeof p!=='object')continue;
      const target=legacyClosed.get(String(p.marketId||''));
      if(!target)continue;
      if(p.settled===true||p.cashedOut===true||p.voided===true)continue;

      const amount=Math.max(0,num(p.amount));
      if(amount<=0)continue;

      refund+=amount;
      totalRefund+=amount;
      refundPositions++;
      changed=true;

      if(p.side==='YES')target.refundYes+=amount;
      else if(p.side==='NO')target.refundNo+=amount;

      p.settled=true;
      p.voided=true;
      p.exitType='void-refund';
      p.result='VOID';
      p.won=null;
      p.payout=amount;
      p.refundAmount=amount;
      p.refundReason='legacy-market-closed-without-valid-close-time';
      p.refundTime=Date.now();
    }

    if(changed){
      userPlans.push({
        ref:userDoc.ref,
        uid:userDoc.id,
        oldBalance:num(data.balance),
        newBalance:num(data.balance)+refund,
        refund,
        positions
      });
    }
  }

  console.log('PROBORA LEGACY REFUND');
  console.log(`Closed legacy markets eligible: ${legacyClosed.size}`);
  console.log(`Users receiving refund: ${userPlans.length}`);
  console.log(`Open positions to refund: ${refundPositions}`);
  console.log(`Total refund: ◈ ${totalRefund.toLocaleString('en-US',{maximumFractionDigits:2})}`);

  for(const p of userPlans){
    console.log(`- user ${p.uid}: ◈ ${p.refund.toLocaleString('en-US',{maximumFractionDigits:2})} | balance ${p.oldBalance} -> ${p.newBalance}`);
  }
  for(const [id,m] of legacyClosed){
    if(m.refundYes||m.refundNo)console.log(`- market ${id}: remove YES ◈ ${m.refundYes}, NO ◈ ${m.refundNo}`);
  }

  if(!APPLY){
    console.log('\nDRY RUN ONLY. No Firestore data changed.');
    console.log('Apply exactly these refunds with: node functions/refund-closed-legacy.js --apply');
    return;
  }

  if(!refundPositions){
    console.log('Nothing to refund.');
    return;
  }

  let batch=db.batch(),writes=0;
  const commitIfNeeded=async force=>{
    if(!writes)return;
    if(force||writes>=350){await batch.commit();batch=db.batch();writes=0;}
  };

  for(const p of userPlans){
    batch.update(p.ref,{balance:p.newBalance,positions:p.positions,updatedAt:FieldValue.serverTimestamp()});
    writes++;await commitIfNeeded(false);
  }

  for(const [id,m] of legacyClosed){
    if(!m.refundYes&&!m.refundNo)continue;
    const currentYes=Math.max(0,num(m.data.yesStake));
    const currentNo=Math.max(0,num(m.data.noStake));
    const nextYes=Math.max(0,currentYes-m.refundYes);
    const nextNo=Math.max(0,currentNo-m.refundNo);
    batch.update(m.ref,{yesStake:nextYes,noStake:nextNo,refundCompletedAt:FieldValue.serverTimestamp(),refundReason:'legacy-market-closed-without-valid-close-time',updatedAt:FieldValue.serverTimestamp()});
    writes++;await commitIfNeeded(false);
  }

  await commitIfNeeded(true);
  console.log(`Refunded ${refundPositions} positions for a total of ◈ ${totalRefund.toLocaleString('en-US',{maximumFractionDigits:2})}.`);
  console.log('Already settled/resolved/cashed-out positions were not changed.');
})().catch(err=>{console.error(err);process.exitCode=1;});
