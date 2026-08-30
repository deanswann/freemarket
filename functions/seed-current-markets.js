const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const APPLY = process.argv.includes('--apply');
const BATCH_ID = 'curated-2026-08-30';
const researchedAtMs = Date.parse('2026-08-30T12:00:00Z');

const markets = [
  {
    "id": "ucl27-barcelona",
    "title": "Will Barcelona win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 17,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Barcelona is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-arsenal",
    "title": "Will Arsenal win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 16,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Arsenal is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-psg",
    "title": "Will Paris Saint-Germain win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 15,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Paris Saint-Germain is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-bayern-munich",
    "title": "Will Bayern Munich win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 15,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Bayern Munich is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-real-madrid",
    "title": "Will Real Madrid win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 13,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Real Madrid is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-man-city",
    "title": "Will Manchester City win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 9,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Manchester City is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-liverpool",
    "title": "Will Liverpool win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 7,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Liverpool is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-inter-milan",
    "title": "Will Inter Milan win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 4,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Inter Milan is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-man-utd",
    "title": "Will Manchester United win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 3,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Manchester United is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-atletico-madrid",
    "title": "Will Atlético Madrid win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 2,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Atlético Madrid is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-aston-villa",
    "title": "Will Aston Villa win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 1,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Aston Villa is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "ucl27-dortmund",
    "title": "Will Borussia Dortmund win the 2026–27 UEFA Champions League?",
    "category": "Sports",
    "prior": 1,
    "closeAt": "2027-05-31T20:00:00Z",
    "resolutionRule": "Resolves YES if Borussia Dortmund is officially declared winner of the 2026–27 UEFA Champions League; otherwise NO.",
    "source": "https://www.uefa.com/uefachampionsleague/",
    "oddsBasis": "Polymarket UCL champion odds snapshot 2026-08-30: https://polymarket.com/event/uefa-champions-league-2027-champion-20260701202025549"
  },
  {
    "id": "f1-2026-norris",
    "title": "Will Lando Norris win the 2026 Formula 1 Drivers’ Championship?",
    "category": "Sports",
    "prior": 9,
    "closeAt": "2026-12-06T18:00:00Z",
    "resolutionRule": "Resolves YES if Lando Norris finishes first in the official 2026 F1 Drivers’ Championship standings.",
    "source": "https://www.formula1.com/en/results/2026/drivers",
    "oddsBasis": "Polymarket 2026 F1 Drivers' Champion snapshot 2026-08-30: https://polymarket.com/event/2026-f1-drivers-champion"
  },
  {
    "id": "f1-2026-leclerc",
    "title": "Will Charles Leclerc win the 2026 Formula 1 Drivers’ Championship?",
    "category": "Sports",
    "prior": 2,
    "closeAt": "2026-12-06T18:00:00Z",
    "resolutionRule": "Resolves YES if Charles Leclerc finishes first in the official 2026 F1 Drivers’ Championship standings.",
    "source": "https://www.formula1.com/en/results/2026/drivers",
    "oddsBasis": "Polymarket 2026 F1 Drivers' Champion snapshot 2026-08-30: https://polymarket.com/event/2026-f1-drivers-champion"
  },
  {
    "id": "f1-2026-verstappen",
    "title": "Will Max Verstappen win the 2026 Formula 1 Drivers’ Championship?",
    "category": "Sports",
    "prior": 1,
    "closeAt": "2026-12-06T18:00:00Z",
    "resolutionRule": "Resolves YES if Max Verstappen finishes first in the official 2026 F1 Drivers’ Championship standings.",
    "source": "https://www.formula1.com/en/results/2026/drivers",
    "oddsBasis": "Polymarket 2026 F1 Drivers' Champion snapshot 2026-08-30: https://polymarket.com/event/2026-f1-drivers-champion"
  },
  {
    "id": "f1-2026-piastri",
    "title": "Will Oscar Piastri win the 2026 Formula 1 Drivers’ Championship?",
    "category": "Sports",
    "prior": 1,
    "closeAt": "2026-12-06T18:00:00Z",
    "resolutionRule": "Resolves YES if Oscar Piastri finishes first in the official 2026 F1 Drivers’ Championship standings.",
    "source": "https://www.formula1.com/en/results/2026/drivers",
    "oddsBasis": "Polymarket 2026 F1 Drivers' Champion snapshot 2026-08-30: https://polymarket.com/event/2026-f1-drivers-champion"
  },
  {
    "id": "f1-constructors-ferrari",
    "title": "Will Ferrari win the 2026 Formula 1 Constructors’ Championship?",
    "category": "Sports",
    "prior": 9,
    "closeAt": "2026-12-06T18:00:00Z",
    "resolutionRule": "Resolves YES if Ferrari is the official 2026 F1 Constructors’ Champion.",
    "source": "https://www.formula1.com/en/results/2026/team",
    "oddsBasis": "Polymarket constructors snapshot 2026-08-30, rounded/conservative: https://polymarket.com/event/f1-constructors-champion/will-haas-be-the-2026-f1-constructors-champion"
  },
  {
    "id": "f1-constructors-mclaren",
    "title": "Will McLaren win the 2026 Formula 1 Constructors’ Championship?",
    "category": "Sports",
    "prior": 1,
    "closeAt": "2026-12-06T18:00:00Z",
    "resolutionRule": "Resolves YES if McLaren is the official 2026 F1 Constructors’ Champion.",
    "source": "https://www.formula1.com/en/results/2026/team",
    "oddsBasis": "Polymarket constructors snapshot 2026-08-30, rounded/conservative: https://polymarket.com/event/f1-constructors-champion/will-haas-be-the-2026-f1-constructors-champion"
  },
  {
    "id": "f1-constructors-red-bull",
    "title": "Will Red Bull Racing win the 2026 Formula 1 Constructors’ Championship?",
    "category": "Sports",
    "prior": 1,
    "closeAt": "2026-12-06T18:00:00Z",
    "resolutionRule": "Resolves YES if Red Bull Racing is the official 2026 F1 Constructors’ Champion.",
    "source": "https://www.formula1.com/en/results/2026/team",
    "oddsBasis": "Polymarket constructors snapshot 2026-08-30, rounded/conservative: https://polymarket.com/event/f1-constructors-champion/will-haas-be-the-2026-f1-constructors-champion"
  },
  {
    "id": "f1-constructors-other",
    "title": "Will Any team other than Mercedes, Ferrari, McLaren or Red Bull Racing win the 2026 Formula 1 Constructors’ Championship?",
    "category": "Sports",
    "prior": 1,
    "closeAt": "2026-12-06T18:00:00Z",
    "resolutionRule": "Resolves YES if Any team other than Mercedes, Ferrari, McLaren or Red Bull Racing is the official 2026 F1 Constructors’ Champion.",
    "source": "https://www.formula1.com/en/results/2026/team",
    "oddsBasis": "Polymarket constructors snapshot 2026-08-30, rounded/conservative: https://polymarket.com/event/f1-constructors-champion/will-haas-be-the-2026-f1-constructors-champion"
  },
  {
    "id": "dem-nom-2028-aoc",
    "title": "Will Alexandria Ocasio-Cortez win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 19,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Alexandria Ocasio-Cortez wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "dem-nom-2028-ossoff",
    "title": "Will Jon Ossoff win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 16,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Jon Ossoff wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "dem-nom-2028-newsom",
    "title": "Will Gavin Newsom win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 15,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Gavin Newsom wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "dem-nom-2028-harris",
    "title": "Will Kamala Harris win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 8,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Kamala Harris wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "dem-nom-2028-buttigieg",
    "title": "Will Pete Buttigieg win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 5,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Pete Buttigieg wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "dem-nom-2028-shapiro",
    "title": "Will Josh Shapiro win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 5,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Josh Shapiro wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "dem-nom-2028-whitmer",
    "title": "Will Gretchen Whitmer win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 4,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Gretchen Whitmer wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "dem-nom-2028-kelly",
    "title": "Will Mark Kelly win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 3,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Mark Kelly wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "dem-nom-2028-pritzker",
    "title": "Will J.B. Pritzker win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 3,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if J.B. Pritzker wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "dem-nom-2028-gallego",
    "title": "Will Ruben Gallego win the 2028 Democratic presidential nomination?",
    "category": "Politics",
    "prior": 2,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Ruben Gallego wins and accepts the Democratic Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://democrats.org/",
    "oddsBasis": "Polymarket Democratic nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/democratic-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-vance",
    "title": "Will J.D. Vance win the 2028 Republican presidential nomination?",
    "category": "Politics",
    "prior": 49,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if J.D. Vance wins and accepts the Republican Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-rubio",
    "title": "Will Marco Rubio win the 2028 Republican presidential nomination?",
    "category": "Politics",
    "prior": 17,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Marco Rubio wins and accepts the Republican Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-carlson",
    "title": "Will Tucker Carlson win the 2028 Republican presidential nomination?",
    "category": "Politics",
    "prior": 3,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Tucker Carlson wins and accepts the Republican Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-desantis",
    "title": "Will Ron DeSantis win the 2028 Republican presidential nomination?",
    "category": "Politics",
    "prior": 3,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Ron DeSantis wins and accepts the Republican Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-trump",
    "title": "Will Donald Trump win the 2028 Republican presidential nomination?",
    "category": "Politics",
    "prior": 2,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Donald Trump wins and accepts the Republican Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-trump-jr",
    "title": "Will Donald Trump Jr. win the 2028 Republican presidential nomination?",
    "category": "Politics",
    "prior": 2,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Donald Trump Jr. wins and accepts the Republican Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-youngkin",
    "title": "Will Glenn Youngkin win the 2028 Republican presidential nomination?",
    "category": "Politics",
    "prior": 2,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Glenn Youngkin wins and accepts the Republican Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-haley",
    "title": "Will Nikki Haley win the 2028 Republican presidential nomination?",
    "category": "Politics",
    "prior": 1,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Nikki Haley wins and accepts the Republican Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-bannon",
    "title": "Will Steve Bannon win the 2028 Republican presidential nomination?",
    "category": "Politics",
    "prior": 1,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if Steve Bannon wins and accepts the Republican Party nomination for U.S. president in 2028; otherwise NO.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "rep-nom-2028-other",
    "title": "Will the 2028 Republican presidential nominee be someone other than Vance, Rubio, Carlson, DeSantis, Trump, Trump Jr., Youngkin, Haley or Bannon?",
    "category": "Politics",
    "prior": 20,
    "closeAt": "2028-08-31T23:59:00Z",
    "resolutionRule": "Resolves YES if the accepted 2028 Republican presidential nominee is not one of the nine named candidates in this market title.",
    "source": "https://www.gop.com/",
    "oddsBasis": "Polymarket Republican nominee snapshot 2026-08-30; top prices directly observed, lower-tier rounded: https://polymarket.com/event/republican-presidential-nominee-2028"
  },
  {
    "id": "fed-sep-hike25",
    "title": "Will the Fed raise rates by exactly 25 bps at its September 2026 meeting?",
    "category": "Economy",
    "prior": 47,
    "closeAt": "2026-09-16T18:00:00Z",
    "resolutionRule": "YES if the upper bound of the target federal funds range rises by exactly 25 bps at the September 2026 FOMC meeting.",
    "source": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    "oddsBasis": "Polymarket Fed decision/end-rate snapshots 2026-08-30: https://polymarket.com/event/fed-decision-in-september-762 and https://polymarket.com/event/what-will-the-fed-rate-be-at-the-end-of-2026"
  },
  {
    "id": "fed-sep-nochange",
    "title": "Will the Fed leave rates unchanged at its September 2026 meeting?",
    "category": "Economy",
    "prior": 54,
    "closeAt": "2026-09-16T18:00:00Z",
    "resolutionRule": "YES if the upper bound of the target federal funds range is unchanged at the September 2026 FOMC meeting.",
    "source": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    "oddsBasis": "Polymarket Fed decision/end-rate snapshots 2026-08-30: https://polymarket.com/event/fed-decision-in-september-762 and https://polymarket.com/event/what-will-the-fed-rate-be-at-the-end-of-2026"
  },
  {
    "id": "fed-sep-cut25",
    "title": "Will the Fed cut rates by at least 25 bps at its September 2026 meeting?",
    "category": "Economy",
    "prior": 1,
    "closeAt": "2026-09-16T18:00:00Z",
    "resolutionRule": "YES if the upper bound of the target federal funds range falls by at least 25 bps at the September 2026 FOMC meeting.",
    "source": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    "oddsBasis": "Polymarket Fed decision/end-rate snapshots 2026-08-30: https://polymarket.com/event/fed-decision-in-september-762 and https://polymarket.com/event/what-will-the-fed-rate-be-at-the-end-of-2026"
  },
  {
    "id": "fed-cut-by-oct",
    "title": "Will the Fed have made at least one rate cut by the end of its October 2026 meeting?",
    "category": "Economy",
    "prior": 4,
    "closeAt": "2026-10-28T18:00:00Z",
    "resolutionRule": "YES if the upper bound of the target federal funds range is lower than it was on August 30, 2026 by the end of the October 2026 FOMC meeting.",
    "source": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    "oddsBasis": "Polymarket Fed decision/end-rate snapshots 2026-08-30: https://polymarket.com/event/fed-decision-in-september-762 and https://polymarket.com/event/what-will-the-fed-rate-be-at-the-end-of-2026"
  },
  {
    "id": "fed-cut-by-dec",
    "title": "Will the Fed have made at least one rate cut by the end of its December 2026 meeting?",
    "category": "Economy",
    "prior": 11,
    "closeAt": "2026-12-09T18:00:00Z",
    "resolutionRule": "YES if the upper bound of the target federal funds range is lower than it was on August 30, 2026 by the end of the December 2026 FOMC meeting.",
    "source": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    "oddsBasis": "Polymarket Fed decision/end-rate snapshots 2026-08-30: https://polymarket.com/event/fed-decision-in-september-762 and https://polymarket.com/event/what-will-the-fed-rate-be-at-the-end-of-2026"
  },
  {
    "id": "fed-end-4",
    "title": "Will the upper bound of the Fed target range be exactly 4.00% after the December 2026 meeting?",
    "category": "Economy",
    "prior": 39,
    "closeAt": "2026-12-09T18:00:00Z",
    "resolutionRule": "YES if the upper bound of the target federal funds range is 4.00% immediately after the December 2026 FOMC decision.",
    "source": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    "oddsBasis": "Polymarket Fed decision/end-rate snapshots 2026-08-30: https://polymarket.com/event/fed-decision-in-september-762 and https://polymarket.com/event/what-will-the-fed-rate-be-at-the-end-of-2026"
  },
  {
    "id": "fed-end-375",
    "title": "Will the upper bound of the Fed target range be exactly 3.75% after the December 2026 meeting?",
    "category": "Economy",
    "prior": 26,
    "closeAt": "2026-12-09T18:00:00Z",
    "resolutionRule": "YES if the upper bound of the target federal funds range is 3.75% immediately after the December 2026 FOMC decision.",
    "source": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    "oddsBasis": "Polymarket Fed decision/end-rate snapshots 2026-08-30: https://polymarket.com/event/fed-decision-in-september-762 and https://polymarket.com/event/what-will-the-fed-rate-be-at-the-end-of-2026"
  },
  {
    "id": "ecb-sep-hike25",
    "title": "Will the ECB raise its deposit facility rate by exactly 25 bps at the September 2026 meeting?",
    "category": "Economy",
    "prior": 98,
    "closeAt": "2026-09-10T13:45:00Z",
    "resolutionRule": "YES if the ECB deposit facility rate rises by exactly 25 bps at the September 2026 meeting.",
    "source": "https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html",
    "oddsBasis": "Polymarket ECB September/October 2026 decision snapshots 2026-08-30: https://polymarket.com/event/ecb-interest-rates-september-2026-20260616222636097 and https://polymarket.com/event/ecb-interest-rates-october-2026-20260723225848778"
  },
  {
    "id": "ecb-sep-nochange",
    "title": "Will the ECB leave its deposit facility rate unchanged at the September 2026 meeting?",
    "category": "Economy",
    "prior": 2,
    "closeAt": "2026-09-10T13:45:00Z",
    "resolutionRule": "YES if the ECB deposit facility rate is unchanged at the September 2026 meeting.",
    "source": "https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html",
    "oddsBasis": "Polymarket ECB September/October 2026 decision snapshots 2026-08-30: https://polymarket.com/event/ecb-interest-rates-september-2026-20260616222636097 and https://polymarket.com/event/ecb-interest-rates-october-2026-20260723225848778"
  },
  {
    "id": "ecb-oct-nochange",
    "title": "Will the ECB leave its deposit facility rate unchanged at the October 2026 meeting?",
    "category": "Economy",
    "prior": 90,
    "closeAt": "2026-10-29T13:45:00Z",
    "resolutionRule": "YES if the ECB deposit facility rate is unchanged at the October 2026 meeting.",
    "source": "https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html",
    "oddsBasis": "Polymarket ECB September/October 2026 decision snapshots 2026-08-30: https://polymarket.com/event/ecb-interest-rates-september-2026-20260616222636097 and https://polymarket.com/event/ecb-interest-rates-october-2026-20260723225848778"
  },
  {
    "id": "ecb-oct-hike25",
    "title": "Will the ECB raise its deposit facility rate by exactly 25 bps at the October 2026 meeting?",
    "category": "Economy",
    "prior": 10,
    "closeAt": "2026-10-29T13:45:00Z",
    "resolutionRule": "YES if the ECB deposit facility rate rises by exactly 25 bps at the October 2026 meeting.",
    "source": "https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html",
    "oddsBasis": "Polymarket ECB September/October 2026 decision snapshots 2026-08-30: https://polymarket.com/event/ecb-interest-rates-september-2026-20260616222636097 and https://polymarket.com/event/ecb-interest-rates-october-2026-20260723225848778"
  },
  {
    "id": "us-recession-2026-new",
    "title": "Will the U.S. enter a recession by the end of 2026?",
    "category": "Economy",
    "prior": 9,
    "closeAt": "2027-01-31T23:59:00Z",
    "resolutionRule": "YES if either NBER declares a U.S. recession covering 2025-2026 or BEA reports two consecutive negative quarter-over-quarter annualized real GDP growth readings through Q4 2026.",
    "source": "https://www.bea.gov/data/gdp/gross-domestic-product",
    "oddsBasis": "Polymarket 2026 recession market snapshot 2026-08-30: https://polymarket.com/event/us-recession-by-end-of-2026"
  },
  {
    "id": "us-recession-2027",
    "title": "Will the U.S. enter a recession by the end of 2027?",
    "category": "Economy",
    "prior": 29,
    "closeAt": "2028-01-31T23:59:00Z",
    "resolutionRule": "YES if either NBER declares a U.S. recession covering 2025-2027 or BEA reports two consecutive negative quarter-over-quarter annualized real GDP growth readings through Q4 2027.",
    "source": "https://www.bea.gov/data/gdp/gross-domestic-product",
    "oddsBasis": "Polymarket 2027 recession market snapshot 2026-08-30: https://polymarket.com/event/us-recession-by-end-of-2027-20260807185409760"
  },
  {
    "id": "us-cpi-sep-above3",
    "title": "Will U.S. headline CPI inflation be above 3.0% year-over-year for September 2026?",
    "category": "Economy",
    "prior": 72,
    "closeAt": "2026-10-20T12:30:00Z",
    "resolutionRule": "YES if the BLS first-published September 2026 all-items CPI 12-month percent change is greater than 3.0%.",
    "source": "https://www.bls.gov/cpi/",
    "oddsBasis": "Model prior anchored to late-August 2026 inflation and Fed pricing."
  },
  {
    "id": "us-cpi-dec-above35",
    "title": "Will U.S. headline CPI inflation be above 3.5% year-over-year in December 2026?",
    "category": "Economy",
    "prior": 42,
    "closeAt": "2027-01-20T13:30:00Z",
    "resolutionRule": "YES if the BLS first-published December 2026 all-items CPI 12-month percent change is greater than 3.5%.",
    "source": "https://www.bls.gov/cpi/",
    "oddsBasis": "Model prior using current inflation persistence and Fed pricing."
  },
  {
    "id": "us-unemployment-sep-above42",
    "title": "Will the U.S. unemployment rate be above 4.2% in September 2026?",
    "category": "Economy",
    "prior": 38,
    "closeAt": "2026-10-10T12:30:00Z",
    "resolutionRule": "YES if the BLS first-published seasonally adjusted U-3 unemployment rate for September 2026 is greater than 4.2%.",
    "source": "https://www.bls.gov/news.release/empsit.toc.htm",
    "oddsBasis": "Model prior anchored to July 2026 unemployment around 4.1% and current uncertainty."
  },
  {
    "id": "us-unemployment-dec-above45",
    "title": "Will the U.S. unemployment rate be at or above 4.5% in December 2026?",
    "category": "Economy",
    "prior": 22,
    "closeAt": "2027-01-10T13:30:00Z",
    "resolutionRule": "YES if the BLS first-published seasonally adjusted U-3 unemployment rate for December 2026 is at least 4.5%.",
    "source": "https://www.bls.gov/news.release/empsit.toc.htm",
    "oddsBasis": "Model prior anchored to current labor-market conditions."
  },
  {
    "id": "us-q3-gdp-negative",
    "title": "Will U.S. real GDP growth be negative in Q3 2026 on the BEA advance estimate?",
    "category": "Economy",
    "prior": 14,
    "closeAt": "2026-11-05T12:30:00Z",
    "resolutionRule": "YES if BEA's advance estimate reports a negative seasonally adjusted annualized quarter-over-quarter change in real GDP for Q3 2026.",
    "source": "https://www.bea.gov/data/gdp/gross-domestic-product",
    "oddsBasis": "Model prior consistent with low recession pricing."
  },
  {
    "id": "us-q3-gdp-above2",
    "title": "Will U.S. real GDP growth exceed 2.0% annualized in Q3 2026 on the BEA advance estimate?",
    "category": "Economy",
    "prior": 48,
    "closeAt": "2026-11-05T12:30:00Z",
    "resolutionRule": "YES if BEA's advance estimate reports Q3 2026 real GDP growth greater than 2.0% annualized quarter-over-quarter.",
    "source": "https://www.bea.gov/data/gdp/gross-domestic-product",
    "oddsBasis": "Model prior based on mid-2026 growth near roughly 2%."
  },
  {
    "id": "euro-inflation-dec-above3",
    "title": "Will euro-area headline HICP inflation be above 3.0% year-over-year in December 2026?",
    "category": "Economy",
    "prior": 44,
    "closeAt": "2027-01-20T10:00:00Z",
    "resolutionRule": "YES if Eurostat's first flash estimate for December 2026 euro-area all-items HICP annual inflation is greater than 3.0%.",
    "source": "https://ec.europa.eu/eurostat/web/hicp",
    "oddsBasis": "Model prior anchored to ECB tightening and elevated 2026 inflation outlook."
  },
  {
    "id": "nvda-sep-hit-224",
    "title": "Will NVIDIA (NVDA) trade at or above $224 during September 2026?",
    "category": "Markets",
    "prior": 82,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute NVDA candle during September 2026 has a high at or above $224.",
    "source": "https://pythdata.app/explore/Equity.US.NVDA%2FUSD",
    "oddsBasis": "Polymarket September NVDA hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-nvda-hit-in-september-2026"
  },
  {
    "id": "nvda-sep-hit-232",
    "title": "Will NVIDIA (NVDA) trade at or above $232 during September 2026?",
    "category": "Markets",
    "prior": 52,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute NVDA candle during September 2026 has a high at or above $232.",
    "source": "https://pythdata.app/explore/Equity.US.NVDA%2FUSD",
    "oddsBasis": "Polymarket September NVDA hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-nvda-hit-in-september-2026"
  },
  {
    "id": "nvda-sep-hit-240",
    "title": "Will NVIDIA (NVDA) trade at or above $240 during September 2026?",
    "category": "Markets",
    "prior": 23,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute NVDA candle during September 2026 has a high at or above $240.",
    "source": "https://pythdata.app/explore/Equity.US.NVDA%2FUSD",
    "oddsBasis": "Polymarket September NVDA hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-nvda-hit-in-september-2026"
  },
  {
    "id": "nvda-sep-hit-248",
    "title": "Will NVIDIA (NVDA) trade at or above $248 during September 2026?",
    "category": "Markets",
    "prior": 23,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute NVDA candle during September 2026 has a high at or above $248.",
    "source": "https://pythdata.app/explore/Equity.US.NVDA%2FUSD",
    "oddsBasis": "Polymarket September NVDA hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-nvda-hit-in-september-2026"
  },
  {
    "id": "nvda-sep-hit-256",
    "title": "Will NVIDIA (NVDA) trade at or above $256 during September 2026?",
    "category": "Markets",
    "prior": 12,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute NVDA candle during September 2026 has a high at or above $256.",
    "source": "https://pythdata.app/explore/Equity.US.NVDA%2FUSD",
    "oddsBasis": "Polymarket September NVDA hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-nvda-hit-in-september-2026"
  },
  {
    "id": "nvda-sep-hit-264",
    "title": "Will NVIDIA (NVDA) trade at or above $264 during September 2026?",
    "category": "Markets",
    "prior": 9,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute NVDA candle during September 2026 has a high at or above $264.",
    "source": "https://pythdata.app/explore/Equity.US.NVDA%2FUSD",
    "oddsBasis": "Polymarket September NVDA hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-nvda-hit-in-september-2026"
  },
  {
    "id": "aapl-sep-hit-320",
    "title": "Will Apple (AAPL) trade at or above $320 during September 2026?",
    "category": "Markets",
    "prior": 73,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute AAPL candle during September 2026 has a high at or above $320.",
    "source": "https://pythdata.app/explore/Equity.US.AAPL%2FUSD",
    "oddsBasis": "Polymarket September AAPL hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-aapl-hit-in-september-2026"
  },
  {
    "id": "aapl-sep-hit-328",
    "title": "Will Apple (AAPL) trade at or above $328 during September 2026?",
    "category": "Markets",
    "prior": 71,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute AAPL candle during September 2026 has a high at or above $328.",
    "source": "https://pythdata.app/explore/Equity.US.AAPL%2FUSD",
    "oddsBasis": "Polymarket September AAPL hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-aapl-hit-in-september-2026"
  },
  {
    "id": "aapl-sep-hit-336",
    "title": "Will Apple (AAPL) trade at or above $336 during September 2026?",
    "category": "Markets",
    "prior": 49,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute AAPL candle during September 2026 has a high at or above $336.",
    "source": "https://pythdata.app/explore/Equity.US.AAPL%2FUSD",
    "oddsBasis": "Polymarket September AAPL hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-aapl-hit-in-september-2026"
  },
  {
    "id": "aapl-sep-hit-344",
    "title": "Will Apple (AAPL) trade at or above $344 during September 2026?",
    "category": "Markets",
    "prior": 31,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute AAPL candle during September 2026 has a high at or above $344.",
    "source": "https://pythdata.app/explore/Equity.US.AAPL%2FUSD",
    "oddsBasis": "Polymarket September AAPL hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-aapl-hit-in-september-2026"
  },
  {
    "id": "aapl-sep-hit-352",
    "title": "Will Apple (AAPL) trade at or above $352 during September 2026?",
    "category": "Markets",
    "prior": 20,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute AAPL candle during September 2026 has a high at or above $352.",
    "source": "https://pythdata.app/explore/Equity.US.AAPL%2FUSD",
    "oddsBasis": "Polymarket September AAPL hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-aapl-hit-in-september-2026"
  },
  {
    "id": "msft-sep-hit-495",
    "title": "Will Microsoft (MSFT) trade at or above $495 during September 2026?",
    "category": "Markets",
    "prior": 81,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute MSFT candle during September 2026 has a high at or above $495.",
    "source": "https://pythdata.app/explore/Equity.US.MSFT%2FUSD",
    "oddsBasis": "Polymarket September MSFT hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-msft-hit-in-september-2026"
  },
  {
    "id": "msft-sep-hit-510",
    "title": "Will Microsoft (MSFT) trade at or above $510 during September 2026?",
    "category": "Markets",
    "prior": 81,
    "closeAt": "2026-10-01T20:00:00Z",
    "resolutionRule": "YES if any regular-session 1-minute MSFT candle during September 2026 has a high at or above $510.",
    "source": "https://pythdata.app/explore/Equity.US.MSFT%2FUSD",
    "oddsBasis": "Polymarket September MSFT hit-price snapshot 2026-08-30: https://polymarket.com/event/what-price-will-msft-hit-in-september-2026"
  },
  {
    "id": "eth-3000-sep",
    "title": "Will Ethereum trade at or above $3,000 by September 30, 2026?",
    "category": "Markets",
    "prior": 36,
    "closeAt": "2026-10-01T03:59:00Z",
    "resolutionRule": "YES if a Binance 1-minute candle for the named crypto/USDT pair reaches or exceeds the stated USD level before the deadline; otherwise NO.",
    "source": "https://www.binance.com/en/trade/ETH_USDT",
    "oddsBasis": "Polymarket ETH $3k by Sep 30 snapshot 2026-08-30: https://polymarket.com/de/event/when-will-ethereum-hit-3k"
  },
  {
    "id": "eth-3000-dec",
    "title": "Will Ethereum trade at or above $3,000 by December 31, 2026?",
    "category": "Markets",
    "prior": 53,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if a Binance 1-minute candle for the named crypto/USDT pair reaches or exceeds the stated USD level before the deadline; otherwise NO.",
    "source": "https://www.binance.com/en/trade/ETH_USDT",
    "oddsBasis": "Polymarket ETH $3k by Dec 31 snapshot 2026-08-30: https://polymarket.com/de/event/when-will-ethereum-hit-3k"
  },
  {
    "id": "eth-4000-sep",
    "title": "Will Ethereum trade at or above $4,000 by September 30, 2026?",
    "category": "Markets",
    "prior": 5,
    "closeAt": "2026-10-01T03:59:00Z",
    "resolutionRule": "YES if a Binance 1-minute candle for the named crypto/USDT pair reaches or exceeds the stated USD level before the deadline; otherwise NO.",
    "source": "https://www.binance.com/en/trade/ETH_USDT",
    "oddsBasis": "Polymarket ETH $4k by Sep 30 snapshot 2026-08-30: https://polymarket.com/de/event/when-will-ethereum-hit-4k"
  },
  {
    "id": "eth-4000-dec",
    "title": "Will Ethereum trade at or above $4,000 by December 31, 2026?",
    "category": "Markets",
    "prior": 16,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if a Binance 1-minute candle for the named crypto/USDT pair reaches or exceeds the stated USD level before the deadline; otherwise NO.",
    "source": "https://www.binance.com/en/trade/ETH_USDT",
    "oddsBasis": "Polymarket ETH $4k by Dec 31 snapshot 2026-08-30: https://polymarket.com/de/event/when-will-ethereum-hit-4k"
  },
  {
    "id": "sol-150-sep",
    "title": "Will Solana trade at or above $150 by September 30, 2026?",
    "category": "Markets",
    "prior": 15,
    "closeAt": "2026-10-01T03:59:00Z",
    "resolutionRule": "YES if a Binance 1-minute candle for the named crypto/USDT pair reaches or exceeds the stated USD level before the deadline; otherwise NO.",
    "source": "https://www.binance.com/en/trade/SOL_USDT",
    "oddsBasis": "Polymarket SOL $150 by Sep 30 snapshot 2026-08-30: https://polymarket.com/de/event/when-will-solana-hit-150"
  },
  {
    "id": "sol-150-dec",
    "title": "Will Solana trade at or above $150 by December 31, 2026?",
    "category": "Markets",
    "prior": 38,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if a Binance 1-minute candle for the named crypto/USDT pair reaches or exceeds the stated USD level before the deadline; otherwise NO.",
    "source": "https://www.binance.com/en/trade/SOL_USDT",
    "oddsBasis": "Polymarket SOL $150 by Dec 31 snapshot 2026-08-30: https://polymarket.com/de/event/when-will-solana-hit-150"
  },
  {
    "id": "sol-300-dec",
    "title": "Will Solana trade at or above $300 by December 31, 2026?",
    "category": "Markets",
    "prior": 5,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if a Binance 1-minute candle for the named crypto/USDT pair reaches or exceeds the stated USD level before the deadline; otherwise NO.",
    "source": "https://www.binance.com/en/trade/SOL_USDT",
    "oddsBasis": "Polymarket SOL $300 by Dec 31 snapshot 2026-08-30: https://polymarket.com/de/event/when-will-solana-hit-300"
  },
  {
    "id": "ai-best-sep-anthropic",
    "title": "Will Anthropic have the best AI model at the end of September 2026?",
    "category": "Technology",
    "prior": 93,
    "closeAt": "2026-10-01T00:00:00Z",
    "resolutionRule": "YES if Anthropic ranks first on the specified independent AI benchmark leaderboard at the end of September 30, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/which-company-has-the-best-ai-model-end-of-september-20260717143435868"
  },
  {
    "id": "ai-best-sep-openai",
    "title": "Will OpenAI have the best AI model at the end of September 2026?",
    "category": "Technology",
    "prior": 4,
    "closeAt": "2026-10-01T00:00:00Z",
    "resolutionRule": "YES if OpenAI ranks first on the specified independent AI benchmark leaderboard at the end of September 30, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/which-company-has-the-best-ai-model-end-of-september-20260717143435868"
  },
  {
    "id": "ai-best-sep-google",
    "title": "Will Google have the best AI model at the end of September 2026?",
    "category": "Technology",
    "prior": 3,
    "closeAt": "2026-10-01T00:00:00Z",
    "resolutionRule": "YES if Google ranks first on the specified independent AI benchmark leaderboard at the end of September 30, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/which-company-has-the-best-ai-model-end-of-september-20260717143435868"
  },
  {
    "id": "ai-best-2026-anthropic",
    "title": "Will Anthropic have the best AI model at the end of 2026?",
    "category": "Technology",
    "prior": 69,
    "closeAt": "2027-01-01T00:00:00Z",
    "resolutionRule": "YES if Anthropic ranks first on the specified independent AI benchmark leaderboard at the end of December 31, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/which-company-has-best-ai-model-end-of-2026"
  },
  {
    "id": "ai-best-2026-openai",
    "title": "Will OpenAI have the best AI model at the end of 2026?",
    "category": "Technology",
    "prior": 12,
    "closeAt": "2027-01-01T00:00:00Z",
    "resolutionRule": "YES if OpenAI ranks first on the specified independent AI benchmark leaderboard at the end of December 31, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/which-company-has-best-ai-model-end-of-2026"
  },
  {
    "id": "ai-best-2026-google",
    "title": "Will Google have the best AI model at the end of 2026?",
    "category": "Technology",
    "prior": 9,
    "closeAt": "2027-01-01T00:00:00Z",
    "resolutionRule": "YES if Google ranks first on the specified independent AI benchmark leaderboard at the end of December 31, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/which-company-has-best-ai-model-end-of-2026"
  },
  {
    "id": "ai-best-2026-xai",
    "title": "Will xAI have the best AI model at the end of 2026?",
    "category": "Technology",
    "prior": 8,
    "closeAt": "2027-01-01T00:00:00Z",
    "resolutionRule": "YES if xAI ranks first on the specified independent AI benchmark leaderboard at the end of December 31, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/which-company-has-best-ai-model-end-of-2026"
  },
  {
    "id": "ai-best-2026-meta",
    "title": "Will Meta have the best AI model at the end of 2026?",
    "category": "Technology",
    "prior": 3,
    "closeAt": "2027-01-01T00:00:00Z",
    "resolutionRule": "YES if Meta ranks first on the specified independent AI benchmark leaderboard at the end of December 31, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/which-company-has-best-ai-model-end-of-2026"
  },
  {
    "id": "agent-best-sep-anthropic",
    "title": "Will Anthropic have the best AI agent at the end of September 2026?",
    "category": "Technology",
    "prior": 85,
    "closeAt": "2026-10-01T00:00:00Z",
    "resolutionRule": "YES if Anthropic ranks first on the designated public AI-agent benchmark at the end of September 30, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket AI agent snapshot 2026-08-30: https://polymarket.com/event/which-company-has-the-best-ai-agent-end-of-september-20260716211946456"
  },
  {
    "id": "agent-best-sep-openai",
    "title": "Will OpenAI have the best AI agent at the end of September 2026?",
    "category": "Technology",
    "prior": 13,
    "closeAt": "2026-10-01T00:00:00Z",
    "resolutionRule": "YES if OpenAI ranks first on the designated public AI-agent benchmark at the end of September 30, 2026.",
    "source": "https://artificialanalysis.ai/",
    "oddsBasis": "Polymarket AI agent snapshot 2026-08-30: https://polymarket.com/event/which-company-has-the-best-ai-agent-end-of-september-20260716211946456"
  },
  {
    "id": "gpt6-by-oct31",
    "title": "Will OpenAI publicly release GPT-6 by October 31, 2026?",
    "category": "Technology",
    "prior": 65,
    "closeAt": "2026-11-01T03:59:00Z",
    "resolutionRule": "YES if OpenAI publicly releases a model explicitly named GPT-6 for general user or API access by the deadline.",
    "source": "https://openai.com/news/",
    "oddsBasis": "Polymarket tech category snapshot 2026-08-30: https://polymarket.com/tech"
  },
  {
    "id": "gpt6-by-dec31",
    "title": "Will OpenAI publicly release GPT-6 by December 31, 2026?",
    "category": "Technology",
    "prior": 68,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if OpenAI publicly releases a model explicitly named GPT-6 for general user or API access by the deadline.",
    "source": "https://openai.com/news/",
    "oddsBasis": "Polymarket tech category snapshot 2026-08-30: https://polymarket.com/tech"
  },
  {
    "id": "openai-astra-sep30",
    "title": "Will OpenAI publicly release a product/model called Astra by September 30, 2026?",
    "category": "Technology",
    "prior": 83,
    "closeAt": "2026-10-01T03:59:00Z",
    "resolutionRule": "YES if OpenAI publicly releases a product or model explicitly named Astra for general user or API access by the deadline.",
    "source": "https://openai.com/news/",
    "oddsBasis": "Polymarket tech category snapshot 2026-08-30: https://polymarket.com/tech"
  },
  {
    "id": "openai-astra-oct31",
    "title": "Will OpenAI publicly release a product/model called Astra by October 31, 2026?",
    "category": "Technology",
    "prior": 92,
    "closeAt": "2026-11-01T03:59:00Z",
    "resolutionRule": "YES if OpenAI publicly releases a product or model explicitly named Astra for general user or API access by the deadline.",
    "source": "https://openai.com/news/",
    "oddsBasis": "Polymarket tech category snapshot 2026-08-30: https://polymarket.com/tech"
  },
  {
    "id": "largest-company-dec-nvda",
    "title": "Will NVIDIA be the world’s largest publicly traded company by market cap at the end of 2026?",
    "category": "Technology",
    "prior": 77,
    "closeAt": "2027-01-02T21:00:00Z",
    "resolutionRule": "YES if NVIDIA has the highest market capitalization among publicly traded companies at the final U.S. market close of 2026.",
    "source": "https://companiesmarketcap.com/",
    "oddsBasis": "Polymarket tech category snapshot 2026-08-30: https://polymarket.com/tech"
  },
  {
    "id": "largest-company-dec-apple",
    "title": "Will Apple be the world’s largest publicly traded company by market cap at the end of 2026?",
    "category": "Technology",
    "prior": 15,
    "closeAt": "2027-01-02T21:00:00Z",
    "resolutionRule": "YES if Apple has the highest market capitalization among publicly traded companies at the final U.S. market close of 2026.",
    "source": "https://companiesmarketcap.com/",
    "oddsBasis": "Polymarket tech category snapshot 2026-08-30: https://polymarket.com/tech"
  },
  {
    "id": "third-company-sep-alphabet",
    "title": "Will Alphabet be the world’s third-largest publicly traded company by market cap at the end of September 2026?",
    "category": "Technology",
    "prior": 70,
    "closeAt": "2026-10-01T21:00:00Z",
    "resolutionRule": "YES if Alphabet ranks third by market capitalization among publicly traded companies at the final U.S. market close of September 2026.",
    "source": "https://companiesmarketcap.com/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/3rd-largest-company-end-of-september-1785358369147"
  },
  {
    "id": "anthropic-value-over-openai-2026",
    "title": "Will Anthropic have a higher reported valuation than OpenAI at any point before 2027?",
    "category": "Technology",
    "prior": 99,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if a completed funding round or public-market valuation reported by the companies or overwhelming credible consensus places Anthropic above OpenAI before 2027.",
    "source": "https://www.anthropic.com/news",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/anthropic-valued-higher-than-openai-in-2026"
  },
  {
    "id": "apple-foldable-announcement-2027",
    "title": "Will Apple publicly announce a foldable iPhone before July 1, 2027?",
    "category": "Technology",
    "prior": 58,
    "closeAt": "2027-07-01T03:59:00Z",
    "resolutionRule": "YES if Apple officially announces an iPhone with a foldable display before the deadline.",
    "source": "https://www.apple.com/newsroom/",
    "oddsBasis": "Model prior based on current supply-chain reporting and timeline uncertainty."
  },
  {
    "id": "tesla-unsupervised-robotaxi-5cities",
    "title": "Will Tesla operate an unsupervised public robotaxi service in at least 5 U.S. cities before July 1, 2027?",
    "category": "Technology",
    "prior": 32,
    "closeAt": "2027-07-01T03:59:00Z",
    "resolutionRule": "YES if Tesla operates a paid, driverless public robotaxi service with no safety driver in at least five distinct U.S. cities before the deadline.",
    "source": "https://www.tesla.com/blog",
    "oddsBasis": "Model prior based on current rollout pace and regulatory uncertainty."
  },
  {
    "id": "starship14-launch-sep15",
    "title": "Will SpaceX Starship Flight Test 14 launch by September 15, 2026?",
    "category": "Space",
    "prior": 20,
    "closeAt": "2026-09-16T03:59:00Z",
    "resolutionRule": "YES if Starship Flight Test 14 lifts off by the deadline.",
    "source": "https://www.spacex.com/launches/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/spacex-starship-flight-test-14"
  },
  {
    "id": "starship14-launch-sep30",
    "title": "Will SpaceX Starship Flight Test 14 launch by September 30, 2026?",
    "category": "Space",
    "prior": 82,
    "closeAt": "2026-10-01T03:59:00Z",
    "resolutionRule": "YES if Starship Flight Test 14 lifts off by the deadline.",
    "source": "https://www.spacex.com/launches/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/spacex-starship-flight-test-14"
  },
  {
    "id": "starship14-launch-oct31",
    "title": "Will SpaceX Starship Flight Test 14 launch by October 31, 2026?",
    "category": "Space",
    "prior": 96,
    "closeAt": "2026-11-01T03:59:00Z",
    "resolutionRule": "YES if Starship Flight Test 14 lifts off by the deadline.",
    "source": "https://www.spacex.com/launches/",
    "oddsBasis": "Polymarket snapshot 2026-08-30: https://polymarket.com/event/spacex-starship-flight-test-14"
  },
  {
    "id": "starship14-splashdown",
    "title": "Will the Starship vehicle achieve a successful controlled splashdown on Flight Test 14?",
    "category": "Space",
    "prior": 86,
    "closeAt": "2026-11-01T03:59:00Z",
    "resolutionRule": "YES if the Starship upper stage completes the mission and achieves the planned controlled splashdown on Flight Test 14.",
    "source": "https://www.spacex.com/launches/",
    "oddsBasis": "Polymarket Flight 14 snapshot 2026-08-30: https://polymarket.com/event/spacex-starship-flight-test-14"
  },
  {
    "id": "starship14-booster-explodes",
    "title": "Will the Super Heavy booster explode during or after Flight Test 14 before controlled recovery is complete?",
    "category": "Space",
    "prior": 83,
    "closeAt": "2026-11-01T03:59:00Z",
    "resolutionRule": "YES if the Flight Test 14 Super Heavy booster experiences an explosion before its planned recovery sequence is complete.",
    "source": "https://www.spacex.com/launches/",
    "oddsBasis": "Polymarket Flight 14 snapshot 2026-08-30: https://polymarket.com/event/spacex-starship-flight-test-14"
  },
  {
    "id": "starship14-booster-catch",
    "title": "Will SpaceX catch the Super Heavy booster with the launch tower chopsticks on Flight Test 14?",
    "category": "Space",
    "prior": 5,
    "closeAt": "2026-11-01T03:59:00Z",
    "resolutionRule": "YES if the Flight Test 14 Super Heavy booster is successfully caught by the launch tower arms.",
    "source": "https://www.spacex.com/launches/",
    "oddsBasis": "Polymarket Flight 14 snapshot 2026-08-30: https://polymarket.com/event/spacex-starship-flight-test-14"
  },
  {
    "id": "starship14-ship-catch",
    "title": "Will SpaceX catch the Starship upper stage with launch-tower chopsticks on Flight Test 14?",
    "category": "Space",
    "prior": 4,
    "closeAt": "2026-11-01T03:59:00Z",
    "resolutionRule": "YES if the Flight Test 14 Starship upper stage is successfully caught by launch-tower arms.",
    "source": "https://www.spacex.com/launches/",
    "oddsBasis": "Polymarket Flight 14 snapshot 2026-08-30: https://polymarket.com/event/spacex-starship-flight-test-14"
  },
  {
    "id": "starship-florida-2026",
    "title": "Will Starship launch from Florida by December 31, 2026?",
    "category": "Space",
    "prior": 20,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if any Starship/Super Heavy stack successfully lifts off from a Florida launch pad by the deadline.",
    "source": "https://www.spacex.com/launches/",
    "oddsBasis": "Polymarket Florida launch snapshot 2026-08-30: https://polymarket.com/event/spacex-starship-florida-launch-by-20260617154757803"
  },
  {
    "id": "starship-florida-jun2027",
    "title": "Will Starship launch from Florida by June 30, 2027?",
    "category": "Space",
    "prior": 76,
    "closeAt": "2027-07-01T03:59:00Z",
    "resolutionRule": "YES if any Starship/Super Heavy stack successfully lifts off from a Florida launch pad by the deadline.",
    "source": "https://www.spacex.com/launches/",
    "oddsBasis": "Polymarket Florida launch snapshot 2026-08-30: https://polymarket.com/event/spacex-starship-florida-launch-by-20260617154757803"
  },
  {
    "id": "newglenn-return-2026",
    "title": "Will Blue Origin’s New Glenn return to flight before the end of 2026?",
    "category": "Space",
    "prior": 68,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if a New Glenn vehicle launches on an orbital mission before the end of 2026.",
    "source": "https://www.blueorigin.com/news/new-glenn-return-to-flight",
    "oddsBasis": "Model prior anchored to Blue Origin's official stated goal to return to flight in 2026 after the May hotfire anomaly."
  },
  {
    "id": "newglenn-booster-land-2026",
    "title": "Will New Glenn successfully land a first stage on a mission launched before the end of 2026?",
    "category": "Space",
    "prior": 42,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if a New Glenn mission launched before the end of 2026 includes a successful controlled first-stage landing on the recovery platform.",
    "source": "https://www.blueorigin.com/new-glenn",
    "oddsBasis": "Model prior reflecting return-to-flight uncertainty plus prior successful booster recovery."
  },
  {
    "id": "artemis3-launch-2027",
    "title": "Will NASA launch Artemis III during calendar year 2027?",
    "category": "Space",
    "prior": 72,
    "closeAt": "2028-01-01T04:59:00Z",
    "resolutionRule": "YES if NASA's Artemis III SLS/Orion mission launches before January 1, 2028.",
    "source": "https://www.nasa.gov/mission/artemis-iii/",
    "oddsBasis": "NASA currently lists Artemis III as a 2027 crewed demonstration mission; prior discounts schedule slip risk."
  },
  {
    "id": "artemis3-docking-demo",
    "title": "Will Artemis III complete a crewed rendezvous and docking demonstration with a commercial lunar-lander test article?",
    "category": "Space",
    "prior": 62,
    "closeAt": "2028-01-31T04:59:00Z",
    "resolutionRule": "YES if NASA reports Artemis III successfully completed an in-space crewed rendezvous and docking demonstration with a qualifying commercial HLS test vehicle.",
    "source": "https://www.nasa.gov/missions/artemis/artemis-3/nasa-outlines-preliminary-artemis-iii-mission-plans/",
    "oddsBasis": "NASA's published Artemis III objectives plus execution risk."
  },
  {
    "id": "artemis4-launch-2028",
    "title": "Will NASA launch Artemis IV during calendar year 2028?",
    "category": "Space",
    "prior": 52,
    "closeAt": "2029-01-01T04:59:00Z",
    "resolutionRule": "YES if NASA's Artemis IV mission launches before January 1, 2029.",
    "source": "https://www.nasa.gov/event-type/launch-schedule/",
    "oddsBasis": "NASA lists Artemis IV for early 2028; prior discounts historical schedule risk."
  },
  {
    "id": "blue-moon-mk1-2026",
    "title": "Will Blue Origin launch a Blue Moon Mark 1 lunar mission before the end of 2026?",
    "category": "Space",
    "prior": 48,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if a Blue Origin Blue Moon Mark 1 lunar lander mission launches before January 1, 2027.",
    "source": "https://www.nasa.gov/event-type/launch-schedule/",
    "oddsBasis": "NASA launch schedule lists a 2026 Blue Moon Mark 1 mission; prior discounts launch-provider and schedule risk."
  },
  {
    "id": "im3-launch-2026",
    "title": "Will Intuitive Machines IM-3 launch before the end of 2026?",
    "category": "Space",
    "prior": 64,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if the Intuitive Machines IM-3 lunar mission launches before January 1, 2027.",
    "source": "https://www.nasa.gov/event-type/launch-schedule/",
    "oddsBasis": "NASA launch schedule lists IM-3 in 2026; prior discounts mission schedule risk."
  },
  {
    "id": "blue-ghost2-launch-2026",
    "title": "Will Firefly Aerospace Blue Ghost Mission 2 launch before the end of 2026?",
    "category": "Space",
    "prior": 61,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if Blue Ghost Mission 2 launches before January 1, 2027.",
    "source": "https://www.nasa.gov/event-type/launch-schedule/",
    "oddsBasis": "NASA launch schedule lists Blue Ghost Mission 2 in 2026; prior discounts schedule risk."
  },
  {
    "id": "starliner1-launch-2026",
    "title": "Will Boeing Starliner-1 launch before the end of 2026?",
    "category": "Space",
    "prior": 22,
    "closeAt": "2027-01-01T04:59:00Z",
    "resolutionRule": "YES if NASA/Boeing's Starliner-1 operational mission launches before January 1, 2027.",
    "source": "https://www.nasa.gov/event-type/launch-schedule/",
    "oddsBasis": "NASA schedule currently lists Starliner-1 as under review; conservative prior."
  },
  {
    "id": "crew13-by-sep20",
    "title": "Will NASA’s SpaceX Crew-13 launch by September 20, 2026?",
    "category": "Space",
    "prior": 74,
    "closeAt": "2026-09-21T03:59:00Z",
    "resolutionRule": "YES if NASA's SpaceX Crew-13 mission launches by the deadline.",
    "source": "https://www.nasa.gov/event-type/launch-schedule/",
    "oddsBasis": "NASA lists Crew-13 no earlier than September 12, 2026; prior discounts ordinary schedule slips."
  },
  {
    "id": "progress96-sep9",
    "title": "Will Roscosmos Progress 96 launch on September 9, 2026?",
    "category": "Space",
    "prior": 67,
    "closeAt": "2026-09-10T03:59:00Z",
    "resolutionRule": "YES if Progress 96 launches on calendar date September 9, 2026 UTC.",
    "source": "https://www.nasa.gov/event-type/launch-schedule/",
    "oddsBasis": "NASA lists a targeted September 9, 2026 launch; prior discounts routine slip risk."
  },
  {
    "id": "sb61-halftime-dua-lipa",
    "title": "Will Dua Lipa perform live during the Super Bowl LXI halftime show?",
    "category": "Culture",
    "prior": 26,
    "closeAt": "2027-02-15T04:00:00Z",
    "resolutionRule": "YES if Dua Lipa performs live and in person as part of the official Super Bowl LXI halftime show; otherwise NO.",
    "source": "https://www.nfl.com/super-bowl/",
    "oddsBasis": "Polymarket halftime-show snapshot 2026-08-30: https://polymarket.com/event/who-will-perform-at-the-2027-big-game-halftime-show"
  },
  {
    "id": "sb61-halftime-justin-bieber",
    "title": "Will Justin Bieber perform live during the Super Bowl LXI halftime show?",
    "category": "Culture",
    "prior": 24,
    "closeAt": "2027-02-15T04:00:00Z",
    "resolutionRule": "YES if Justin Bieber performs live and in person as part of the official Super Bowl LXI halftime show; otherwise NO.",
    "source": "https://www.nfl.com/super-bowl/",
    "oddsBasis": "Polymarket halftime-show snapshot 2026-08-30: https://polymarket.com/event/who-will-perform-at-the-2027-big-game-halftime-show"
  },
  {
    "id": "sb61-halftime-olivia-rodrigo",
    "title": "Will Olivia Rodrigo perform live during the Super Bowl LXI halftime show?",
    "category": "Culture",
    "prior": 18,
    "closeAt": "2027-02-15T04:00:00Z",
    "resolutionRule": "YES if Olivia Rodrigo performs live and in person as part of the official Super Bowl LXI halftime show; otherwise NO.",
    "source": "https://www.nfl.com/super-bowl/",
    "oddsBasis": "Polymarket halftime-show snapshot 2026-08-30: https://polymarket.com/event/who-will-perform-at-the-2027-big-game-halftime-show"
  },
  {
    "id": "sb61-halftime-drake",
    "title": "Will Drake perform live during the Super Bowl LXI halftime show?",
    "category": "Culture",
    "prior": 15,
    "closeAt": "2027-02-15T04:00:00Z",
    "resolutionRule": "YES if Drake performs live and in person as part of the official Super Bowl LXI halftime show; otherwise NO.",
    "source": "https://www.nfl.com/super-bowl/",
    "oddsBasis": "Polymarket halftime-show snapshot 2026-08-30: https://polymarket.com/event/who-will-perform-at-the-2027-big-game-halftime-show"
  },
  {
    "id": "sb61-halftime-taylor-swift",
    "title": "Will Taylor Swift perform live during the Super Bowl LXI halftime show?",
    "category": "Culture",
    "prior": 10,
    "closeAt": "2027-02-15T04:00:00Z",
    "resolutionRule": "YES if Taylor Swift performs live and in person as part of the official Super Bowl LXI halftime show; otherwise NO.",
    "source": "https://www.nfl.com/super-bowl/",
    "oddsBasis": "Polymarket halftime-show snapshot 2026-08-30: https://polymarket.com/event/who-will-perform-at-the-2027-big-game-halftime-show"
  },
  {
    "id": "sb61-halftime-harry-styles",
    "title": "Will Harry Styles perform live during the Super Bowl LXI halftime show?",
    "category": "Culture",
    "prior": 9,
    "closeAt": "2027-02-15T04:00:00Z",
    "resolutionRule": "YES if Harry Styles performs live and in person as part of the official Super Bowl LXI halftime show; otherwise NO.",
    "source": "https://www.nfl.com/super-bowl/",
    "oddsBasis": "Polymarket halftime-show snapshot 2026-08-30: https://polymarket.com/event/who-will-perform-at-the-2027-big-game-halftime-show"
  },
  {
    "id": "sb61-halftime-kanye-west",
    "title": "Will Kanye West perform live during the Super Bowl LXI halftime show?",
    "category": "Culture",
    "prior": 3,
    "closeAt": "2027-02-15T04:00:00Z",
    "resolutionRule": "YES if Kanye West performs live and in person as part of the official Super Bowl LXI halftime show; otherwise NO.",
    "source": "https://www.nfl.com/super-bowl/",
    "oddsBasis": "Polymarket halftime-show snapshot 2026-08-30: https://polymarket.com/event/who-will-perform-at-the-2027-big-game-halftime-show"
  },
  {
    "id": "oscars27-bestpic-odyssey",
    "title": "Will The Odyssey win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 56,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if The Odyssey is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "oscars27-bestpic-dune3",
    "title": "Will Dune: Part Three win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 16,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if Dune: Part Three is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "oscars27-bestpic-la-bola-negra",
    "title": "Will La Bola Negra win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 10,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if La Bola Negra is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "oscars27-bestpic-wild-horse-nine",
    "title": "Will Wild Horse Nine win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 8,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if Wild Horse Nine is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "oscars27-bestpic-fjord",
    "title": "Will Fjord win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 6,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if Fjord is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "oscars27-bestpic-digger",
    "title": "Will Digger win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 5,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if Digger is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "oscars27-bestpic-project-hail-mary",
    "title": "Will Project Hail Mary win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 5,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if Project Hail Mary is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "oscars27-bestpic-avengers-doomsday",
    "title": "Will Avengers: Doomsday win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 2,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if Avengers: Doomsday is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "oscars27-bestpic-disclosure-day",
    "title": "Will Disclosure Day win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 2,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if Disclosure Day is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "oscars27-bestpic-josephine",
    "title": "Will Josephine win Best Picture at the 99th Academy Awards?",
    "category": "Culture",
    "prior": 1,
    "closeAt": "2027-03-15T06:00:00Z",
    "resolutionRule": "YES if Josephine is officially awarded Best Picture at the 99th Academy Awards; otherwise NO.",
    "source": "https://www.oscars.org/",
    "oddsBasis": "Polymarket Oscars Best Picture snapshot 2026-08-30: https://polymarket.com/event/oscars-2027-best-picture-winner-20260727173620857"
  },
  {
    "id": "gta6-by-sep30",
    "title": "Will GTA VI be officially released in the U.S. by September 30, 2026?",
    "category": "Culture",
    "prior": 1,
    "closeAt": "2026-10-01T03:59:00Z",
    "resolutionRule": "YES if GTA VI becomes publicly available for purchase/download in the U.S. by the deadline; early access/beta/leaks do not count.",
    "source": "https://www.rockstargames.com/VI",
    "oddsBasis": "Polymarket GTA VI release snapshot 2026-08-30: https://polymarket.com/event/gta-vi-released-before-november-2026"
  },
  {
    "id": "gta6-by-nov30",
    "title": "Will GTA VI be officially released in the U.S. by November 30, 2026?",
    "category": "Culture",
    "prior": 94,
    "closeAt": "2026-12-01T04:59:00Z",
    "resolutionRule": "YES if GTA VI becomes publicly available for purchase/download in the U.S. by the deadline; early access/beta/leaks do not count.",
    "source": "https://www.rockstargames.com/VI",
    "oddsBasis": "Polymarket GTA VI release snapshot 2026-08-30: https://polymarket.com/event/gta-vi-released-before-november-2026"
  },
  {
    "id": "gta6-price-100",
    "title": "Will the standard base edition of GTA VI launch at a U.S. MSRP of $100 or more?",
    "category": "Culture",
    "prior": 2,
    "closeAt": "2027-02-28T23:59:00Z",
    "resolutionRule": "YES if the officially announced U.S. MSRP for the standard base edition at launch is at least $100 before tax; deluxe/special editions do not count.",
    "source": "https://www.rockstargames.com/VI",
    "oddsBasis": "Polymarket GTA VI $100+ snapshot 2026-08-30: https://polymarket.com/event/will-gta-6-cost-100-245"
  }
];

