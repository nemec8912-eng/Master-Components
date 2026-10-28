/* v3 интерфейс: меню устройств, переключатели режимов, «Ещё», поиск, вкладки панели, мобильные вкладки,
   шпаргалка, прогресс, установка как приложение */
const mobile=()=>matchMedia("(max-width:760px)").matches;
const ICONS={tv:'<rect x="3" y="5" width="20" height="13" rx="2"/><path d="M9 22h8M13 18v4"/>',plug:'<path d="M9 3v5M17 3v5M6 8h14v4a7 7 0 0 1-14 0zM13 19v4"/>',
 pc:'<rect x="6" y="3" width="14" height="20" rx="2"/><circle cx="13" cy="16" r="3"/><path d="M9 7h8"/>',bulb:'<path d="M9 18h8M10 22h6M13 3a6 6 0 0 0-4 10.5c1 1 1.5 2 1.5 3.5h5c0-1.5.5-2.5 1.5-3.5A6 6 0 0 0 13 3z"/>',
 spk:'<path d="M4 10h4l6-5v16l-6-5H4z"/><path d="M18 9a5 5 0 0 1 0 8M21 6a9 9 0 0 1 0 14"/>',wash:'<rect x="4" y="3" width="18" height="20" rx="2"/><circle cx="13" cy="14" r="5"/><path d="M7 7h3"/>',
 mw:'<rect x="2" y="5" width="22" height="15" rx="2"/><rect x="5" y="8" width="11" height="9" rx="1"/><path d="M19 9v1M19 13v1"/>',weld:'<path d="M4 22l9-9M13 13l3-8 5 5-8 3"/><path d="M18 18l2 2M21 15l1 1M15 21l1 1"/>',
 phone:'<rect x="7" y="2" width="12" height="22" rx="2.5"/><path d="M11 20h4"/><path d="M14 8l-2 4h3l-2 4"/>',fridge:'<rect x="6" y="2" width="14" height="22" rx="2"/><path d="M6 10h14M9 5v3M9 13v5"/>',laptop:'<rect x="5" y="5" width="16" height="11" rx="1.5"/><path d="M2 20h22l-2-4H4z"/>',ac:'<rect x="2" y="5" width="22" height="9" rx="2"/><path d="M5 11h16M8 17l-1 3M13 17v3M18 17l1 3"/>',ind:'<rect x="3" y="4" width="20" height="18" rx="3"/><circle cx="13" cy="13" r="5.5"/><circle cx="13" cy="13" r="2.5"/>',book:'<path d="M4 4h7a3 3 0 0 1 3 3v15a2 2 0 0 0-2-2H4zM22 4h-7a3 3 0 0 0-3 3"/><path d="M22 4v16h-8"/>'};
