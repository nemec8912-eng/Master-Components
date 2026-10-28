/* Цепь зарядки телефона: экран телефона */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="";
  if(s.lab)see=`К клеммам аккумулятора подключён лабораторный БП: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — ограничение тока.":"."}`;
  else if(!st.tv)see=s.mains?(s.ichg>.05?"Телефон выключен, идёт зарядка ("+fmt(s.ichg,1)+" А).":"Телефон выключен, кабель вставлен — зарядка не идёт: "+s.chgText+"."):"Телефон выключен, кабель не подключён.";
  else if(!s.phone)see=s.mains?"Телефон не включается даже от зарядки.":(s.batConn?"Телефон выключился: аккумулятор не держит нагрузку.":"Без кабеля телефон не включается — аккумулятора как будто нет.");
  else if(!s.mains)see="Телефон работает от аккумулятора: "+Math.round(s.soc)+" %.";
  else if(s.ichg<.05)see="Кабель вставлен, но телефон не заряжается: "+s.chgText+".";
  else if(s.ichg<1.5)see="Телефон заряжается, но медленно: "+fmt(s.ichg,2)+" А.";
  else see="Телефон заряжается: "+fmt(s.ichg,1)+" А, "+Math.round(s.soc)+" %."+(s.ledOn?"":" Индикатор зарядки не горит.");
  if(st.offSeen)see+=" Под нагрузкой выключается на "+Math.round(s.soc)+" %.";
  const pct=Math.round(s.soc),chg=s.ichg>.05;
  scr.className="screen phbox";
  scr.innerHTML=`<svg viewBox="0 0 150 60" aria-hidden="true"><rect x="45" y="2" width="60" height="56" rx="8" class="phb"/><rect x="50" y="8" width="50" height="44" rx="3" class="phs${s.phone?" on":""}"/>`+
   (s.phone||chg?`<rect x="62" y="20" width="24" height="12" rx="2" class="phc"/><rect x="86" y="24" width="2" height="4" class="phc"/><rect x="63.5" y="21.5" width="${(21*pct/100).toFixed(1)}" height="9" class="phl${pct<20?" low":""}"/>`+
   `<text x="75" y="44" class="pht">${s.phone||chg?pct+" %":""}${chg?" ⚡":""}</text>`:"")+
   `<circle cx="96" cy="12" r="1.8" class="pcl${s.ledOn?" red":""}"/>`+(s.mains?`<path d="M75 58 V60" class="phk"/><rect x="69" y="58" width="12" height="2" class="phk"/>`:"")+`</svg>`;
  led.className=s.ledOn?"red":"";$("ledT").textContent="индикатор зарядки";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Кабель",s.mains?"вставлен "+(s.flip?"(перевёрнут)":"(прямо)"):"нет",2)+row("VBUS",fmt(s.vbus,2)+" В",s.vbus>4.5?1:(s.mains?0:2))+row("Вход контроллера",fmt(s.vin,2)+" В",s.vin>4.3?1:(s.mains?0:2))+
   row("Контроллер",s.chgText,s.ichg>1.5?1:(s.mains?0:2))+row("Ток заряда",fmt(s.ichg,2)+" А",s.ichg>1.5?1:(s.mains?0:2))+row("Аккумулятор",s.batConn?fmt(s.vbat,2)+" В, "+Math.round(s.soc)+" %":"не обнаружен",s.batConn?1:0)+
   row("VSYS",fmt(s.vsys,2)+" В",s.vsys>3.4?1:0)+row("Индикатор",s.ledOn?"горит":"не горит",s.ledOn?1:2);
}
