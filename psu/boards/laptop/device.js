/* Питание ноутбука: экран, батарея, индикатор и ток от блока питания */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="";
  if(s.lab&&!s.mains)see=`Зарядка отключена. Лабораторный БП на шине «${LAB_RAILS[s.lab.rail].n}»: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — ограничение тока: КЗ! Ищите горячую деталь тепловизором.":"."}`;
  else if(s.inShort)see="Ноутбук мёртвый. Индикатор на блоке питания мигает — блок питания уходит в защиту от короткого замыкания на входе.";
  else if(!s.ec){
    if(s.hic)see="Не включается. Ток от блока питания дёргается 0 → 0,05 А — ШИМ дежурок перезапускается из-за КЗ.";
    else if(!s.mains&&!s.batRun)see=s.bat&&okp("Q5")?"Зарядка отключена, батарея разряжена.":"Зарядка вынута — и ноутбук сразу погас: от батареи не работает.";
    else if(!s.alw)see="Ноутбук мёртвый: ток от блока питания 0,00 А, дежурных 3 В и 5 В нет.";
    else see="Ноутбук мёртвый: дежурки 3 В и 5 В есть, но мультиконтроллер не запускается.";}
  else if(is("SW1","stuck")&&st.stuckDone)see="Ноутбук сам включился, через 4 секунды выключился и больше не реагирует на кнопку.";
  else if(!st.tv)see=s.mains?(s.acfet?"Ноутбук выключен, зарядка подключена.":"Ноутбук выключен. Зарядку не видит."):"Ноутбук выключен, работает только дежурка от батареи.";
  else if(!s.pwr){
    if(st.vcLatch)see="При нажатии кнопки ток от блока питания прыгнул до 0,6 А и упал — ноутбук не включился (защита по VCORE).";
    else if(st.drops)see="Ноутбук начал загружаться и через несколько секунд выключился.";
    else see="Нажимаете кнопку питания — ничего не происходит."+(s.ledOn?" Индикатор зарядки горит.":"");}
  else if(!s.booted)see=s.vcore<.1&&st.onT>1.5?"Вентилятор крутится, экран чёрный. Ток от блока питания 0,25 А.":"Включается…";
  else if(st.drops)see="Ноутбук включается и через несколько секунд выключается.";
  else if(!s.mains)see="Ноутбук работает от батареи.";
  else if(!s.acfet)see="Ноутбук работает, но зарядку не видит: «работа от батареи», батарея садится.";
  else if(!s.batOK)see="Ноутбук работает от зарядки, но батарея не обнаружена (значок с крестиком).";
  else if(!s.chgPath)see="Ноутбук работает, значок батареи: «Подключено, не заряжается».";
  else if(s.worn)see="Работает и заряжается, но батарея набирает заряд за минуты: контроллер батареи показывает износ 80 %.";
  else if(!s.ledOn)see="Ноутбук работает и заряжается, но индикатор зарядки не горит.";
  else see="Ноутбук работает, батарея заряжается, индикатор горит.";
  const lit=s.booted;
  scr.className="screen lpbox";
  scr.innerHTML=`<svg viewBox="0 0 150 60" aria-hidden="true"><rect x="10" y="3" width="76" height="46" rx="3" class="lpl"/>`+
   `<rect x="14" y="7" width="68" height="38" class="lps" style="fill:${lit?"#2b6cb0":"#0b0f14"}"/>`+(lit&&s.bootT>1?'<path d="M40 18h7v7h-7zM48 18h7v7h-7zM40 26h7v7h-7zM48 26h7v7h-7z" class="lpw"/>':(s.pwr?'<text x="48" y="30" class="lpt">…</text>':""))+
   `<path d="M2 52h92l-6-3H8z" class="lpb"/>`+
   `<rect x="100" y="8" width="38" height="16" rx="2" class="lpbat"/><rect x="138" y="13" width="3" height="6" class="lpbat"/>`+
   (s.bat?`<rect x="102" y="10" width="${(34*Math.min(100,s.soc)/100).toFixed(1)}" height="12" class="lpfill" style="fill:${s.worn?"#d69e2e":"#38a169"}"/>`:'<path d="M110 11l18 10M128 11l-18 10" class="lpx"/>')+
   (s.chg?'<path d="M121 10l-5 7h4l-2 6 6-8h-4z" class="lpz"/>':"")+
   `<text x="100" y="38" class="wms" style="fill:#333">${fmt(s.iad,2)} А</text><text x="100" y="50" class="wms" style="fill:#777">ток от БП</text></svg>`;
  led.className=s.ledOn?"amber":"";$("ledT").textContent="индикатор зарядки";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Зарядка 19 В",s.mains?(s.inShort?"в защите (КЗ)":fmt(s.vad,1)+" В"):"не подключена",s.mains?(s.inShort?0:1):2)+row("Ток от БП",fmt(s.iad,2)+" А",2)+
   row("ACDET",fmt(s.acdet,2)+" В",s.mains?(s.acdet>2.4&&s.acdet<4.2?1:0):2)+row("VSYS",fmt(s.vsys,1)+" В",s.vsys>9?1:0)+row("Батарея",s.bat?Math.round(s.soc)+" % · "+fmt(s.vbat,1)+" В":"не обнаружена",s.bat&&!s.worn?1:0)+
   row("Заряд",s.chg?fmt(s.ichg,1)+" А":(s.chgPath?"заряжена":"не идёт"),s.mains?(s.chgPath?1:0):2)+row("+5 / +3,3 В",fmt(s.v5,2)+" / "+fmt(s.v3,2)+" В",s.v3>3&&s.v5>4.7?1:0)+
   row("EC",s.ec?"работает":"не работает",s.ec?1:0)+row("VCORE",fmt(s.vcore,2)+" В",s.pwr?(s.vcore>.9?1:0):2)+row("Индикатор",s.ledOn?"горит":"не горит",s.mains&&s.acfet?(s.ledOn?1:0):2);
}