function histOf(id){try{const v=localStorage.getItem(id==="samsung"?"psu.hist":"psu."+id+".hist");return v?JSON.parse(v):[]}catch(e){return[]}}
/* ---------- модальное окно ---------- */
let modOnClose=null;
function openModal(title,html,onClose){$("modT").textContent=title;$("modB").innerHTML=html;$("modal").hidden=false;modOnClose=onClose||null;$("modX").focus()}
function closeModal(){$("modal").hidden=true;if(modOnClose)modOnClose();modOnClose=null}
$("modX").addEventListener("click",closeModal);
$("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("modal").hidden)closeModal();if(!$("morePop").hidden)togglePop(false);$("findL").hidden=true}});
/* ---------- меню устройств ---------- */
function devCards(){
  const links=[...$("devNav").querySelectorAll("a")],groups={};
  links.forEach(a=>{(groups[a.dataset.group]=groups[a.dataset.group]||[]).push(a)});
  return Object.entries(groups).map(([g,list])=>`<div class="dgroup">${g}</div><div class="dgrid">`+list.map(a=>{
    const id=a.dataset.id,n=+a.dataset.n||0,h=id?histOf(id):[],solved=new Set(h.filter(x=>!x.rand).map(x=>x.t)).size,p=n?Math.min(100,Math.round(solved/n*100)):0;
    return `<a class="dcard" href="${a.getAttribute("href")}"${a.getAttribute("aria-current")?' aria-current="page"':""}><span class="ic"><svg viewBox="0 0 26 26">${ICONS[a.dataset.icon]||ICONS.tv}</svg></span><b>${a.textContent}</b><small>${a.dataset.desc}</small>`+
      (n?`<span class="pr"><i style="--p:${p}%"></i>${solved} из ${n}</span>`:"")+`</a>`}).join("")+`</div>`).join("");
}
$("devB").addEventListener("click",()=>{$("devB").setAttribute("aria-expanded","true");openModal("Выберите устройство",devCards(),()=>$("devB").setAttribute("aria-expanded","false"))});
/* ---------- режим и вид ---------- */
function syncSeg(){$("sgLearn").setAttribute("aria-pressed",String(!game.on));$("sgRepair").setAttribute("aria-pressed",String(game.on));
  $("sgSch").setAttribute("aria-pressed",String(!pcbOn));$("sgPcb").setAttribute("aria-pressed",String(pcbOn));$("mtTask").hidden=!game.on;
  if(!game.on&&document.body.dataset.mt==="task")setMt("board")}
const _setMode3=setMode;setMode=function(on){_setMode3(on);syncSeg();if(on&&mobile())setMt("task")};
const _setView3=setView;setView=function(on){_setView3(on);syncSeg()};
$("sgLearn").addEventListener("click",()=>{if(game.on){if(exam.on)examStop(true);setMode(false)}});
$("sgRepair").addEventListener("click",()=>{if(!game.on)setMode(true)});
$("sgSch").addEventListener("click",()=>{if(pcbOn)setView(false)});
$("sgPcb").addEventListener("click",()=>{if(!pcbOn)setView(true)});
/* ---------- «Ещё» ---------- */
function togglePop(v){const p=$("morePop");p.hidden=v===undefined?!p.hidden:!v;$("moreB").setAttribute("aria-expanded",String(!p.hidden))}
$("moreB").addEventListener("click",e=>{e.stopPropagation();togglePop()});
addEventListener("click",e=>{if(!$("morePop").hidden&&!e.target.closest(".more"))togglePop(false);if(!e.target.closest(".find"))$("findL").hidden=true});
const OPT={hl:store.get("opt.hl",true),norm:store.get("opt.norm",true),flow:store.get("opt.flow",true)};
[["optHl","hl"],["optNorm","norm"],["optFlow","flow"]].forEach(([eid,k])=>{const c=$(eid);c.checked=OPT[k];c.addEventListener("change",()=>{OPT[k]=c.checked;store.set("opt."+k,c.checked);document.dispatchEvent(new CustomEvent("opt",{detail:k}))})});
/* ---------- поиск детали ---------- */
let findAct=0;
function findList(q){q=q.trim().toLowerCase();if(!q)return[];
  const r=[];Object.keys(P).forEach(id=>{const [n,v]=P[id],L=id.toLowerCase();let s=0;
    if(L===q)s=100;else if(L.startsWith(q))s=80;else if(n.toLowerCase().includes(q))s=50;else if(v.toLowerCase().includes(q))s=40;if(s)r.push([s,id])});
  return r.sort((a,b)=>b[0]-a[0]||a[1].localeCompare(b[1],"ru",{numeric:true})).slice(0,12).map(x=>x[1])}
function findRender(){const L=findList($("findQ").value),ul=$("findL");ul.hidden=!L.length;findAct=0;
  ul.innerHTML=L.map((id,i)=>`<li><button type="button" data-id="${id}" class="${i===0?"act":""}"><b>${id}</b>${P[id][0]}<span>${shortV(P[id][1])}</span></button></li>`).join("")}
function findGo(id){$("findL").hidden=true;$("findQ").value="";if(mobile())setMt("board");pick(id,true);if(typeof flashPart==="function")flashPart(id)}
$("findQ").addEventListener("input",findRender);
$("findQ").addEventListener("keydown",e=>{const b=[...$("findL").querySelectorAll("button")];if(!b.length)return;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();b[findAct].classList.remove("act");findAct=(findAct+(e.key==="ArrowDown"?1:b.length-1))%b.length;b[findAct].classList.add("act")}
  if(e.key==="Enter"){e.preventDefault();findGo(b[findAct].dataset.id)}});
$("findL").addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(b)findGo(b.dataset.id)});
addEventListener("keydown",e=>{if(e.key==="/"&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$("findQ").focus()}});
/* ---------- вкладки боковой панели ---------- */
function setTab(t){document.querySelectorAll(".stabs [role=tab]").forEach(b=>{const on=b.dataset.tab===t;b.setAttribute("aria-selected",String(on))});
  ["tTools","tLab","tParts","tNote"].forEach(i=>$(i).hidden=i!==t);store.set("tab",t)}
