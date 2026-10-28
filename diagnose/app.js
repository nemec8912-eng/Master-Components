"use strict";
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// In-page replacements for alert/confirm/prompt: they look native on every phone
// and keep working where the browser blocks system dialogs.
// ask(text) -> true/false; ask(text,{input:""}) -> string or null.
const askQueue=[];
function ask(text,opts={}){return new Promise(resolve=>{askQueue.push({text,opts,resolve});if(askQueue.length===1)showAsk()})}
const notify=text=>ask(text,{ok:"Понятно",cancel:null});
function showAsk(){
 const {text,opts}=askQueue[0],input="input" in opts;
 const danger=/^Удалить/.test(text);
 $("askText").textContent=text;
 $("askInput").hidden=!input||opts.multiline;$("askArea").hidden=!(input&&opts.multiline);
 if(input){const f=opts.multiline?$("askArea"):$("askInput");f.value=opts.input||""}
 $("askOk").textContent=opts.ok||(danger?"Удалить":"Да");$("askOk").classList.toggle("danger",danger);
 $("askCancel").hidden=opts.cancel===null;$("askCancel").textContent=opts.cancel||"Отмена";
 $("askDialog").dataset.result="";$("askDialog").showModal();
 if(input&&!opts.multiline)$("askInput").focus();
 if(opts.multiline){$("askArea").focus();$("askArea").select()}
}
$("askForm").addEventListener("submit",()=>{$("askDialog").dataset.result="ok"});
$("askCancel").onclick=()=>$("askDialog").close();
$("askDialog").addEventListener("close",()=>{
 const {opts,resolve}=askQueue.shift(),ok=$("askDialog").dataset.result==="ok",input="input" in opts;
 resolve(input?(ok?(opts.multiline?$("askArea"):$("askInput")).value:null):ok);
 if(askQueue.length)showAsk();
});
// Opens every collapsed section that contains el, then scrolls to it.
function reveal(el){if(!el)return;for(let d=el.closest("details");d;d=d.parentElement?.closest("details"))d.open=true;if(el.tagName==="DETAILS")el.open=true;el.scrollIntoView({behavior:"smooth",block:"start"})}
let toastTimer;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.__mdpInstallEvent=e},{once:true});
function toast(text){const t=$("toast");t.textContent=text;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3200)}
function downloadJSON(obj,name){
 const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}

// Text (and photos) to a messenger via the system share sheet; clipboard as a fallback.
async function shareText({title,text,files}){
 if(navigator.share){
  const data={title,text};
  if(files?.length&&navigator.canShare?.({files}))data.files=files;
  try{await navigator.share(data);return}catch(err){if(err.name==="AbortError")return}
 }
 try{await navigator.clipboard.writeText(text);toast("Текст скопирован — вставьте в мессенджер")}
 catch{ask("Скопируйте текст и вставьте в мессенджер:",{input:text,multiline:true,ok:"Готово",cancel:null})}
}

// One banner at a time, by priority. "Позже" hides a banner until the app is reopened.
const banners={},hiddenBanners=new Set(),BANNER_ORDER=["preview","update","backup","install"];
// Preview build (opened by link inside Claude): no file downloads, no install, no offline mode.
const PREVIEW=!!window.MDP_PREVIEW;
function setBanner(key,opts){if(opts)banners[key]=opts;else delete banners[key];drawBanner()}
function drawBanner(){
 const key=BANNER_ORDER.find(k=>banners[k]&&!hiddenBanners.has(k)),b=key&&banners[key];
 $("banner").hidden=!b;if(!b)return;
 $("banner").dataset.key=key;$("bannerText").textContent=b.text;$("bannerAction").textContent=b.label;
 $("bannerClose").textContent=b.closeLabel||"Позже";
}
$("bannerAction").onclick=()=>{const b=banners[$("banner").dataset.key];if(b)b.action()};
$("bannerClose").onclick=()=>{const k=$("banner").dataset.key;hiddenBanners.add(k);banners[k]?.onDismiss?.();drawBanner()};

