const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

initializeApp({credential:applicationDefault()});
const db=getFirestore();
const APPLY=process.argv.includes('--apply');
const BATCH_ID='curated-safe-2026-08-30-v2';
const RESEARCHED_AT_MS=Date.parse('2026-08-30T12:00:00Z');

function loadCandidates(){
  const text=fs.readFileSync(path.join(__dirname,'seed-current-markets.js'),'utf8');
  const start=text.indexOf('const markets = [');
  const end=text.indexOf('\n];\n\nfunction validate',start);
  if(start<0||end<0)throw new Error('Curated candidate list not found.');
  return vm.runInNewContext(text.slice(start+'const markets = '.length,end+2),Object.create(null),{timeout:1000});
}

const closeCorrections={
  'fed-sep-hike25':'2026-09-16T17:45:00Z','fed-sep-nochange':'2026-09-16T17:45:00Z','fed-sep-cut25':'2026-09-16T17:45:00Z',
  'fed-cut-by-oct':'2026-10-28T17:45:00Z','fed-cut-by-dec':'2026-12-09T17:45:00Z','fed-end-4':'2026-12-09T17:45:00Z','fed-end-375':'2026-12-09T17:45:00Z',
  'ecb-sep-hike25':'2026-09-10T11:00:00Z','ecb-sep-nochange':'2026-09-10T11:00:00Z','ecb-oct-nochange':'2026-10-29T12:00:00Z','ecb-oct-hike25':'2026-10-29T12:00:00Z',
  'sb61-halftime-dua-lipa':'2027-02-14T22:00:00Z','sb61-halftime-justin-bieber':'2027-02-14T22:00:00Z','sb61-halftime-olivia-rodrigo':'2027-02-14T22:00:00Z','sb61-halftime-drake':'2027-02-14T22:00:00Z','sb61-halftime-taylor-swift':'2027-02-14T22:00:00Z','sb61-halftime-harry-styles':'2027-02-14T22:00:00Z','sb61-halftime-kanye-west':'2027-02-14T22:00:00Z'
};
for(const id of ['oscars27-bestpic-odyssey','oscars27-bestpic-dune3','oscars27-bestpic-la-bola-negra','oscars27-bestpic-wild-horse-nine','oscars27-bestpic-fjord','oscars27-bestpic-digger','oscars27-bestpic-project-hail-mary','oscars27-bestpic-avengers-doomsday','oscars27-bestpic-disclosure-day','oscars27-bestpic-josephine'])closeCorrections[id]='2027-03-14T22:45:00Z';
for(const id of ['ucl27-barcelona','ucl27-arsenal','ucl27-psg','ucl27-bayern-munich','ucl27-real-madrid','ucl27-man-city','ucl27-liverpool','ucl27-inter-milan','ucl27-man-utd','ucl27-atletico-madrid','ucl27-aston-villa','ucl27-dortmund'])closeCorrections[id]='2027-06-05T18:00:00Z';

function safety(m){
  const id=m.id,t=m.title.toLowerCase();
  if(['fed-sep-hike25','fed-sep-nochange','fed-sep-cut25','fed-end-4','fed-end-375'].includes(id))return ['scheduled-release',false,'Fixed FOMC result time; closes 15 minutes before the statement.'];
  if(['fed-cut-by-oct','fed-cut-by-dec'].includes(id))return ['early-trigger',true,'A prior FOMC meeting can make this outcome known before closeAt.'];
  if(id.startsWith('ecb-'))return ['scheduled-release',false,'Fixed ECB result time; closes before publication.'];
  if(id.startsWith('ai-best-')||id.startsWith('agent-best-'))return ['fixed-snapshot',false,'Defined by a benchmark snapshot at a fixed cutoff.'];
  if(id.startsWith('sb61-halftime-'))return ['scheduled-event',false,'Defined by actual live performance; closes before Super Bowl LXI begins.'];
  if(id.startsWith('oscars27-'))return ['award',true,'Nomination announcements can make a title impossible before ceremony night.'];
  if(t.includes('trade at or above')||t.includes(' by ')||t.includes(' before ')||t.includes('during september'))return ['early-trigger',true,'Can become objectively decided before closeAt.'];
  if(t.includes('championship')||t.includes('champions league')||t.includes('presidential nomination')||t.includes('presidential nominee'))return ['elimination-or-clinch',true,'Can be eliminated/clinched before the scheduled final date.'];
  if(id.startsWith('us-cpi-')||id.startsWith('us-unemployment-')||id.startsWith('us-q3-')||id.startsWith('euro-inflation-'))return ['scheduled-data-release',true,'Official release timestamp has not yet been individually verified.'];
  if(id.startsWith('largest-company-')||id.startsWith('third-company-'))return ['market-close-snapshot',true,'Exact final trading session and close time need individual verification.'];
  if(id.includes('recession'))return ['multi-trigger',true,'NBER/BEA can trigger resolution before the nominal deadline.'];
  return ['manual-review',true,'Not proven safe for unattended trading.'];
}

