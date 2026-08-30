const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
initializeApp({credential:applicationDefault()});
const db=getFirestore();
const APPLY=process.argv.includes('--apply');
const BATCH_ID='safe-sports-2026-08-30';
const RESEARCHED_AT_MS=Date.parse('2026-08-30T14:30:00Z');

const markets=[
  // 2026 Italian Grand Prix. Official race start: Sep 6, 15:00 local (13:00 UTC). Close 15m before.
  ['f1-italy26-norris','Will Lando Norris win the 2026 Italian Grand Prix?','Sports',32,'2026-09-06T12:45:00Z','YES if Lando Norris is listed first in the official final classification for the 2026 Italian Grand Prix; otherwise NO.','https://www.formula1.com/en/results/2026/races','Polymarket Italian GP driver-winner snapshot on 2026-08-30: Norris 32%.'],
  ['f1-italy26-russell','Will George Russell win the 2026 Italian Grand Prix?','Sports',28,'2026-09-06T12:45:00Z','YES if George Russell is listed first in the official final classification for the 2026 Italian Grand Prix; otherwise NO.','https://www.formula1.com/en/results/2026/races','Polymarket Italian GP driver-winner snapshot on 2026-08-30: Russell 28%.'],
  ['f1-italy26-hamilton','Will Lewis Hamilton win the 2026 Italian Grand Prix?','Sports',12,'2026-09-06T12:45:00Z','YES if Lewis Hamilton is listed first in the official final classification for the 2026 Italian Grand Prix; otherwise NO.','https://www.formula1.com/en/results/2026/races','Polymarket Italian GP driver-winner snapshot on 2026-08-30: Hamilton 12%.'],
  ['f1-italy26-leclerc','Will Charles Leclerc win the 2026 Italian Grand Prix?','Sports',11,'2026-09-06T12:45:00Z','YES if Charles Leclerc is listed first in the official final classification for the 2026 Italian Grand Prix; otherwise NO.','https://www.formula1.com/en/results/2026/races','Polymarket Italian GP driver-winner snapshot on 2026-08-30: Leclerc 11%.'],
  ['f1-italy26-antonelli','Will Kimi Antonelli win the 2026 Italian Grand Prix?','Sports',9,'2026-09-06T12:45:00Z','YES if Kimi Antonelli is listed first in the official final classification for the 2026 Italian Grand Prix; otherwise NO.','https://www.formula1.com/en/results/2026/races','Polymarket Italian GP driver-winner snapshot on 2026-08-30: Antonelli about 9%.'],
  ['f1-italy26-verstappen','Will Max Verstappen win the 2026 Italian Grand Prix?','Sports',6,'2026-09-06T12:45:00Z','YES if Max Verstappen is listed first in the official final classification for the 2026 Italian Grand Prix; otherwise NO.','https://www.formula1.com/en/results/2026/races','Polymarket Italian GP driver-winner snapshot on 2026-08-30: Verstappen 6%.'],
  ['f1-italy26-piastri','Will Oscar Piastri win the 2026 Italian Grand Prix?','Sports',6,'2026-09-06T12:45:00Z','YES if Oscar Piastri is listed first in the official final classification for the 2026 Italian Grand Prix; otherwise NO.','https://www.formula1.com/en/results/2026/races','Polymarket Italian GP driver-winner snapshot on 2026-08-30: Piastri 6%.'],

  // NFL Week 1. Opening probabilities are no-vig probabilities calculated from the cited CBS moneylines on 2026-08-30.
  ['nfl26-w1-seahawks','Will the Seattle Seahawks beat the New England Patriots in NFL Week 1?','Sports',64,'2026-09-10T00:05:00Z','YES if Seattle is credited with the win in the official NFL final result for Patriots at Seahawks in Week 1 of the 2026 regular season; otherwise NO.','https://www.nfl.com/schedules/2026/by-week/week-1','CBS moneylines SEA -190 / NE +170; normalized no-vig Seattle probability ≈64%.'],
  ['nfl26-w1-rams','Will the Los Angeles Rams beat the San Francisco 49ers in NFL Week 1?','Sports',63,'2026-09-11T00:20:00Z','YES if the Los Angeles Rams are credited with the win in the official NFL final result for 49ers at Rams in Week 1 of the 2026 regular season; otherwise NO.','https://www.nfl.com/schedules/2026/by-week/week-1','CBS moneylines LAR -175 / SF +172; normalized no-vig Rams probability ≈63%.'],
  ['nfl26-w1-bengals','Will the Cincinnati Bengals beat the Tampa Bay Buccaneers in NFL Week 1?','Sports',65,'2026-09-13T16:45:00Z','YES if Cincinnati is credited with the win in the official NFL final result for Buccaneers at Bengals in Week 1 of the 2026 regular season; otherwise NO.','https://www.nfl.com/schedules/2026/by-week/week-1','CBS moneylines CIN -198 / TB +176; normalized no-vig Bengals probability ≈65%.'],
  ['nfl26-w1-bills','Will the Buffalo Bills beat the Houston Texans in NFL Week 1?','Sports',51,'2026-09-13T16:45:00Z','YES if Buffalo is credited with the win in the official NFL final result for Bills at Texans in Week 1 of the 2026 regular season; otherwise NO.','https://www.nfl.com/schedules/2026/by-week/week-1','CBS moneylines BUF -112 / HOU -104; normalized no-vig Bills probability ≈51%.'],
  ['nfl26-w1-ravens','Will the Baltimore Ravens beat the Indianapolis Colts in NFL Week 1?','Sports',63,'2026-09-13T16:45:00Z','YES if Baltimore is credited with the win in the official NFL final result for Ravens at Colts in Week 1 of the 2026 regular season; otherwise NO.','https://www.nfl.com/schedules/2026/by-week/week-1','CBS moneylines BAL -186 / IND +165; normalized no-vig Ravens probability ≈63%.'],
  ['nfl26-w1-bears','Will the Chicago Bears beat the Carolina Panthers in NFL Week 1?','Sports',57,'2026-09-13T16:45:00Z','YES if Chicago is credited with the win in the official NFL final result for Bears at Panthers in Week 1 of the 2026 regular season; otherwise NO.','https://www.nfl.com/schedules/2026/by-week/week-1','CBS moneylines CHI -135 / CAR +128; normalized no-vig Bears probability ≈57%.'],
  ['nfl26-w1-lions','Will the Detroit Lions beat the New Orleans Saints in NFL Week 1?','Sports',74,'2026-09-13T16:45:00Z','YES if Detroit is credited with the win in the official NFL final result for Saints at Lions in Week 1 of the 2026 regular season; otherwise NO.','https://www.nfl.com/schedules/2026/by-week/week-1','CBS moneylines DET -325 / NO +280; normalized no-vig Lions probability ≈74%.']
];

