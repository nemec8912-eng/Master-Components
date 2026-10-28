/* v4: пауза, тема, горячие клавиши, обучение «Как пользоваться», незаконченные задачи в меню, копирование блокнота */

/* ---------- пауза: всё замирает, можно спокойно рассмотреть ток и напряжения ---------- */
window.simRaw=sim;
let PAUSED=false,speedBeforePause=1;
sim=function(now,dt){return window.simRaw(now,PAUSED?0:dt)};
function setPause(v){if(v===PAUSED)return;PAUSED=v;if(v){speedBeforePause=st.speed;st.speed=0}else st.speed=speedBeforePause||1;
  const b=$("pauseB");b.setAttribute("aria-pressed",String(v));b.innerHTML=v?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2l10 6-10 6z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>';b.setAttribute("aria-label",v?"Продолжить":"Пауза");b.title=v?"Продолжить (пробел)":"Пауза (пробел)";$("pauseTag").hidden=!v}
{const t=document.createElement("div");t.id="pauseTag";t.className="pausetag";t.hidden=true;t.textContent="Пауза — схема замерла. Пробел — продолжить";$("board").prepend(t)}
$("pauseB").addEventListener("click",()=>setPause(!PAUSED));
$("spd").addEventListener("input",()=>{if(PAUSED){speedBeforePause=st.speed;st.speed=0}});

/* ---------- тема ---------- */
const THEMES=[["auto","Тема: как в системе"],["light","Тема: светлая"],["dark","Тема: тёмная"]];
function themeGet(){try{return localStorage.getItem("psu.theme")||"auto"}catch(e){return"auto"}}
function themeSet(t){try{localStorage.setItem("psu.theme",t)}catch(e){}applyTheme()}
function applyTheme(){const t=themeGet();if(t==="auto")delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t;const b=$("themeB");if(b)b.textContent=THEMES.find(x=>x[0]===t)[1]}
{const b=document.createElement("button");b.type="button";b.id="themeB";$("bFixAll").after(b);
 b.addEventListener("click",()=>{const i=THEMES.findIndex(x=>x[0]===themeGet());themeSet(THEMES[(i+1)%3][0])});applyTheme()}

/* ---------- горячие клавиши ---------- */
const KEYS=[["Пробел","пауза / продолжить"],["/","найти деталь"],["1 … 6","рука, мультиметр, ESR-метр, осциллограф, тестер, тепловизор"],["V","схема ↔ плата"],["R","обучение ↔ ремонт"],["+  −","масштаб"],["H","подсказка в задаче"],["?","эта справка"],["Esc","закрыть окно"]];
function keysHtml(){return '<table class="cheat"><tbody>'+KEYS.map(([k,v])=>`<tr><td><kbd>${k}</kbd></td><td>${v}</td></tr>`).join("")+"</tbody></table>"}
addEventListener("keydown",e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;if(!$("modal").hidden&&e.key!=="Escape")return;
  const k=e.key,tools=["hand","dmm","esr","osc","tst","thermo"];
  if(k===" "){e.preventDefault();setPause(!PAUSED)}
  else if(/^[1-6]$/.test(k))setTool(tools[+k-1]);
  else if(k==="v"||k==="V"||k==="м"||k==="М")setView(!pcbOn);
  else if(k==="r"||k==="R"||k==="к"||k==="К"){if(game.on){if(exam.on)return;setMode(false)}else setMode(true)}
  else if(k==="+"||k==="=")$("zIn").click();else if(k==="-")$("zOut").click();
  else if((k==="h"||k==="H"||k==="р"||k==="Р")&&game.on&&!$("hintB").disabled)$("hintB").click();
  else if(k==="?"||k===",")openModal("Горячие клавиши",keysHtml());
});
{const b=document.createElement("button");b.type="button";b.id="keysB";b.textContent="Горячие клавиши";$("themeB").after(b);b.addEventListener("click",()=>{togglePop(false);openModal("Горячие клавиши",keysHtml())})}

