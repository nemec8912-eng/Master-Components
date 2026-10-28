/* Холодильник: внешний вид и показания */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="";
  if(!s.mains)see=s.lab?`Вилка выдернута. К шине ${LAB_RAILS[s.lab.rail].n} подключён лабораторный БП: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — ограничение тока, КЗ!":"."}`:"Вилка выдернута из розетки.";
  else if(st.lamp&&s.surge)see="Лампа 100 Вт горит ярко: в холодильнике КЗ. Предохранитель цел благодаря лампе.";
  else if(st.fuse||s.surge)see=s.surge?"Хлопок! Короткое замыкание — сейчас сгорит предохранитель.":"Холодильник мёртвый: сгорел предохранитель F1.";
  else if(!s.mcu)see="Дисплей не горит, холодильник не работает, тишина.";
  else if(!st.tv)see=s.run?"Холодильник выключен кнопкой, а компрессор работает!":(s.heat?"Холодильник выключен кнопкой, а ТЭН оттайки греет!":"Холодильник выключен кнопкой. Нажмите «Включить холодильник».");
  else if(s.hum)see="Компрессор гудит, но не запускается. Сейчас щёлкнет тепловое реле.";
  else if(st.chatT>=3)see="Реле на плате трещит, компрессор дёргается и не запускается.";
  else if(s.err)see="На дисплее "+s.err+": "+ERRS[s.err].split(" — ")[1]+"."+(s.ice>.4?" На задней стенке морозилки шуба льда.":"");
  else if(s.doorAl)see="Холодильник пищит «дверь открыта», хотя дверь закрыта. Вентилятор не крутится.";
  else if(s.kOpen)see="Компрессор стоит: сработало тепловое реле (клиxон). Остынет — попробует снова.";
  else if(s.tC>8)see=s.run&&!s.fan?"Компрессор работает, морозилка холодная, а в холодильной камере тепло — вентилятор не шумит.":"В холодильной камере тепло.";
  else if(s.tC<.5)see="Компрессор работает без остановки — продукты в камере замерзают!";
  else if(s.defrost)see=s.heat?"Идёт оттайка: ТЭН растапливает лёд на испарителе.":"Оттайка: ТЭН не греет!";
  else if(s.heat)see="ТЭН оттайки греет без команды: в морозилке тает лёд.";
  else see=s.run?"Холодильник работает: компрессор качает, вентилятор гонит холод.":"Холодильник работает: камера охлаждена, компрессор отдыхает.";
  const disp=!s.mcu||!st.tv?"":(s.err||(s.doorAl?"dr":(Math.round(s.tC)>0?"+":"")+Math.round(s.tC)+"°"));
  const ice=Math.min(1,s.ice),warm=s.tC>8;
  scr.className="screen frbox";
  scr.innerHTML=`<svg viewBox="0 0 150 60" aria-hidden="true"><rect x="40" y="2" width="44" height="56" rx="4" class="frb"/>`+
   `<rect x="43" y="5" width="38" height="17" rx="2" class="frz"/><rect x="43" y="25" width="38" height="30" rx="2" class="frc" style="fill:${warm?"#f3d6c4":"#d7ecff"}"/>`+
   (ice>.05?`<rect x="45" y="${(20-ice*13).toFixed(1)}" width="34" height="${(ice*13).toFixed(1)}" rx="1" class="frice"/>`:"")+
   `<g class="${s.fan?"wmspin":""}" style="transform-origin:62px 13px"><path d="M62 9v8M58 13h8" class="frf"/></g>`+
   (s.heat?'<path d="M47 19h30" class="frh"/>':"")+
   `<rect x="92" y="10" width="50" height="22" rx="3" class="wml"/><text x="117" y="26" class="wmt${s.err||s.doorAl?" bad":""}">${disp}</text>`+
   `<text x="92" y="46" class="wms" style="fill:#333">${s.run?"компрессор ▶":(s.hum?"компрессор ⚠":"компрессор ■")}</text>`+
   `<text x="4" y="20" class="wms" style="fill:#333">мороз.</text><text x="4" y="42" class="wms" style="fill:#333">${Math.round(s.tE)}°</text></svg>`;
  led.className=s.mcu?"green":"";$("ledT").textContent="дисплей";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Сеть",s.mains?"230 В ~":"нет",s.mains?1:2)+row("Предохранитель F1",st.fuse?"сгорел":"цел",st.fuse?0:1)+
   row("+12 / +5 В",fmt(s.v12,1)+" / "+fmt(s.v5,2)+" В",s.v12>11&&s.v5>4.7?1:0)+row("Компрессор",s.run?"работает":(s.hum?"гудит, не стартует":"стоит"),s.hum?0:2)+
   row("Клиxон",s.kOpen?"разомкнут":"замкнут",s.kOpen?0:1)+row("Камера",fmt(s.tC,1)+" °C",s.tC>.5&&s.tC<6.5?1:0)+row("Испаритель",Math.round(s.tE)+" °C",2)+
   row("Лёд на испарителе",Math.round(s.ice*100)+" %",s.ice<.5?1:0)+row("Вентилятор",s.fan?"крутится":"стоит",2)+row("Оттайка",s.defrost?(s.heat?"идёт":"ТЭН не греет"):(s.heat?"ТЭН греет без команды":"выключена"),s.defrost&&!s.heat||(!s.defrost&&s.heat)?0:2)+
   row("Ошибка",s.err||(s.doorAl?"дверь":"нет"),s.err||s.doorAl?0:1);
}
