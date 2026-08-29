const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const uid=process.argv[2];
if(!uid){
  console.error('Usage: node set-admin.js <FIREBASE_UID>');
  process.exit(1);
}

initializeApp({credential:applicationDefault()});

getAuth().setCustomUserClaims(uid,{admin:true})
  .then(()=>{
    console.log(`Admin claim enabled for ${uid}. Sign out and back in so the new token is loaded.`);
    process.exit(0);
  })
  .catch(err=>{
    console.error(err);
    process.exit(1);
  });
