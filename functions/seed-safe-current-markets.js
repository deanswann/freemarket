const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const APPLY = process.argv.includes('--apply');
const INCLUDE_MONITORED = process.argv.includes('--include-monitored');
const BATCH_ID = 'curated-safe-2026-08-30';
const RESEARCHED_AT_MS = Date.parse('2026-08-30T12:00:00Z');

function loadCandidates(){
  const file=path.join(__dirname,'seed-current-markets.js');
  const text=fs.readFileSync(file,'utf8');
  const start=text.indexOf('const markets = [');
  const end=text.indexOf('\n];\n\nfunction validate',start);
  if(start<0||end<0) throw new Error('Could not read curated candidate list.');
  const literal=text.slice(start+'const markets = '.length,end+2);
  return vm.runInNewContext(literal,Object.create(null),{timeout:1000});
}

const CORRECTIONS = {
  // Official Fed statement is released 2:00 p.m. ET. Close 15 minutes earlier.
  'fed-sep-hike25':'2026-09-16T17:45:00Z',
  'fed-sep-nochange':'2026-09-16T17:45:00Z',
  'fed-sep-cut25':'2026-09-16T17:45:00Z',
  'fed-cut-by-oct':'2026-10-28T17:45:00Z',
  'fed-cut-by-dec':'2026-12-09T17:45:00Z',
  'fed-end-4':'2026-12-09T17:45:00Z',
  'fed-end-375':'2026-12-09T17:45:00Z',

  // ECB monetary-policy decisions are published at 14:15 CET/CEST. Close 15 minutes earlier.
  'ecb-sep-hike25':'2026-09-10T11:00:00Z',
  'ecb-sep-nochange':'2026-09-10T11:00:00Z',
  'ecb-oct-nochange':'2026-10-29T12:00:00Z',
  'ecb-oct-hike25':'2026-10-29T12:00:00Z',

  // 99th Oscars begin 7 p.m. ET on March 14, 2027. Close 15 minutes before broadcast.
  'oscars27-bestpic-odyssey':'2027-03-14T22:45:00Z',
  'oscars27-bestpic-dune3':'2027-03-14T22:45:00Z',
  'oscars27-bestpic-la-bola-negra':'2027-03-14T22:45:00Z',
  'oscars27-bestpic-wild-horse-nine':'2027-03-14T22:45:00Z',
  'oscars27-bestpic-fjord':'2027-03-14T22:45:00Z',
  'oscars27-bestpic-digger':'2027-03-14T22:45:00Z',
  'oscars27-bestpic-project-hail-mary':'2027-03-14T22:45:00Z',
  'oscars27-bestpic-avengers-doomsday':'2027-03-14T22:45:00Z',
  'oscars27-bestpic-disclosure-day':'2027-03-14T22:45:00Z',
  'oscars27-bestpic-josephine':'2027-03-14T22:45:00Z',

  // UEFA confirms the final is June 5, 2027. These remain monitoring-gated because teams can be eliminated earlier.
  'ucl27-barcelona':'2027-06-05T18:00:00Z',
  'ucl27-arsenal':'2027-06-05T18:00:00Z',
  'ucl27-psg':'2027-06-05T18:00:00Z',
  'ucl27-bayern-munich':'2027-06-05T18:00:00Z',
  'ucl27-real-madrid':'2027-06-05T18:00:00Z',
  'ucl27-man-city':'2027-06-05T18:00:00Z',
  'ucl27-liverpool':'2027-06-05T18:00:00Z',
  'ucl27-inter-milan':'2027-06-05T18:00:00Z',
  'ucl27-man-utd':'2027-06-05T18:00:00Z',
  'ucl27-atletico-madrid':'2027-06-05T18:00:00Z',
  'ucl27-aston-villa':'2027-06-05T18:00:00Z',
  'ucl27-dortmund':'2027-06-05T18:00:00Z',

  // Super Bowl LXI is Feb. 14, 2027. Close well before game/halftime begins.
  'sb61-halftime-dua-lipa':'2027-02-14T22:00:00Z',
  'sb61-halftime-justin-bieber':'2027-02-14T22:00:00Z',
  'sb61-halftime-olivia-rodrigo':'2027-02-14T22:00:00Z',
  'sb61-halftime-drake':'2027-02-14T22:00:00Z',
  'sb61-halftime-taylor-swift':'2027-02-14T22:00:00Z',
  'sb61-halftime-harry-styles':'2027-02-14T22:00:00Z',
  'sb61-halftime-kanye-west':'2027-02-14T22:00:00Z'
};

