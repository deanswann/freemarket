'use strict';

const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {determineAutomaticResult}=require('./auto-resolver');

initializeApp({credential:applicationDefault()});
const db=getFirestore();

(async()=>{
  const [closedSnap,resolvingSnap]=await Promise.all([
    db.collection('markets').where('status','==','closed').get(),
    db.collection('markets').where('status','==','resolving').get()
  ]);
  const docs=[...closedSnap.docs,...resolvingSnap.docs];
  const seen=new Set();
  const rows=[];
  for(const doc of docs){
    if(seen.has(doc.id))continue;
    seen.add(doc.id);
    try{
      const decision=await determineAutomaticResult(doc.id,doc.data(),Date.now());
      if(decision.state!=='unsupported'&&decision.state!=='skip')rows.push({id:doc.id,...decision});
    }catch(err){
      rows.push({id:doc.id,state:'ERROR',reason:String(err?.message||err)});
    }
  }
  console.log('PROBORA AUTO-RESOLUTION READ-ONLY TEST');
  console.log(`Closed/resolving markets checked: ${seen.size}`);
  console.log(`Supported/pending/error rows: ${rows.length}`);
  for(const row of rows){
    console.log(`- ${row.id} | ${row.state}${row.result?` ${row.result}`:''}${row.reason?` | ${row.reason}`:''}`);
    if(row.evidence)console.log(`  evidence=${JSON.stringify(row.evidence)}`);
  }
  console.log('\nREAD ONLY: no market, position, or balance was changed.');
})().catch(err=>{console.error(err);process.exitCode=1;});