document.querySelectorAll(".stabs [role=tab]").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
setTab(store.get("tab","tTools"));
new MutationObserver(()=>{if(document.body.classList.contains("dragging")&&$("tParts").hidden){setTab("tParts");if(mobile())setMt("tools")}}).observe(document.body,{attributes:true,attributeFilter:["class"]});
const _setTool3=setTool;setTool=function(t){_setTool3(t);if(t!=="hand"&&$("tTools").hidden)setTab("tTools")};
function tabBadges(){const tb=document.querySelector('[data-tab="tParts"]'),n=st.trash.length;tb.innerHTML="Замена"+(n?`<span class="cnt">${n}</span>`:"")}
const _renderTrash3=renderTrash;renderTrash=function(){_renderTrash3();tabBadges()};tabBadges();
/* ---------- мобильные вкладки ---------- */
function setMt(m){
  // На телефоне остаются только три основных раздела. Задача живёт вместе со схемой.
  m=m==="task"?"board":(m==="dev"?"part":m);
  document.body.dataset.mt=m;
  document.body.classList.remove("show-device");
  const db=$("mobileDevB");if(db)db.setAttribute("aria-expanded","false");
  document.querySelectorAll("#mtabs button").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.m===m));if(b.dataset.m===m)b.classList.remove("dot")});
  scrollTo({top:0})
}
document.querySelectorAll("#mtabs button").forEach(b=>b.addEventListener("click",()=>setMt(b.dataset.m)));
document.body.dataset.mt="board";
// Дополнительные данные устройства не потеряны: открываются из карточки детали.
{const b=document.createElement("button");b.type="button";b.id="mobileDevB";b.textContent="Состояние устройства и журнал";b.setAttribute("aria-expanded","false");
 $("partCard").appendChild(b);
 b.addEventListener("click",()=>{const open=!document.body.classList.contains("show-device");document.body.classList.toggle("show-device",open);b.setAttribute("aria-expanded",String(open));if(open)$("devCard").scrollIntoView({block:"nearest",behavior:"smooth"})})}
{if(mobile())document.body.classList.add("task-compact");const b=document.createElement("button");b.type="button";b.id="mobileTaskB";const cmp=document.body.classList.contains("task-compact");b.textContent=cmp?"Подсказки и маршрут":"Свернуть задание";b.setAttribute("aria-expanded",String(!cmp));
 $("repair").querySelector(".rp-head").appendChild(b);
 b.addEventListener("click",()=>{const compact=document.body.classList.toggle("task-compact");b.setAttribute("aria-expanded",String(!compact));b.textContent=compact?"Подсказки и маршрут":"Свернуть задание"})}

const _pick3=pick;pick=function(id,scroll){_pick3(id,scroll);if(mobile()&&document.body.dataset.mt!=="part")document.querySelector('#mtabs [data-m="part"]').classList.add("dot")};
{const m=document.createElement("button");m.type="button";m.className="mini";m.id="mini";m.hidden=true;m.innerHTML='<span id="miniT"></span><b id="miniV"></b>';document.body.appendChild(m);
 m.addEventListener("click",()=>setMt("tools"))}
setInterval(()=>{const m=$("mini");if(!mobile()||ms.tool==="hand"||document.body.dataset.mt==="tools"||!(ms.id||ms.trash)){m.hidden=true;return}
  m.hidden=false;$("miniT").textContent=($("mTool").textContent||"")+" · "+(ms.id||(ms.trash&&ms.trash.id)||"");$("miniV").textContent=$("mOsc").hidden?($("mV").textContent+" "+$("mU").textContent):"∿ сигнал"},300);
