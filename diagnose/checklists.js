"use strict";
MDPStore.ready.then(()=>{
const {KEYS,validChecklist,mergeChecklistSteps}=MDPLib;
let editing=-1;
let records=MDPStore.get(KEYS.checklists,[]);
if(!Array.isArray(records))records=[];
records=records.filter(validChecklist);
const save=()=>MDPStore.set(KEYS.checklists,records);
const render=()=>{
 $("checklistItems").innerHTML=records.length?records.map((r,i)=>{
  const done=r.steps.filter(s=>s.done).length;
  return '<article class="card">'+(r.model?'<small>'+escapeHTML(r.model)+'</small>':'')+'<h3>'+escapeHTML(r.name)+'</h3><p>'+done+' из '+r.steps.length+' проверено</p>'+
  r.steps.map((s,j)=>'<label class="step-check"><input type="checkbox" data-i="'+i+'" data-j="'+j+'" '+(s.done?'checked':'')+'> '+escapeHTML(s.text)+'</label>').join("")+
  '<div class="actions start">'+(done?'<button type="button" data-finish="'+i+'">Завершить</button><button type="button" data-reset="'+i+'">Сбросить</button>':'')+'<button type="button" data-edit="'+i+'">Изменить</button><button type="button" data-remove="'+i+'">Удалить</button></div></article>';
 }).join(""):'<p class="empty">Добавьте собственный диагностический сценарий.</p>';
};
$("checklistForm").onsubmit=e=>{
 e.preventDefault();const f=new FormData(e.target);
 const name=String(f.get("name")).trim(),steps=String(f.get("steps")).split("\n").map(x=>x.trim()).filter(Boolean);
 if(!name||!steps.length)return;
 const model=String(f.get("model")).trim();
 if(editing>=0&&records[editing])records[editing]={...records[editing],name,model,steps:mergeChecklistSteps(records[editing].steps,steps)};
 else records.unshift({name,model,steps:steps.map(text=>({text,done:false}))});
 save();stopEditing();render();toast("Сценарий сохранён");
};
function stopEditing(){editing=-1;$("checklistForm").reset();$("cancelChecklistEdit").hidden=true;$("checklistSubmit").textContent="Сохранить сценарий"}
$("cancelChecklistEdit").onclick=stopEditing;
$("checklistItems").onchange=e=>{const i=Number(e.target.dataset.i),j=Number(e.target.dataset.j);if(records[i]?.steps[j]){records[i].steps[j].done=e.target.checked;save();render()}};
$("checklistItems").onclick=async e=>{
 const reset=e.target.closest("[data-reset]"),remove=e.target.closest("[data-remove]"),edit=e.target.closest("[data-edit]"),finish=e.target.closest("[data-finish]");
 if(edit){const r=records[Number(edit.dataset.edit)];if(!r)return;editing=Number(edit.dataset.edit);const f=$("checklistForm");f.elements.name.value=r.name;f.elements.model.value=r.model||"";f.elements.steps.value=r.steps.map(s=>s.text).join("\n");$("cancelChecklistEdit").hidden=false;$("checklistSubmit").textContent="Сохранить изменения";reveal(f);return}
 if(finish){const i=Number(finish.dataset.finish),r=records[i];if(!r)return;MDPJournal.open({title:r.name,device:r.model,steps:"Сценарий: проверено "+r.steps.filter(s=>s.done).length+" из "+r.steps.length,resettable:true,onSaved:reset=>{if(reset&&records[i]===r){r.steps.forEach(s=>s.done=false);save();render()}}});return}
 if(reset){records[Number(reset.dataset.reset)]?.steps.forEach(s=>s.done=false);save();render()}
 if(remove&&await ask("Удалить сценарий?")){records.splice(Number(remove.dataset.remove),1);if(editing>=0)stopEditing();save();render()}
};
render();
});
