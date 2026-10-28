/* extras: thermal camera, lamp, lab PSU, sounds, random & chain tasks, score, history, save */

/* ---------- storage helpers ---------- */
const skey=k=>"psu."+(BOARD.id==="samsung"||k==="sound"||k==="lamp"?"":BOARD.id+".")+k;
const store={get(k,d){try{const v=localStorage.getItem(skey(k));return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(skey(k),JSON.stringify(v))}catch(e){}}};

/* ---------- touch: tap = select / measure ---------- */
let lastPT="mouse";
addEventListener("pointerdown",e=>{lastPT=e.pointerType},true);
Object.entries(parts).forEach(([id,arr])=>arr.forEach(p=>{if(p.c.nopart)return;
  p.G.addEventListener("click",()=>{if(lastPT!=="touch")return;if(ms.tool!=="hand")measureAt(id);else pick(id)})}));

/* ---------- thermal camera ---------- */
TOOLS.thermo="Тепловизор";
const heatG=el("g",{class:"heat","aria-hidden":"true"});svg.insertBefore(heatG,probeG);
const heatT=el("g",{class:"heatT","aria-hidden":"true"});svg.insertBefore(heatT,probeG);
let heatSpots=null;
setInterval(()=>{if(!S||S.t==null)return;Object.keys(P).forEach(id=>{const a=st.temp[id]??25,b=heatTarget(id);st.temp[id]=a+(b-a)*(b>a?.12:.05)});
  if(ms.tool==="thermo")drawHeat()},100);
function heatColor(t){const st_=[[25,[40,70,190]],[38,[30,170,200]],[50,[60,190,90]],[65,[250,200,40]],[85,[250,120,30]],[110,[225,40,40]],[150,[255,235,235]]];
  if(t<=st_[0][0])return`rgb(${st_[0][1]})`;for(let i=1;i<st_.length;i++)if(t<=st_[i][0]){const [t0,c0]=st_[i-1],[t1,c1]=st_[i],k=(t-t0)/(t1-t0);return`rgb(${c0.map((v,j)=>Math.round(v+(c1[j]-v)*k))})`}
  return"rgb(255,240,240)"}
function computeSpots(){
  const inv=svg.getScreenCTM().inverse(),pt=svg.createSVGPoint();heatSpots=[];
  Object.entries(parts).forEach(([id,arr])=>arr.forEach(p=>{if(p.c.nopart||p.c.t==="CORE")return;const h=p.G.querySelector(".hit");if(!h)return;const r=h.getBoundingClientRect();if(!r.width)return;
    pt.x=r.left+r.width/2;pt.y=r.top+r.height/2;const q=pt.matrixTransform(inv);heatSpots.push({id,x:q.x,y:q.y,r:Math.min(30,Math.max(14,Math.max(r.width,r.height)/svg.getScreenCTM().a/2))})}));
  heatG.innerHTML="";heatT.innerHTML="";
  heatSpots.forEach(s=>{s.c=el("circle",{cx:s.x,cy:s.y,r:s.r},heatG);s.l=el("text",{x:s.x,y:s.y+4,"text-anchor":"middle",class:"htxt"},heatT)});
}
function drawHeat(){if(!heatSpots)computeSpots();heatSpots.forEach(s=>{const t=st.temp[s.id]??25;s.c.style.fill=heatColor(t);s.c.style.opacity=t<30?.35:.8;
  s.l.textContent=t>=38?Math.round(t)+"°":"";})}
function thermoReading(id){const t=Math.round(st.temp[id]??25);
  const n=t<32?"Холодная — деталь не нагружена (или не работает).":t<=70?"Тёплая — нормальный рабочий нагрев.":t<=95?"Горячая — на пределе. Проверьте, не перегружена ли она.":"Перегрев! Деталь пробита, перегружена или по ней идёт ток КЗ.";
  return{v:String(t),u:"°C",n:n+(S.mains||S.lab?"":" Тепловизор видит нагрев только на работающей плате или при подаче тока от ЛБП.")}}
