/* Плата стиральной машины: дисплей и барабан */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="";
  if(!s.mains)see=s.lab?`Вилка выдернута. К шине ${LAB_RAILS[s.lab.rail].n} подключён лабораторный БП: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — сработало ограничение тока, КЗ!":"."}`:"Вилка выдернута из розетки."+(s.dcv>30?" На C1 ещё опасное напряжение!":"");
  else if(st.lamp&&s.surge)see="Лампа 100 Вт горит ярко: на плате короткое замыкание. Предохранитель цел благодаря лампе.";
  else if(st.fuse||s.surge)see=s.surge?"Короткое замыкание! Сейчас сгорит предохранитель.":"Машина мёртвая: дисплей не горит, сгорел предохранитель F1.";
  else if(!s.mcuOn)see="Дисплей не горит, кнопки не реагируют. "+s.mcuText+".";
  else if(!s.mcu)see="Дисплей мигает «88» — микроконтроллер перезапускается.";
  else if(s.err)see="На дисплее ошибка "+(s.err==="HOT"?"HE":s.err)+": "+({dE:"дверь не заблокировалась.",HE:"вода не нагревается.",HOT:"вода перегрелась — ТЭН включён без команды!","5E":"вода не уходит, насос не работает.","1E":"вода не набирается.",tE:"датчик температуры показывает чушь."}[s.err]);
  else if(s.doorStuck)see="Программа закончилась, но дверь осталась заблокированной — бельё не достать.";
  else if(!st.tv)see=s.heaterOn?"Машина стоит, но вода горячая: ТЭН греет без команды!":(s.pumpOn?"Машина стоит, а насос гудит без остановки.":"Машина ждёт. Нажмите «Старт программы».");
  else see={lock:"Щёлкнул замок двери…",fill:"Набирается вода.",heat:"Греется вода до 40 °C.",wash:"Барабан крутится — стирка.",drain:"Насос сливает воду.",end:"Готово! Стирка завершена, дверь разблокирована."}[s.ph]||"Запуск программы…";
  const d=s.disp,wl=s.wl,drum=s.ph==="wash"&&s.mcu;
  scr.className="screen wmbox";
  scr.innerHTML=`<svg viewBox="0 0 150 60" aria-hidden="true"><rect x="2" y="2" width="146" height="56" rx="6" class="wmb"/>`+
   `<circle cx="38" cy="31" r="24" class="wmd"/><clipPath id="wmc"><circle cx="38" cy="31" r="20"/></clipPath>`+
   `<rect x="18" y="${(51-wl*.4).toFixed(1)}" width="40" height="${(wl*.4).toFixed(1)}" clip-path="url(#wmc)" class="wmw" style="fill:${s.wt>45?"#e88":"#6ab0ff"}"/>`+
   `<g class="${drum?"wmspin":""}" style="transform-origin:38px 31px"><circle cx="38" cy="31" r="20" class="wmg"/><path d="M38 11v40M18 31h40" class="wmg"/></g>`+
   `<rect x="76" y="10" width="64" height="24" rx="3" class="wml"/><text x="108" y="28" class="wmt${s.err?" bad":""}">${d}</text>`+
   `<text x="78" y="48" class="wms">${s.lockOn?"🔒":"🔓"}</text><text x="96" y="48" class="wms">${Math.round(s.wt)}°C</text>`+
   `${s.heaterOn?'<text x="128" y="48" class="wms">♨</text>':""}</svg>`;
  led.className=s.v5>4?"green":"";$("ledT").textContent="индикатор сети";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Сеть",s.mains?"230 В ~":"нет",s.mains?1:2)+row("Предохранитель F1",st.fuse?"сгорел":"цел",st.fuse?0:1)+
   row("C1 (после диода)",Math.round(s.dcv)+" В",s.dcv>250?1:(s.dcv>30?2:0))+row("+12 В",fmt(s.v12,1)+" В",s.v12>11&&s.v12<13?1:0)+row("+5 В",fmt(s.v5,2)+" В",s.v5>4.7&&s.v5<5.3?1:0)+
   row("Микроконтроллер",s.mcu?"работает":(s.mcuOn?"перезапуск":"не работает"),s.mcu?1:0)+row("Этап",s.err?"ошибка "+(s.err==="HOT"?"HE":s.err):({idle:"ожидание",boot:"запуск",lock:"замок",fill:"набор воды",heat:"нагрев",wash:"стирка",drain:"слив",end:"конец"}[s.ph]||s.ph),s.err?0:2)+
   row("ТЭН / насос / замок",(s.heaterOn?"вкл":"выкл")+" / "+(s.pumpOn?"вкл":"выкл")+" / "+(s.lockOn?"закрыт":"открыт"),2)+row("Вода",Math.round(s.wl)+" % · "+Math.round(s.wt)+" °C",s.wt>70?0:2);
}