function validate(m){
  if(!m||typeof m.id!=='string'||!/^[a-z0-9-]+$/.test(m.id))throw new Error(`Bad id: ${m?.id}`);
  if(!['Sports','Politics','Economy','Markets','Technology','Space','Culture'].includes(m.category))throw new Error(`Bad category: ${m.id}`);
  if(!Number.isInteger(m.prior)||m.prior<1||m.prior>99)throw new Error(`Bad prior: ${m.id}`);
  if(typeof m.title!=='string'||m.title.length<10||m.title.length>220)throw new Error(`Bad title: ${m.id}`);
  if(typeof m.resolutionRule!=='string'||m.resolutionRule.length<20||m.resolutionRule.length>700)throw new Error(`Bad rule: ${m.id}`);
  if(!Number.isFinite(Date.parse(m.closeAt)))throw new Error(`Bad closeAt: ${m.id}`);
  const u=new URL(m.source);if(!['https:','http:'].includes(u.protocol))throw new Error(`Bad source: ${m.id}`);
}

(async()=>{
  const candidates=loadCandidates().map(raw=>{
    const m={...raw};if(closeCorrections[m.id])m.closeAt=closeCorrections[m.id];
    const [marketType,requiresMonitoring,safetyReason]=safety(m);
    return {...m,marketType,requiresMonitoring,safetyReason};
  });
  const ids=new Set(),titles=new Set();
  for(const m of candidates){validate(m);if(ids.has(m.id))throw new Error(`Duplicate id ${m.id}`);const k=m.title.trim().toLowerCase();if(titles.has(k))throw new Error(`Duplicate title ${m.title}`);ids.add(m.id);titles.add(k);}

  const safe=candidates.filter(m=>!m.requiresMonitoring);
  const blocked=candidates.filter(m=>m.requiresMonitoring);
  const refs=safe.map(m=>db.collection('markets').doc(m.id));
  const snaps=refs.length?await db.getAll(...refs):[];
  const existing=new Set(snaps.filter(s=>s.exists).map(s=>s.id));
  const now=Date.now();
  const selected=safe.filter(m=>!existing.has(m.id)&&Date.parse(m.closeAt)>now+60_000);
  const categoryCounts=selected.reduce((o,m)=>(o[m.category]=(o[m.category]||0)+1,o),{});

  console.log(`Batch ${BATCH_ID}`);
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Safety-approved: ${safe.length}`);
  console.log(`Blocked pending monitoring/manual verification: ${blocked.length}`);
  console.log(`Existing safety-approved markets skipped: ${existing.size}`);
  console.log(`New markets selected: ${selected.length}`);
  console.log('Selected categories:',categoryCounts);
  for(const m of selected)console.log(`[SAFE] ${m.category.padEnd(10)} ${String(m.prior).padStart(2)}% ${m.id} — ${m.title}`);

  console.log('\nBlocked examples:');
  for(const m of blocked.slice(0,15))console.log(`[BLOCKED] ${m.id} — ${m.safetyReason}`);
  if(blocked.length>15)console.log(`...and ${blocked.length-15} more.`);

  if(!APPLY){console.log('\nDRY RUN ONLY. Nothing was written.');console.log('If this output looks correct, run: node functions/seed-safe-markets.js --apply');process.exit(0);}
  if(!selected.length){console.log('Nothing new to create.');process.exit(0);}

  for(let i=0;i<selected.length;i+=200){
    const batch=db.batch();
    for(const m of selected.slice(i,i+200)){
      const ref=db.collection('markets').doc(m.id);
      batch.set(ref,{title:m.title,category:m.category,prior:m.prior,priorLiquidity:2000,yesStake:0,noStake:0,status:'open',result:null,closeAt:new Date(Date.parse(m.closeAt)),resolutionRule:m.resolutionRule,source:m.source,oddsBasis:m.oddsBasis,marketType:m.marketType,requiresMonitoring:false,safetyReason:m.safetyReason,curatedBatch:BATCH_ID,researchedAtMs:RESEARCHED_AT_MS,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
      batch.set(ref.collection('history').doc('open'),{timeMs:now,yesChance:m.prior,volume:0,previousYesChance:m.prior,previousVolume:0,kind:'open'});
    }
    await batch.commit();
  }
  console.log(`Created ${selected.length} safety-approved markets with opening history.`);
  process.exit(0);
})().catch(err=>{console.error(err);process.exit(1);});
