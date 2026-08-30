// Probora analytics: direct Google Analytics 4 tag.
// No email addresses, Firebase UIDs, or other account identifiers are sent by custom events.
(function(){
  'use strict';

  const MEASUREMENT_ID='G-F6N8GLFK45';

  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};

  if(!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}"]`)){
    const script=document.createElement('script');
    script.async=true;
    script.src=`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  if(!window.__proboraGa4Configured){
    window.__proboraGa4Configured=true;
    window.gtag('js',new Date());
    window.gtag('config',MEASUREMENT_ID);
  }

  window.proboraTrack=(name,params={})=>{
    try{
      window.gtag('event',String(name),params);
    }catch(e){
      console.warn('Analytics event failed',e);
    }
  };
})();
