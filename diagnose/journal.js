"use strict";
// Diagnostics journal: what was checked, on which unit, and the outcome.
MDPStore.ready.then(()=>{
const {KEYS,JOURNAL_RESULTS,validJournalEntry,normalize}=MDPLib;
let entries=MDPStore.get(KEYS.journal,[]);
if(!Array.isArray(entries))entries=[];
entries=entries.filter(validJournalEntry);
const save=()=>MDPStore.set(KEYS.journal,entries);
const PAGE=30;let shown=PAGE,pending=null,editingId=null;
const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const resultClass=r=>r==="Исправлено"?"ok":r==="Причина найдена"||r==="Нужна запчасть"?"mid":"bad";

$("journalResult").innerHTML=JOURNAL_RESULTS.map(r=>'<option>'+escapeHTML(r)+'</option>').join("");

function render(){
 const q=normalize($("journalFilter").value);
 const list=entries.filter(e=>!q||normalize([e.title,e.device,e.result,e.note,e.steps].join(" ")).includes(q));
 const devices=[...new Set(entries.map(e=>e.device).filter(Boolean))].slice(0,200);
 $("deviceList").replaceChildren(...devices.map(d=>{const o=document.createElement("option");o.value=d;return o}));
 if(!entries.length){$("journalList").innerHTML='<p class="empty">Журнал пуст.</p>';return}
 if(!list.length){$("journalList").innerHTML='<p class="empty">Ничего не найдено.</p>';return}
 $("journalList").innerHTML=list.slice(0,shown).map(e=>'<article class="card journalEntry">'+
  '<small>'+escapeHTML(new Date(e.date+"T12:00:00").toLocaleDateString("ru",{day:"numeric",month:"long",year:"numeric"}))+'</small>'+
  '<h3>'+escapeHTML(e.title)+'</h3>'+
  '<span class="badge '+resultClass(e.result)+'">'+escapeHTML(e.result)+'</span>'+
  (e.device?'<p><b>Аппарат:</b> '+escapeHTML(e.device)+'</p>':'')+
  (e.steps?'<p class="hint">'+escapeHTML(e.steps)+'</p>':'')+
  (e.note?'<p>'+escapeHTML(e.note)+'</p>':'')+
  '<div class="actions start"><button type="button" data-jshare="'+escapeHTML(e.id)+'">Отправить</button><button type="button" data-jedit="'+escapeHTML(e.id)+'">Изменить</button><button type="button" data-jdelete="'+escapeHTML(e.id)+'">Удалить</button></div></article>').join("")+
  (list.length>shown?'<button type="button" id="journalMore">Показать ещё ('+(list.length-shown)+')</button>':'');
}

function journalText(j){
 return [new Date(j.date+"T12:00:00").toLocaleDateString("ru",{day:"numeric",month:"long",year:"numeric"}),j.device&&"Аппарат: "+j.device,"Работа: "+j.title,"Результат: "+j.result,j.note].filter(Boolean).join("\n");
}
// opts: {title, device, steps, resettable, onSaved(resetSteps)}
function open(opts={}){
 pending=opts;editingId=opts.id||null;
 const f=$("journalForm");f.reset();
 const e=editingId&&entries.find(x=>x.id===editingId);
 $("journalDialogTitle").textContent=e?"Изменить запись":"Запись в журнал";
 f.elements.title.value=(e||opts).title||"";
 f.elements.device.value=(e||opts).device||"";
 f.elements.result.value=e?e.result:JOURNAL_RESULTS[0];
 f.elements.date.value=e?e.date:today();
 f.elements.note.value=e?e.note||"":"";
 $("journalResetWrap").hidden=!opts.resettable;
 $("journalDialog").showModal();
}
$("journalForm").onsubmit=ev=>{
 ev.preventDefault();const f=new FormData(ev.target),val=k=>String(f.get(k)||"").trim();
 const data={title:val("title"),device:val("device"),result:val("result"),date:val("date")||today(),note:val("note")};
 if(!data.title)return;
 if(editingId){const i=entries.findIndex(x=>x.id===editingId);if(i>=0)entries[i]={...entries[i],...data,updatedAt:new Date().toISOString()}}
 else{
  entries.unshift({id:"j-"+(crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)),...data,steps:pending?.steps||"",createdAt:new Date().toISOString()});
  entries.sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||"").localeCompare(a.createdAt||""));
 }
 save();const cb=pending?.onSaved,reset=f.get("resetSteps")==="on"&&!$("journalResetWrap").hidden;
 $("journalDialog").close();render();toast("Записано в журнал");
 if(cb)cb(reset);
};
$("journalCancel").onclick=()=>$("journalDialog").close();
$("journalDialog").addEventListener("close",()=>{pending=null;editingId=null});
$("addJournal").onclick=()=>open();
$("journalFilter").addEventListener("input",()=>{shown=PAGE;render()});
$("journalList").onclick=async e=>{
 const t=e.target.closest("[data-jedit],[data-jdelete],[data-jshare],#journalMore");if(!t)return;
 if(t.dataset.jshare){const j=entries.find(x=>x.id===t.dataset.jshare);if(j)shareText({title:j.title,text:journalText(j)});return}
 if(t.id==="journalMore"){shown+=PAGE;render();return}
 if(t.dataset.jedit)open({id:t.dataset.jedit});
 if(t.dataset.jdelete&&await ask("Удалить запись из журнала?")){entries=entries.filter(x=>x.id!==t.dataset.jdelete);save();render()}
};
$("navJournal").onclick=e=>{e.preventDefault();reveal($("journal"))};
self.MDPJournal={open};
render();
});
