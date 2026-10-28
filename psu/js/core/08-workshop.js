/* repair workshop */
st.slot={};st.trash=[];
const game={on:false,sc:-1,hints:0,done:false,reveal:false,t0:0,moves:0};
const TYPE_OF={};Object.values(SCH).forEach(sc=>(sc.c||[]).forEach(c=>{if(P[c.id]&&!TYPE_OF[c.id])TYPE_OF[c.id]=c.t}));
function catOf(id){if(/^IC/.test(id))return"IC";if(/^PC/.test(id)||/^U\d/.test(id))return"OPT";if(/^F\d/.test(id))return"F";if(/^TH/.test(id))return"TH";if(/^RV/.test(id))return"RV";if(/^BD/.test(id))return"BD";if(/^LED/.test(id))return"LED";if(/^LS\d/.test(id))return"SPK";if(/^TR\d/.test(id))return"TRI";if(/^RL\d/.test(id))return"RL";if(/^ZQ\d/.test(id))return"XT";if(/^RT\d/.test(id))return"TH";if(/^SW\d/.test(id))return"SW";if(/^J\d/.test(id))return"CON";if(/^BT\d/.test(id))return"BAT";if(/^MG\d/.test(id))return"MG";if(/^M\d/.test(id))return"MOT";
  return {R:"R",C:"C",CP:"CP",D:"D",DZ:"D",LED:"LED",Q:"Q",BJT:"Q",L:"L",CORE:"L"}[TYPE_OF[id]]||"L"}
const CATN={R:"резистор",C:"конденсатор",CP:"электролитический конденсатор",D:"диод",Q:"транзистор",IC:"микросхема",OPT:"оптопара",L:"дроссель / трансформатор",F:"предохранитель",TH:"термистор",RV:"варистор",BD:"диодный мост",LED:"светодиод",SPK:"динамик",TRI:"симистор",RL:"реле",XT:"кварцевый резонатор",SW:"выключатель",MG:"магнетрон",MOT:"двигатель",CON:"разъём",BAT:"аккумулятор"};
const CATG={R:"Резисторы",CP:"Электролитические конденсаторы",C:"Плёночные и керамические конденсаторы",D:"Диоды и стабилитроны",Q:"Транзисторы",IC:"Микросхемы",OPT:"Оптопары",L:"Дроссели и трансформаторы",F:"Предохранители",TH:"Термисторы",RV:"Варисторы",BD:"Диодные мосты",LED:"Светодиоды",SPK:"Динамики",TRI:"Симисторы",RL:"Реле",XT:"Резонаторы",SW:"Выключатели и термовыключатели",MG:"Магнетроны",MOT:"Двигатели",CON:"Разъёмы",BAT:"Аккумуляторы"};
const CORD=["R","CP","C","D","LED","Q","IC","OPT","L","F","TH","RV","BD","SPK","TRI","RL","XT","SW","MG","MOT","CON","BAT"];
const missing=id=>{const m=Object.keys(P[id][4]);return m.includes("open")?"open":m.includes("dry")?"dry":m.includes("dead")?"dead":null};
const CAT=[];
{const seen={};Object.keys(P).forEach(id=>kitFor(id).forEach(o=>{let c=catOf(id);if(/стабилитрон/.test(o.l))c="D";if(/^MOC/.test(o.l))c="OPT";
  const d=(c==="L"&&o.r==="ok")?P[id][0]+" · "+o.l:o.l;const k=c+"|"+o.l;if(!seen[k]){seen[k]=1;CAT.push({c,l:o.l,d})}}));
 CAT.sort((a,b)=>CORD.indexOf(a.c)-CORD.indexOf(b.c)||a.d.localeCompare(b.d,"ru",{numeric:true}))}

/* toast */
const toastEl=document.createElement("div");toastEl.className="toast";toastEl.setAttribute("role","status");document.body.appendChild(toastEl);
let toastT;function toast(m){toastEl.textContent=m;toastEl.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove("show"),3200)}

