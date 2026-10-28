/* v3 помощь в обучении: подсветка цепей выбранной детали, нормы у приборов (по исправной плате),
   эталон на осциллографе, блокнот измерений, подсказки-маршрут со ссылками на детали */

/* ---------- подсветка цепей ---------- */
const GROUND=/^(gnd|hg|cg|hg0|cg0|pe|pe0|hvg)$/;
const WIRE_PAN=[];Object.keys(PAN).forEach(pid=>(SCH[pid].w||[]).forEach(()=>WIRE_PAN.push(pid)));
function termsOf(c){
  if(c.t==="CORE")return[];
  if(c.t==="IC")return c.pins.map(p=>[p[0],p[1]]);
  if(c.t==="Q")return[c.d,c.s,c.g];
  if(c.t==="BJT")return[c.b,c.c,c.e];
  if(c.t==="TRIAC")return[c.a,c.b,c.g];
  if(c.t==="BR"){const [x,y]=c.c,r=c.r;return[[x,y-r],[x,y+r],[x-r,y],[x+r,y]]}
  if(c.t==="RELAY")return[[c.x+13,c.y+10],[c.x+13,c.y+56],[c.x+80,c.y+60],[c.x+112,c.y+12]];
  if(c.t==="PT")return[[c.c[0]+8,c.c[1]-17],[c.c[0]+8,c.c[1]+17]];
  if(c.a&&c.b)return[c.a,c.b];
  return[];
}
function onWire(w,[x,y]){return w.segs.some(([,l,a,b])=>{const minx=Math.min(a[0],b[0])-1.6,maxx=Math.max(a[0],b[0])+1.6,miny=Math.min(a[1],b[1])-1.6,maxy=Math.max(a[1],b[1])+1.6;
  if(x<minx||x>maxx||y<miny||y>maxy)return false;const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return Math.abs((x-a[0])*dy-(y-a[1])*dx)/L<1.8})||w.pts.some(p=>Math.abs(p[0]-x)<1.8&&Math.abs(p[1]-y)<1.8)}
const NETS_OF={};
Object.entries(SCH).forEach(([pid,sc])=>(sc.c||[]).forEach(c=>{if(!P[c.id])return;const T=termsOf(c);const set=NETS_OF[c.id]=NETS_OF[c.id]||new Set();
  wires.forEach((w,i)=>{if(WIRE_PAN[i]!==pid||GROUND.test(w.net))return;if(T.some(t=>onWire(w,t)))set.add(w.net)})}));
let selectedWireNet=null;
function paintCircuit(netset,focusId){
  const on=!!(OPT.hl&&netset&&netset.size);
  svg.classList.toggle("hl",on);
  wires.forEach(w=>{
    const active=on&&netset.has(w.net);
    w.base.classList.toggle("on",!!active);
    w.dots.forEach(d=>d.classList.toggle("dot",!active))
  });
  flags.forEach(f=>f.r.parentNode.classList.toggle("on",!!(on&&netset.has(f.net))));
  Object.entries(parts).forEach(([id,arr])=>{
    const active=on&&(id===focusId||[...(NETS_OF[id]||[])].some(n=>netset.has(n)));
    arr.forEach(p=>p.G.classList.toggle("on",!!active))
  });
}
function highlight(id){
  selectedWireNet=null;
  paintCircuit(id?NETS_OF[id]:null,id)
}
function highlightNet(net){
  if(!net)return;
  if(!OPT.hl){OPT.hl=true;$("optHl").checked=true;store.set("opt.hl",true)}
  if(selectedWireNet===net){selectedWireNet=null;paintCircuit(null,null);return}
  selectedWireNet=net;paintCircuit(new Set([net]),null)
}
// Прозрачная, удобная для нажатия область поверх каждого тонкого провода.
wires.forEach(w=>{
  const hit=el("path",{"d":w.base.getAttribute("d"),"class":"wire-hit","aria-label":"Подсветить цепь "+w.net},w.base.parentNode);
  hit.addEventListener("click",e=>{e.stopPropagation();highlightNet(w.net)});
});
let userActT=0;["pointerdown","keydown"].forEach(ev=>addEventListener(ev,()=>{userActT=performance.now()},true));
const _pick4=pick;pick=function(id,scroll){_pick4(id,scroll);if(performance.now()-userActT<800||scroll)highlight(id);else highlight(null)};
document.addEventListener("opt",e=>{if(e.detail==="hl")highlight(sel)});
$("board").addEventListener("click",e=>{if(e.target===svg||e.target.classList.contains("prect"))highlight(null)});
function flashPart(id){(parts[id]||[]).forEach(p=>{p.G.classList.remove("flash");void p.G.getBBox();p.G.classList.add("flash");setTimeout(()=>p.G.classList.remove("flash"),1600)})}