function validate(m){
  const [id,title,category,prior,closeAt,rule,source]=m;
  if(!/^[a-z0-9-]+$/.test(id))throw new Error(`Bad id ${id}`);
  if(category!=='Sports')throw new Error(`Bad category ${id}`);
  if(!Number.isInteger(prior)||prior<1||prior>99)throw new Error(`Bad prior ${id}`);
  if(!Number.isFinite(Date.parse(closeAt))||Date.parse(closeAt)<=Date.now()+60_000)throw new Error(`Bad/expired closeAt ${id}`);
  if(title.length<10||rule.length<20)throw new Error(`Bad text ${id}`);
  const u=new URL(source);if(u.protocol!=='https:')throw new Error(`Bad source ${id}`);
}

(async()=>{
  const ids=new Set();for(const m of markets){validate(m);if(ids.has(m[0]))throw new Error(`Duplicate ${m[0]}`);ids.add(m[0]);}
  const refs=markets.map(m=>db.collection('markets').doc(m[0]));
  const snaps=await db.getAll(...refs);const existing=new Set(snaps.filter(s=>s.exists).map(s=>s.id));
  const selected=markets.filter(m=>!existing.has(m[0]));
  console.log(`Batch ${BATCH_ID}: ${markets.length} candidates, ${existing.size} existing, ${selected.length} selected.`);
  for(const m of selected)console.log(`[SAFE SPORTS] ${String(m[3]).padStart(2)}% ${m[0]} — ${m[1]} — closes ${m[4]}`);
  if(!APPLY){console.log('\nDRY RUN ONLY. Nothing written.');console.log('Apply with: node functions/seed-safe-sports.js --apply');return;}
  if(!selected.length){console.log('Nothing new to create.');return;}
  const now=Date.now(),batch=db.batch();
  for(const [id,title,category,prior,closeAt,resolutionRule,source,oddsBasis] of selected){
    const ref=db.collection('markets').doc(id);
    batch.set(ref,{title,category,prior,priorLiquidity:2000,yesStake:0,noStake:0,status:'open',result:null,closeAt:new Date(Date.parse(closeAt)),resolutionRule,source,oddsBasis,marketType:'scheduled-event',requiresMonitoring:false,safetyReason:'Trading closes before the official scheduled event start.',curatedBatch:BATCH_ID,researchedAtMs:RESEARCHED_AT_MS,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
    batch.set(ref.collection('history').doc('open'),{timeMs:now,yesChance:prior,volume:0,previousYesChance:prior,previousVolume:0,kind:'open'});
  }
  await batch.commit();console.log(`Created ${selected.length} scheduled sports markets with opening history.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