function updateNetwork(){const n=$("network");n.textContent=navigator.onLine?"● Онлайн":"● Офлайн";n.classList.toggle("offline",!navigator.onLine)}
window.addEventListener("online",updateNetwork);window.addEventListener("offline",updateNetwork);updateNetwork();
if(PREVIEW)setBanner("preview",{text:"Это браузерная версия для просмотра. Записи сохраняются только в этом браузере, а скачать резервную копию, отправить в мессенджер и работать без интернета здесь нельзя. Для работы установите приложение на телефон.",label:"Понятно",action:()=>{hiddenBanners.add("preview");drawBanner()},closeLabel:"Скрыть"});
if(!PREVIEW&&"serviceWorker" in navigator)window.addEventListener("load",()=>{
 const hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.register("./sw.js").then(reg=>{
  // Phones keep the app open for days: look for a new version every hour and on return to the app.
  setInterval(()=>reg.update().catch(()=>{}),3600e3);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")reg.update().catch(()=>{})});
 }).catch(console.warn);
 navigator.serviceWorker.addEventListener("controllerchange",()=>{
  if(hadController)setBanner("update",{text:"Вышла новая версия приложения. Ваши данные сохранятся.",label:"Обновить",action:()=>location.reload()});
 });
});
MDPStore.onError(()=>toast("Не удалось сохранить изменения. Скачайте резервную копию."));

