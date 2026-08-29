const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const markets = [
  ['us-house-dem','Will Democrats win control of the U.S. House in the 2026 midterms?','Politics',62],
  ['us-senate-dem','Will Democrats win control of the U.S. Senate in the 2026 midterms?','Politics',35],
  ['us-house-rep','Will Republicans win at least 230 U.S. House seats in the 2026 midterms?','Politics',28],
  ['us-senate-52','Will Republicans hold at least 52 U.S. Senate seats after the 2026 midterms?','Politics',58],
  ['uk-election-2027','Will the United Kingdom hold a general election before July 2027?','Politics',18],
  ['germany-chancellor-2027','Will Germany have the same chancellor on January 1, 2027 as on August 29, 2026?','Politics',88],
  ['fed','Will the Fed cut its target rate at its next scheduled meeting?','Economy',5],
  ['fed-2026-cut','Will the Fed make at least one rate cut before the end of 2026?','Economy',18],
  ['ecb-2026-cut','Will the ECB cut its key policy rates again before the end of 2026?','Economy',35],
  ['us-cpi-3','Will U.S. headline CPI inflation be below 3.0% year-over-year in December 2026?','Economy',55],
  ['eu-inflation-2','Will euro-area headline inflation be below 2.0% in December 2026?','Economy',38],
  ['spx-7000','Will the S&P 500 finish 2026 above 7,000?','Markets',58],
  ['btc-150','Will Bitcoin trade at or above $150,000 before 2027?','Markets',28],
  ['gold-4000','Will gold trade at or above $4,000 per ounce before 2027?','Markets',45],
  ['superbowl-afc','Will the AFC champion win Super Bowl LXI?','Sports',50],
  ['superbowl-overtime','Will Super Bowl LXI go to overtime?','Sports',9],
  ['superbowl-margin','Will Super Bowl LXI be decided by 7 points or fewer?','Sports',52],
  ['f1-antonelli','Will Kimi Antonelli win the 2026 Formula 1 Drivers’ Championship?','Sports',78],
  ['f1-russell','Will George Russell win the 2026 Formula 1 Drivers’ Championship?','Sports',9],
  ['f1-hamilton','Will Lewis Hamilton win the 2026 Formula 1 Drivers’ Championship?','Sports',9],
  ['f1-mercedes','Will Mercedes win the 2026 Formula 1 Constructors’ Championship?','Sports',84],
  ['ucl-england','Will an English club win the 2026–27 UEFA Champions League?','Sports',42],
  ['ucl-spain','Will a Spanish club win the 2026–27 UEFA Champions League?','Sports',24],
  ['nba-west','Will the Western Conference champion win the 2027 NBA Finals?','Sports',58],
  ['nba-seven','Will the 2027 NBA Finals reach Game 7?','Sports',24],
  ['stanley-seven','Will the 2027 Stanley Cup Final reach Game 7?','Sports',20],
  ['ai-hle','Will an AI model score above 90% on Humanity’s Last Exam before 2027?','Technology',30],
  ['openai-major','Will OpenAI publicly release a new flagship model before 2027?','Technology',65],
  ['apple-fold','Will Apple publicly announce a foldable iPhone before 2028?','Technology',72],
  ['tesla-robotaxi','Will Tesla operate a driverless robotaxi service open to the public in at least 3 U.S. cities before 2027?','Technology',40],
  ['starship-orbit','Will Starship complete an orbital-class mission and controlled ship recovery before 2027?','Space',68],
  ['mars-launch','Will SpaceX launch a Starship mission toward Mars before 2028?','Space',38],
  ['moon-2028','Will humans land on the Moon again before 2029?','Space',55],
  ['gta-2027','Will GTA VI release before July 1, 2027?','Culture',80],
  ['avatar-4','Will Avatar 4 keep its currently announced December 2029 theatrical release year?','Culture',60]
];

(async()=>{
  let created=0, skipped=0;
  for (const [id,title,category,prior] of markets) {
    const ref=db.collection('markets').doc(id);
    const snap=await ref.get();
    if (snap.exists) { skipped++; continue; }
    await ref.set({
      title, category, prior, priorLiquidity:2000,
      yesStake:0, noStake:0,
      status:'open', result:null,
      createdAt:FieldValue.serverTimestamp(),
      updatedAt:FieldValue.serverTimestamp(),
      legacySeed:true
    });
    created++;
    console.log('Created', id);
  }
  console.log(`Done. Created ${created}, skipped ${skipped}.`);
  process.exit(0);
})().catch(err=>{ console.error(err); process.exit(1); });
