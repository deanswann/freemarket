const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

initializeApp({credential:applicationDefault()});
const db=getFirestore();
const APPLY=process.argv.includes('--apply');

(async()=>{
  const snap=await db.collection('markets').where('status','==','open').get();
  const targets=snap.docs.filter(d=>{
    const m=d.data();
    const close=m?.closeAt?.toMillis?m.closeAt.toMillis():Number(m?.closeAtMs)||0;
    return !close && (m.legacySeed===true || (!String(m.resolutionRule||'').trim() && !String(m.source||'').trim()));
  });

  console.log(`Unsafe open legacy markets without closeAt: ${targets.length}`);
  for(const d of targets){
    const m=d.data();
    console.log(`- ${d.id} | ${m.title||'(no title)'}`);
  }

  if(!APPLY){
    console.log('\nDRY RUN ONLY. No Firestore data changed.');
    console.log('To close only these unsafe legacy markets: node functions/close-legacy-unsafe.js --apply');
    return;
  }

  for(let i=0;i<targets.length;i+=400){
    const batch=db.batch();
    for(const d of targets.slice(i,i+400)){
      batch.update(d.ref,{
        status:'closed',
        closedAt:FieldValue.serverTimestamp(),
        closedReason:'legacy-missing-close-time',
        requiresMonitoring:true,
        updatedAt:FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
  }
  console.log(`Closed ${targets.length} unsafe legacy markets. Positions and balances were not settled or changed.`);
})().catch(err=>{console.error(err);process.exitCode=1;});