MDPStore.ready.then(()=>{
const {KEYS,DEFAULT_CATEGORIES,matchFault,matchRef,codeKey,validData,cleanMeta,parseBackup}=MDPLib;
// Built-in reference: read-only, ships with the app, works offline.
const REF=self.MDPReference||{entries:[],sources:{}};
const refById=new Map(REF.entries.map(e=>[e.id,e]));
const REF_CATS=[...new Set(REF.entries.map(e=>e.category))];
const SOURCE_KIND={official:"сайт производителя",service:"сервисный справочник",practice:"общая практика ремонта"};
const refTitle=e=>e.type==="code"?e.title:e.symptom;
const ICONS={"Стиральные машины":"🫧","Холодильники":"❄️","Посудомойки":"🍽️","Сушильные машины":"♨️","Телевизоры":"📺","Кофемашины":"☕","Другая техника":"🔧","Микроволновки":"📡","Духовые шкафы":"🔥","Варочные панели":"🍳","Пылесосы":"🌀","Кондиционеры":"🌬️","ПК":"💻","Компьютеры":"💻","Ноутбуки":"💻"};
const iconFor=c=>ICONS[c]||"🔧";

function loadData(){const s=MDPStore.get(KEYS.data);return validData(s)?s:{categories:[...DEFAULT_CATEGORIES],faults:[]}}
let state=loadData(),meta=cleanMeta(MDPStore.get(KEYS.meta));
let mode="symptom",selected="",view="all",editingId=null,limit=40;
// Photos in the open editor: {id, blob?} — blob is set for photos not saved yet.
let draftPhotos=[],removedPhotos=[];
const expanded=new Set();
const save=()=>MDPStore.set(KEYS.data,state);
const saveMeta=()=>MDPStore.set(KEYS.meta,meta);
const markRecent=id=>{meta.recent=[id,...meta.recent.filter(x=>x!==id)].slice(0,15);saveMeta()};
// Drop links to records that no longer exist.
{const ids=new Set(state.faults.map(f=>f.id));const ok=id=>ids.has(id)||refById.has(id);meta.favorites=meta.favorites.filter(ok);meta.recent=meta.recent.filter(ok)}
const allCategories=()=>[...new Set([...state.categories,...REF_CATS])];

function field(label,value){return value?'<p><b>'+label+':</b> '+escapeHTML(value)+'</p>':""}
function card(f){
 const open=expanded.has(f.id),fav=meta.favorites.includes(f.id);
 return '<article class="card fault'+(open?' open':'')+'">'+
  '<div class="cardHead"><button type="button" class="cardToggle" data-toggle="'+escapeHTML(f.id)+'" aria-expanded="'+open+'">'+
   '<small>'+escapeHTML([f.category,f.brand,f.model].filter(Boolean).join(" · "))+'</small>'+
   '<h3>'+escapeHTML(f.symptom)+'</h3>'+(f.code?'<span class="code">'+escapeHTML(f.code)+'</span>':"")+
  '</button><button type="button" class="star'+(fav?' on':'')+'" data-fav="'+escapeHTML(f.id)+'" aria-label="'+(fav?"Убрать из избранного":"В избранное")+'" aria-pressed="'+fav+'">'+(fav?"★":"☆")+'</button></div>'+
  (open?'<div class="details">'+field("Проверка",f.check)+field("Ремонт",f.fix)+field("Мультиметр",f.meterMode)+field("Щупы",f.probePoints)+field("Показания",f.expected)+field("Источник",f.source)+
   (f.photos?.length?'<div class="thumbs">'+f.photos.map((p,i)=>'<button type="button" class="thumb" data-view-photo="'+escapeHTML(f.id)+'" data-index="'+i+'" aria-label="Открыть фото '+(i+1)+'"><img data-photo="'+escapeHTML(p)+'" alt="" loading="lazy"></button>').join("")+'</div>':"")+
   (f.imageUrl&&/^https:\/\//i.test(f.imageUrl)?'<p><a href="'+escapeHTML(f.imageUrl)+'" target="_blank" rel="noopener noreferrer">Открыть иллюстрацию измерения</a></p>':"")+
   (f.updatedAt||f.createdAt?'<p class="hint">'+(f.updatedAt?"Изменено ":"Добавлено ")+new Date(f.updatedAt||f.createdAt).toLocaleDateString("ru")+'</p>':"")+
   '<div class="actions"><button type="button" data-share="'+escapeHTML(f.id)+'">Отправить</button><button type="button" data-journal="'+escapeHTML(f.id)+'">В журнал</button><button type="button" data-copy="'+escapeHTML(f.id)+'">Копировать</button><button type="button" data-edit="'+escapeHTML(f.id)+'">Изменить</button><button type="button" data-delete="'+escapeHTML(f.id)+'">Удалить</button></div></div>':"")+
 '</article>';
}

const list=(label,items)=>items?.length?'<p><b>'+label+':</b></p><ul>'+items.map(x=>'<li>'+escapeHTML(x)+'</li>').join("")+'</ul>':"";
function refCard(e){
 const open=expanded.has(e.id),fav=meta.favorites.includes(e.id),src=REF.sources[e.source]||{};
 const sub=[e.category,(e.brands||[]).join(", ")].filter(Boolean).join(" · ");
 return '<article class="card fault ref'+(open?' open':'')+'">'+
  '<div class="cardHead"><button type="button" class="cardToggle" data-toggle="'+e.id+'" aria-expanded="'+open+'">'+
   '<small>'+escapeHTML(sub)+'</small><h3>'+escapeHTML(refTitle(e))+'</h3>'+
   (e.codes?'<span class="code">'+escapeHTML(e.codes.join(" / "))+'</span> ':"")+'<span class="refBadge">'+(e.type==="code"?"Справочник кодов":"Типовая неисправность")+'</span>'+
  '</button><button type="button" class="star'+(fav?' on':'')+'" data-fav="'+e.id+'" aria-label="'+(fav?"Убрать из избранного":"В избранное")+'" aria-pressed="'+fav+'">'+(fav?"★":"☆")+'</button></div>'+
  (open?'<div class="details">'+
   (e.warn?'<p class="warnBox">⚠ '+escapeHTML(e.warn)+'</p>':"")+
   field("Модели",e.models)+(e.note?'<p>'+escapeHTML(e.note)+'</p>':"")+
   ((self.MDPAlgorithms||[]).filter(a=>a.category===e.category&&(a.symptoms.includes(e.symptom)||(e.type==="code"&&e.measure?.[0]===a.key))).map(a=>'<div class="measureLinks"><button type="button" class="algBtn" data-run-guide="'+a.id+'">▶ Пройти алгоритм: '+escapeHTML(a.title)+'</button></div>').join(""))+
   (e.measure?.length&&self.MDPMeasureUI?'<p><b>Как замерить:</b></p><div class="measureLinks">'+e.measure.filter(id=>MDPMeasureUI.has(id)).map(id=>'<button type="button" data-measure="'+id+'">📏 '+escapeHTML(MDPMeasureUI.title(id))+'</button>').join("")+'</div>':"")+
   list("Вероятные причины",e.causes)+list("Что советует производитель",e.owner)+list(e.type==="code"?"Проверки мастера":"Порядок проверки",e.checks||e.master)+
   ((e.master?.length||e.checks?.length)?'<p class="hint">'+escapeHTML(REF.safety||"")+(e.type==="code"?" Номиналы и значения — по сервис-мануалу конкретной модели.":"")+'</p>':"")+
   '<p class="hint">Источник: '+(src.url?'<a href="'+escapeHTML(src.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(src.title)+'</a>':escapeHTML(src.title||""))+' ('+escapeHTML(SOURCE_KIND[src.kind]||"")+')</p>'+
   '<div class="actions"><button type="button" data-share="'+e.id+'">Отправить</button><button type="button" data-journal="'+e.id+'">В журнал</button><button type="button" data-adopt="'+e.id+'">В мою базу</button></div></div>':"")+
 '</article>';
}
function refText(e){
 const lines=[refTitle(e)+(e.codes?" (код "+e.codes.join(" / ")+")":""),[(e.brands||[]).join(", "),e.category].filter(Boolean).join(" · ")];
 if(e.models)lines.push("Модели: "+e.models);if(e.note)lines.push(e.note);
 for(const [label,items] of [["Причины",e.causes],["Советы производителя",e.owner],["Проверки",e.checks||e.master]])if(items?.length)lines.push(label+":\n- "+items.join("\n- "));
 return lines.filter(Boolean).join("\n");
}
function fillList(id,values){$(id).replaceChildren(...[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ru")).slice(0,300).map(v=>{const o=document.createElement("option");o.value=v;return o}))}
// Model suggestions follow the brand typed in the editor (or in the filter).
function updateSuggestions(brand){
 fillList("brandList",[...state.faults.map(f=>f.brand),...REF.entries.flatMap(e=>e.brands||[])]);
 const b=MDPLib.normalize(brand);
 fillList("modelList",state.faults.filter(f=>!b||MDPLib.normalize(f.brand)===b).map(f=>f.model));
}
// Quick brand buttons for the current category / search, with record counts.
function drawBrandChips(list,brandQ){
 const counts=new Map();
 for(const f of list)for(const raw of f.brands||[f.brand]){const b=(raw||"").trim();if(!b)continue;const k=MDPLib.normalize(b);const c=counts.get(k)||{name:b,n:0};c.n++;counts.set(k,c)}
 const items=[...counts.values()].sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,"ru")).slice(0,12);
 $("brandChips").innerHTML=items.length<2&&!brandQ?"":items.map(c=>{const on=MDPLib.normalize(c.name)===brandQ;return '<button type="button" data-brand="'+escapeHTML(c.name)+'" class="'+(on?"selected":"")+'" aria-pressed="'+on+'">'+escapeHTML(c.name)+'<span>'+c.n+'</span></button>'}).join("");
}
function faultText(f){
 const lines=[f.symptom+(f.code?" (код "+f.code+")":""),[f.brand,f.model].filter(Boolean).join(" ")+(f.category?" · "+f.category:"")];
 for(const [label,v] of [["Проверка",f.check],["Ремонт",f.fix],["Мультиметр",f.meterMode],["Щупы",f.probePoints],["Показания",f.expected],["Источник",f.source]])if(v)lines.push(label+": "+v);
 return lines.filter(Boolean).join("\n");
}
function render(){
 const cats=$("categories"),catsAll=allCategories();
 cats.replaceChildren(...catsAll.map(c=>{const b=document.createElement("button");b.type="button";b.className="tile"+(selected===c?" active":"");b.setAttribute("aria-pressed",selected===c);const n=REF.entries.filter(e=>e.category===c).length+state.faults.filter(f=>f.category===c).length;b.innerHTML="<span>"+iconFor(c)+"</span><strong>"+escapeHTML(c)+"</strong>"+(n?"<em>"+n+"</em>":"");b.onclick=()=>{selected=selected===c?"":c;rerender();if(selected)$("base").scrollIntoView({behavior:"smooth"})};return b}));
 const cur=$("categorySelect").value;
 $("categorySelect").replaceChildren(...catsAll.map(c=>{const o=document.createElement("option");o.textContent=c;o.value=c;return o}));
 if(catsAll.includes(cur))$("categorySelect").value=cur;
 const q=$("query").value.trim();
 // While searching, results go straight under the search box.
 $("catSection").hidden=!!q;
 const brandQ=MDPLib.normalize($("brandFilter").value),modelQ=MDPLib.normalize($("modelFilter").value);
 // My records
 let mine=view==="ref"?[]:state.faults;
 if(view==="fav")mine=mine.filter(f=>meta.favorites.includes(f.id));
 const mineBase=mine.filter(f=>(!selected||f.category===selected)&&(!modelQ||MDPLib.normalize(f.model).includes(modelQ))&&matchFault(f,q,mode));
 const mineHits=mineBase.filter(f=>!brandQ||MDPLib.normalize(f.brand).includes(brandQ));
 // Reference: shown once there is a query, a category, or the "Справочник" / favourites view.
 const showRef=view!=="mine"&&(q||selected||view==="ref"||view==="fav");
 let refPool=showRef?REF.entries:[];
 if(view==="fav")refPool=refPool.filter(e=>meta.favorites.includes(e.id));
 let scored=refPool.filter(e=>!selected||e.category===selected).map(e=>[e,matchRef(e,q,mode)]).filter(x=>x[1]);
 // An exact code hit hides "starts with" hits: E1 should not list E10…E19.
 if(scored.some(x=>x[1]===2))scored=scored.filter(x=>x[1]===2);
 const refBase=scored.map(x=>x[0]);
 const refHits=refBase.filter(e=>!brandQ||!e.brands||e.brands.some(b=>MDPLib.normalize(b).includes(brandQ)))
  .sort((a,b)=>(a.type===b.type?0:a.type==="symptom"?-1:1)||(a.brands?.[0]||"").localeCompare(b.brands?.[0]||"","ru")||codeKey(a.codes?.[0]||"").localeCompare(codeKey(b.codes?.[0]||"")));
 let items=[...mineHits.map(f=>({f})),...refHits.map(e=>({e}))];
 if(view==="recent"){const pos=new Map(meta.recent.map((id,i)=>[id,i]));items=meta.recent.map(id=>{const f=state.faults.find(x=>x.id===id);if(f)return {f};const e=refById.get(id);return e?{e}:null}).filter(Boolean).filter(it=>it.f?(!selected||it.f.category===selected)&&matchFault(it.f,q,mode):(!selected||it.e.category===selected)&&matchRef(it.e,q,mode))}
 drawBrandChips([...mineBase,...refBase.filter(e=>e.type==="code")],brandQ);
 $("resultsTitle").textContent=selected||"Неисправности";
 const nMine=items.filter(i=>i.f).length,nRef=items.length-nMine;
 const brands=new Set(refHits.filter(e=>e.type==="code").map(e=>e.brands[0]));
 $("resultsCount").textContent=(showRef||view==="recent"?"Справочник: "+nRef+" · Мои записи: "+nMine:"Мои записи: "+nMine+" · В справочнике "+REF.entries.length+" записей — выберите категорию или введите код")+
  (q&&mode==="code"&&!brandQ&&brands.size>1?". Код есть у разных марок и значит у них разное — уточните марку.":"");
 let empty;
 if(view==="fav"&&!meta.favorites.length)empty='Избранного пока нет. Нажмите ☆ на карточке.';
 else if(view==="recent"&&!meta.recent.length)empty='Здесь появятся записи, которые вы открывали.';
 else if(view==="mine"&&!state.faults.length)empty='Своих записей пока нет. Добавьте кнопкой «+ Запись» или нажмите «В мою базу» на карточке справочника.';
 else if(!q&&!selected&&view==="all"&&!state.faults.length)empty='Выберите категорию техники выше или введите код ошибки / симптом в поиске.';
 else empty=mode==="code"&&q?'Код не найден. Проверьте написание или переключитесь на поиск по симптомам.':'Ничего не найдено. Попробуйте другой запрос или режим поиска.';
 const canDeleteCat=selected&&state.categories.includes(selected)&&!REF_CATS.includes(selected)&&!state.faults.some(f=>f.category===selected)&&state.categories.length>1;
 const shown=items.slice(0,limit);
 $("results").innerHTML=items.length?shown.map(it=>it.f?card(it.f):refCard(it.e)).join("")+(items.length>limit?'<button type="button" id="moreResults" class="more">Показать ещё ('+(items.length-limit)+')</button>':""):'<p class="empty">'+empty+'</p>'+(canDeleteCat?'<div class="actions start"><button type="button" id="deleteCategory">Удалить пустую категорию «'+escapeHTML(selected)+'»</button></div>':"");
 MDPPhotos.hydrate($("results"));
 if(!$("editor").open)updateSuggestions($("brandFilter").value);
}

const rerender=()=>{limit=40;render()};
$("query").addEventListener("input",rerender);
$("brandChips").onclick=e=>{const b=e.target.closest("[data-brand]");if(!b)return;const on=b.getAttribute("aria-pressed")==="true";$("brandFilter").value=on?"":b.dataset.brand;rerender()};$("brandFilter").addEventListener("input",rerender);
$("faultForm").elements.brand.addEventListener("input",e=>updateSuggestions(e.target.value));$("modelFilter").addEventListener("input",rerender);
$("searchForm").onsubmit=e=>{e.preventDefault();$("query").blur();rerender();$("base").scrollIntoView({behavior:"smooth"})};
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll("[data-mode]").forEach(x=>x.classList.toggle("selected",x===b));$("query").placeholder=mode==="code"?"Например, E03 или 5E":"Например, не сливает воду";rerender()});
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("selected",x===b));rerender()});

