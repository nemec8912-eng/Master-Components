/* UI */
let sel=null;
const PANEL_OF={};Object.entries(SCH).forEach(([pid,sc])=>(sc.c||[]).forEach(c=>{if(P[c.id]&&!PANEL_OF[c.id])PANEL_OF[c.id]=pid}));
const pickSel=$("pick");
{const o=document.createElement("option");o.value="";o.textContent="Найти деталь…";pickSel.appendChild(o);
 Object.entries(PAN).forEach(([pid,[,,title]])=>{const og=document.createElement("optgroup");og.label=title;Object.keys(P).filter(k=>PANEL_OF[k]===pid).forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=k+" — "+P[k][0];og.appendChild(o)});pickSel.appendChild(og)})}
pickSel.addEventListener("change",()=>{if(pickSel.value){pick(pickSel.value,true)}});
function pick(id,scroll){
  sel=id;Object.entries(parts).forEach(([k,arr])=>arr.forEach(p=>p.G.classList.toggle("sel",k===id)));pickSel.value=id;renderCard();
  if(scroll){const p=parts[id][0].G.getBoundingClientRect(),b=$("board").getBoundingClientRect();$("board").scrollBy({left:p.left-b.left-b.width/2,top:p.top-b.top-b.height/2,behavior:"smooth"})}
}
function setFail(id,m){
  if(m){delete st.inst[id];delete st.later[id];st.F[id]=m;log(`${id} (${P[id][0]}): ${ML[m].toLowerCase()}.`,true)}else{delete st.F[id];delete st.sec[id];Object.keys(st.casc).forEach(k=>{if(k.startsWith(id))delete st.casc[k]});
    if(id==="F1"){st.fuse=false}log(`${id} заменён исправным.`)}
  if(BOARD.rcdPart===id&&!m)st.rcd=false;
  renderCard();
}
function renderCard(){
  const body=$("cBody");if(!sel){return}
  const [n,v,role,chk,modes]=P[sel],m=st.F[sel]||(sel==="F1"&&st.fuse?"open":null);
  $("cId").textContent=sel+" · "+(PAN[PANEL_OF[sel]]||[,,""])[2];$("cName").textContent=n;$("cVal").textContent=v;
  const sl=st.slot[sel],hide=game.on&&!game.reveal;
  let h=`<div class="lbl">Зачем нужна</div><p>${role}</p><div class="lbl">Как проверить мультиметром</div><p>${chk}</p>`;
  h+=`<div class="slotbox">${sl==="empty"?`<b>Место пустое.</b> По схеме здесь ${CATN[catOf(sel)]} <span class="mono">${v}</span>. Найдите деталь в каталоге справа и перетащите сюда${matchMedia("(pointer:coarse)").matches?" (или нажмите на неё в каталоге)":" или нажмите на неё в каталоге"}.`:`Сейчас стоит: <span class="mono">${sl?sl.l:v}</span>${sl?"":" (заводская)"} <button type="button" class="rm" id="rmB">Выпаять в корзину</button>`}</div>`;
  if(hide){body.innerHTML=h;const rb=$("rmB");if(rb)rb.addEventListener("click",()=>removePart(sel));return}
  h+=`<div class="modes">`;
  Object.keys(modes).forEach(k=>{h+=`<button type="button" class="brk" data-m="${k}" aria-pressed="${m===k}">${ML[k]}</button>`});
  h+="</div>";
  const ins=st.inst[sel],lat=st.later[sel];
  h+=`<div class="lbl">Комплект замены — выберите деталь</div><div class="kit">`;
  (sel==="F1"||m||ins)&&kitFor(sel).forEach((o,i)=>{h+=`<button type="button" class="kb${ins&&ins.l===o.l?" cur":""}" data-k="${i}">${o.l}</button>`});
  if(!(sel==="F1"||m||ins))h+=`<span class="hint">Деталь исправна. Сначала выведите её из строя кнопкой выше.</span>`;
  h+="</div>";
  if(ins){const good=ins.r==="ok"||ins.r==="ok2";h+=`<div class="verdict ${good?(ins.r==="ok"?"g":"y"):"b"}"><b>${good?(ins.r==="ok"?"Подходит":"Работает, но не лучший выбор"):(ins.r==="later"&&lat?"Пока работает…":"Не подходит")}:</b> ${ins.r==="ok"?ins.why:ins.why}${lat?` <span class="cd">Выйдет из строя примерно через ${Math.max(0,Math.ceil(lat.t))} с работы.</span>`:""}</div>`}
  if(m&&modes[m]){const [why,sym,cause]=modes[m];
    h+=`<div class="fail">${st.sec[sel]?`<p class="sec">Вторичная поломка из-за ${st.sec[sel]}</p>`:""}<div class="lbl">Почему дальше не работает</div><p>${why}</p><div class="lbl">Признаки</div><ul class="sy">${sym.map(s=>`<li>${s}</li>`).join("")}</ul><div class="lbl">Почему выходит из строя</div><p>${cause}</p></div>`}
  else if(sel==="F1"&&st.fuse){h+=`<div class="fail"><div class="lbl">Почему дальше не работает</div><p>${modes.open[0]}</p><div class="lbl">Почему сгорел</div><p>Его сожгло короткое замыкание — смотрите журнал событий. Новый предохранитель ставьте только после замены пробитой детали.</p></div>`}
  body.innerHTML=h;
  body.querySelectorAll("button[data-m]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.m;setFail(sel,k?(st.F[sel]===k?null:k):null)}));
  const K=kitFor(sel);body.querySelectorAll("button[data-k]").forEach(b=>b.addEventListener("click",()=>{if(st.slot[sel]==="empty"){st.trash=st.trash.filter(x=>x.id!==sel)}install(sel,K[+b.dataset.k]);renderTrash()}));
  const rb=$("rmB");if(rb)rb.addEventListener("click",()=>removePart(sel));
}
function syncBtns(){$("bMains").classList.toggle("on",st.mains);$("bMains").textContent=st.mains?(BOARD.mainsOn||"Вилка в розетке"):(BOARD.mainsOff||"Вилка выдернута");$("bTv").classList.toggle("tvon",st.tv);$("bTv").textContent=st.tv?BOARD.onBtn:BOARD.offBtn}
$("bMains").addEventListener("click",()=>{st.mains=!st.mains;if(!st.mains){st.ovp=false;st.rcd=false}syncBtns();log(st.mains?(BOARD.mainsOnLog||"Вилка вставлена в розетку."):(BOARD.mainsOffLog||"Вилка выдернута."))});
$("bTv").addEventListener("click",()=>{st.tv=!st.tv;if(!st.tv)st.ovp=false;syncBtns();log(st.tv?BOARD.onLog:BOARD.offLog)});
$("bFixAll").addEventListener("click",()=>{if(game.on){toast("В режиме ремонта чинить нужно самому. Переключитесь в режим «Обучение».");return}st.F={};st.sec={};st.casc={};st.inst={};st.later={};st.slot={};st.trash=[];st.bug=false;st.fuse=false;st.rcd=false;st.ovp=false;log("Все детали заменены исправными.");renderCard();renderTrash()});
$("spd").addEventListener("input",e=>st.speed=e.target.value/100);
let zoom=.82;
function applyZoom(){svg.style.width=Math.round(W0*zoom)+"px";svg.style.height=Math.round(H0*zoom)+"px"}
$("zIn").addEventListener("click",()=>{zoom=Math.min(1.6,zoom+.12);applyZoom()});
$("zOut").addEventListener("click",()=>{zoom=Math.max(.35,zoom-.12);applyZoom()});
$("zFit").addEventListener("click",()=>{zoom=($("board").clientWidth-4)/W0;applyZoom()});
applyZoom();
log(BOARD.startLog);
pick("F1");
requestAnimationFrame(frame);