/* ---------- исправная плата «в тени»: нормы и эталоны ---------- */
let HS=null;
function healthyKey(){return[st.mains,st.tv,st.lab.on,st.lab.rail,st.lab.v,Math.round(S.t/4)].join("|")}
function healthy(){
  const key=healthyKey();if(HS&&HS.key===key)return HS;
  const keep={trash:st.trash,temp:st.temp,lab:st.lab},bk=structuredClone(st),Sb=S,mute=["log","renderCard","labUi","toast","renderTrash"],saved={};
  mute.forEach(f=>{saved[f]=window[f];window[f]=()=>{}});
  const out={key,node:{},wave:{},heat:{}};
  try{
    Object.assign(st,{F:{},sec:{},casc:{},later:{},inst:{},slot:{},fuse:false,surge:null,bug:false,rcd:false,ovp:false});
    const run=window.simRaw||sim;let now=performance.now();for(let i=0;i<300;i++){now+=20;run(now,.02)}
    const nodes=new Set();Object.values(PINS).forEach(pp=>pp.forEach(p=>nodes.add(p[1])));
    nodes.forEach(n=>{out.node[n]=NODE(n);try{const W=wave(n),a=[];for(let k=0;k<=120;k++)a.push(W.f(k/120));out.wave[n]={lo:W.lo,hi:W.hi,a}}catch(e){}});
    Object.keys(P).forEach(id=>{try{out.heat[id]=heatTarget(id)}catch(e){}});
  }catch(e){console.warn(e)}
  Object.keys(st).forEach(k=>delete st[k]);Object.assign(st,bk);Object.assign(keep.lab,bk.lab);st.lab=keep.lab;st.trash=keep.trash;st.temp=keep.temp;S=Sb;mute.forEach(f=>window[f]=saved[f]);
  HS=out;return out;
}
function num(s){const x=parseFloat(String(s).replace(",","."));return isNaN(x)?null:x}
function normFor(){
  if(ms.tool==="hand")return null;
  if(ms.tool==="thermo"&&ms.id){const t=healthy().heat[ms.id];return t==null?null:{v:Math.round(t)+" °C",n:t,tol:12}}
  if(ms.trash||((ms.tool==="dmm"&&!["vdc","vac"].includes(ms.mode))||ms.tool==="esr"||ms.tool==="tst")){
    const x=ms.trash;let p;if(x)p={id:x.id,cat:x.c||catOf(x.id),label:P[x.id][1],mode:null};else{const q=partPhys(ms.id);if(q.empty)return null;p=Object.assign({},q,{mode:null,label:P[ms.id][1]})}
    if(!x&&ms.tool==="tst")return null;
    const r=passive(p,ms.tool,ms.mode);if(!r||r.v==="—")return null;return{v:r.v+(r.u?" "+r.u:""),n:num(r.v),raw:r.v,tol:null}}
  if(ms.tool==="dmm"&&ms.id){const pins=PINS[ms.id]||[];if(pins.length<2)return null;const H=healthy(),a=H.node[pins[0][1]],b=H.node[pins[1][1]];if(!a||!b)return null;
    if(ms.mode==="vac"){const d=Math.abs((a[1]||0)-(b[1]||0));return{v:fmt(d,d<10?2:0)+" В~",n:d}}
    const d=a[0]-b[0];return{v:fmt(d,Math.abs(d)<10?2:(Math.abs(d)<100?1:0))+" В",n:d}}
  return null;
}
function verdict(cur,nm){if(nm.n==null){return nm.raw===cur?"ok":"bad"}const c=num(cur);if(c==null)return cur==="OL"&&nm.raw==="OL"?"ok":"bad";
  const tol=nm.tol!=null?nm.tol:Math.max(Math.abs(nm.n)*.06,Math.abs(nm.n)<1?.12:.25);return Math.abs(c-nm.n)<=tol?"ok":"bad"}
const _renderMeter4=renderMeter;
renderMeter=function(){_renderMeter4();const box=$("mNorm");if(!OPT.norm||exam.on||ms.tool==="osc"||$("mLcd").classList.contains("warn")){box.hidden=true;noteAdd(null);return}
  const nm=normFor(),cur=$("mV").textContent;if(!nm||cur==="- - -"||cur==="—"){box.hidden=true;noteAdd(null);return}
  const vd=verdict(cur,nm);box.hidden=false;box.innerHTML=`Исправная плата: <b>${nm.v}</b> <span class="tag2 ${vd}">${vd==="ok"?"в норме":"не в норме"}</span>`;
  if(ms.tool==="dmm"&&["vdc","vac"].includes(ms.mode)){const H=healthy();[...$("mRows").querySelectorAll("li")].forEach((li,i)=>{const pin=(PINS[ms.id]||[])[i];if(!pin)return;const v=H.node[pin[1]];if(!v)return;
    const s=ms.mode==="vac"?(ACN.has(pin[1])||v[1]>.05?fmt(v[1],v[1]<10?2:0)+" В~":""):(ACN.has(pin[1])?"":fmt(v[0],v[0]<10?2:(v[0]<100?1:0))+" В");if(!s)return;
    const b=li.querySelector("b");if(b&&!b.querySelector("i"))b.insertAdjacentHTML("beforeend",` <i class="dim" style="font-style:normal">/ ${s}</i>`)})}
  noteAdd(cur+($("mU").textContent?" "+$("mU").textContent:""),nm.v,vd)};