$("addCategory").onclick=async()=>{const c=(await ask("Название новой категории техники:",{input:"",ok:"Добавить"}))?.trim().replace(/\s+/g," ");if(!c)return;if(c.length>40)return notify("Слишком длинное название");if(state.categories.some(x=>MDPLib.normalize(x)===MDPLib.normalize(c)))return notify("Категория уже существует");state.categories.push(c);save();render()};

// copyFrom: prefill a new record from an existing one (for a similar model).
// fromRef: prefill a new record from a reference entry, so it can be edited and extended.
function openEditor(id=null,copyFrom=null,fromRef=null){
 const src=state.faults.find(x=>x.id===(id||copyFrom));if((id||copyFrom)&&!src)return;
 editingId=id;$("faultForm").reset();
 $("editorTitle").textContent=id?"Редактировать неисправность":copyFrom?"Копия записи":fromRef?"В мою базу из справочника":"Новая неисправность";
 draftPhotos=id?(src.photos||[]).map(p=>({id:p})):[];removedPhotos=[];
 if(src){
  if(!state.categories.includes(src.category)){state.categories.push(src.category);save();render()}
  for(const [k,v] of Object.entries(src)){const el=$("faultForm").elements.namedItem(k);if(el&&typeof v==="string")el.value=v}
  if(copyFrom)$("faultForm").elements.model.value="";
 }else if(fromRef){
  const F=$("faultForm").elements,s=REF.sources[fromRef.source]||{};
  F.category.value=fromRef.category;F.brand.value=fromRef.brands?.[0]||"";F.code.value=fromRef.codes?.[0]||"";
  F.symptom.value=refTitle(fromRef);F.check.value=(fromRef.checks||fromRef.master||[]).join("\n")||fromRef.note||"Проверить по сервис-мануалу";
  F.fix.value=[...(fromRef.owner||[]),...(fromRef.causes||[]).map(c=>"Причина: "+c)].join("\n");
  F.source.value=s.title?(s.title+(s.url?" — "+s.url:"")):"";
 }else if(selected)$("categorySelect").value=selected;
 updateSuggestions($("faultForm").elements.brand.value);
 drawDraftPhotos();
 $("photoNote").textContent=MDPStore.photos.available?(copyFrom&&src.photos?.length?"Фото не копируются — добавьте свои.":""):"Фото недоступны: браузер не даёт доступ к IndexedDB.";
 $("photoPick").hidden=!MDPStore.photos.available;
 $("editor").showModal();
 if(copyFrom)$("faultForm").elements.model.focus();
}
const draftUrls=new Map();
function drawDraftPhotos(){
 $("editorPhotos").innerHTML=draftPhotos.map((p,i)=>'<div class="thumb"><img '+(p.blob?'src="'+draftUrl(p)+'"':'data-photo="'+escapeHTML(p.id)+'"')+' alt="Фото '+(i+1)+'"><button type="button" class="thumbRemove" data-remove-photo="'+i+'" aria-label="Удалить фото '+(i+1)+'">✕</button></div>').join("");
 MDPPhotos.hydrate($("editorPhotos"));
}
function draftUrl(p){if(!draftUrls.has(p.id))draftUrls.set(p.id,URL.createObjectURL(p.blob));return draftUrls.get(p.id)}
function dropDraftUrls(){draftUrls.forEach(u=>URL.revokeObjectURL(u));draftUrls.clear()}
$("photoInput").onchange=async e=>{
 const files=[...(e.target.files||[])];e.target.value="";if(!files.length)return;
 if(draftPhotos.length+files.length>12){notify("Не больше 12 фото на запись");return}
 $("photoNote").textContent="Обработка фото…";
 const errors=[];
 for(const file of files){try{draftPhotos.push({id:MDPPhotos.newId(),blob:await MDPPhotos.compress(file)})}catch(err){errors.push(err.message)}}
 $("photoNote").textContent=errors.join("; ");drawDraftPhotos();
};
$("editorPhotos").onclick=e=>{
 const b=e.target.closest("[data-remove-photo]");if(!b)return;
 const [p]=draftPhotos.splice(Number(b.dataset.removePhoto),1);
 if(p&&!p.blob)removedPhotos.push(p.id);
 drawDraftPhotos();
};
$("addFault").onclick=()=>openEditor();
$("navAdd").onclick=e=>{e.preventDefault();openEditor()};
$("navSearch").onclick=e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});$("query").focus({preventScroll:true})};
$("navHome").onclick=e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"})};
$("navTools").onclick=e=>{e.preventDefault();reveal($("tools"))};
$("cancel").onclick=()=>$("editor").close();
$("editor").addEventListener("close",()=>{editingId=null;draftPhotos=[];removedPhotos=[];dropDraftUrls();updateSuggestions($("brandFilter").value)});
let saving=false;
$("faultForm").onsubmit=async e=>{
 e.preventDefault();if(saving)return;
 const f=Object.fromEntries([...new FormData(e.target)].map(([k,v])=>[k,String(v).trim()]));
 if(!f.symptom||!f.check)return;
 if(f.imageUrl&&!/^https:\/\//i.test(f.imageUrl))return notify("Ссылка на иллюстрацию должна начинаться с https://");
 saving=true;
 try{
  // New photos are written first: a record never points at a photo that is not on disk.
  for(const p of draftPhotos)if(p.blob)await MDPStore.photos.put(p.id,p.blob);
 }catch(err){saving=false;notify("Фото не сохранены: "+err.message);return}
 f.photos=draftPhotos.map(p=>p.id);
 const removed=removedPhotos.slice();
 const now=new Date().toISOString();let id=editingId;
 if(!state.categories.includes(f.category))state.categories.push(f.category);
 if(id){const i=state.faults.findIndex(x=>x.id===id);if(i<0){saving=false;return}state.faults[i]={...state.faults[i],...f,updatedAt:now}}
 else{id=crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);state.faults.unshift({...f,id,createdAt:now})}
 expanded.add(id);markRecent(id);
 save();MDPStore.photos.remove(removed).catch(console.warn);MDPPhotos.forget(removed);
 saving=false;$("editor").close();render();toast("Запись сохранена");
};