const _measure=measure;
measure=function(){if(ms.tool==="thermo"){if(ms.trash)return{v:"25",u:"°C",n:"Деталь в корзине остыла."};if(!ms.id)return null;return thermoReading(ms.id)}return _measure()};
const _setTool=setTool;
setTool=function(t){_setTool(t);document.body.classList.toggle("thermo",t==="thermo");if(t==="thermo"){heatSpots=null;drawHeat()}else{heatG.innerHTML="";heatT.innerHTML="";heatSpots=null}};
{const b=document.createElement("button");b.type="button";b.dataset.t="thermo";b.setAttribute("aria-pressed","false");b.textContent="Тепловизор";
 $("tools").querySelector(".tbtns").appendChild(b);b.addEventListener("click",()=>setTool("thermo"))}
addEventListener("resize",()=>{heatSpots=null});
["zIn","zOut","zFit"].forEach(i=>$(i).addEventListener("click",()=>{heatSpots=null}));

/* ---------- lamp ---------- */
function lampUi(){const b=$("bLamp");b.classList.toggle("on",st.lamp);b.textContent=st.lamp?"Лампа 100 Вт: включена":"Лампа 100 Вт: нет";$("lampBox").hidden=!st.lamp}
$("bLamp").addEventListener("click",()=>{st.lamp=!st.lamp;lampUi();store.set("lamp",st.lamp);
  log(st.lamp?"Блок включён в сеть через лампу 100 Вт: при КЗ лампа загорится, а предохранитель уцелеет.":"Лампа убрана, блок включён в сеть напрямую.")});
setInterval(()=>{if(!st.lamp)return;const b=S.lampB||0;$("bulb").style.setProperty("--glow",b.toFixed(2));
  $("lampT").textContent=!S.mains?"не горит (нет сети)":b>.8?"горит ярко — КЗ в блоке!":b>.3?"вспыхнула — идёт заряд C1 или большая нагрузка":b>.12?"еле тлеет — блок работает под нагрузкой":"почти не горит — КЗ нет"},120);

/* ---------- lab PSU ---------- */
{const sel=$("labRail");Object.entries(LAB_RAILS).forEach(([k,r])=>{const o=document.createElement("option");o.value=k;o.textContent=r.n;sel.appendChild(o)})}
function labUi(){const L=st.lab;$("labRail").value=L.rail;$("labV").value=L.v;$("labI").value=String(L.lim);
  $("labOn").textContent=L.on?"Выключить ЛБП":"Включить ЛБП";$("labOn").classList.toggle("on",L.on);$("labBox").classList.toggle("live",L.on)}
$("labRail").addEventListener("change",e=>{st.lab.rail=e.target.value;st.lab.v=LAB_RAILS[st.lab.rail].def;labUi()});
$("labV").addEventListener("change",e=>{st.lab.v=Math.max(0,Math.min(30,parseFloat(String(e.target.value).replace(",","."))||0));labUi()});
$("labI").addEventListener("change",e=>{st.lab.lim=parseFloat(e.target.value)});
$("labOn").addEventListener("click",()=>{
  if(!st.lab.on){if(S.mains){toast("Сначала выньте вилку из розетки: ЛБП подключают только к обесточенной плате.");return}
    if(S.bulk>30){toast(`На ${CAPN} ещё ${Math.round(S.bulk)} В. Разрядите его (кнопка в окне прибора).`);return}}
  st.lab.on=!st.lab.on;labUi();log(st.lab.on?`ЛБП ${fmt(st.lab.v,1)} В, ограничение ${fmt(st.lab.lim,1)} А подключён к шине ${LAB_RAILS[st.lab.rail].n}.`:"ЛБП отключён.")});
