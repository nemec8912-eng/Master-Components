/* Кондиционер: внутренний блок (дисплей) и наружный блок */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="";
  if(!s.mains)see=s.lab?`Вилка выдернута. К шине ${LAB_RAILS[s.lab.rail].n} подключён лабораторный БП: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — ограничение тока, КЗ!":"."}`:"Кондиционер выключен из сети. Конденсаторы шины разряжаются — "+Math.round(s.bus)+" В.";
  else if(st.lamp&&s.surge)see="Лампа 100 Вт горит ярко: в наружном блоке КЗ. Предохранитель цел благодаря лампе.";
  else if(st.fuse||s.surge)see=s.surge?"Хлопок в наружном блоке! Сейчас сгорит предохранитель.":"Наружный блок мёртвый: сгорел предохранитель F1."+(st.tv&&s.err?" На внутреннем блоке "+s.err+".":"");
  else if(!st.tv)see=s.mcu?"Кондиционер в сети, ждёт команды с пульта.":(s.ptcTrip?"Кондиционер в сети, но наружная плата мёртвая, позистор горячий.":"Кондиционер в сети, наружная плата не подаёт признаков жизни.");
  else if(s.err)see="На внутреннем блоке "+s.err+": "+ERRS[s.err].split(" — ")[1]+"."+(s.err==="E1"&&s.mcu?" Наружная плата при этом под напряжением.":"")+(s.ptcTrip?" Позистор плавного пуска раскалён.":"");
  else if(s.jerk)see="Компрессор дёргается, не может запуститься.";
  else if(!s.run)see=s.comm?"Связь есть, наружный блок готовится к запуску компрессора…":"Внутренний блок дует, ждёт ответа наружного…";
  else see=s.freq<55?"Компрессор разгоняется…":"Кондиционер охлаждает: компрессор работает, из внутреннего блока холодный воздух.";
  const disp=!st.tv?"":(s.err||"22°");
  scr.className="screen acbox";
  scr.innerHTML=`<svg viewBox="0 0 150 60" aria-hidden="true"><rect x="4" y="4" width="92" height="22" rx="6" class="aci"/>`+
   `<rect x="58" y="9" width="32" height="12" rx="2" class="wml"/><text x="74" y="19" class="wmt${s.err?" bad":""}" style="font-size:10px">${disp}</text>`+
   `<path d="M10 22h40" class="acv"/>`+(st.tv&&!s.err&&s.run?'<path d="M14 30q4 5 0 10M26 30q4 5 0 10M38 30q4 5 0 10" class="acair"/>':"")+
   `<rect x="96" y="30" width="50" height="28" rx="3" class="aco"/><circle cx="114" cy="44" r="10" class="acfan"/>`+
   `<g class="${s.run?"wmspin":""}" style="transform-origin:114px 44px"><path d="M114 35v18M105 44h18" class="acbl"/></g>`+
   `<text x="128" y="42" class="wms" style="fill:#333">${s.run?Math.round(s.freq)+"Гц":"—"}</text><text x="128" y="52" class="wms" style="fill:#333">${Math.round(s.bus)}В</text>`+
   `<text x="4" y="56" class="wms" style="fill:#333">в комнате ${Math.round(s.room)}°</text></svg>`;
  led.className=s.mcu?"green":"";$("ledT").textContent="светодиод наружной платы";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Сеть",s.mains?"230 В ~":"нет",s.mains?1:2)+row("Предохранитель F1",st.fuse?"сгорел":"цел",st.fuse?0:1)+row("Позистор / реле",Math.round(s.rtT)+" °C / "+(s.rl?"замкнуто":"разомкнуто"),s.ptcTrip?0:2)+
   row("Шина",Math.round(s.bus)+" В",s.bus>360?1:(s.bus>250?2:0))+row("PFC",s.pfc?"работает":"выключен",s.pfcCmd&&!s.pfc?0:2)+row("+15 / +5 В",fmt(s.v15,1)+" / "+fmt(s.v5,2)+" В",s.v15>13&&s.v5>4.7?1:0)+
   row("Связь с внутренним",s.comm?"есть":"нет",st.tv?(s.comm?1:0):2)+row("Компрессор",s.run?Math.round(s.freq)+" Гц, "+fmt(s.icomp,1)+" А":(s.jerk?"дёргается":"стоит"),s.jerk?0:2)+
   row("Нагнетание",s.tDr<-30?"обрыв":(s.tDr>150?"КЗ":Math.round(s.tDr)+" °C"),s.tDr<-30||s.tDr>150?0:2)+row("Ошибка",s.err||"нет",s.err?0:1);
}
