const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const APPLY = process.argv.includes('--apply');
const BATCH_ID = 'safe-crypto-2026-08-30';
const RESEARCHED_AT_MS = Date.parse('2026-08-30T14:52:00Z');
const SNAPSHOT_AT = '2026-10-01T00:00:00Z';
const CLOSE_AT = '2026-09-30T23:55:00Z';

const markets = [
  ['btc-sep30-above-70000','Will Bitcoin be above $70,000 at 00:00 UTC on October 1, 2026?',68,'BTCUSDT',70000],
  ['btc-sep30-above-80000','Will Bitcoin be above $80,000 at 00:00 UTC on October 1, 2026?',43,'BTCUSDT',80000],
  ['btc-sep30-above-90000','Will Bitcoin be above $90,000 at 00:00 UTC on October 1, 2026?',23,'BTCUSDT',90000],
  ['btc-sep30-above-100000','Will Bitcoin be above $100,000 at 00:00 UTC on October 1, 2026?',10,'BTCUSDT',100000],
  ['eth-sep30-above-2200','Will Ethereum be above $2,200 at 00:00 UTC on October 1, 2026?',63,'ETHUSDT',2200],
  ['eth-sep30-above-2500','Will Ethereum be above $2,500 at 00:00 UTC on October 1, 2026?',43,'ETHUSDT',2500],
  ['eth-sep30-above-2800','Will Ethereum be above $2,800 at 00:00 UTC on October 1, 2026?',27,'ETHUSDT',2800],
  ['eth-sep30-above-3200','Will Ethereum be above $3,200 at 00:00 UTC on October 1, 2026?',13,'ETHUSDT',3200],
  ['sol-sep30-above-90','Will Solana be above $90 at 00:00 UTC on October 1, 2026?',67,'SOLUSDT',90],
  ['sol-sep30-above-110','Will Solana be above $110 at 00:00 UTC on October 1, 2026?',40,'SOLUSDT',110],
  ['sol-sep30-above-130','Will Solana be above $130 at 00:00 UTC on October 1, 2026?',21,'SOLUSDT',130],
  ['sol-sep30-above-150','Will Solana be above $150 at 00:00 UTC on October 1, 2026?',10,'SOLUSDT',150]
].map(([id,title,prior,pair,threshold])=>({
  id,title,prior,pair,threshold,
  category:'Markets',
  closeAt:CLOSE_AT,
  snapshotAt:SNAPSHOT_AT,
  source:`https://www.binance.com/en/trade/${pair.replace('USDT','')}_USDT`,
  resolutionRule:`Resolves YES if the Binance ${pair} 1-minute candle that opens at 2026-10-01 00:00:00 UTC has an open price strictly above $${threshold.toLocaleString('en-US')}; otherwise NO. Trading closes five minutes before the snapshot.`,
  oddsBasis:'Model prior from live Alpaca crypto prices on 2026-08-30 plus recent realized volatility. Approximate annualized volatility assumptions used for the one-month horizon: BTC 70%, ETH 90%, SOL 100%, zero directional drift.'
}));

function validate(m){
  if(!/^[a-z0-9-]+$/.test(m.id)) throw new Error(`Invalid id: ${m.id}`);
  if(!Number.isInteger(m.prior)||m.prior<1||m.prior>99) throw new Error(`Invalid prior: ${m.id}`);
  if(!Number.isFinite(Date.parse(m.closeAt))||!Number.isFinite(Date.parse(m.snapshotAt))) throw new Error(`Invalid time: ${m.id}`);
  if(Date.parse(m.closeAt)>=Date.parse(m.snapshotAt)) throw new Error(`closeAt must precede snapshotAt: ${m.id}`);
  if(typeof m.resolutionRule!=='string'||m.resolutionRule.length<30) throw new Error(`Invalid rule: ${m.id}`);
  const u=new URL(m.source); if(u.protocol!=='https:') throw new Error(`Invalid source: ${m.id}`);
}

(async()=>{
  const ids=new Set(),titles=new Set();
  for(const m of markets){
    validate(m);
    if(ids.has(m.id)) throw new Error(`Duplicate id: ${m.id}`);
    const tk=m.title.toLowerCase(); if(titles.has(tk)) throw new Error(`Duplicate title: ${m.title}`);
    ids.add(m.id); titles.add(tk);
  }
  const refs=markets.map(m=>db.collection('markets').doc(m.id));
  const snaps=await db.getAll(...refs);
  const existing=new Set(snaps.filter(s=>s.exists).map(s=>s.id));
  const now=Date.now();
  const selected=markets.filter(m=>!existing.has(m.id)&&Date.parse(m.closeAt)>now+60_000);
  console.log(`Batch ${BATCH_ID}: ${markets.length} candidates, ${existing.size} existing, ${selected.length} selected.`);
  for(const m of selected) console.log(`[SAFE CRYPTO] ${String(m.prior).padStart(2)}% ${m.id} — ${m.title} — closes ${m.closeAt}`);
  if(!APPLY){
    console.log('\nDRY RUN ONLY. Nothing written.');
    console.log('Apply with: node functions/seed-safe-crypto.js --apply');
    process.exit(0);
  }
  if(!selected.length){ console.log('Nothing new to create.'); process.exit(0); }
  const batch=db.batch();
  const nowMs=Date.now();
  for(const m of selected){
    const ref=db.collection('markets').doc(m.id);
    batch.set(ref,{
      title:m.title,category:m.category,prior:m.prior,priorLiquidity:2000,
      yesStake:0,noStake:0,status:'open',result:null,
      closeAt:new Date(Date.parse(m.closeAt)),snapshotAt:new Date(Date.parse(m.snapshotAt)),
      resolutionRule:m.resolutionRule,source:m.source,oddsBasis:m.oddsBasis,
      marketType:'fixed-snapshot',requiresMonitoring:false,
      safetyReason:'Outcome is only determined at one future timestamp; betting closes before that timestamp.',
      curatedBatch:BATCH_ID,researchedAtMs:RESEARCHED_AT_MS,
      createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()
    });
    batch.set(ref.collection('history').doc('open'),{
      timeMs:nowMs,yesChance:m.prior,volume:0,previousYesChance:m.prior,previousVolume:0,kind:'open'
    });
  }
  await batch.commit();
  console.log(`Created ${selected.length} fixed-snapshot crypto markets with opening history.`);
  process.exit(0);
})().catch(err=>{console.error(err);process.exit(1);});