setInterval(()=>{const L=S.lab;$("labVo").textContent=(L?fmt(L.v,2):"0,00")+" В";$("labIo").textContent=(L?fmt(L.i,3):"0,000")+" А";
  const cc=$("labCC");cc.textContent=L?(L.cc?"CC":"CV"):"—";cc.className=L&&L.cc?"cc":"";},150);

/* ---------- sounds ---------- */
let actx=null,soundOn=store.get("sound",true);
function ac(){if(!soundOn)return null;try{if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume();return actx}catch(e){return null}}
addEventListener("pointerdown",()=>{if(soundOn)ac()},{once:true});
function tone(f,d,type="square",vol=.06,at=0){const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+at;o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(c.destination);o.start(t);o.stop(t+d+.02)}
function noise(d,vol=.4,lp=1800){const c=ac();if(!c)return;const n=c.sampleRate*d,b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type="lowpass";f.frequency.value=lp;g.gain.value=vol;s.connect(f).connect(g).connect(c.destination);s.start()}
const SND={tick:()=>tone(2200,.025,"square",.05),click:()=>{tone(900,.012,"square",.07);tone(600,.015,"square",.05,.03)},
  pop:()=>{noise(.35,.55,2400);tone(70,.25,"sine",.35)},snap:()=>{noise(.06,.5,6000)},beep:()=>tone(2700,.28,"square",.05),
  chime:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.35,"triangle",.07,i*.12)),buzz:()=>tone(110,.4,"sawtooth",.04)};
function soundUi(){$("bSnd").textContent=soundOn?"Звук: вкл":"Звук: выкл";$("bSnd").classList.toggle("on",soundOn)}
$("bSnd").addEventListener("click",()=>{soundOn=!soundOn;store.set("sound",soundOn);soundUi();if(soundOn){ac();SND.click()}});
let prevS={};
setInterval(()=>{const s=S;if(!s||s.t==null)return;
  if(s.surge&&!prevS.surge)SND.pop();
  if(st.fuse&&!prevS.fuse)SND.snap();
  if(s.sbyMode==="hic"&&s.sbyOn&&!prevS.sbyOn)SND.tick();
  if(s.llcRun&&!prevS.llcRun)SND.click();
  if(st.ovp&&!prevS.ovp)SND.click();
  if(s.pson!==prevS.pson&&prevS.t!=null)SND.click();
  if(game.done&&!prevS.done)SND.chime();
  prevS={surge:s.surge,fuse:st.fuse,sbyOn:s.sbyOn,llcRun:s.llcRun,ovp:st.ovp,pson:s.pson,done:game.done,t:s.t};},40);
const _measureAt=measureAt;
measureAt=function(id){_measureAt(id);if(ms.tool==="dmm"&&ms.mode==="beep"){const r=measure();if(r&&r.u==="Ω")SND.beep()}};

/* ---------- random tasks ---------- */
const PANEL_TITLE=id=>(PAN[PANEL_OF[id]]||[,,""])[2].replace(/^\d+ · /,"");
SCEN.push({t:"Случайная поломка (1 деталь)",rand:1,n:1},{t:"Случайная поломка (2 детали)",rand:1,n:2});
function genRandom(sc){
  const pool=RANDOM_POOL.slice(),picked=[];
  while(picked.length<sc.n&&pool.length){const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0];if(picked.some(p=>p[0]===k[0]||PANEL_OF[p[0]]===PANEL_OF[k[0]]))continue;picked.push(k)}
  sc.F={};picked.forEach(([id,m])=>sc.F[id]=m);sc.fuse=false;
  const [id,m]=picked[0],[why,sym]=P[id][4][m];
  const clean=sym.filter(x=>!/\b[A-Z]{1,3}\d/.test(x)&&!/звонится|почернел/.test(x));
  sc.c="«"+(clean.length?clean.slice(0,2).join(", "):"Телевизор не работает")+"».";
  sc.h=[];picked.forEach(([pid,pm],i)=>{const pre=sc.n>1?`Поломка ${i+1}: `:"";const w=P[pid][4][pm][0].split(pid).join("эта деталь");
    sc.h.push(pre+"неисправность на участке «"+PANEL_TITLE(pid)+"».");sc.h.push(pre+w);sc.h.push(pre+"ищите "+CATN[catOf(pid)]+" "+shortV(P[pid][1])+".")});
  if(sc.n>1)sc.h=[sc.h[0],sc.h[3],sc.h[1],sc.h[4],sc.h[2],sc.h[5]];
  sc.a=picked.map(([pid,pm])=>`${pid} (${P[pid][0]}): ${ML[pm].toLowerCase()}`).join("; ")+".";
}
const _startScenario=startScenario;
startScenario=function(i){const sc=SCEN[i];if(sc&&sc.rand)genRandom(sc);_startScenario(i);game.extra=0;game.wrong=0;saveGame()};

