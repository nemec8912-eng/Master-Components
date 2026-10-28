/* Микроволновая печь: что видно снаружи */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="";
  if(!s.mains)see=s.lab?`Вилка выдернута. К шине ${LAB_RAILS[s.lab.rail].n} подключён лабораторный БП: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — сработало ограничение тока, КЗ!":"."}`:"Вилка выдернута."+(s.bulk>30?" На высоковольтном конденсаторе C3 ещё "+fmt(s.bulk/1000,1)+" кВ — разрядите его!":"");
  else if(st.lamp&&s.surge)see="Лампа 100 Вт горит ярко: в печи короткое замыкание. Предохранитель цел благодаря лампе.";
  else if(st.fuse||s.surge)see=s.surge?"Гул и щелчок — сейчас сгорит предохранитель!":"Печь мертва: сгорел предохранитель F1.";
  else if(!s.mcuOn)see="Дисплей не горит, кнопки не реагируют.";
  else if(!s.mcu)see="Дисплей мигнул и сбросился — программа остановилась.";
  else if(s.selfRun)see="Печь гудит и греет, хотя «Старт» не нажимали! Опасно.";
  else if(s.door)see=st.tv?"Дверца открыта.":"Дверца открыта — поставили стакан воды.";
  else if(s.running){const p=[];if(!s.t1On)p.push("не слышно гула трансформатора");else if(s.hum)p.push("сильно гудит");if(s.mgOn&&s.pw<.8)p.push("греет слабо");if(s.t1On&&!s.mgOn&&!s.hum)p.push("гудит, но не греет");if(!s.plateOn)p.push("тарелка стоит");if(!s.coolOn)p.push("вентилятор не дует");if(!s.lampOn)p.push("лампа не горит");
    see=p.length?"Идёт разогрев, но: "+p.join(", ")+".":"Идёт разогрев: гудит, тарелка крутится, вода греется."}
  else if(s.ended)see=s.goodRun?"Готово! Вода в стакане горячая.":"«Готово», но вода почти холодная.";
  else see=st.tv?"Нажат «Старт», но печь не запускается.":"Печь ждёт. Нажмите «Старт 30 с».";
  const disp=!s.mcu?"":(s.running?"0:"+String(Math.max(0,Math.ceil(s.left*2))).padStart(2,"0"):(s.ended?"End":"0:30"));
  const lit=s.lampOn;
  scr.className="screen mwbox";
  scr.innerHTML=`<svg viewBox="0 0 150 60" aria-hidden="true"><rect x="2" y="4" width="146" height="52" rx="5" class="mwb"/>`+
   `<rect x="8" y="10" width="98" height="40" rx="3" class="mww${lit?" on":""}${s.door?" open":""}"/>`+
   `<ellipse cx="57" cy="42" rx="30" ry="4" class="mwp"/><g class="${s.plateOn?"mwspin":""}" style="transform-origin:57px 42px"><path d="M27 42h60" class="mwr"/></g>`+
   `<rect x="50" y="26" width="14" height="15" rx="2" class="mwc" style="fill:${s.wt>45?"#e8a0a0":"#9cc8ff"}"/>`+
   `${s.mgOn?'<path d="M40 22 q4 -4 8 0 t8 0 t8 0 t8 0" class="mwwave"/>':""}`+
   `<rect x="112" y="10" width="32" height="14" rx="2" class="wml"/><text x="128" y="21" class="wmt" style="font-size:9px">${disp}</text>`+
   `<text x="113" y="38" class="wms">${Math.round(s.wt)}°C</text></svg>`;
  led.className=s.mcu?"green":"";$("ledT").textContent="дисплей";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Сеть",s.mains?"230 В ~":"нет",s.mains?1:2)+row("Предохранитель F1",st.fuse?"сгорел":"цел",st.fuse?0:1)+row("Дверца",s.door?"открыта":"закрыта",2)+
   row("Питание платы",fmt(s.v12,1)+" / "+fmt(s.v5,2)+" В",s.v5>4.7?1:0)+row("Реле магнетрона",s.relayHot?"включено":"выключено",s.selfRun?0:2)+
   row("Трансформатор T1",s.t1On?"под сетью":"выключен",2)+row("Магнетрон",s.mgOn?Math.round(s.pw*100)+" % мощности":"СВЧ нет",s.mgOn?(s.pw>.8?1:0):2)+
   row("Тарелка / вентилятор",(s.plateOn?"крутится":"стоит")+" / "+(s.coolOn?"дует":"стоит"),2)+row("C3",s.bulk>30?"−"+fmt(s.bulk/1000,1)+" кВ":"разряжен",s.bulk>30&&!s.mains?0:2)+row("Вода",Math.round(s.wt)+" °C",2);
}
