"use strict";
// Guided algorithms are user-authored; no unverified model-specific readings are supplied.
MDPStore.ready.then(()=>{
const {KEYS,validGuide,parseSteps,stepsToText}=MDPLib;
const safe=escapeHTML;
let guides=MDPStore.get(KEYS.guides,[]),progress=MDPStore.get(KEYS.progress,{});
if(!Array.isArray(guides))guides=[];
guides=guides.filter(validGuide);
if(!progress||typeof progress!=="object"||Array.isArray(progress))progress={};
for(const id of Object.keys(progress))if(!Array.isArray(progress[id]))delete progress[id];
const persist=()=>{MDPStore.set(KEYS.guides,guides);MDPStore.set(KEYS.progress,progress)};
let active=null,editingGuide=null;
// Built-in algorithms (algorithms.js) are read-only; progress is kept like for own ones.
const builtins=self.MDPAlgorithms||[];
const findGuide=id=>guides.find(x=>x.id===id)||builtins.find(x=>x.id===id);
const doneCount=g=>(progress[g.id]||[]).slice(0,g.steps.length).filter(Boolean).length;

function draw(){
 const cats=[...new Set(builtins.map(a=>a.category))];
 $("builtinGuides").innerHTML=cats.map(c=>'<p class="groupLabel">'+safe(c)+'</p>'+builtins.filter(a=>a.category===c).map(a=>{const d=doneCount(a);return '<button type="button" class="measureItem" data-open-guide="'+a.id+'"><strong>'+safe(a.title)+'</strong><span>'+a.steps.filter(s=>s.yes).length+' проверок'+(d?' · отмечено '+d:'')+'</span></button>'}).join("")).join("");
 $("builtinCount").textContent=builtins.length;
 $("guideList").innerHTML=guides.length?guides.map(g=>'<article class="card"><small>'+safe([g.category,g.brand,g.model].filter(Boolean).join(" · "))+'</small><h3>'+safe(g.title)+'</h3><p>'+g.steps.length+' шаг(ов), выполнено '+doneCount(g)+'</p><div class="actions start"><button type="button" class="primary" data-open-guide="'+safe(g.id)+'">Открыть</button><button type="button" data-edit-guide="'+safe(g.id)+'">Изменить</button><button type="button" data-remove-guide="'+safe(g.id)+'">Удалить</button></div></article>').join(""):'<p class="empty">Своих алгоритмов пока нет. Создайте кнопкой «+ Алгоритм» или скопируйте готовый.</p>';
}
function updateProgress(g){$("guideProgress").textContent=g.builtin?"Готовый алгоритм · "+g.category+". Отвечайте «исправно / неисправно» — приложение покажет следующий шаг.":doneCount(g)+" из "+g.steps.length+" шагов проверено"}
function drawSteps(){
 const g=findGuide(active);if(!g)return;
 $("guideTitle").textContent=g.title;
 $("copyGuide").hidden=!g.builtin;
 $("guideSteps").innerHTML=g.steps.map((s,i)=>{
  const checked=!!progress[g.id]?.[i],end=!s.yes&&!s.no&&g.builtin;
  return '<article class="card'+(end?' conclusion':'')+'" id="guide-step-'+i+'"><h3>'+(end?'':'Шаг '+(i+1)+': ')+safe(s.title)+'</h3>'+(s.instruction?'<p>'+safe(s.instruction)+'</p>':'')+
  (s.measure&&self.MDPMeasureUI?.has(s.measure)?'<div class="measureLinks"><button type="button" data-measure="'+safe(s.measure)+'">📏 Как замерить: '+safe(MDPMeasureUI.title(s.measure))+'</button></div>':'')+
  (s.mode?'<p><b>Режим мультиметра:</b> '+safe(s.mode)+'</p>':'')+
  (s.points?'<p><b>Куда поставить щупы:</b> '+safe(s.points)+'</p>':'')+
  (s.expected?'<p><b>Ожидаемый результат:</b> '+safe(s.expected)+'</p>':'')+
  (s.image&&/^https:\/\//i.test(s.image)?'<img class="guide-image" loading="lazy" alt="Иллюстрация к шагу '+(i+1)+'" src="'+safe(s.image)+'">':'')+
  (end?'':'<label class="step-check"><input type="checkbox" data-step="'+i+'" '+(checked?'checked':'')+'> Проверено</label>')+
  (s.yes||s.no?'<div class="actions start">'+(s.yes?'<button type="button" class="okBtn" data-answer="'+i+'" data-value="yes">'+safe(s.yesLabel||"Да / исправно")+' → '+(g.builtin?jumpName(g,s.yes):"шаг "+s.yes)+'</button>':'')+(s.no?'<button type="button" class="badBtn" data-answer="'+i+'" data-value="no">'+safe(s.noLabel||"Нет")+' → '+(g.builtin?jumpName(g,s.no):"шаг "+s.no)+'</button>':'')+'</div>':'')+'</article>';
 }).join("");
 updateProgress(g);
 if(!$("guideDialog").open)$("guideDialog").showModal();
}
const jumpName=(g,n)=>{const t=g.steps[n-1];return t&&!t.yes&&!t.no?"вывод":"шаг "+n};
function openGuideEditor(id=null){
 const g=id&&guides.find(x=>x.id===id);editingGuide=g?g.id:null;
 const f=$("guideForm");f.reset();
 $("guideEditorTitle").textContent=g?"Изменить алгоритм":"Новый алгоритм";
 if(g){for(const k of ["title","category","brand","model"])f.elements[k].value=g[k]||"";f.elements.steps.value=stepsToText(g.steps)}
 $("guideEditor").showModal();
}
$("newGuide").onclick=()=>openGuideEditor();
$("guideEditor").addEventListener("close",()=>{editingGuide=null});
$("copyGuide").onclick=()=>{
 const g=builtins.find(x=>x.id===active);if(!g)return;
 const copy={id:crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2),title:g.title+" (моя копия)",category:g.category,brand:"",model:"",steps:JSON.parse(JSON.stringify(g.steps))};
 guides.unshift(copy);persist();$("guideDialog").close();draw();openGuideEditor(copy.id);toast("Скопировано в мои алгоритмы — можно править");
};
$("finishGuide").onclick=()=>{
 const g=findGuide(active);if(!g)return;
 MDPJournal.open({title:g.title,device:[g.brand,g.model].filter(Boolean).join(" "),steps:"Алгоритм: проверено "+doneCount(g)+" из "+g.steps.length+" шагов",resettable:true,
  onSaved:reset=>{if(reset){delete progress[g.id];persist()}$("guideDialog").close()}});
};
$("closeGuideEditor").onclick=()=>$("guideEditor").close();
$("closeGuide").onclick=()=>$("guideDialog").close();
$("guideDialog").addEventListener("close",draw);
$("resetGuide").onclick=async()=>{if(active&&await ask("Снять все отметки в этом алгоритме?")){delete progress[active];persist();drawSteps()}};
$("guideForm").onsubmit=e=>{
 e.preventDefault();const f=new FormData(e.target);
 const steps=parseSteps(f.get("steps"));
 if(!steps.length)return notify("Добавьте хотя бы один шаг");
 const bad=steps.findIndex(s=>(s.yes&&s.yes>steps.length)||(s.no&&s.no>steps.length));
 if(bad>=0)return notify("Шаг "+(bad+1)+": переход ведёт на несуществующий шаг (всего шагов: "+steps.length+")");
 const val=k=>String(f.get(k)||"").trim();
 const data={title:val("title"),category:val("category"),brand:val("brand"),model:val("model"),steps};
 if(editingGuide){
  const i=guides.findIndex(g=>g.id===editingGuide);if(i<0)return;
  // Progress refers to step positions; it stays valid only if the step titles are unchanged.
  if(guides[i].steps.map(s=>s.title).join("\n")!==steps.map(s=>s.title).join("\n"))delete progress[editingGuide];
  guides[i]={...guides[i],...data,updatedAt:new Date().toISOString()};
 }else guides.unshift({id:crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2),...data});
 persist();e.target.reset();$("guideEditor").close();draw();toast("Алгоритм сохранён");
};
$("guideList").onclick=async e=>{
 const open=e.target.closest("[data-open-guide]"),remove=e.target.closest("[data-remove-guide]"),edit=e.target.closest("[data-edit-guide]");
 if(edit){openGuideEditor(edit.dataset.editGuide);return}
 if(open){active=open.dataset.openGuide;drawSteps()}
 if(remove&&await ask("Удалить алгоритм диагностики?")){guides=guides.filter(g=>g.id!==remove.dataset.removeGuide);delete progress[remove.dataset.removeGuide];persist();draw()}
};
$("guideSteps").onclick=e=>{
 const button=e.target.closest("[data-answer]");if(!button)return;
 const g=findGuide(active);if(!g)return;
 const step=Number(button.dataset.answer),target=g.steps[step]?.[button.dataset.value];
 if(!Number.isInteger(target)||target<1||target>g.steps.length){notify("Для этого ответа следующий шаг не задан.");return}
 if(!Array.isArray(progress[active]))progress[active]=[];progress[active][step]=true;persist();drawSteps();
 const next=$("guide-step-"+(target-1));
 if(next){next.scrollIntoView({behavior:"smooth",block:"start"});next.classList.add("flash");setTimeout(()=>next.classList.remove("flash"),1500)}
};
$("guideSteps").onchange=e=>{
 if(!e.target.matches("[data-step]"))return;const g=findGuide(active);if(!g)return;
 if(!Array.isArray(progress[active]))progress[active]=[];progress[active][Number(e.target.dataset.step)]=e.target.checked;persist();updateProgress(g);
};
$("builtinGuides").onclick=e=>{const b=e.target.closest("[data-open-guide]");if(b){active=b.dataset.openGuide;drawSteps()}};
self.MDPGuides={open(id){if(!findGuide(id))return;active=id;drawSteps()}};
draw();
});
