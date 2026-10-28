/* Индукционная плита: панель и конфорка */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="";
  if(!s.mains)see=s.lab?`Вилка выдернута. К шине ${LAB_RAILS[s.lab.rail].n} подключён лабораторный БП: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — ограничение тока, КЗ!":"."}`:"Вилка выдернута из розетки.";
  else if(st.lamp&&s.surge)see="Лампа 100 Вт горит ярко: в плите КЗ. Предохранитель цел благодаря лампе.";
  else if(st.fuse||s.surge)see=s.surge?"Хлопок! Сейчас сгорит предохранитель.":"Плита мёртвая: сгорел предохранитель F1.";
  else if(!s.mcu)see="Дисплей не горит, кнопки не реагируют.";
  else if(s.err)see="Плита пищит, на дисплее "+s.err+": "+ERRS[s.err].split(" — ")[1]+".";
  else if(!st.tv)see="Плита включена в сеть, дисплей показывает «- -». Поставьте кастрюлю и включите.";
  else if(!s.heat)see="Плита ищет посуду…";
  else see=s.pw<.8?"Греет, но слабо и громко пищит.":(s.fan?"Греет: вода в кастрюле нагревается, вентилятор шумит.":"Греет, но вентилятор не крутится!");
  const disp=!s.mcu?"":(s.err||(st.tv?(s.heat?"P6":"…"):"- -"));
  const glow=s.heat?Math.min(1,s.pw):0;
  scr.className="screen icbox";
  scr.innerHTML=`<svg viewBox="0 0 150 60" aria-hidden="true"><rect x="2" y="3" width="146" height="54" rx="6" class="icg"/>`+
   `<circle cx="52" cy="30" r="23" class="icz" style="--g:${glow.toFixed(2)}"/><circle cx="52" cy="30" r="17" class="icp"/>`+
   `<ellipse cx="52" cy="30" rx="13" ry="13" class="icw" style="fill:${s.wt>70?"#e8a0a0":"#9cc8ff"}"/>`+(s.wt>95&&s.heat?'<path d="M46 14q2-4 0-7M52 14q2-4 0-7M58 14q2-4 0-7" class="icst"/>':"")+
   `<rect x="96" y="12" width="44" height="18" rx="3" class="wml"/><text x="118" y="26" class="wmt${s.err?" bad":""}" style="font-size:12px">${disp}</text>`+
   `<text x="98" y="46" class="wms" style="fill:#ddd">${Math.round(s.wt)}°C</text><g class="${s.fan?"wmspin":""}" style="transform-origin:134px 43px"><path d="M134 37v12M128 43h12" class="icf"/></g></svg>`;
  led.className=s.mcu?"green":"";$("ledT").textContent="дисплей";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Сеть",s.mains?"230 В ~":"нет",s.mains?1:2)+row("Предохранитель F1",st.fuse?"сгорел":"цел",st.fuse?0:1)+row("Шина",Math.round(s.bus)+" В",s.bus>250?1:(s.mains?0:2))+
   row("+18 / +5 В",fmt(s.v18,1)+" / "+fmt(s.v5,2)+" В",s.v5>4.7&&s.v18>15?1:0)+row("Нагрев",s.heat?Math.round(s.pw*2000)+" Вт":"нет",s.heat?(s.pw>.8?1:0):2)+
   row("Вентилятор",s.fan?"крутится":"стоит",s.fan?1:(st.tv?0:2))+row("IGBT",Math.round(s.tQ)+" °C",s.tQ<70?1:0)+row("Ошибка",s.err||"нет",s.err?0:1)+row("Вода",Math.round(s.wt)+" °C",2);
}
