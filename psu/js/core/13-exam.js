/* exam — 5 случайных поломок подряд на время, без подсказок */
const exam={on:false,i:0,n:5,res:[],t0:0,tt:0};
const RAND1=SCEN.findIndex(s=>s.rand&&s.n===1);
{const b=document.createElement("button");b.type="button";b.id="examB";b.textContent="Экзамен: 5 поломок";$("scStart").after(b);
 b.addEventListener("click",()=>exam.on?examStop(true):examStart());
 const bar=document.createElement("div");bar.className="exambar";bar.id="examBar";bar.hidden=true;
 bar.innerHTML=`<b id="exT"></b><span id="exTime"></span><button type="button" id="exGive">Сдаться в этой задаче</button>`;$("rpT").parentNode.after(bar);
 $("exGive").addEventListener("click",()=>{if(!exam.on||game.done)return;examRecord(false);game.reveal=true;renderGame();renderCard();
   $("win").hidden=false;$("win").innerHTML=`<b>Задача не решена.</b> Ответ: ${SCEN[game.sc].a} <button type="button" id="examNext">${exam.i+1<exam.n?"Следующая задача":"Итоги экзамена"}</button>`;});
 $("win").addEventListener("click",e=>{if(e.target.id==="examNext")examNext()});}
function examStart(){if(RAND1<0)return;if(!game.on)setMode(true);Object.assign(exam,{on:true,i:0,res:[],t0:Date.now()});document.body.classList.add("exam");$("examB").textContent="Прервать экзамен";$("examBar").hidden=false;
  log("Экзамен начался: 5 случайных поломок, подсказок нет.");examTask()}
function examTask(){exam.tt=Date.now();$("scSel").value=RAND1;startScenario(RAND1);$("exT").textContent=`Экзамен: задача ${exam.i+1} из ${exam.n}`}
function examRecord(ok){const sc=SCEN[game.sc];exam.res.push({ok,sec:Math.round((Date.now()-exam.tt)/1000),a:sc.a,extra:game.extra||0,wrong:game.wrong||0});game.done=true}
function examNext(){exam.i++;if(exam.i<exam.n)examTask();else examStop(false)}
function examStop(aborted){exam.on=false;document.body.classList.remove("exam");$("examB").textContent="Экзамен: 5 поломок";$("examBar").hidden=true;
  if(aborted){log("Экзамен прерван.");return}
  const solved=exam.res.filter(r=>r.ok).length,total=Math.round((Date.now()-exam.t0)/1000),pen=exam.res.reduce((a,r)=>a+r.extra+r.wrong,0);
  const grade=solved===5&&total<=15*60&&pen<=3?5:solved>=4?4:solved>=3?3:2;const score=Math.max(0,solved*20-2*pen);
  const h=store.get("hist",[]);h.unshift({t:"Экзамен",rand:true,ans:`оценка ${grade}, решено ${solved} из 5`,d:Date.now(),sec:total,score,hints:0,rev:false,extra:pen,wrong:0});store.set("hist",h.slice(0,100));renderHist();
  $("win").hidden=false;$("win").innerHTML=`<b>Экзамен окончен. Оценка: ${grade}</b><div class="score">Решено ${solved} из 5 · общее время ${Math.floor(total/60)}:${String(total%60).padStart(2,"0")} · лишних выпаек и неподходящих деталей: ${pen}</div><ol class="exres">${exam.res.map((r,i)=>`<li class="${r.ok?"ok":"no"}">${r.ok?"✓":"✗"} Задача ${i+1} · ${Math.floor(r.sec/60)}:${String(r.sec%60).padStart(2,"0")} · ${r.a}</li>`).join("")}</ol>`;
  log(`Экзамен окончен: оценка ${grade}.`)}
const _winHtml=winHtml;
winHtml=function(sec){if(!exam.on)return _winHtml(sec);examRecord(true);
  return `<b>Задача ${exam.i+1} решена!</b> ${BOARD.okText} <button type="button" id="examNext">${exam.i+1<exam.n?"Следующая задача":"Итоги экзамена"}</button>`};
setInterval(()=>{if(!exam.on)return;const s=Math.round((Date.now()-exam.t0)/1000);$("exTime").textContent=`общее время ${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`},500);