/* ---------- «Как пользоваться»: короткий тур при первом открытии ---------- */
const TOUR=[
 ["#devB","Устройства","Здесь все платы: блоки питания, телевизор, бытовая техника, кондиционер, ноутбук, сварка, телефон. Полоска показывает, сколько задач решено."],
 ["#board","Схема","Точки на проводах — это ток: где точки бегут, ток идёт. Цвет провода — какое там напряжение (подписи сверху). Нажмите на деталь — её цепи подсветятся."],
 ["#partCard","Деталь","Здесь объяснение, зачем нужна деталь и как её проверить. Кнопками можно вывести её из строя и посмотреть, что изменится."],
 [".side","Приборы","Выберите мультиметр, осциллограф или тепловизор и нажмите на деталь. Под показанием видно, сколько должно быть на исправной плате."],
 ["#sgPcb","Плата","Тот же блок в виде настоящей платы: дорожки окрашены по напряжению, по ним тоже бежит ток."],
 ["#sgRepair","Ремонт","Задачи со скрытой поломкой: найдите её приборами, выпаяйте деталь и поставьте исправную. Пробел ставит всё на паузу."]];
let tourI=-1;
function tourShow(i){const box=$("tour");tourI=i;document.querySelectorAll(".tourhl").forEach(x=>x.classList.remove("tourhl"));
  if(i<0||i>=TOUR.length){box.hidden=true;try{localStorage.setItem("psu.tour","1")}catch(e){}return}
  let [sel,t,txt]=TOUR[i];if(mobile()&&(sel===".side"||sel==="#partCard")){setMt(sel===".side"?"tools":"part")}else if(mobile())setMt("board");
  const el_=document.querySelector(sel);if(!el_){tourShow(i+1);return}el_.classList.add("tourhl");el_.scrollIntoView({block:"nearest",behavior:"smooth"});
  box.hidden=false;box.innerHTML=`<div class="tstep">${i+1} из ${TOUR.length}</div><b>${t}</b><p>${txt}</p><div class="tact"><button type="button" data-t="skip">Пропустить</button><button type="button" data-t="next" class="on">${i+1<TOUR.length?"Далее":"Готово"}</button></div>`}
{const b=document.createElement("div");b.id="tour";b.className="tour";b.hidden=true;b.setAttribute("role","dialog");b.setAttribute("aria-label","Как пользоваться");document.body.appendChild(b);
 b.addEventListener("click",e=>{const t=e.target.closest("[data-t]");if(!t)return;tourShow(t.dataset.t==="next"?tourI+1:-1)})}
{const b=document.createElement("button");b.type="button";b.id="tourB";b.textContent="Как пользоваться";$("keysB").after(b);b.addEventListener("click",()=>{togglePop(false);tourShow(0)})}
addEventListener("load",()=>{let seen="1";try{seen=localStorage.getItem("psu.tour")}catch(e){}if(!seen&&!new URLSearchParams(location.search).get("train"))setTimeout(()=>tourShow(0),600)});

/* ---------- меню устройств: незаконченные задачи ---------- */
function savedOf(id){try{const v=localStorage.getItem(id==="samsung"?"psu.save":"psu."+id+".save");const s=v&&JSON.parse(v);return s&&!s.done?s:null}catch(e){return null}}
const _devCards5=devCards;
devCards=function(){const html=_devCards5();const box=document.createElement("div");box.innerHTML=html;
  box.querySelectorAll("a.dcard").forEach(a=>{const href=a.getAttribute("href");const link=[...$("devNav").querySelectorAll("a")].find(x=>x.getAttribute("href")===href);
    if(link&&link.dataset.id&&savedOf(link.dataset.id))a.insertAdjacentHTML("beforeend",'<span class="resume">незаконченная задача — продолжить</span>')});return box.innerHTML};

/* ---------- блокнот: копировать как текст ---------- */
{const b=document.createElement("button");b.type="button";b.id="noteCopy";b.textContent="Скопировать";$("noteClr").before(b);
 b.addEventListener("click",()=>{if(!NOTE.length){toast("Блокнот пуст.");return}
   const txt=BOARD.name+" — измерения\n"+NOTE.slice().reverse().map(e=>`${new Date(e.t).toLocaleTimeString("ru-RU")}  ${e.id}  ${e.what} (${e.pw}): ${e.v}`+(e.nm&&!exam.on?`  [норма ${e.nm}]`:"")).join("\n");
   (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast("Блокнот скопирован — можно вставить в заметки или мессенджер.")).catch(()=>{openModal("Блокнот",`<textarea class="ncopy" readonly>${txt.replace(/</g,"&lt;")}</textarea>`)})})}