$("results").addEventListener("click",async e=>{
 const t=e.target.closest("[data-toggle],[data-fav],[data-edit],[data-delete],[data-copy],[data-share],[data-journal],[data-view-photo],[data-adopt],[data-run-guide],#deleteCategory,#moreResults");if(!t)return;
 if(t.id==="moreResults"){limit+=40;render();return}
 if(t.dataset.runGuide){self.MDPGuides?.open(t.dataset.runGuide);return}
 if(t.dataset.adopt){const r=refById.get(t.dataset.adopt);if(r)openEditor(null,null,r);return}
 const ref=refById.get(t.dataset.share||t.dataset.journal||"");
 if(ref&&t.dataset.share){shareText({title:refTitle(ref),text:refText(ref)});return}
 if(ref&&t.dataset.journal){MDPJournal.open({title:refTitle(ref)+(ref.codes?" ("+ref.codes[0]+")":""),device:ref.brands?.[0]||""});return}
 if(t.dataset.viewPhoto){const f=state.faults.find(x=>x.id===t.dataset.viewPhoto);if(f?.photos)MDPPhotos.open(f.photos,Number(t.dataset.index));return}
 if(t.dataset.copy){openEditor(null,t.dataset.copy);return}
 if(t.dataset.share){const f=state.faults.find(x=>x.id===t.dataset.share);if(!f)return;
  const files=(f.photos||[]).map((id,i)=>{const b=MDPPhotos.loaded(id);return b&&new File([b],"foto-"+(i+1)+".jpg",{type:b.type||"image/jpeg"})}).filter(Boolean);
  shareText({title:f.symptom,text:faultText(f),files});return}
 if(t.dataset.journal){const f=state.faults.find(x=>x.id===t.dataset.journal);if(f)MDPJournal.open({title:f.symptom+(f.code?" ("+f.code+")":""),device:[f.brand,f.model].filter(Boolean).join(" ")});return}
 if(t.id==="deleteCategory"){if(await ask("Удалить категорию «"+selected+"»?")){state.categories=state.categories.filter(c=>c!==selected);selected="";save();render()}return}
 if(t.dataset.toggle){const id=t.dataset.toggle;if(expanded.has(id))expanded.delete(id);else{expanded.add(id);markRecent(id)}render();return}
 if(t.dataset.fav){const id=t.dataset.fav;meta.favorites=meta.favorites.includes(id)?meta.favorites.filter(x=>x!==id):[id,...meta.favorites];saveMeta();render();return}
 if(t.dataset.edit){openEditor(t.dataset.edit);return}
 if(t.dataset.delete){const id=t.dataset.delete,item=state.faults.find(f=>f.id===id);
  if(item&&await ask("Удалить запись «"+item.symptom+"»"+(item.photos?.length?" вместе с "+item.photos.length+" фото":"")+"?")){state.faults=state.faults.filter(f=>f.id!==id);MDPStore.photos.remove(item.photos||[]).catch(console.warn);MDPPhotos.forget(item.photos||[]);meta.favorites=meta.favorites.filter(x=>x!==id);meta.recent=meta.recent.filter(x=>x!==id);expanded.delete(id);save();saveMeta();render()}}
});