document.addEventListener("opt",e=>{if(e.detail==="norm")renderMeter()});
/* эталон на осциллографе */
const _drawOsc4=drawOsc;
drawOsc=function(){_drawOsc4();if(!OPT.norm||exam.on)return;const pins=PINS[ms.id]||[];const n=(pins[ms.pin]||[])[1];if(!n)return;const R=healthy().wave[n];if(!R)return;
  const cv=$("oscC"),w=cv.clientWidth,h=cv.clientHeight,g=cv.getContext("2d"),W=wave(n),Y=v=>h-6-(h-12)*(v-W.lo)/(W.hi-W.lo);
  g.save();g.beginPath();g.rect(0,0,w,h);g.clip();g.setLineDash([5,4]);g.strokeStyle="#ffd166";g.lineWidth=1.5;g.beginPath();
  R.a.forEach((v,k)=>{const x=k/120*w;k?g.lineTo(x,Y(v)):g.moveTo(x,Y(v))});g.stroke();g.setLineDash([]);g.fillStyle="#ffd166";g.font="11px "+getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
  g.textAlign="right";g.fillText("- - исправная плата",w-4,h-4);g.restore()};

/* ---------- блокнот измерений ---------- */
let NOTE=store.get("notes",[]),noteKey=null;
function noteAdd(val,norm,vd){if(val==null){return}
  const id=ms.trash?ms.trash.id+" (корзина)":ms.id;if(!id)return;
  const what=TOOLS[ms.tool]+(ms.tool==="dmm"?" "+DMODES.find(d=>d[0]===ms.mode)[1]:"");const key=[id,what,ms.pin].join("|");
  if(noteKey===key&&NOTE[0]&&NOTE[0].k===key){if(NOTE[0].v===val)return;NOTE[0].v=val;NOTE[0].nm=norm;NOTE[0].vd=vd}
  else{NOTE.unshift({k:key,id,what,v:val,nm:norm,vd,t:Date.now(),pw:S.mains?"сеть":(S.lab?"ЛБП":"обесточена")});NOTE=NOTE.slice(0,80);noteKey=key}
  store.set("notes",NOTE);noteRender()}
function noteRender(){const t=$("noteT");
  t.innerHTML=NOTE.length?`<thead><tr><th>Деталь</th><th>Что</th><th>Показание</th><th>Норма</th></tr></thead><tbody>`+NOTE.map(e=>`<tr class="${e.vd||""}"><td><button type="button" class="ptl" data-id="${e.id.split(" ")[0]}">${e.id}</button></td><td>${e.what}<div class="dim">${e.pw}</div></td><td class="v">${e.v}</td><td class="v">${exam.on?"—":(e.nm||"")}</td></tr>`).join("")+"</tbody>"
    :`<tbody><tr><td class="dim">Пока пусто. Выберите прибор и измерьте любую деталь — показание и норма появятся здесь.</td></tr></tbody>`;
  const tb=document.querySelector('[data-tab="tNote"]');tb.innerHTML="Блокнот"+(NOTE.length?`<span class="cnt">${NOTE.length}</span>`:"")}
$("noteT").addEventListener("click",e=>{const b=e.target.closest(".ptl");if(b&&P[b.dataset.id]){if(mobile())setMt("board");pick(b.dataset.id,true);flashPart(b.dataset.id)}});
$("noteClr").addEventListener("click",()=>{NOTE=[];noteKey=null;store.set("notes",NOTE);noteRender()});
const _startScenario4=startScenario;startScenario=function(i){_startScenario4(i);NOTE=[];noteKey=null;store.set("notes",NOTE);noteRender()};
noteRender();

