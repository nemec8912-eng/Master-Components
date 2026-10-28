/* Блок питания ATX: что происходит с компьютером */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="",mon="",fan=s.power&&s.v12>6;
  if(!s.mains)see=s.lab?`Вилка выдернута. К шине ${LAB_RAILS[s.lab.rail].n} подключён лабораторный БП: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — сработало ограничение тока, КЗ!":"."}`:"Вилка выдернута из розетки."+(s.bulk>30?" Конденсаторы C1/C2 ещё заряжены!":"");
  else if(st.lamp&&s.surge)see="Лампа 100 Вт горит ярко: на горячей стороне КЗ. Предохранитель цел благодаря лампе.";
  else if(st.fuse||s.surge)see=s.surge?"Хлопок! Короткое замыкание — сейчас сгорит предохранитель.":"Блок мёртвый: сгорел предохранитель F1.";
  else if(s.vsb<1)see="Дежурки нет: светодиод на материнской плате не горит, кнопка не работает.";
  else if(s.vsb>6)see="Дежурка +5VSB = "+fmt(s.vsb,1)+" В! Материнская плата в опасности.";
  else if(st.autoSeen)see="Компьютер включился сам, без кнопки: блок не слушает PS_ON.";
  else if(!st.tv)see=s.vsb<4.6?"Дежурка занижена ("+fmt(s.vsb,2)+" В): материнская плата может не проснуться.":"Компьютер выключен. Дежурка +5VSB есть. Нажмите кнопку компьютера.";
  else if(s.prot)see="Вентилятор дёрнулся и остановился: блок ушёл в защиту.";
  else if(!s.drive)see="Кнопку нажали — ничего не происходит. Дежурка есть, основные напряжения не запускаются.";
  else if(!s.pg)see=(s.v12>11&&s.v5>4.7)?"Вентилятор крутится, напряжения есть, но сигнала Power Good нет — компьютер не стартует.":"Блок запускается, но напряжения не в норме.";
  else if(s.rip12||s.rip5)see="Компьютер загрузился, но зависает: большие пульсации на выходе.";
  else if(performance.now()-st.pgDrop<3000)see="Компьютер перезагрузился: Power Good пропал на мгновение.";
  else see="Компьютер работает: все напряжения в норме.";
  if(s.pg&&st.tv)mon=(s.rip12||s.rip5)?"Windows… (завис)":(performance.now()-st.pgDrop<3000?"Перезагрузка…":"Рабочий стол");
  scr.className="screen pcbox";
  scr.innerHTML=`<svg viewBox="0 0 150 60" aria-hidden="true"><rect x="2" y="4" width="92" height="50" rx="3" class="pcm"/><rect x="7" y="9" width="82" height="40" class="pcs${mon?" on":""}"/>`+
   `<text x="48" y="33" class="pct">${mon}</text>`+
   `<rect x="102" y="4" width="44" height="50" rx="3" class="pcc"/><g class="${fan?"wmspin":""}" style="transform-origin:124px 26px"><circle cx="124" cy="26" r="13" class="pcf"/><path d="M124 13v26M111 26h26M115 17l18 18M133 17l-18 18" class="pcb"/></g>`+
   `<circle cx="124" cy="47" r="2.5" class="${s.pg&&st.tv?"pcl on":"pcl"}"/></svg>`;
  led.className=s.vsb>4?"green":"";$("ledT").textContent="дежурка на материнке";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Сеть",s.mains?"230 В ~":"нет",s.mains?1:2)+row("Предохранитель F1",st.fuse?"сгорел":"цел",st.fuse?0:1)+
   row("Шина +310 В",Math.round(s.bulk)+" В",s.bulk>280?1:(s.bulk>30?2:0))+row("+5VSB (дежурка)",fmt(s.vsb,2)+" В",s.vsb>4.75&&s.vsb<5.25?1:0)+
   row("VCC TL494",fmt(s.vcc,1)+" В",s.vcc>10?1:0)+row("PS_ON",st.tv?"0 В (включить)":"5 В (выключено)",2)+
   row("+12 В",fmt(s.v12,2)+" В",s.v12>11.4&&s.v12<12.6?1:(st.tv?0:2))+row("+5 В",fmt(s.v5,2)+" В",s.v5>4.75&&s.v5<5.25?1:(st.tv?0:2))+
   row("Power Good",s.pg?"5 В":"0 В",s.pg?1:(st.tv?0:2))+row("Защита",s.prot?"сработала":"нет",s.prot?0:1);
}