/* ---------- select with groups and solved marks ---------- */
function rebuildScSel(){const sel=$("scSel"),cur=sel.value;sel.innerHTML="";const hist=store.get("hist",[]);const solved=new Set(hist.map(h=>h.t));
  const groups=[["Задачи",SCEN.map((s,i)=>[s,i]).filter(([s])=>!s.chain&&!s.rand)],["Цепочки поломок",SCEN.map((s,i)=>[s,i]).filter(([s])=>s.chain)],["Случайные",SCEN.map((s,i)=>[s,i]).filter(([s])=>s.rand)]];
  let n=0;groups.forEach(([g,list])=>{const og=document.createElement("optgroup");og.label=g;list.forEach(([s,i])=>{const o=document.createElement("option");o.value=i;
    o.textContent=(s.rand?"":(++n)+". ")+s.t+(solved.has(s.t)&&!s.rand?"  ✓":"");og.appendChild(o)});sel.appendChild(og)});if(cur)sel.value=cur}
rebuildScSel();

/* ---------- score & history ---------- */
const _removePart=removePart;
removePart=function(id){const real=st.F[id]||(id==="F1"&&st.fuse?"open":null),ins=st.inst[id];if(game.on&&!real&&!ins&&st.slot[id]!=="empty")game.extra=(game.extra||0)+1;_removePart(id);saveGame()};
const _install=install;
install=function(id,opt){if(game.on&&opt.r!=="ok"&&opt.r!=="ok2")game.wrong=(game.wrong||0)+1;_install(id,opt);saveGame()};
function scoreRepair(sec){
  let s=100-12*game.hints-(game.reveal?40:0)-6*(game.extra||0)-8*(game.wrong||0)-2*Math.max(0,Math.floor((sec-180)/60));
  s=Math.max(5,Math.min(100,s));const stars=s>=85?3:s>=60?2:1;const sc=SCEN[game.sc];
  const h=store.get("hist",[]);h.unshift({t:sc.t,rand:!!sc.rand,ans:sc.a,d:Date.now(),sec,score:s,hints:game.hints,rev:game.reveal,extra:game.extra||0,wrong:game.wrong||0});store.set("hist",h.slice(0,100));
  rebuildScSel();renderHist();return{s,stars}}
function renderHist(){const h=store.get("hist",[]),box=$("hist");if(!box)return;
  const fixed=SCEN.filter(s=>!s.rand).length,solved=new Set(h.filter(x=>!x.rand).map(x=>x.t)).size,best=h.length?Math.max(...h.map(x=>x.score)):0,avg=h.length?Math.round(h.reduce((a,x)=>a+x.score,0)/h.length):0;
  $("histSum").textContent=`Мои ремонты: ${h.length} · решено задач ${solved} из ${fixed} · средний счёт ${avg} · лучший ${best}`;
  $("histT").innerHTML=h.length?`<thead><tr><th>Когда</th><th>Задача</th><th>Время</th><th>Подсказки</th><th>Счёт</th></tr></thead><tbody>`+h.slice(0,30).map(x=>`<tr><td>${new Date(x.d).toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</td><td>${x.t}${x.rand?`<div class="dim">${x.ans}</div>`:""}</td><td>${Math.floor(x.sec/60)}:${String(x.sec%60).padStart(2,"0")}</td><td>${x.hints}${x.rev?" + ответ":""}</td><td><b>${x.score}</b> ${"★".repeat(x.score>=85?3:x.score>=60?2:1)}</td></tr>`).join("")+"</tbody>":`<tbody><tr><td class="dim">Пока нет завершённых ремонтов.</td></tr></tbody>`}