/* ---------- подсказки: шаги со ссылками на детали ---------- */
const IDS=Object.keys(P).sort((a,b)=>b.length-a.length);
const ID_RE=new RegExp("(^|[^A-Za-z0-9А-Яа-я])("+IDS.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")(?![A-Za-z0-9])","g");
function linkify(html){return html.replace(/>([^<]+)</g,(m,t)=>">"+t.replace(ID_RE,(q,pre,id)=>pre+`<button type="button" class="pref" data-id="${id}">${id}</button>`)+"<")}
const _renderGame4=renderGame;
renderGame=function(){_renderGame4();const h=$("hints");[...h.children].forEach(li=>{li.innerHTML=linkify(">"+li.innerHTML.replace(/^<b>Подсказка \d+\.<\/b>\s*/,"")+"<").slice(1,-1)})};
$("hints").addEventListener("click",e=>{const b=e.target.closest(".pref");if(b){if(mobile())setMt("board");pick(b.dataset.id,true);flashPart(b.dataset.id)}});
if(game.on)renderGame();

/* ---------- интерактивный универсальный маршрут диагностики ---------- */
const ROUTE_STEPS={
  power:{text:"Проверь выбранный узел: питание приходит на его вход?",yes:"output",no:"input"},
  input:{text:"На обесточенной схеме проверь входную цепь, предохранитель, соединения. Обрыв найден?",yes:"repair",no:"control"},
  output:{text:"Измерь выходное напряжение и сравни с нормой. Оно в пределах нормы?",yes:"signal",no:"load"},
  signal:{text:"Проверь сигнал разрешения работы или управляющий сигнал. Он присутствует?",yes:"next",no:"control"},
  load:{text:"При отключённом питании проверь выход на КЗ и перегрузку. Нашлась неисправность нагрузки?",yes:"repair",no:"feedback"},
  feedback:{text:"Проверь цепь обратной связи и фильтрующие элементы. Отклонение найдено?",yes:"repair",no:"control"},
  control:{text:"Проверь питание управляющей микросхемы, сигналы на выводах, датчики и защиту. Затем вернись к тому узлу, где обнаружено первое отклонение."},
  next:{text:"Предыдущий узел исправен. Перейди к следующей ступени схемы и повтори сравнение входа, выхода и сигнала управления."},
  repair:{text:"Устрани найденную причину, затем повтори измерения. Если есть вторичные повреждения, проверь их до повторного включения."}
};
let routeTrail=[],routeCurrent="power",routeVisible=false;
{const b=document.createElement("button");b.type="button";b.id="routeB";b.textContent="Маршрут диагностики";b.setAttribute("aria-expanded","false");
 $("hintB").before(b);
 const p=document.createElement("div");p.id="routePanel";p.className="route-panel";p.hidden=true;
 $("repair").querySelector(".rp-act").after(p);
 b.addEventListener("click",()=>{routeVisible=!routeVisible;b.setAttribute("aria-expanded",String(routeVisible));renderRoute()});
 p.addEventListener("click",e=>{
   const b=e.target.closest("[data-route]");if(!b)return;
   const answer=b.dataset.route;
   if(answer==="restart"){routeTrail=[];routeCurrent="power"}
   else if(answer==="back"){const previous=routeTrail.pop();routeCurrent=previous?previous.step:"power"}
   else if((answer==="yes"||answer==="no")&&ROUTE_STEPS[routeCurrent]?.[answer]){
     routeTrail.push({step:routeCurrent,answer});
     routeCurrent=ROUTE_STEPS[routeCurrent][answer]
   }
   renderRoute()
 })
}
function renderRoute(){
  const p=$("routePanel");
  p.hidden=!routeVisible||exam.on||!game.on;
  if(p.hidden)return;
  const step=ROUTE_STEPS[routeCurrent];
  const history=routeTrail.length?'<ol class="route-history">'+routeTrail.map(x=>
    '<li>'+ROUTE_STEPS[x.step].text+' <strong>'+(x.answer==="yes"?"Да":"Нет")+'</strong></li>').join("")+'</ol>':"";
  p.innerHTML='<b>Универсальный порядок диагностики</b>'+
    '<p class="dim">Вы сами оцениваете показания прибора. Маршрут не определяет неисправность автоматически и не раскрывает ответ задачи.</p>'+
    history+'<div class="route-step"><span>Шаг '+(routeTrail.length+1)+'</span><p>'+step.text+'</p></div>'+
    '<div class="route-actions">'+
    (step.yes?'<button type="button" data-route="yes">Да</button><button type="button" data-route="no">Нет</button>':
      '<button type="button" data-route="restart">Начать заново</button>')+
    (routeTrail.length?'<button type="button" data-route="back">Назад</button>':"")+
    '</div>'
}
const _startScenarioRoute=startScenario;
startScenario=function(i){_startScenarioRoute(i);routeTrail=[];routeCurrent="power";renderRoute()};
const _renderGameRoute=renderGame;
renderGame=function(){_renderGameRoute();if(routeVisible)renderRoute()};
