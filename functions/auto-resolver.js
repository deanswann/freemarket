'use strict';

const F1_ITALY_2026_DRIVERS={
  'f1-italy26-norris':'norris',
  'f1-italy26-russell':'russell',
  'f1-italy26-hamilton':'hamilton',
  'f1-italy26-leclerc':'leclerc',
  'f1-italy26-antonelli':'antonelli',
  'f1-italy26-verstappen':'verstappen',
  'f1-italy26-piastri':'piastri'
};
const NFL_WEEK1_2026={
  'nfl26-w1-seahawks':['SEA','NE'],
  'nfl26-w1-rams':['LAR','SF'],
  'nfl26-w1-bengals':['CIN','TB'],
  'nfl26-w1-bills':['BUF','HOU'],
  'nfl26-w1-ravens':['BAL','IND'],
  'nfl26-w1-bears':['CHI','CAR'],
  'nfl26-w1-lions':['DET','NO']
};
const CRYPTO_SYMBOLS={btc:'BTCUSDT',eth:'ETHUSDT',sol:'SOLUSDT'};

function timestampMs(value){
  if(value?.toMillis)return value.toMillis();
  const n=Number(value);
  return Number.isFinite(n)?n:0;
}

async function fetchJson(url,options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),10000);
  try{
    const res=await fetch(url,{...options,signal:controller.signal,headers:{'accept':'application/json','user-agent':'ProboraAutoResolver/1.0',...(options.headers||{})}});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }finally{clearTimeout(timer);}
}

async function resolveCryptoSnapshot(marketId,market,nowMs){
  const m=/^(btc|eth|sol)-sep30-above-(\d+)$/.exec(marketId);
  if(!m)return null;
  const snapshotAt=timestampMs(market.snapshotAt);
  if(!snapshotAt)return {state:'blocked',reason:'Missing snapshotAt.'};
  if(nowMs<snapshotAt+60_000)return {state:'pending',reason:'Snapshot candle not final yet.'};
  const symbol=CRYPTO_SYMBOLS[m[1]];
  const threshold=Number(m[2]);
  const url=`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=1m&startTime=${snapshotAt}&endTime=${snapshotAt+59_999}&limit=1`;
  const data=await fetchJson(url);
  if(!Array.isArray(data)||data.length!==1||!Array.isArray(data[0]))throw new Error('Unexpected Binance kline response.');
  const candle=data[0];
  const openTime=Number(candle[0]);
  const openPrice=Number(candle[1]);
  if(openTime!==snapshotAt||!Number.isFinite(openPrice))throw new Error('Binance candle does not match the required snapshot.');
  return {
    state:'resolved',
    result:openPrice>threshold?'YES':'NO',
    evidence:{provider:'Binance Spot API',symbol,openTime,openPrice,threshold,comparison:'strictly-above',checkedAtMs:nowMs}
  };
}

async function resolveF1Italy2026(marketId,market,nowMs){
  const expectedDriver=F1_ITALY_2026_DRIVERS[marketId];
  if(!expectedDriver)return null;
  const closeAt=timestampMs(market.closeAt);
  if(closeAt&&nowMs<closeAt+2*60*60*1000)return {state:'pending',reason:'Waiting for final classification window.'};
  const url='https://api.jolpi.ca/ergast/f1/2026/circuits/monza/results/1.json';
  const data=await fetchJson(url);
  const races=data?.MRData?.RaceTable?.Races;
  if(!Array.isArray(races)||races.length!==1)throw new Error('Unexpected F1 result response.');
  const race=races[0];
  if(String(race?.season)!=='2026'||race?.Circuit?.circuitId!=='monza')throw new Error('F1 result does not match 2026 Monza.');
  const winner=Array.isArray(race?.Results)?race.Results.find(r=>String(r?.position)==='1'):null;
  const winnerDriver=String(winner?.Driver?.driverId||'');
  if(!winnerDriver)throw new Error('F1 winner missing from final classification.');
  return {
    state:'resolved',
    result:winnerDriver===expectedDriver?'YES':'NO',
    evidence:{provider:'Jolpica F1 API (Ergast-compatible)',season:2026,circuitId:'monza',winnerDriver,expectedDriver,checkedAtMs:nowMs}
  };
}

async function resolveNflWeek1_2026(marketId,market,nowMs){
  const teams=NFL_WEEK1_2026[marketId];
  if(!teams)return null;
  const closeAt=timestampMs(market.closeAt);
  if(closeAt&&nowMs<closeAt+4*60*60*1000)return {state:'pending',reason:'Waiting for a final NFL result window.'};
  const [yesTeam,opponent]=teams;
  const url='https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=1';
  const data=await fetchJson(url);
  const events=Array.isArray(data?.events)?data.events:[];
  const matches=events.filter(event=>{
    const competitors=event?.competitions?.[0]?.competitors;
    if(!Array.isArray(competitors))return false;
    const abbrs=competitors.map(c=>String(c?.team?.abbreviation||''));
    return abbrs.includes(yesTeam)&&abbrs.includes(opponent);
  });
  if(matches.length!==1)throw new Error(`Expected exactly one NFL event for ${yesTeam}/${opponent}, got ${matches.length}.`);
  const event=matches[0];
  if(event?.status?.type?.completed!==true||event?.status?.type?.state!=='post')return {state:'pending',reason:'NFL game is not marked final.'};
  const competitors=event.competitions[0].competitors;
  const yes=competitors.find(c=>String(c?.team?.abbreviation||'')===yesTeam);
  const no=competitors.find(c=>String(c?.team?.abbreviation||'')===opponent);
  if(!yes||!no)throw new Error('NFL competitors missing.');
  if(yes.winner===no.winner)throw new Error('NFL result does not contain one unique winner.');
  return {
    state:'resolved',
    result:yes.winner===true?'YES':'NO',
    evidence:{provider:'ESPN public NFL scoreboard',eventId:String(event.id||''),yesTeam,opponent,yesScore:String(yes.score||''),opponentScore:String(no.score||''),completed:true,checkedAtMs:nowMs}
  };
}

async function determineAutomaticResult(marketId,market,nowMs=Date.now()){
  if(!market||market.status==='resolved')return {state:'skip',reason:'Already resolved.'};
  if(market.status!=='closed'&&market.status!=='resolving')return {state:'skip',reason:'Market is not closed.'};

  const resolvers=[resolveCryptoSnapshot,resolveF1Italy2026,resolveNflWeek1_2026];
  for(const resolver of resolvers){
    const result=await resolver(marketId,market,nowMs);
    if(result)return result;
  }
  return {state:'unsupported',reason:'No validated automatic resolver for this market.'};
}

module.exports={determineAutomaticResult};