/* remove / place */
function removePart(id){
  if(st.slot[id]==="empty")return;
  const real=st.F[id]||(id==="F1"&&st.fuse?"open":null),ins=st.inst[id];
  const ph=partPhys(id);st.trash.unshift({id,l:ins?ins.l:P[id][1],c:ph.cat,mode:ph.mode,bad:ins&&ins.r!=="ok"&&ins.r!=="ok2"?"wrong":real,orig:!ins,checked:false});if(ms&&ms.id===id){ms.id=null;drawProbes();renderMeter()}
  delete st.inst[id];delete st.later[id];delete st.sec[id];if(id==="F1"){st.fuse=false;st.bug=false}
  Object.keys(st.casc).forEach(k=>{if(k.startsWith(id))delete st.casc[k]});
  const mm=missing(id);if(mm)st.F[id]=mm;else delete st.F[id];
  st.slot[id]="empty";game.moves++;log(`${id} выпаян и убран в корзину.`);renderTrash();if(sel===id)renderCard();
}
function placeItem(id,it){
  if(st.slot[id]!=="empty"){toast(`Место ${id} занято. Сначала выпаяйте старую деталь — перетащите её в корзину.`);pick(id);return}
  const kit=kitFor(id),f=kit.find(o=>o.l===it.l),need=catOf(id),mm=missing(id);
  const opt=f||(it.c===need?{l:it.l,r:"same",m:mm,why:"Тип детали тот, но номинал или модель не подходят: режим цепи нарушен."}
    :{l:it.l,r:"same",m:mm,why:`Здесь должен стоять ${CATN[need]}, а поставлен ${CATN[it.c]}. Он не может выполнить эту работу — цепь не работает.`});
  st.trash=st.trash.filter(x=>!(x.id===id&&x.orig&&!x.bad&&opt.r==="ok"&&false));
  install(id,Object.assign({c:it.c},opt));game.moves++;pick(id);renderTrash();if(ms&&ms.id===id)renderMeter();
}

/* drag & drop */
let drag=null;const ghost=document.createElement("div");ghost.className="ghost";ghost.hidden=true;document.body.appendChild(ghost);
let hov=null;
function dStart(e,kind,payload,label){drag={kind,payload,label,x:e.clientX,y:e.clientY,moved:false}}
function hoverTarget(t){
  const tr=$("trash");tr.classList.toggle("over",!!(drag&&drag.kind==="part"&&t&&t.closest("#trash")));
  const g=drag&&drag.kind==="item"&&t?t.closest(".pc"):null;
  if(hov&&hov!==g)hov.classList.remove("drop");hov=g;if(g)g.classList.add("drop");
}
addEventListener("pointermove",e=>{if(!drag)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6){drag.moved=true;ghost.hidden=false;ghost.textContent=drag.label;document.body.classList.add("dragging")}
  if(drag.moved){ghost.style.left=e.clientX+14+"px";ghost.style.top=e.clientY+14+"px";hoverTarget(document.elementFromPoint(e.clientX,e.clientY))}});
addEventListener("pointerup",e=>{if(!drag)return;const d=drag;drag=null;ghost.hidden=true;document.body.classList.remove("dragging");
  const t=document.elementFromPoint(e.clientX,e.clientY);hoverTarget(null);
  if(!d.moved){if(d.kind==="part")pick(d.payload);else catClick(d.payload);return}
  if(d.kind==="part"){if(t&&t.closest("#trash"))removePart(d.payload);else toast("Чтобы выпаять деталь, отпустите её над корзиной.")}
  else{const g=t&&t.closest(".pc");if(g&&g.dataset.id&&P[g.dataset.id])placeItem(g.dataset.id,d.payload);else toast("Отпустите деталь над пустым местом на схеме.")}});
addEventListener("pointercancel",()=>{drag=null;ghost.hidden=true;document.body.classList.remove("dragging");hoverTarget(null)});
function catClick(it){
  if(sel&&st.slot[sel]==="empty")placeItem(sel,it);
  else toast(sel?`Место ${sel} занято. Сначала выпаяйте деталь (перетащите в корзину), потом выбирайте замену.`:"Сначала выберите на схеме пустое место.");
}

/* catalog */
const catF=$("catF"),catQ=$("catQ"),catL=$("catL");
{const o=document.createElement("option");o.value="";o.textContent="Все типы";catF.appendChild(o);CORD.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=CATG[c];catF.appendChild(o)})}
function renderCat(){
  const q=catQ.value.trim().toLowerCase(),f=catF.value;let h="",last="";
  CAT.forEach((it,i)=>{if(f&&it.c!==f)return;if(q&&!it.d.toLowerCase().includes(q))return;
    if(it.c!==last){last=it.c;h+=`<li class="cg">${CATG[it.c]}</li>`}
    h+=`<li><button type="button" class="ci" data-i="${i}"><i class="ct ct-${it.c}">${it.c==="OPT"?"PC":it.c}</i>${it.d}</button></li>`});
  catL.innerHTML=h||`<li class="hint">Ничего не найдено</li>`;
  catL.querySelectorAll(".ci").forEach(b=>{const it=CAT[+b.dataset.i];
    b.addEventListener("pointerdown",e=>{if(e.button!==0||e.pointerType==="touch")return;e.preventDefault();dStart(e,"item",it,it.d)});
    b.addEventListener("click",e=>{if(e.detail===0||e.pointerType==="touch"||matchMedia("(pointer:coarse)").matches)catClick(it)})});
}
catQ.addEventListener("input",renderCat);catF.addEventListener("change",renderCat);renderCat();