// ---------- backup ----------
$("exportAll").onclick=async()=>{
 if(PREVIEW){notify("В браузерной версии скачивание файлов недоступно. Резервные копии делаются в установленном приложении.");return}
 const btn=$("exportAll");btn.disabled=true;const label=btn.textContent;btn.textContent="Готовлю файл…";
 try{
  await MDPStore.flush();
  const used=new Set(state.faults.flatMap(f=>f.photos||[]));
  const photos=[];
  for(const p of await MDPStore.photos.all())if(used.has(p.id)&&p.blob)photos.push({id:p.id,type:p.blob.type||"image/jpeg",data:await MDPPhotos.toBase64(p.blob)});
  const backup={format:"mdp-complete",version:3,exportedAt:new Date().toISOString(),data:state,meta,
   checklists:MDPStore.get(KEYS.checklists,[]),guides:MDPStore.get(KEYS.guides,[]),progress:MDPStore.get(KEYS.progress,{}),
   journal:MDPStore.get(KEYS.journal,[]),photos};
  downloadJSON(backup,"master-diagnose-"+new Date().toISOString().slice(0,10)+".json");
  MDPStore.set(KEYS.lastBackup,backup.exportedAt);showStorage();setBanner("backup",null);
 }catch(err){notify("Копия не создана: "+err.message)}
 finally{btn.disabled=false;btn.textContent=label}
};
$("importAll").onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>300*1024*1024)throw Error("Файл больше 300 МБ");
  let parsed;try{parsed=JSON.parse(await file.text())}catch{throw Error("Файл повреждён или это не JSON")}
  const {entries,photos,summary}=parseBackup(parsed);
  if(!(await ask("Восстановить из файла: "+summary+"?\nТекущие данные этих разделов будут заменены.",{ok:"Восстановить"})))return;
  await MDPStore.restore(entries,photos&&photos.map(p=>({id:p.id,blob:MDPPhotos.fromBase64(p.data,p.type)})));
  await notify("Копия восстановлена. Приложение перезапустится.");location.reload();
 }catch(err){notify("Восстановление не выполнено: "+err.message+"\nТекущие данные не изменены.")}finally{e.target.value=""}
};
async function showStorage(){
 const i=await MDPStore.info(),last=MDPStore.get(KEYS.lastBackup);
 const parts=[i.backend==="indexeddb"?"Хранилище: IndexedDB":"Хранилище: localStorage (IndexedDB недоступен)"];
 if(i.persisted===true)parts.push("защищено от автоочистки");else if(i.persisted===false)parts.push("браузер может очистить при нехватке места — делайте копии");
 if(i.usage!=null)parts.push("занято "+(i.usage/1048576).toFixed(1).replace(".",",")+" МБ");
 parts.push(last?"последняя копия: "+new Date(last).toLocaleDateString("ru"):"копий ещё не было");
 $("storageInfo").textContent=parts.join(" · ");
}
// Photos left behind by an interrupted save or an old-format restore.
async function cleanOrphans(){
 const keys=await MDPStore.photos.keys();
 const used=new Set(state.faults.flatMap(f=>f.photos||[]));
 const orphans=keys.filter(id=>!used.has(id));
 if(orphans.length)await MDPStore.photos.remove(orphans);
}
// Remind about a backup when there are changes the last copy does not have.
function checkBackup(){
 const now=Date.now(),last=Date.parse(MDPStore.get(KEYS.lastBackup)||"")||0,changed=Date.parse(MDPStore.get(KEYS.lastChange)||"")||0;
 const first=Date.parse(MDPStore.get(KEYS.firstUse)||"")||now;
 const hasData=state.faults.length||MDPStore.get(KEYS.checklists,[]).length||MDPStore.get(KEYS.guides,[]).length||MDPStore.get(KEYS.journal,[]).length;
 const days=Math.floor((now-(last||first))/864e5);
 if(!PREVIEW&&hasData&&changed>last&&days>=(last?7:2))setBanner("backup",{text:last?"Резервной копии не было "+days+" дн., а данные менялись. Если телефон потеряется или браузер очистит память, изменения пропадут.":"Резервная копия ещё ни разу не делалась. Сохраните файл — без него данные живут только в этом браузере.",label:"Скачать копию",action:()=>$("exportAll").click()});
}
if(!MDPStore.get(KEYS.firstUse))MDPStore.set(KEYS.firstUse,new Date().toISOString());
// Install: Android/desktop Chrome offers a prompt; iPhone needs the Share menu.
const standalone=navigator.standalone||matchMedia("(display-mode: standalone)").matches;
const dismissInstall=()=>MDPStore.set(KEYS.installDismissed,true);
let installEvent=window.__mdpInstallEvent||null;
function offerInstall(){
 if(PREVIEW||standalone||MDPStore.get(KEYS.installDismissed))return;
 if(installEvent)setBanner("install",{text:"Установите приложение на главный экран — оно будет открываться как обычное и работать без интернета.",label:"Установить",onDismiss:dismissInstall,
  action:async()=>{const ev=installEvent;installEvent=null;setBanner("install",null);ev.prompt();const c=await ev.userChoice.catch(()=>null);if(c?.outcome==="accepted")dismissInstall()}});
 else if(/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))
  setBanner("install",{text:"Чтобы приложение открывалось с главного экрана и работало без сети: в Safari нажмите «Поделиться» ⬆︎, затем «На экран Домой».",label:"Понятно",closeLabel:"Позже",action:()=>{dismissInstall();setBanner("install",null)}});
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvent=e;offerInstall()});
window.addEventListener("appinstalled",()=>{dismissInstall();setBanner("install",null)});
render();showStorage();cleanOrphans().catch(console.warn);checkBackup();offerInstall();
});