function validate(m) {
  if(!m || typeof m.id!=='string' || !/^[a-z0-9-]+$/.test(m.id)) throw new Error(`Invalid id: ${m?.id}`);
  if(!['Sports','Politics','Economy','Markets','Technology','Space','Culture'].includes(m.category)) throw new Error(`Invalid category for ${m.id}`);
  if(!Number.isInteger(m.prior) || m.prior<1 || m.prior>99) throw new Error(`Invalid prior for ${m.id}`);
  const closeAtMs=Date.parse(m.closeAt);
  if(!Number.isFinite(closeAtMs)) throw new Error(`Invalid closeAt for ${m.id}`);
  if(typeof m.title!=='string'||m.title.length<10||m.title.length>220) throw new Error(`Invalid title for ${m.id}`);
  if(typeof m.resolutionRule!=='string'||m.resolutionRule.length<20||m.resolutionRule.length>700) throw new Error(`Invalid resolutionRule for ${m.id}`);
  try { const u=new URL(m.source); if(!['https:','http:'].includes(u.protocol)) throw new Error(); } catch { throw new Error(`Invalid source URL for ${m.id}`); }
  return closeAtMs;
}

(async()=>{
  const ids=new Set();
  const titles=new Set();
  for(const m of markets){
    validate(m);
    if(ids.has(m.id)) throw new Error(`Duplicate id in batch: ${m.id}`);
    const titleKey=m.title.trim().toLowerCase();
    if(titles.has(titleKey)) throw new Error(`Duplicate title in batch: ${m.title}`);
    ids.add(m.id);titles.add(titleKey);
  }

  const categoryCounts={};
  for(const m of markets) categoryCounts[m.category]=(categoryCounts[m.category]||0)+1;
  for(const category of ['Sports','Politics','Economy','Markets','Technology','Space','Culture']){
    if(categoryCounts[category]!==20) throw new Error(`Expected 20 ${category} markets, got ${categoryCounts[category]||0}`);
  }

  const now=Date.now();
  const refs=markets.map(m=>db.collection('markets').doc(m.id));
  const snaps=await db.getAll(...refs);
  const existing=new Set(snaps.filter(s=>s.exists).map(s=>s.id));
  const eligible=markets.filter(m=>!existing.has(m.id)&&Date.parse(m.closeAt)>now+60_000);
  const expired=markets.filter(m=>Date.parse(m.closeAt)<=now+60_000);

  console.log(`Batch ${BATCH_ID}: ${markets.length} curated markets`);
  console.log('Category counts:', categoryCounts);
  console.log(`Existing/skipped: ${existing.size}`);
  console.log(`Expired/skipped: ${expired.length}`);
  console.log(`Eligible to create: ${eligible.length}`);
  if(expired.length) console.log('Expired IDs:', expired.map(m=>m.id).join(', '));

  for(const m of eligible){
    console.log(`[DRY] ${m.category.padEnd(10)} ${String(m.prior).padStart(2)}%  ${m.id}  — ${m.title}`);
  }

  if(!APPLY){
    console.log('\nDry run only. Nothing was written.');
    console.log('Review the output, then run: node functions/seed-current-markets.js --apply');
    process.exit(0);
  }

  if(!eligible.length){
    console.log('Nothing new to create.');
    process.exit(0);
  }

  const batch=db.batch();
  const createdAt=FieldValue.serverTimestamp();
  for(const m of eligible){
    const ref=db.collection('markets').doc(m.id);
    const closeAtMs=Date.parse(m.closeAt);
    batch.set(ref,{
      title:m.title,
      category:m.category,
      prior:m.prior,
      priorLiquidity:2000,
      yesStake:0,
      noStake:0,
      status:'open',
      result:null,
      closeAt:new Date(closeAtMs),
      resolutionRule:m.resolutionRule,
      source:m.source,
      oddsBasis:m.oddsBasis,
      curatedBatch:BATCH_ID,
      researchedAtMs,
      createdAt,
      updatedAt:createdAt
    });
    batch.set(ref.collection('history').doc('open'),{
      timeMs:now,
      yesChance:m.prior,
      volume:0,
      previousYesChance:m.prior,
      previousVolume:0,
      kind:'open'
    });
  }
  await batch.commit();
  console.log(`Created ${eligible.length} markets and ${eligible.length} opening-history points atomically in one batch.`);
  process.exit(0);
})().catch(err=>{ console.error(err); process.exit(1); });