function classify(m){
  const t=m.title.toLowerCase();
  const id=m.id;

  if(id.startsWith('fed-')) return {marketType:'scheduled-release',requiresMonitoring:false,reason:'Fixed FOMC decision time; trading closes before the statement.'};
  if(id.startsWith('ecb-')) return {marketType:'scheduled-release',requiresMonitoring:false,reason:'Fixed ECB decision time; trading closes before publication.'};
  if(id.startsWith('ai-best-')||id.startsWith('agent-best-')) return {marketType:'fixed-snapshot',requiresMonitoring:false,reason:'Outcome is defined by a benchmark snapshot at a fixed cutoff.'};
  if(id.startsWith('sb61-halftime-')) return {marketType:'scheduled-event',requiresMonitoring:false,reason:'Outcome is actual live performance; trading closes before the event.'};

  // Known-outcome risk: threshold can be hit early, launch/release can happen early, a team can be eliminated,
  // a championship can be clinched, a candidate can become mathematically/officially certain, or nominees can be excluded.
  if(t.includes('trade at or above')||t.includes(' by ')||t.includes(' before ')||t.includes('during september'))
    return {marketType:'early-trigger',requiresMonitoring:true,reason:'Can become objectively decided before closeAt.'};
  if(t.includes('championship')||t.includes('champions league')||t.includes('presidential nomination')||t.includes('presidential nominee'))
    return {marketType:'elimination-or-clinch',requiresMonitoring:true,reason:'Can become effectively/officially decided before the final scheduled date.'};
  if(id.startsWith('oscars27-'))
    return {marketType:'award',requiresMonitoring:true,reason:'A title can become impossible when nominations are announced before the ceremony.'};
  if(id.startsWith('us-cpi-')||id.startsWith('us-unemployment-')||id.startsWith('us-q3-')||id.startsWith('euro-inflation-'))
    return {marketType:'scheduled-data-release',requiresMonitoring:true,reason:'Release date/time must be verified against the official calendar before import.'};
  if(id.startsWith('largest-company-')||id.startsWith('third-company-'))
    return {marketType:'market-close-snapshot',requiresMonitoring:true,reason:'Exact final trading session and close time must be verified.'};
  if(id.includes('recession'))
    return {marketType:'multi-trigger',requiresMonitoring:true,reason:'NBER/BEA trigger can resolve before the nominal deadline.'};

  return {marketType:'manual-review',requiresMonitoring:true,reason:'Not proven safe for unattended trading.'};
}

function validate(m){
  if(!m||typeof m.id!=='string'||!/^[a-z0-9-]+$/.test(m.id)) throw new Error(`Invalid id: ${m?.id}`);
  if(!['Sports','Politics','Economy','Markets','Technology','Space','Culture'].includes(m.category)) throw new Error(`Invalid category: ${m.id}`);
  if(!Number.isInteger(m.prior)||m.prior<1||m.prior>99) throw new Error(`Invalid prior: ${m.id}`);
  if(typeof m.title!=='string'||m.title.length<10||m.title.length>220) throw new Error(`Invalid title: ${m.id}`);
  if(typeof m.resolutionRule!=='string'||m.resolutionRule.length<20||m.resolutionRule.length>700) throw new Error(`Invalid rule: ${m.id}`);
  const closeAtMs=Date.parse(m.closeAt);
  if(!Number.isFinite(closeAtMs)) throw new Error(`Invalid closeAt: ${m.id}`);
  const u=new URL(m.source);
  if(!['https:','http:'].includes(u.protocol)) throw new Error(`Invalid source: ${m.id}`);
}

