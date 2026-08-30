import { getApps, getApp, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAnalytics, isSupported, logEvent } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js';

const firebaseConfig={
  apiKey:'AIzaSyDXr4ryOOT-OHX1np8KIPER6_Nk60okylw',
  authDomain:'freemarket-68274.firebaseapp.com',
  projectId:'freemarket-68274',
  storageBucket:'freemarket-68274.firebasestorage.app',
  messagingSenderId:'130108525153',
  appId:'1:130108525153:web:69fcce32c2f6eefbb93820',
  measurementId:'G-F6N8GLFK45'
};

const analyticsReady=(async()=>{
  try{
    if(!(await isSupported()))return null;
    const app=getApps().length?getApp():initializeApp(firebaseConfig);
    return getAnalytics(app);
  }catch(e){
    console.warn('Analytics unavailable',e);
    return null;
  }
})();

window.proboraTrack=(name,params={})=>{
  analyticsReady.then(analytics=>{
    if(!analytics)return;
    try{logEvent(analytics,String(name),params);}catch(e){console.warn('Analytics event failed',e);}
  });
};
