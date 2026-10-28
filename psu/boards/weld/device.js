/* Сварочный инвертор: передняя панель и дуга */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="";
  if(!s.mains)see=s.lab?`Вилка выдернута. К шине ${LAB_RAILS[s.lab.rail].n} подключён лабораторный БП: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — сработало ограничение тока, КЗ!":"."}`:"Вилка выдернута."+(s.bulk>30?" Конденсаторы шины ещё заряжены: "+Math.round(s.bulk)+" В!":"");
  else if(st.lamp&&s.surge)see="Лампа 100 Вт горит ярко: в аппарате короткое замыкание. Предохранитель цел благодаря лампе.";
  else if(st.fuse||s.surge)see=s.surge?"Хлопок! Короткое замыкание — сейчас сгорит предохранитель.":"Аппарат мёртв: сгорел предохранитель F1 (или выбило автомат).";
  else if(s.v15<5)see="Аппарат не подаёт признаков жизни: вентилятор стоит, индикатор не горит.";
  else if(!s.thOK)see="Горит индикатор «перегрев» — аппарат не варит."+(s.fan?"":" Вентилятор не крутится!");
  else if(!st.tv)see=s.ocv>40?"Холостой ход: на клеммах "+Math.round(s.ocv)+" В. Коснитесь электродом — «Зажечь дугу».":"Вентилятор крутится, но на клеммах 0 В — дуги не будет.";
  else if(!s.arc)see=s.ocv>40?"Дуга оборвалась.":"Электрод касается детали — а дуги нет.";
  else if(s.iarc>150)see="Дуга очень жёсткая: "+Math.round(s.iarc)+" А при выставленных 120 А — ручка тока не работает.";
  else if(s.iarc<100)see="Дуга слабая: "+Math.round(s.iarc)+" А вместо 120 А, электрод липнет.";
  else if(performance.now()-st.breakT<2500)see="Дуга рвётся — аппарат проседает под нагрузкой.";
  else see="Дуга горит ровно, ток "+Math.round(s.iarc)+" А.";
  if(st.tv&&!s.fan&&s.arc)see+=" Вентилятор не крутится!";
  const lvl=s.arc?Math.min(1,s.iarc/150):0;
  scr.className="screen wdbox";
  scr.innerHTML=`<svg viewBox="0 0 150 60" aria-hidden="true"><rect x="2" y="4" width="70" height="52" rx="4" class="wdb"/>`+
   `<rect x="8" y="10" width="40" height="16" rx="2" class="wml"/><text x="28" y="22" class="wmt" style="font-size:11px">${s.v15>5?(s.arc?Math.round(s.iarc):"120"):""}</text>`+
   `<circle cx="58" cy="15" r="3" class="pcl${s.v15>5?" on":""}"/><circle cx="58" cy="26" r="3" class="wdh${s.hotLed?" on":""}"/>`+
   `<circle cx="28" cy="42" r="8" class="wdk"/><path d="M28 42 l${(5*Math.cos(2.4)).toFixed(1)} ${(-5*Math.sin(2.4)).toFixed(1)}" class="wdn"/>`+
   `<path d="M95 8 L118 40" class="wde"/><rect x="85" y="46" width="60" height="8" class="wdm"/>`+
   (lvl?`<circle cx="119" cy="43" r="${(4+lvl*6).toFixed(1)}" class="wdarc"/><circle cx="119" cy="43" r="${(2+lvl*2).toFixed(1)}" fill="#fff"/>`:"")+`</svg>`;
  led.className=s.v15>5?"green":"";$("ledT").textContent="сеть";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Сеть",s.mains?"230 В ~":"нет",s.mains?1:2)+row("Предохранитель F1",st.fuse?"сгорел":"цел",st.fuse?0:1)+row("Шина",Math.round(s.bulk)+" В",s.bulk>280?1:(s.bulk>30?2:0))+
   row("Реле плавного пуска",s.relay?"замкнуто":"разомкнуто",s.relay?1:2)+row("+15 В",fmt(s.v15,1)+" В",s.v15>13?1:0)+row("Вентилятор",s.fan?"крутится":"стоит",s.fan?1:0)+
   row("Радиатор",Math.round(s.hs)+" °C",s.hs<70?1:0)+row("Uхх",Math.round(s.ocv)+" В",s.ocv>50?1:0)+row("Ток дуги",s.arc?Math.round(s.iarc)+" А":"—",s.arc?(s.iarc>100&&s.iarc<140?1:0):2);
}