(async()=>{
  const raw=loadCandidates();
  const candidates=raw.map(x=>{
    const m={...x};
    if(CORRECTIONS[m.id])m.closeAt=CORRECTIONS[m.id];
    return {...m,...classify(m)};
  });

  const ids=new Set(),titles=new Set();
  for(const m of candidates){
    validate(m);
    if(ids.has(m.id))throw new Error(`Duplicate id: ${m.id}`);
    const k=m.title.trim().toLowerCase();
    if(titles.has(k))throw new Error(`Duplicate title: ${m.title}`);
    ids.add(m.id);titles.add(k);
  }

  const now=Date.now();
  const refs=candidates.map(m=>db.collection('markets').doc(m.id));
  const snaps=await db.getAll(...refs);
  const existing=new Set(snaps.filter(s=>s.exists).map(s=>s.id));

  const safe=candidates.filter(m=>!m.requiresMonitoring);
  const monitored=candidates.filter(m=>m.requiresMonitoring);
  const selected=(INCLUDE_MONITORED?candidates:safe).filter(m=>!existing.has(m.id)&&Date.parse(m.closeAt)>now+60_000);
  const expired=candidates.filter(m=>Date.parse(m.closeAt)<=now+60_000);

  const countBy=(list,key)=>list.reduce((o,m)=>(o[m[key]]=(o[m[key]]||0)+1,o),{});
  console.log(`Safety batch: ${BATCH_ID}`);
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Safe without monitoring: ${safe.length}`);
  console.log(`Monitoring-gated: ${monitored.length}`);
  console.log(`Existing/skipped: ${existing.size}`);
  console.log(`Expired/skipped: ${expired.length}`);
  console.log(`Selected to create: ${selected.length}`);
  console.log('Selected categories:',countBy(selected,'category'));
  console.log('Selected types:',countBy(selected,'marketType'));

  console.log('\nSAFE SELECTION');
  for(const m of selected)console.log(`[SAFE] ${m.category.padEnd(10)} ${String(m.prior).padStart(2)}% ${m.id} — ${m.title}`);

  if(monitored.length){
    console.log(`\n${monitored.length} candidates are blocked by default because they need live monitoring.`);
    for(const m of monitored.slice(0,20))console.log(`[BLOCKED] ${m.id} — ${m.reason}`);
    if(monitored.length>20)console.log(`...and ${monitored.length-20} more.`);
  }

  if(!APPLY){
    console.log('\nDRY RUN ONLY — nothing was written.');
    console.log('To create only the safety-approved markets: node functions/seed-safe-current-markets.js --apply');
    console.log('Do NOT use --include-monitored unless live monitoring/auto-close exists.');
    process.exit(0);
  }

  if(INCLUDE_MONITORED)throw new Error('Refusing monitored import: auto-monitoring is not implemented yet. Remove --include-monitored.');
  if(!selected.length){console.log('Nothing new to create.');process.exit(0);}

  // Firestore limit is 500 writes per batch; each market uses 2 writes.
  const chunks=[];
  for(let i=0;i<selected.length;i+=200)chunks.push(selected.slice(i,i+200));
  let created=0;
  for(const chunk of chunks){
    const batch=db.batch();
    for(const m of chunk){
      const ref=db.collection('markets').doc(m.id);
      batch.set(ref,{
        title:m.title,category:m.category,prior:m.prior,priorLiquidity:2000,
        yesStake:0,noStake:0,status:'open',result:null,
        closeAt:new Date(Date.parse(m.closeAt)),
        resolutionRule:m.resolutionRule,source:m.source,oddsBasis:m.oddsBasis,
        marketType:m.marketType,requiresMonitoring:false,safetyReason:m.reason,
        curatedBatch:BATCH_ID,researchedAtMs:RESEARCHED_AT_MS,
        createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()
      });
      batch.set(ref.collection('history').doc('open'),{
        timeMs:now,yesChance:m.prior,volume:0,previousYesChance:m.prior,previousVolume:0,kind:'open'
      });
    }
    await batch.commit();
    created+=chunk.length;
  }
  console.log(`Created ${created} safety-approved markets with opening-history points.`);
  process.exit(0);
})().catch(err=>{console.error(err);process.exit(1);});