/* ---------- шпаргалка ---------- */
const CHECK_BY_CAT={C:"разрядить, затем ёмкость и ESR",CP:"разрядить, затем ёмкость и ESR",R:"без питания: сопротивление",F:"прозвонка",TH:"без питания: сопротивление",RV:"без питания: сопротивление (норма OL)",
  L:"сопротивление обмотки; межвитковое — сравнением с исправной",D:"режим диода в обе стороны",BD:"режим диода, каждый диод моста",LED:"режим диода, должен слабо светиться",
  Q:"режим диода между выводами, затем сигнал на затворе / базе",TRI:"пробой — прозвонкой, работу — в схеме",IC:"питание на выводах, входные и выходные сигналы",OPT:"светодиод — режим диода, транзистор — в схеме",
  RL:"сопротивление катушки и контакты",SW:"прозвонка нажатого и отпущенного",XT:"осциллограф на выводах",MG:"нить накала и пробой на корпус",MOT:"сопротивление обмотки",
  CON:"осмотр и прозвонка контактов",BAT:"напряжение и внутреннее сопротивление",SPK:"сопротивление катушки"};
function checkAdvice(id){return CHECK_BY_CAT[catOf(id)]||"напряжения на выводах, затем проверка детали"}
function cheatHtml(){
  const rows={};
  Object.entries(P).forEach(([id,p])=>{
    if(!p[4])return;
    Object.entries(p[4]).forEach(([m,[why,sym]])=>{
      const k=sym.join(" · ");
      (rows[k]=rows[k]||{sym,list:[]}).list.push([id,m])
    })
  });
  const arr=Object.values(rows).sort((a,b)=>b.list.length-a.list.length);
  return '<p class="dim">'+BOARD.name+': симптом → подозреваемые детали → проверка. Это учебные рекомендации, не замена сервис-мануалу. На реальной плате перед прозвонкой отключайте питание и безопасно разряжайте конденсаторы.</p>'+
  '<table class="cheat"><thead><tr><th>Признак</th><th>Вероятные детали</th><th>Что измерить</th></tr></thead><tbody>'+
  arr.map(r=>'<tr><td>'+r.sym.join("<br>")+'</td><td><div class="pl">'+r.list.map(([id,m])=>
    '<span class="chip"><button type="button" class="pref" data-id="'+id+'" title="'+P[id][0]+'">'+id+'</button><em>'+ML[m].toLowerCase()+'</em></span>').join("")+
    '</div></td><td class="check-col">'+[...new Set(r.list.map(([id])=>checkAdvice(id)))].join("; ")+'</td></tr>').join("")+
  '</tbody></table><div class="mprint"><button type="button" id="cheatPrint">Распечатать</button></div>'
}
$("cheatB").addEventListener("click",()=>{openModal("Шпаргалка: признак → детали",cheatHtml());$("cheatPrint").addEventListener("click",()=>print())});
$("modB").addEventListener("click",e=>{const b=e.target.closest(".pref[data-id]");if(b){closeModal();findGo(b.dataset.id)}const r=e.target.closest("[data-rep]");if(r){closeModal();const i=SCEN.findIndex(s=>s.t===r.dataset.rep);if(i>=0){if(!game.on)setMode(true);$("scSel").value=i;startScenario(i);if(mobile())setMt("task")}}});
/* ---------- прогресс ---------- */
function statHtml(){
  const links=[...$("devNav").querySelectorAll("a")].filter(a=>a.dataset.id);let tot=0,sol=0,rep=0,sum=0,ex=[];
  const per=links.map(a=>{const h=histOf(a.dataset.id),n=+a.dataset.n,s=new Set(h.filter(x=>!x.rand).map(x=>x.t)).size;tot+=n;sol+=s;rep+=h.length;sum+=h.reduce((q,x)=>q+x.score,0);
    h.filter(x=>x.t==="Экзамен").forEach(x=>ex.push(x));return{a,n,s,h}});
  const h=store.get("hist",[]),fixed=SCEN.filter(s=>!s.rand);
  const weak=[];fixed.forEach(s=>{const tries=h.filter(x=>x.t===s.t);if(!tries.length)return;const best=Math.max(...tries.map(x=>x.score));if(best<70)weak.push([s.t,best])});
  const todo=fixed.filter(s=>!h.some(x=>x.t===s.t)).slice(0,5);
  const grades=ex.map(x=>(x.ans.match(/оценка (\d)/)||[])[1]).filter(Boolean);
  // Слабые места по всем устройствам, а не только по открытой плате.
  const missed=[];
  per.forEach(({a,h})=>{
    const groups=new Map();
    h.filter(x=>!x.rand&&x.t!=="Экзамен").forEach(x=>{
      const entry=groups.get(x.t)||{t:x.t,total:0,miss:0};
      entry.total++;
      if(x.rev||x.hints>=2||x.score<70||x.wrong>0)entry.miss++;
      groups.set(x.t,entry)
    });
    groups.forEach(v=>{if(v.miss)missed.push({...v,a})})
  });
  missed.sort((a,b)=>b.miss-a.miss||b.miss/b.total-a.miss/a.total);
  const missedHtml=missed.length?
    '<div class="dgroup">Чаще всего вызывают трудности</div><ul class="weak">'+
    missed.slice(0,12).map(x=>'<li><span><b>'+x.t+'</b><small class="dim"> · '+x.a.textContent+' · сложностей '+x.miss+' из '+x.total+'</small></span>'+
      (x.a.dataset.id===document.body.dataset.board?'<button type="button" data-rep="'+x.t.replace(/"/g,"&quot;")+'">Тренировать</button>':
       '<a class="train-link" href="'+x.a.getAttribute("href")+'?train='+encodeURIComponent(x.t)+'">Тренировать</a>')+'</li>').join('')+'</ul>':
    '<p class="dim">Когда накопятся попытки с ошибками или подсказками, здесь появятся слабые места по устройствам.</p>';
  return `<div class="kpis"><div class="kpi"><b>${sol} / ${tot}</b><span>задач решено на всех устройствах</span></div><div class="kpi"><b>${rep}</b><span>ремонтов всего</span></div>`+
    `<div class="kpi"><b>${rep?Math.round(sum/rep):"—"}</b><span>средний счёт</span></div><div class="kpi"><b>${grades.length?Math.max(...grades):"—"}</b><span>лучшая оценка за экзамен (${grades.length} экз.)</span></div></div>`+
    `<div class="dgroup">${BOARD.name}: стоит повторить</div>`+(weak.length?`<ul class="weak">${weak.map(([t,b])=>`<li><span>${t} <span class="dim">· лучший счёт ${b}</span></span><button type="button" data-rep="${t}">Повторить</button></li>`).join("")}</ul>`:`<p class="dim">Здесь появятся задачи, где понадобились ответ или много подсказок.</p>`)+
    (todo.length?`<div class="dgroup">Ещё не решали</div><ul class="weak">${todo.map(s=>`<li><span>${s.t}</span><button type="button" data-rep="${s.t}">Начать</button></li>`).join("")}</ul>`:"")+
    missedHtml+`<div class="dgroup">По устройствам</div><div class="dgrid">`+per.map(({a,n,s,h})=>`<a class="dcard" href="${a.getAttribute("href")}"><span class="ic"><svg viewBox="0 0 26 26">${ICONS[a.dataset.icon]}</svg></span><b>${a.textContent}</b><small>${h.length} ремонтов${h.length?" · средний счёт "+Math.round(h.reduce((q,x)=>q+x.score,0)/h.length):""}</small><span class="pr"><i style="--p:${n?Math.round(s/n*100):0}%"></i>${s} из ${n}</span></a>`).join("")+`</div>`}
$("statB").addEventListener("click",()=>openModal("Мой прогресс",statHtml()));
/* ---------- компактная панель инструментов ---------- */
/* ---------- быстрые действия внутри «Ещё» ---------- */
{const q=document.createElement("div");q.className="quick";
 q.innerHTML='<span class="ql">Быстро открыть</span><div class="qrow"><button type="button" data-quick="dmm">Мультиметр</button><button type="button" data-quick="thermo">Тепловизор</button><button type="button" data-quick="lab">ЛБП</button></div>';
 $("morePop").prepend(q);
 q.addEventListener("click",e=>{const b=e.target.closest("[data-quick]");if(!b)return;const k=b.dataset.quick;
   if(k==="lab")setTab("tLab");else setTool(k);if(mobile())setMt("tools");else document.querySelector(".side").scrollIntoView({block:"nearest"});togglePop(false)})}
// Ссылка «тренировать» переносит к соответствующей задаче другой платы.
addEventListener("load",()=>{
  const name=new URLSearchParams(location.search).get("train");if(!name)return;
  const i=SCEN.findIndex(s=>!s.rand&&s.t===name);
  if(i>=0){if(!game.on)setMode(true);$("scSel").value=i;startScenario(i);if(mobile())setMt("board")}
});
/* ---------- установка как приложение ---------- */
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)&&!/claude|usercontent/.test(location.hostname)){addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
syncSeg();