$("histClr").addEventListener("click",()=>{if(!$("histClr").dataset.arm){$("histClr").dataset.arm=1;$("histClr").textContent="Точно очистить?";setTimeout(()=>{delete $("histClr").dataset.arm;$("histClr").textContent="Очистить историю"},3000);return}
  store.set("hist",[]);delete $("histClr").dataset.arm;$("histClr").textContent="Очистить историю";renderHist();rebuildScSel()});
renderHist();

/* ---------- save / restore progress ---------- */
function saveGame(){if(!game.on||game.sc<0){store.set("save",null);return}
  const sc=SCEN[game.sc];store.set("save",{sc:game.sc,rand:sc.rand?{F:sc.F,c:sc.c,h:sc.h,a:sc.a}:null,F:st.F,sec:st.sec,slot:st.slot,inst:st.inst,trash:st.trash,later:st.later,casc:st.casc,fuse:st.fuse,
    hints:game.hints,reveal:game.reveal,done:game.done,el:Date.now()-game.t0,moves:game.moves,extra:game.extra||0,wrong:game.wrong||0,tv:st.tv,mains:st.mains})}
setInterval(saveGame,2000);addEventListener("pagehide",saveGame);
$("bMode").addEventListener("click",()=>setTimeout(saveGame,0));
function restoreGame(){const s=store.get("save",null);if(!s||!SCEN[s.sc])return false;
  const sc=SCEN[s.sc];if(sc.rand&&s.rand)Object.assign(sc,s.rand);
  game.sc=s.sc;$("scSel").value=s.sc;setMode(true);resetBoard();
  Object.assign(st,{F:s.F||{},sec:s.sec||{},slot:s.slot||{},inst:s.inst||{},trash:s.trash||[],later:s.later||{},casc:s.casc||{},fuse:!!s.fuse,tv:!!s.tv,mains:s.mains!==false});
  Object.assign(game,{hints:s.hints||0,reveal:!!s.reveal,done:!!s.done,t0:Date.now()-(s.el||0),moves:s.moves||0,extra:s.extra||0,wrong:s.wrong||0});
  logEl.innerHTML="";log(`Продолжаем задачу: ${sc.t}.`);syncBtns();renderGame();renderTrash();pick("F1");return true}

/* ---------- win hook ---------- */
function winHtml(sec){const r=scoreRepair(sec);
  return `<b>Отремонтировано!</b> ${BOARD.okText}<div class="score"><span class="stars">${"★".repeat(r.stars)}${"☆".repeat(3-r.stars)}</span> <b>${r.s}</b> очков · время ${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")} · подсказок ${game.hints}${game.reveal?" + ответ":""} · лишних выпаек ${game.extra||0} · неподходящих деталей ${game.wrong||0}</div>`+
    (SCEN[game.sc].rand?`<div class="dim">Были неисправны: ${SCEN[game.sc].a}</div>`:"")+` <button type="button" id="nextB">Следующая задача</button>`}

/* ---------- init ---------- */
st.lamp=BOARD.noLamp?false:store.get("lamp",false);lampUi();$("bLamp").hidden=!!BOARD.noLamp;syncBtns();labUi();soundUi();
if(!restoreGame()){}
if(matchMedia("(max-width:720px)").matches){zoom=.5;applyZoom()}
