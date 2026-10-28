/* Усилитель TDA7294: что слышно из динамика */
function renderTv(){
  const s=S,scr=$("screen"),led=$("led");
  let see="";
  if(!s.mains)see=(s.lab?`Вилка выдернута. К шине ${LAB_RAILS[s.lab.rail].n} подключён лабораторный БП: ${fmt(s.lab.v,2)} В, ${fmt(s.lab.i,3)} А${s.lab.cc?" — сработало ограничение тока, КЗ!":"."}`:"Вилка выдернута из розетки."+(s.vp>20?" Конденсаторы фильтра ещё заряжены!":""));
  else if(st.lamp&&s.surge)see="Лампа 100 Вт горит ярко: в усилителе короткое замыкание. Предохранитель цел благодаря лампе.";
  else if(st.fuse||s.surge)see=s.surge?"Короткое замыкание! Сейчас сгорит предохранитель.":"Усилитель мёртв: сгорел предохранитель F1.";
  else if(!s.powered)see="Нет питания ±35 В: усилитель не работает, хотя предохранитель цел.";
  else{const m={ok:"Звук чистый, без фона и искажений.",off:"Усилитель включён и ждёт сигнал. Нажмите «Музыка: включить».",silent:"Индикатор горит, а в динамике тишина: "+s.qText+".",dist:"Звук хрипит: "+s.qText+".",
      noise:"Из динамика громкий гул и треск.",hum:"Звук с фоном 100 Гц, на громкости хрипит.",quiet:"Звук есть, но "+s.qText+".",osc:"Звук есть, но микросхема сильно греется"+(s.therm?" — сработала тепловая защита, звук пропал.":"."),dc:"На динамик подано постоянное напряжение — катушка греется, слышен хлопок!"};
    see=m[s.quality]||s.qText;if(s.quality==="ok"&&(!okp("LED1")||!okp("R2")))see+=" Но индикатор питания не горит."}
  const lvl=s.play&&s.active&&okp("LS1")?Math.min(1,s.amp/17):0;
  const pts=[];for(let i=0;i<=60;i++){const x=i/60;let v=0;if(lvl){const W=wave("out");v=W.f(x)/24}else if(s.dc>20)v=s.dc/40;pts.push(`${(i*2.5).toFixed(1)},${(25-v*22).toFixed(1)}`)}
  scr.className="screen spkbox";
  scr.innerHTML=`<svg viewBox="0 0 150 50" class="spkwave" aria-hidden="true"><polyline points="${pts.join(" ")}"/></svg><div class="spk${lvl?" on":""}" style="--a:${lvl.toFixed(2)}"></div>`;
  led.className=s.vp>10&&okp("R2")&&okp("LED1")?"green":"";$("ledT").textContent="индикатор питания";
  $("see").textContent=see;
  const row=(n,v,ok)=>`<tr><td>${n}</td><td class="${ok===1?"st-ok":ok===0?"st-bad":"st-mid"}">${v}</td></tr>`;
  $("rd").innerHTML=row("Сеть",s.mains?"230 В ~":"нет",s.mains?1:2)+row("Предохранитель F1",st.fuse?"сгорел":"цел",st.fuse?0:1)+
   row("+V / −V",fmt(s.vp,1)+" / "+fmt(s.vn,1)+" В",s.vp>32&&s.vn<-32?1:(s.vp>5?2:0))+row("MUTE/STBY",okp("R7")&&!is("C6","short")&&s.vp>5?"5 В (работа)":"0 В (дежурка)",okp("R7")&&!is("C6","short")&&s.vp>5?1:2)+
   row("Сигнал на выходе",s.play&&s.amp?"±"+fmt(s.amp,1)+" В":"нет",s.amp>10?1:2)+row("Постоянка на выходе",fmt(s.dc,2)+" В",Math.abs(s.dc)<.2?1:0)+row("Температура IC1",Math.round(st.temp.IC1||25)+" °C",(st.temp.IC1||25)<90?1:0)+row("Звук",s.qText,s.quality==="ok"?1:(s.quality==="off"?2:0));
}
