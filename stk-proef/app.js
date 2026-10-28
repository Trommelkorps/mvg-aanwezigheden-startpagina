(function(root){
'use strict';
const DEFAULT_APP='https://script.google.com/macros/s/AKfycbxnL7qtYthP6Cdq-KMdIrxgqsJ0RY2p94NK91jQ2plsF_qxlpAEZtspJ90lxfMD-ns7/exec';
const config=root.STK_PUSH_CONFIG||{},APP=config.testAppUrl||DEFAULT_APP,KEY='stk-push-profiel';
function validProfile(p){return !!p&&/^[a-f0-9]{64}$/i.test(p.member||'')&&p.app===APP;}
function parseProfile(text){const u=new URL(text);const member=u.searchParams.get('member');u.search='';u.hash='';const p={member,app:u.href};if(!validProfile(p))throw Error('Gebruik je persoonlijke STK-lidlink van het bestuur.');return p;}
function personalUrl(p,event){if(!validProfile(p))throw Error('Koppel eerst je persoonlijke lidlink.');const u=new URL(p.app);u.searchParams.set('page','planning');u.searchParams.set('member',p.member);if(event&&/^[A-Za-z0-9_-]{1,80}$/.test(event))u.searchParams.set('event',event);return u.href;}
function registrationUrl(p,id){if(!validProfile(p)||!/^[a-f0-9-]{36}$/i.test(id||''))return '';const u=new URL(p.app);u.searchParams.set('page','pushkoppelen');u.searchParams.set('member',p.member);u.searchParams.set('subscription',id);return u.href;}
if(typeof module!=='undefined'&&module.exports)module.exports={validProfile,parseProfile,personalUrl,registrationUrl};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);let profile=null,sdk=null,view='',personalLoaded='',staffLoaded=false;
try{const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(validProfile(stored))profile=stored;}catch{}
function saveProfile(p){if(!validProfile(p))throw Error('Deze persoonlijke link hoort niet bij de STK-app.');const previous=profile;try{localStorage.setItem(KEY,JSON.stringify(p));}catch{throw Error('Je browser kan de lidlink niet bewaren. Gebruik een normaal browservenster en probeer opnieuw.');}profile=p;if(!previous||previous.member!==p.member){$('personalFrame').removeAttribute('src');personalLoaded='';} $('personalLink').value='';renderProfile();show('mine');}
const fragment=new URLSearchParams(location.hash.slice(1));let fragmentError='';
if(fragment.has('member')){const p={member:fragment.get('member'),app:fragment.get('app')};if(validProfile(p)){profile=p;try{localStorage.setItem(KEY,JSON.stringify(p));}catch{fragmentError='Bewaar je lidlink hieronder om ze na het sluiten te kunnen blijven gebruiken.';}}else fragmentError='Deze persoonlijke link is niet geldig voor deze STK-app.';history.replaceState(null,'',location.pathname+location.search);}
const event=new URLSearchParams(location.search).get('optreden')||'';
function renderProfile(){const has=!!profile;$('connectHelp').hidden=has;$('personalFrame').hidden=!has;$('personalTools').hidden=!has;$('profileStatus').textContent=has?'Je persoonlijke lidlink is op dit toestel bewaard.':'Je persoonlijke lidlink is nog niet gekoppeld.';const id=sdk?.User.PushSubscription.id,on=!!sdk?.User.PushSubscription.optedIn,url=has&&on?registrationUrl(profile,id):'';$('registerDevice').hidden=!url;if(url)$('registerDevice').href=url;$('linkHint').textContent=has?'Wil je meldingen ontvangen? Schakel ze in en bevestig daarna de toestelkoppeling.':'Plak hieronder de persoonlijke lidlink die je van het bestuur kreeg.';}
function show(next){if(!['mine','notifications','staff','register'].includes(next))return;view=next;for(const el of document.querySelectorAll('[data-view]'))el.hidden=el.dataset.view!==next;for(const b of document.querySelectorAll('[data-nav]')){const active=b.dataset.nav===next;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');}$('screenTitle').textContent={mine:'Mijn optredens',notifications:'Meldingen en instellingen',staff:'Aanwezigheden en bestuur',register:'Toestel koppelen'}[next];
 if(next==='mine'&&profile){const url=personalUrl(profile,event);if(personalLoaded!==url){$('personalFrame').src=url;personalLoaded=url;}}
 if(next==='staff'&&!staffLoaded){$('staffFrame').src=APP;staffLoaded=true;}
 if(next!=='register')$('registrationFrame').removeAttribute('src');
}
for(const b of document.querySelectorAll('[data-nav]'))b.onclick=()=>show(b.dataset.nav);
$('connectButton').onclick=()=>{show('notifications');$('personalLink').focus();};
$('saveProfile').onclick=()=>{try{saveProfile(parseProfile($('personalLink').value.trim()));$('formMessage').textContent='Lidlink bewaard. Je persoonlijke planning wordt geopend.';}catch(e){$('formMessage').textContent=e.message;}};
$('personalLink').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('saveProfile').click();}});
$('registerDevice').onclick=e=>{e.preventDefault();if(!sdk?.User.PushSubscription.optedIn)return;const url=registrationUrl(profile,sdk.User.PushSubscription.id);if(!url)return;show('register');$('registrationFrame').src=url;};
$('backSettings').onclick=()=>show('notifications');
$('reloadPersonal').onclick=()=>{if(profile){personalLoaded='';show('mine');}};
$('reloadStaff').onclick=()=>{staffLoaded=false;show('staff');};
renderProfile();if(fragmentError)$('formMessage').textContent=fragmentError;
let preferred='mine';try{if(localStorage.getItem('stk-start-weergave')==='staff')preferred='staff';}catch{}
$('rememberStaff').onchange=()=>{try{if($('rememberStaff').checked)localStorage.setItem('stk-start-weergave','staff');else localStorage.removeItem('stk-start-weergave');}catch{}};
$('rememberStaff').checked=preferred==='staff';
const requestView=new URLSearchParams(location.search).get('onderdeel');show(event||fragment.has('member')?'mine':requestView==='aanwezigheden'?'staff':preferred);
function showPush(){const on=!!sdk.User.PushSubscription.optedIn;$('pushStatus').textContent=on?'Meldingen zijn ingeschakeld op dit toestel.':'Meldingen zijn uitgeschakeld op dit toestel.';$('enable').hidden=on;$('disable').hidden=!on;$('enable').disabled=false;$('disable').disabled=false;renderProfile();}
$('enable').onclick=async()=>{if(!sdk)return;$('enable').disabled=true;try{await sdk.Notifications.requestPermission();if(sdk.Notifications.permission)await sdk.User.PushSubscription.optIn();showPush();if(!sdk.Notifications.permission)$('pushStatus').textContent='Er is geen toestemming gegeven. Controleer de meldingsinstellingen van je browser of telefoon.';}catch{$('pushStatus').textContent='Inschakelen is niet gelukt. Controleer je browserinstellingen en probeer opnieuw.';}finally{$('enable').disabled=false;}};
$('disable').onclick=async()=>{if(!sdk)return;$('disable').disabled=true;try{await sdk.User.PushSubscription.optOut();showPush();}catch{$('pushStatus').textContent='Uitschakelen is niet gelukt. Je kunt meldingen ook uitzetten via de telefooninstellingen.';}finally{$('disable').disabled=false;}};
root.OneSignalDeferred=root.OneSignalDeferred||[];
root.OneSignalDeferred.push(async function(OneSignal){try{if(!OneSignal.Notifications.isPushSupported()){$('pushStatus').textContent='Meldingen zijn hier niet beschikbaar. Op iPhone: voeg deze app via Safari toe aan je beginscherm en open ze via dat icoon. Je kunt de planning wel blijven gebruiken.';return;}const base=new URL('./',location.href).pathname;await OneSignal.init({appId:config.appId,serviceWorkerPath:base+'OneSignalSDKWorker.js',serviceWorkerParam:{scope:base},notifyButton:{enable:false},welcomeNotification:{disable:true},promptOptions:{slidedown:{prompts:[{type:'push',autoPrompt:false}]}}});sdk=OneSignal;showPush();OneSignal.User.PushSubscription.addEventListener('change',showPush);}catch{$('pushStatus').textContent='De meldingsdienst kon niet worden gestart. De planning blijft bereikbaar. Probeer later opnieuw.';}});
const script=document.createElement('script');script.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';script.defer=true;script.onerror=()=>{$('pushStatus').textContent='De meldingsdienst kon niet geladen worden. Je kunt de planning blijven gebruiken.';};document.head.append(script);
})(typeof window!=='undefined'?window:globalThis);
