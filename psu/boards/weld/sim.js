/* Сварочный инвертор: модель работы */
Object.assign(st,{v15:0,hs:30,iarc:0,breakT:-1e9,arcT:0,thLatch:false});
st.lab.rail="v15";st.lab.v=15;
BOARD.reset=()=>{Object.assign(st,{rlOn:false,v15:0,hs:30,iarc:0,breakT:-1e9,arcT:0,thLatch:false})};
const CASC=[
 ["RL1","open","arcR",3,"R1","open","Ток сварки шёл через R1 — резистор плавного пуска сгорел."],
 ["D1","open","arc",3,"Q1","short","Без возвратного диода выбросы пробили верхний IGBT."],
 ["D2","open","arc",3,"Q2","short","Без возвратного диода выбросы пробили нижний IGBT."],
 ["Q5","open","arc",5,"Q1","short","IGBT закрывались медленно, перегрелись — Q1 пробит."],
 ["T4","open","arc",6,"Q2","short","Ток не ограничивался — IGBT Q2 пробит перегрузкой."],
 ["D8","open","arc",6,"Q2","short","Ток не ограничивался — IGBT Q2 пробит перегрузкой."],
 ["C4","short","arc",2,"R7","open","Через пробитый C4 резистор снаббера R7 перегрелся и сгорел."],
 ["Q1","short","drv",.3,"R5","open","Вместе с пробитым IGBT сгорел резистор затвора R5."],
 ["Q2","short","drv",.3,"R6","open","Вместе с пробитым IGBT сгорел резистор затвора R6."]
];
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Хлопок! В силовой части короткое замыкание.":"Короткое замыкание: "+cause+".",true)}
function sim(now,dt){
  const sdt=dt*st.speed;st.t+=sdt;const t=st.t,F=st.F;
  const mains=st.mains;
  let lab=null;
  if(st.lab.on){
    if(mains||st.bulk>30){st.lab.on=false;log(mains?"ЛБП отключён: вилка в розетке.":"ЛБП отключён: на C1/C2 опасное напряжение.",true);if(typeof labUi==="function")labUi()}
    else{const R=LAB_RAILS[st.lab.rail],sh=R.parts.filter(id=>is(id,"short")&&st.slot[id]!=="empty");
      let v=st.lab.v,i=0;if(sh.length){v=.12;i=st.lab.lim}else{i=R.load(v);if(i>st.lab.lim){i=st.lab.lim;v=Math.min(v,v*st.lab.lim/R.load(v))}}
      lab={rail:st.lab.rail,v,i,sh,cc:i>=st.lab.lim-1e-6}}}
  const pre=mains&&okp("F1")&&!st.fuse;
  // standby, relay
  const sbOn=st.bulk>100&&okp("IC2")&&okp("T3");
  if(st.v15<11||!okp("RL1"))st.rlOn=false;else if(st.bulk>180)st.rlOn=true;
  const coil=!!st.rlOn;
  const relay=coil||is("RL1","stuck");
  // icRun, drive
  const icRun=st.v15>9.5&&okp("IC1")&&okp("R8")&&!is("C7","short");
  if(st.hs>75)st.thLatch=true;if(st.hs<60)st.thLatch=false;
  const thOK=okp("SW1")&&!st.thLatch;
  const drive=icRun&&thOK&&okp("Q4")&&okp("C8");
  const g1=drive&&okp("T2")&&okp("R5"),g2=drive&&okp("T2")&&okp("R6");
  // shorts
  let shortC=null;
  if(pre){
    if(is("CX1","short"))shortC="пробит конденсатор CX1";
    else if(is("BD1","short"))shortC="пробит диодный мост";
    else if((is("C1","short")||is("C2","short"))&&(okp("R1")||relay))shortC="пробит конденсатор шины";
    else if(is("RL1","stuck")&&st.bulk<150)shortC="бросок тока заряда без резистора R1 (реле залипло)";
    else if(drive&&(is("Q1","short")||is("Q2","short"))&&st.bulk>150)shortC="сквозной ток через пробитый IGBT и T1";
    else if(g1&&g2&&is("D1","short"))shortC="пробит возвратный диод D1";
  }
  if(st.lamp){if(shortC){if(!st.surge){st.surge={t0:now,cause:shortC,nets:["bp"],lamp:1};if(!st.lampWarn){st.lampWarn=1;log("Лампа горит ярко — КЗ. Предохранитель цел.",true)}}}else if(st.surge&&now-st.surge.t0>700)st.surge=null;if(!shortC&&!st.surge)st.lampWarn=0}
  else if(!st.surge&&shortC)surgeStart(shortC,["bp"],now);
  if(st.surge&&!shortC&&!st.lamp&&!st.surge.lamp)st.surge=null;
  let surge=!!st.surge;
  if(surge&&!st.lamp&&now-st.surge.t0>(shortC&&shortC.includes("бросок")?100:600)){st.fuse=true;st.surge=null;surge=false;if(st.bug){st.bug=false;log("«Жучок» не сгорел — выгорела дорожка у моста.",true)}else log("Сгорел предохранитель F1.",true)}
  const ac=pre&&!surge;
  // bus
  const chgPath=ac&&okp("BD1")&&(okp("R1")||relay);
  const sagSrc=is("BD1","open")||is("C1","dry")||is("C2","dry");
  const arcPrev=st.iarc>5;
  let bT=chgPath?310:0;
  if(chgPath&&arcPrev&&sagSrc&&Math.sin(t*2.2)>.4)bT=200;
  if(chgPath&&arcPrev&&!relay)bT=230;
  st.bulk+=(bT-st.bulk)*(1-Math.exp(-dt/(bT>st.bulk?(relay?.05:.6):(arcPrev?.08:(sbOn?4:40)))));
  // +15
  let v15T=sbOn&&okp("D5")&&!is("C5","short")?15:0;
  if(v15T&&is("C5","dry")&&arcPrev&&Math.sin(t*1.7)>.6)v15T=8;
  st.v15+=(v15T-st.v15)*(1-Math.exp(-dt/.04));if(lab&&lab.rail==="v15")st.v15=lab.v;
  const fan=st.v15>10&&okp("M1");
  // power stage
  const power=g1&&g2&&okp("Q1")&&okp("Q2")&&!is("Q1","short")&&!is("Q2","short")&&st.bulk>150&&okp("T1")&&!surge;
  let ocv=power&&okp("D3")&&!is("D3","short")&&okp("L1")?62*Math.min(1,st.bulk/300):0;
  // arc
  let iT=0;
  if(st.tv&&ocv>40){iT=120;if(is("R11","open"))iT=35;if(is("T4","open")||is("D8","open"))iT=190;if(is("R12","open"))iT=40;if(is("D4","open"))iT=Math.min(iT,70);if(is("C4","short"))iT=Math.min(iT,90);
    if(st.bulk<240)iT=0;}
  st.iarc+=(iT-st.iarc)*(1-Math.exp(-dt/.05));
  const arc=st.iarc>5;
  if(st.tv&&!arc&&st.arcT>.3)st.breakT=now;
  st.arcT=arc?st.arcT+sdt:0;
  if(!st.tv)st.breakT=-1e9;
  // heat
  st.hs+=((arc?(fan?1.2:5)*st.iarc/120:0)-(st.hs-30)*(fan?.08:.01))*sdt;
  // cascades
  const flags={arc:arc,arcR:arc&&!relay,drv:drive&&st.bulk>150};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&flags[cond]){st.casc[k]=(st.casc[k]||0)+dt;if(st.casc[k]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Хлопок и запах гари — что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains)return;if(/^Q[12]$/.test(L.tg)&&!arc)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const hotLed=!thOK&&st.v15>5&&okp("R3")&&okp("LED1");
  S={t,mains,pre,ac,bulk:st.bulk,dcv:st.bulk,chg:chgPath&&st.bulk<300,chgR:chgPath&&!relay&&(st.bulk<300||arc),coil,relay,sbOn,v15:st.v15,fan,hs:st.hs,thOK,hotLed,icRun,drive,power,ocv,arc,iarc:st.iarc,
     surge,surgeNet:{},fuse:st.fuse,lab,lampB:!st.lamp||!mains?0:(surge?1:(arc?.9:(st.bulk<280&&chgPath?.6:.06))),
     devOK:st.tv&&arc&&st.iarc>100&&st.iarc<140&&thOK&&now-st.breakT>2500&&st.v15>13,
     sbyOn:sbOn,llcOut:power,pfcSw:false};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});const pw=s.arc?1.4:(s.power?.3:0);
  const n={ac0:N(s.mains,"ac",s.chg?1:.2+pw),ac1:N(s.pre,"ac",s.chg?1:.2+pw),n0:N(s.mains,"ac",s.chg?1:.2+pw),bp0:N(s.ac,"hv",s.chgR?1:0),bp:N(s.bulk>20,"hv",pw),rly:N(s.coil,"vcc",.3),hg:N(0,"lv",0),
   sbd:N(s.sbOn,"hv",.4),s15:N(s.v15>1,"vcc",.4),v15:N(s.v15>1,"vcc",.3),cg:N(0,"lv",0),therm:N(s.thOK&&s.v15>1,"fb",0),ledA:N(s.hotLed,"fb",.3),
   rtct:N(s.icRun,"pu",0),vref:N(s.icRun,"fb",0),cs:N(s.arc,"fb",.2),out:N(s.drive,"pu",.5),drv:N(s.drive,"pu",.6),drvc:N(s.drive&&okp("C8"),"pu",.6),
   g1:N(s.drive&&okp("T2"),"pu",.5),g2:N(s.drive&&okp("T2"),"pu",.5),pa:N(s.power,"hv",pw),pb:N(s.power,"hv",pw),s1:N(s.power,"lv",pw),s2:N(s.power,"lv",pw),
   kout:N(s.ocv>1,"lv",pw),snb:N(s.power,"lv",.2),outp:N(s.ocv>1,"lv",pw),outm:N(s.ocv>1,"lv",pw),ctp:N(s.arc,"fb",.3)};
  if(s.surge){n.bp.red=1;n.bp.f=5;n.ac1.red=1}
  return n;
}
const LAB_RAILS={
 v15:{n:"+15 В (управление)",def:15,parts:["C5"],load:v=>(v>9.5&&okp("IC1")?.02:.001)+(v>10&&okp("M1")?.2:0)+(v>11&&okp("RL1")?.07:0)}
};
