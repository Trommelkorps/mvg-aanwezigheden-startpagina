'use strict';
const APP='https://script.google.com/macros/s/AKfycbygDSzaoeMC8hCQW9EIoBnunEMvwHPsRaud7bsLLekEzE9vCBDQ-wKjkH97pnEYXufOpw/exec',SITE='https://trommelkorps.github.io/mvg-aanwezigheden-startpagina/meldingen/',KEY='stk-definitief-meldingen-profiel',ACCESS='stk-definitief-toegang',APP_ID='9415e3c8-0b4b-4b73-95d4-c72e67563aca';
const $=id=>document.getElementById(id),validKey=k=>/^[a-f0-9]{64}$/i.test(k||''),validId=id=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id||'');
const appleMobile=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),homeScreen=navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;
const nativePush=typeof PushSubscriptionOptions!=='undefined'&&Object.prototype.hasOwnProperty.call(PushSubscriptionOptions.prototype,'applicationServerKey');
let member='',staff=false,sdk=null,supported=(!appleMobile||homeScreen)&&nativePush,servicePhase=supported?'laden':'niet-ondersteund',linking=false,linked='',linkError=false,attempt=null,manifestBlob='';
try{member=localStorage.getItem(KEY)||'';staff=localStorage.getItem(ACCESS)==='beheer';}catch(e){}if(!validKey(member))member='';
const incoming=new URLSearchParams(location.hash.slice(1)),incomingKey=incoming.get('lid');
if(validKey(incomingKey)&&(!member||member===incomingKey||confirm('Deze uitnodiging hoort bij een ander lid. Wil je op dit toestel die persoonlijke app openen?'))){staff=incoming.get('toegang')==='beheer'||(member===incomingKey&&staff);member=incomingKey;try{localStorage.setItem(KEY,member);localStorage.setItem(ACCESS,staff?'beheer':'lid');}catch(e){}}
const requestedEvent=new URLSearchParams(location.search).get('optreden')||'';
const profileNonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');let profileSource=null;
function personalStart(){return SITE+(member?'#lid='+encodeURIComponent(member)+(staff?'&toegang=beheer':''):'');}
function updateManifest(){const manifest={id:'/mvg-aanwezigheden-startpagina/meldingen/',name:'Met Vel en Gamel',short_name:'Met Vel en Gamel',start_url:personalStart(),scope:SITE,display:'standalone',background_color:'#f5f6f0',theme_color:'#235d49',icons:[{src:'https://trommelkorps.github.io/mvg-aanwezigheden-startpagina/aanwezigheden/apple-touch-icon-v2.png?icon=20261101',sizes:'1254x1254',type:'image/png',purpose:'any'}]};if(manifestBlob)URL.revokeObjectURL(manifestBlob);manifestBlob=URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'}));$('manifest').href=manifestBlob;}
updateManifest();
window.addEventListener('hashchange',()=>location.reload());
function appUrl(){const event=/^[A-Za-z0-9_-]{1,80}$/.test(requestedEvent);if(staff&&!event)return APP;return member?APP+'?page=planning&member='+encodeURIComponent(member)+(event?'&event='+encodeURIComponent(requestedEvent):''):APP;}
$('appFrame').src=appUrl();
$('openManagement').hidden=!staff;
function openManagement(){
 if(!confirm('Naar de beheerschermen? Bewaar eerst eventuele wijzigingen.'))return;
 profileSource=null;$('notifications').close();$('loadNotice').hidden=false;
 history.replaceState(null,'',personalStart());$('appFrame').src=APP;
}
$('openManagement').onclick=openManagement;$('managementLogin').onclick=openManagement;
const loadingTimer=setTimeout(()=>{if(!$('loadNotice').hidden)$('loadNotice').textContent='Het openen duurt langer. Controleer je verbinding. Blijft dit staan? Sluit de app en open het clubicoon opnieuw.';},30000);
function openNotifications(){if(!$('notifications').open)$('notifications').showModal();render();}
$('showNotifications').onclick=openNotifications;$('closeNotifications').onclick=()=>$('notifications').close();
function render(){const on=!!sdk?.User.PushSubscription.optedIn,id=sdk?.User.PushSubscription.id,current=member+'|'+id;$('enable').disabled=!sdk||!member||!supported;$('enable').hidden=on;$('disable').hidden=!on;$('retryLink').hidden=!(on&&member&&linkError&&!linking);$('installTip').hidden=supported;const status=$('pushStatus');status.dataset.error=linkError?'true':'false';if(!member)status.textContent='Open jouw persoonlijke uitnodiging van de administrator. Je profiel wordt dan vanzelf meegenomen. Je kunt de app wel al gebruiken.';else if(!supported)status.textContent=appleMobile&&!homeScreen?'Je iPhone opent deze pagina nog als browserpagina. Meldingen werken alleen in de app die via Zet op beginscherm is toegevoegd.':'Deze app krijgt op dit toestel geen toegang tot pushmeldingen. Je kunt de overige appfuncties gewoon gebruiken.';else if(!sdk)status.textContent=['verbroken','download-mislukt','opstart-mislukt'].includes(servicePhase)?'De meldingsdienst kon niet worden gestart. Tik op Meldingsdienst opnieuw laden. Je app en gegevens blijven behouden.':'De meldingsdienst wordt geladen. Je kunt de app intussen gebruiken.';else if(!on)status.textContent='Meldingen staan uit. Je kiest zelf of je ze inschakelt.';else if(linking)status.textContent='Je meldingen worden automatisch gekoppeld…';else if(linked===current)status.textContent='Meldingen zijn ingeschakeld en gekoppeld aan jouw profiel.';else if(linkError)status.textContent='Meldingen zijn toegestaan, maar de koppeling kon niet worden bevestigd. Tik op Opnieuw proberen.';else status.textContent='We wachten op je toestelregistratie…';$('retryService').hidden=!!sdk||!supported||!['verbroken','download-mislukt','opstart-mislukt'].includes(servicePhase);$('serviceCheck').textContent='Toestelcontrole: beginscherm '+(homeScreen?'ja':'nee')+' · push '+(nativePush?'beschikbaar':'niet beschikbaar')+' · dienst '+servicePhase;}
function googleOrigin(origin){try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||u.hostname.endsWith('-script.googleusercontent.com'));}catch(e){return false;}}
function registerDevice(){const id=sdk?.User.PushSubscription.id,on=!!sdk?.User.PushSubscription.optedIn;if(!member||!on||!validId(id)||linking||linked===member+'|'+id)return;linking=true;linkError=false;const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');const frame=document.createElement('iframe');frame.hidden=true;frame.title='Meldingen koppelen';frame.referrerPolicy='no-referrer';attempt={nonce,frame,key:member,id,timer:setTimeout(()=>finishLink(false),25000)};frame.src=APP+'?page=pushautomatisch&member='+encodeURIComponent(member)+'&subscription='+encodeURIComponent(id)+'&nonce='+nonce;document.body.append(frame);render();}
function finishLink(ok){if(!attempt)return;const current=attempt;clearTimeout(current.timer);current.frame.remove();attempt=null;linking=false;if(ok&&member===current.key&&sdk?.User.PushSubscription.optedIn&&sdk.User.PushSubscription.id===current.id){linked=member+'|'+current.id;linkError=false;}else linkError=true;render();}
window.addEventListener('message',e=>{
 if(!googleOrigin(e.origin)||!e.data||typeof e.data!=='object')return;
 if(e.data.type==='stk-app-ready'){
  clearTimeout(loadingTimer);$('loadNotice').hidden=true;
  if(!profileSource)profileSource=e.source;
  if(e.source===profileSource)e.source.postMessage({type:'stk-host-ready',nonce:profileNonce},e.origin);
 }
 if(e.data.type==='stk-own-profile'&&e.source===profileSource&&e.data.nonce===profileNonce&&validKey(e.data.key)){
  const key=e.data.key;if(member&&member!==key&&!confirm('Je bent aangemeld als een ander lid. Wil je dit toestel voor dat persoonlijke profiel gebruiken?'))return;
  const nextStaff=e.data.staff===true||(member===key&&staff),changed=member!==key||staff!==nextStaff;member=key;staff=nextStaff;$('openManagement').hidden=!staff;
  try{localStorage.setItem(KEY,member);localStorage.setItem(ACCESS,staff?'beheer':'lid');}catch(err){}
  if(changed){linked='';linkError=false;updateManifest();history.replaceState(null,'',SITE+location.search+'#lid='+encodeURIComponent(member)+(staff?'&toegang=beheer':''));}
  render();if(!linkError)registerDevice();
 }
 if(e.data.type==='stk-open-notifications')openNotifications();
 if(e.data.type==='stk-push-linked'&&attempt&&e.data.nonce===attempt.nonce)finishLink(e.data.ok===true);
});
$('retryLink').onclick=()=>{linkError=false;registerDevice();};
$('enable').onclick=async()=>{if(!sdk||!member)return;$('enable').disabled=true;try{await sdk.Notifications.requestPermission();if(sdk.Notifications.permission)await sdk.User.PushSubscription.optIn();registerDevice();}catch(e){$('pushStatus').textContent='Inschakelen is niet gelukt. Controleer de meldingsinstellingen van je telefoon.';return;}finally{$('enable').disabled=false;}render();};
$('disable').onclick=async()=>{if(!sdk)return;try{await sdk.User.PushSubscription.optOut();linked='';linkError=false;render();}catch(e){$('pushStatus').textContent='Uitschakelen is niet gelukt. Probeer opnieuw of gebruik je telefooninstellingen.';}};
$('retryService').onclick=()=>location.reload();
const serviceTimer=setTimeout(()=>{if(!sdk&&supported){servicePhase='verbroken';render();}},15000);
const sdkScript=document.getElementById('onesignalSdk');if(sdkScript)sdkScript.addEventListener('error',()=>{servicePhase='download-mislukt';render();});
window.OneSignalDeferred=window.OneSignalDeferred||[];OneSignalDeferred.push(async function(OneSignal){try{supported=(!appleMobile||homeScreen)&&OneSignal.Notifications.isPushSupported();if(!supported){servicePhase='niet-ondersteund';clearTimeout(serviceTimer);render();return;}servicePhase='verbinden';render();await OneSignal.init({appId:APP_ID,serviceWorkerPath:'/mvg-aanwezigheden-startpagina/meldingen/OneSignalSDKWorker.js',serviceWorkerParam:{scope:'/mvg-aanwezigheden-startpagina/meldingen/'},notifyButton:{enable:false},welcomeNotification:{disable:true},promptOptions:{slidedown:{prompts:[{type:'push',autoPrompt:false}]}}});clearTimeout(serviceTimer);servicePhase='klaar';sdk=OneSignal;const changed=()=>{render();if(!linkError)registerDevice();};sdk.User.PushSubscription.addEventListener('change',changed);sdk.Notifications.addEventListener('permissionChange',changed);changed();}catch(e){servicePhase='opstart-mislukt';clearTimeout(serviceTimer);render();}});render();
