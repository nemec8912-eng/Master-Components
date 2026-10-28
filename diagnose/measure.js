"use strict";
// "Замеры мультиметром": list by category and a full-screen guide with good/bad pictures.
(()=>{
const M=self.MDPMeasure,D=self.MDPMeasureDraw;
if(!M||!D)return;
const byId=new Map(M.items.map(m=>[m.id,m]));
const KIND={official:"сайт производителя",service:"сервисный справочник",practice:"общая практика ремонта"};
let current=null,filter="";
const cats=[...new Set(M.items.flatMap(m=>m.categories))];

function heaterR(power,volts=230){return power>0?volts*volts/power:null}
const fmt=x=>x>=100?x.toFixed(0):x.toFixed(1);
const ru=x=>fmt(x).replace(".",",");

function testHTML(m,t,goodOverride){
 const pic=(st,ok)=>'<figure class="measurePic">'+D.draw({part:m.part,from:t.from,to:t.to,dial:t.dial,display:st.d,unit:st.u,ok,label:st.l,extra:t.extra})+
  '<figcaption><b>'+(ok?"Исправно":"Неисправно — "+escapeHTML(st.l))+':</b> '+escapeHTML(st.t)+'</figcaption></figure>';
 const good=goodOverride?{...t.good,...goodOverride}:t.good;
 return '<section class="measureTest"><h3>'+escapeHTML(t.name)+'</h3><p class="note">'+escapeHTML(t.how)+'</p>'+
  '<div class="measureGrid">'+pic(good,true)+t.bad.map(b=>pic(b,false)).join("")+'</div></section>';
}
function render(){
 const m=current;if(!m)return;
 let goodOverride=null,calc="";
 if(m.calc==="heater"){
  const p=Number(document.getElementById("heaterPower")?.value||0);
  const r=heaterR(p);
  calc='<div class="calcBox"><label>Мощность с маркировки, Вт<input id="heaterPower" type="number" inputmode="numeric" min="50" max="6000" step="50" value="'+(p||"")+'" placeholder="например, 2000"></label>'+
   '<p id="heaterResult">'+(r?"Исправный нагреватель на 230 В: <b>≈ "+ru(r)+" Ом</b> (норма примерно "+ru(r*0.9)+"–"+ru(r*1.1)+" Ом)":"Введите мощность — покажу, сколько должен показать мультиметр.")+'</p></div>';
  if(r)goodOverride={d:fmt(r),t:"≈ "+ru(r)+" Ом для "+p+" Вт (230² / "+p+"). Отклонение до ±10% — норма."};
 }
 const table=m.table&&M[m.table]?'<details class="tool"><summary>Номиналы по маркам</summary><div class="tableWrap"><table class="ref"><thead><tr><th>Марка</th><th>При комнатной температуре</th></tr></thead><tbody>'+M[m.table].map(r=>'<tr><td>'+escapeHTML(r[0])+'</td><td>'+escapeHTML(r[1])+'</td></tr>').join("")+'</tbody></table></div></details>':"";
 const src=(m.src||[]).map(k=>M.sources[k]).filter(Boolean).map(s=>(s.url?'<a href="'+escapeHTML(s.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(s.title)+'</a>':escapeHTML(s.title))+' ('+escapeHTML(KIND[s.kind]||"")+')').join("; ");
 const keepFocus=document.activeElement?.id==="heaterPower";
 $("measureBody").innerHTML=
  (m.warn?'<p class="warnBox">⚠ '+escapeHTML(m.warn)+'</p>':"")+
  '<p class="prep"><b>Подготовка:</b> '+escapeHTML(m.prep)+'</p>'+
  (m.intro?'<p>'+escapeHTML(m.intro)+'</p>':"")+calc+table+
  m.tests.map((t,i)=>testHTML(m,t,i===0?goodOverride:null)).join("")+
  (m.note?'<p class="note">'+escapeHTML(m.note)+'</p>':"")+
  '<p class="note">Красный щуп — в гнездо VΩ, чёрный — в COM. Картинки схематичные: расположение выводов на вашей детали может отличаться. Значения с пометкой «пример» — ориентир, точные — в сервис-мануале модели.</p>'+
  '<p class="hint">Источники: '+src+'</p>';
 if(keepFocus){const el=document.getElementById("heaterPower");el.focus();const v=el.value;el.value="";el.value=v}
}
function open(id){
 const m=byId.get(id);if(!m)return;
 current=m;$("measureTitle").textContent=m.title;$("measureCats").textContent=m.categories.join(" · ");
 render();if(!$("measureDialog").open)$("measureDialog").showModal();$("measureDialog").scrollTop=0;
}
$("measureBody").addEventListener("input",e=>{if(e.target.id==="heaterPower")render()});
$("measureClose").onclick=()=>$("measureDialog").close();

function drawList(){
 $("measureCount").textContent=M.items.length+" инструкций";
 $("measureChips").innerHTML=cats.map(c=>'<button type="button" data-mcat="'+escapeHTML(c)+'" class="'+(filter===c?"selected":"")+'" aria-pressed="'+(filter===c)+'">'+escapeHTML(c)+' <span>'+M.items.filter(m=>m.categories.includes(c)).length+'</span></button>').join("");
 $("measureList").innerHTML=!filter?"":M.items.filter(m=>m.categories.includes(filter)).map(m=>
  '<button type="button" class="measureItem" data-measure="'+m.id+'"><strong>'+escapeHTML(m.title)+'</strong><span>'+escapeHTML(m.categories.join(" · "))+" · "+m.tests.length+" замер"+(m.tests.length>1?"а":"")+'</span></button>').join("");
}
$("measureChips").onclick=e=>{const b=e.target.closest("[data-mcat]");if(!b)return;filter=filter===b.dataset.mcat?"":b.dataset.mcat;drawList()};
document.addEventListener("click",e=>{const b=e.target.closest("[data-measure]");if(b){e.preventDefault();open(b.dataset.measure)}});
drawList();
self.MDPMeasureUI={open,heaterR,has:id=>byId.has(id),title:id=>byId.get(id)?.title||""};
})();
