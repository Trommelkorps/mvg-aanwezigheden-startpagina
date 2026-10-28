(function(root){
'use strict';
const APP='https://script.google.com/macros/s/AKfycbxnL7qtYthP6Cdq-KMdIrxgqsJ0RY2p94NK91jQ2plsF_qxlpAEZtspJ90lxfMD-ns7/exec',SITE='https://trommelkorps.github.io/mvg-aanwezigheden-startpagina/stk-proef/';
function validMessage(data){return !!data&&data.type==='STK_SHARE_INVITATION_V1'&&typeof data.requestId==='string'&&/^[A-Za-z0-9-]{1,80}$/.test(data.requestId)&&typeof data.name==='string'&&data.name.length>0&&data.name.length<=150&&typeof data.text==='string'&&data.text.length<12000&&data.text.includes(SITE)&&data.text.includes(APP+'?page=planning&member=')&&/member=[a-f0-9]{64}(?:\s|$)/i.test(data.text);}
function staffSource(source,staff){if(!source||!staff)return false;let current=source;try{for(let i=0;i<8;i++){if(current===staff)return true;const parent=current.parent;if(!parent||parent===current)return false;current=parent;}}catch{}return false;}
if(typeof module!=='undefined'&&module.exports)module.exports={validMessage,staffSource};
if(typeof document==='undefined')return;
let openDialog=null;
root.addEventListener('message',e=>{
 if(!/^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/i.test(e.origin))return;
 const staff=document.getElementById('staffFrame');if(!staff||!staffSource(e.source,staff.contentWindow)||!validMessage(e.data))return;
 if(openDialog){openDialog.close();openDialog.remove();}
 const data=e.data,dialog=document.createElement('dialog');openDialog=dialog;dialog.className='shareDialog';
 const heading=document.createElement('h2');heading.textContent='Uitnodiging voor '+data.name;
 const intro=document.createElement('p');intro.textContent='Deel dit bericht alleen met '+data.name+'. Kies hieronder Delen om het deelmenu van je telefoon te openen.';
 const area=document.createElement('textarea');area.readOnly=true;area.value=data.text;area.setAttribute('aria-label','Uitnodiging met app-link en persoonlijke lidlink');
 const actions=document.createElement('div');actions.className='shareActions';
 const share=document.createElement('button');share.type='button';share.className='primary';share.textContent='Delen via WhatsApp of andere app';share.hidden=typeof navigator.share!=='function';
 const copy=document.createElement('button');copy.type='button';copy.textContent='Bericht kopiëren';
 const close=document.createElement('button');close.type='button';close.textContent='Sluiten';
 const status=document.createElement('p');status.setAttribute('role','status');
 actions.append(share,copy,close);dialog.append(heading,intro,area,actions,status);document.body.append(dialog);
 function cleanup(){area.value='';dialog.remove();if(openDialog===dialog)openDialog=null;}
 dialog.addEventListener('close',cleanup);close.onclick=()=>dialog.close();
 share.onclick=async()=>{try{await navigator.share({title:'STK-uitnodiging voor '+data.name,text:area.value});status.textContent='Het deelmenu is afgerond.';}catch(err){if(err.name!=='AbortError')status.textContent='Delen lukt niet op dit toestel. Kies Bericht kopiëren en plak de tekst zelf in een persoonlijk bericht.';}};
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(area.value);status.textContent='Bericht gekopieerd. Plak het in een persoonlijk bericht aan '+data.name+'.';}catch{area.focus();area.select();status.textContent='Kopieer de geselecteerde tekst handmatig en plak ze in een persoonlijk bericht.';}};
 dialog.showModal();
 e.source.postMessage({type:'STK_SHARE_ACK_V1',requestId:data.requestId},e.origin);
 });
})(typeof window!=='undefined'?window:globalThis);