/* trash */
function renderTrash(){
  const L=$("trashL");
  if(!st.trash.length){L.innerHTML=`<li class="hint">Пусто. Перетащите сюда деталь со схемы.</li>`;return}
  L.innerHTML=st.trash.map((x,i)=>`<li><div><b class="mono">${x.id}</b> <span class="mono dim">${x.l}</span></div>${x.checked?`<div class="res ${x.bad?"b":"g"}">${x.bad==="wrong"?"Это была неподходящая деталь.":x.bad?"Неисправна: "+ML[x.bad].toLowerCase()+". Поломка найдена!":"Исправна — её можно было не выпаивать."}</div>`:""}
    <div class="ta">${ms&&ms.tool!=="hand"?`<button type="button" class="mb" data-mt="${i}">Измерить: ${TOOLS[ms.tool]}</button>`:""}${x.checked?"":`<button type="button" data-c="${i}">Узнать результат</button>`}${x.orig&&!x.bad&&st.slot[x.id]==="empty"?`<button type="button" data-b="${i}">Вернуть на место</button>`:""}</div></li>`).join("");
  L.querySelectorAll("[data-c]").forEach(b=>b.addEventListener("click",()=>{const x=st.trash[+b.dataset.c];x.checked=true;log(`${x.id} проверен мультиметром: ${x.bad==="wrong"?"неподходящая деталь":x.bad?"неисправен ("+ML[x.bad].toLowerCase()+")":"исправен"}.`,!!x.bad);renderTrash()}));
  L.querySelectorAll("[data-mt]").forEach(b=>b.addEventListener("click",()=>measureTrash(+b.dataset.mt)));
  L.querySelectorAll("[data-b]").forEach(b=>b.addEventListener("click",()=>{const x=st.trash[+b.dataset.b];st.trash.splice(+b.dataset.b,1);const ok=kitFor(x.id).find(o=>o.r==="ok");install(x.id,ok);game.moves++;pick(x.id);renderTrash()}));
}

/* scenarios */
const scSel=$("scSel");SCEN.forEach((s,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`${i+1}. ${s.t}`;scSel.appendChild(o)});
function setMode(on){
  game.on=on;$("bMode").textContent=on?"Режим: ремонт":"Режим: обучение";$("bMode").classList.toggle("on",on);
  $("repair").hidden=!on;document.body.classList.toggle("game",on);
  if(on&&game.sc<0)startScenario(+scSel.value||0);else{renderCard()}
}
function resetBoard(){st.surge=null;st.lab.on=false;st.lampWarn=0;st.F={};st.sec={};st.casc={};st.inst={};st.later={};st.slot={};st.trash=[];st.bug=false;st.fuse=false;st.rcd=false;st.ovp=false;st.ovpT=0;st.mains=true;st.tv=false;st.bulk=0;BOARD.reset()}
function startScenario(i){
  const sc=SCEN[i];resetBoard();Object.assign(st.F,sc.F);st.fuse=!!sc.fuse;
  Object.assign(game,{sc:i,hints:0,done:false,reveal:false,t0:Date.now(),moves:0});
  logEl.innerHTML="";log(`Задача ${i+1}: ${sc.t}. Блок подключён к сети.`);
  syncBtns();renderGame();renderTrash();pick(sel||"F1");
}
function renderGame(){
  const sc=SCEN[game.sc];if(!sc)return;
  $("scText").textContent=sc.c;
  $("hints").innerHTML=sc.h.slice(0,game.hints).map((x,i)=>`<li><b>Подсказка ${i+1}.</b> ${x}</li>`).join("")+(game.reveal?`<li class="ans"><b>Ответ.</b> ${sc.a}</li>`:"");
  $("hintB").textContent=game.hints<sc.h.length?`Подсказка (${game.hints+1} из ${sc.h.length})`:"Подсказки закончились";$("hintB").disabled=game.hints>=sc.h.length;
  $("ansB").disabled=game.reveal;
  const w=$("win");w.hidden=!game.done;
}
$("bMode").addEventListener("click",()=>setMode(!game.on));
$("scStart").addEventListener("click",()=>startScenario(+scSel.value));
$("hintB").addEventListener("click",()=>{game.hints++;log("Взята подсказка.");renderGame()});
$("ansB").addEventListener("click",()=>{game.reveal=true;log("Показан ответ: "+SCEN[game.sc].a);renderGame();renderCard()});
function checkWin(){
  if(!game.on||game.done||game.sc<0)return;
  const clean=!Object.keys(st.F).length&&!st.fuse&&!Object.keys(st.later).length&&!st.bug&&!Object.values(st.slot).includes("empty")&&Object.values(st.inst).every(o=>o.r==="ok"||o.r==="ok2");
  if(st.tv&&S.devOK&&S.winReady!==false&&clean&&st.mains){game.done=true;const sec=Math.round((Date.now()-game.t0)/1000);
    $("win").innerHTML=winHtml(sec);
    log(BOARD.doneLog);renderGame();
    const nb=$("nextB");if(nb)nb.addEventListener("click",()=>{const n=(game.sc+1)%SCEN.length;scSel.value=n;startScenario(n)})}
}
renderTrash();
