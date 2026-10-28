/* Микроволновая печь: модель работы */
const PROG=15;
Object.assign(st,{v12:0,v5:0,doorUntil:1.5,running:false,left:0,ended:false,goodRun:false,badRun:false,wt:20,wt0:20,hotT:0,selfSeen:false,rstT:-1e9,wasTv:false,mcuWas:false});
st.lab.rail="v12";st.lab.v=12;
BOARD.reset=()=>{Object.assign(st,{v12:0,v5:0,doorUntil:st.t+1.5,running:false,left:0,ended:false,goodRun:false,badRun:false,wt:20,wt0:20,hotT:0,selfSeen:false,rstT:-1e9,wasTv:false,mcuWas:false})};
const CASC=[
 ["C3","short","t1",1,"F4","open","Высоковольтный предохранитель F4 сгорел от тока через пробитый C3."],
 ["D4","short","t1",1,"F4","open","F4 сгорел: пробитый диод замкнул конденсатор."],
 ["MG1","short","t1",1,"F4","open","F4 сгорел: пробой магнетрона на корпус."],
 ["M2","open","mgHot",6,"F2","open","Магнетрон перегрелся без вентилятора — сработал термопредохранитель F2."],
 ["RL2","open","mgHot",6,"F2","open","Магнетрон перегрелся без вентилятора — сработал F2."],
 ["R2","open","mgHot",6,"F2","open","Магнетрон перегрелся без вентилятора — сработал F2."],
 ["Q2","open","mgHot",6,"F2","open","Магнетрон перегрелся без вентилятора — сработал F2."],
 ["D2","open","coil1",2,"Q1","short","Выброс катушки реле пробил Q1 — магнетрон теперь включается сам."],
 ["D3","open","coil2",2,"Q2","open","Выброс катушки RL2 пробил и оборвал Q2."],
 ["BD1","short","board",3,"T2","open","Трансформатор платы перегрелся — сгорел его встроенный термопредохранитель."]
];
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Гул и щелчок! Короткое замыкание.":"Короткое замыкание: "+cause+".",true)}
function sim(now,dt){
  const sdt=dt*st.speed;st.t+=sdt;const t=st.t,F=st.F;
  const mains=st.mains;
  let lab=null;
  if(st.lab.on){
    if(mains||st.bulk>30){st.lab.on=false;log(mains?"ЛБП отключён: вилка в розетке.":"ЛБП отключён: на C3 опасное напряжение.",true);if(typeof labUi==="function")labUi()}
    else{const R=LAB_RAILS[st.lab.rail],sh=R.parts.filter(id=>is(id,"short")&&st.slot[id]!=="empty");
      let v=st.lab.v,i=0;if(sh.length){v=.12;i=st.lab.lim}else{i=R.load(v);if(i>st.lab.lim){i=st.lab.lim;v=Math.min(v,v*st.lab.lim/R.load(v))}}
      lab={rail:st.lab.rail,v,i,sh,cc:i>=st.lab.lim-1e-6}}}
  if(st.tv!==st.wasTv){if(!st.tv)st.doorUntil=t+1.5;else{st.ended=false;st.goodRun=false}st.wasTv=st.tv}
  if(!mains)st.doorUntil=Math.max(st.doorUntil,0);
  const door=t<st.doorUntil;
  const pre=mains&&okp("F1")&&!st.fuse;
  // control board
  const board=pre&&okp("T2");
  let v12T=board&&!is("C1","short")?12.5:0;
  st.v12+=(v12T-st.v12)*(1-Math.exp(-dt/.05));if(lab&&lab.rail==="v12")st.v12=lab.v;
  let v5T=st.v12>8&&okp("IC2")&&!is("C2","short")?5:0;
  st.v5+=(v5T-st.v5)*(1-Math.exp(-dt/.03));if(lab&&lab.rail==="v5")st.v5=lab.v;
  const mcuOn=st.v5>4.5&&okp("IC1")&&okp("ZQ1");
  // switches and mains path
  const sw1=(!door&&okp("SW1"))||is("SW1","stuck"),sw2=!door&&okp("SW2"),sw3=door||is("SW3","stuck");
  const acA=pre&&okp("F3"),acS=acA&&sw1;
  // program
  const glitch=is("C1","dry")&&st.running&&Math.sin(t*1.9)>.96;
  if(mcuOn&&glitch&&now-st.rstT>1500){st.rstT=now;st.running=false;log("Плата перезагрузилась: просело питание при включении реле.",true)}
  const mcu=mcuOn&&now-st.rstT>600;
  if(!mcu){st.running=false}
  if(st.tv&&mcu&&!door&&!st.running&&!st.ended&&now-st.rstT>600){st.running=true;st.left=PROG;st.wt0=st.wt;st.badRun=false}
  if(door||!st.tv)st.running=false;
  const mgCmd=mcu&&st.running,fanCmd=mgCmd;
  const coil1=((mgCmd&&okp("R1")&&!is("Q1","open"))||is("Q1","short"))&&okp("RL1")&&st.v12>9;
  const relayHot=coil1||is("RL1","stuck");
  const coil2=fanCmd&&okp("R2")&&okp("Q2")&&okp("RL2")&&st.v12>9;
  const fanOn=coil2;
  // shorts
  let shortC=null;
  if(acS&&sw3)shortC="контрольный выключатель SW3 замкнул сеть";
  const t1Pre=acS&&relayHot&&okp("F2")&&sw2;
  if(!shortC&&t1Pre&&is("T1","short"))shortC="межвитковое замыкание в трансформаторе T1";
  if(st.lamp){if(shortC){if(!st.surge){st.surge={t0:now,cause:shortC,nets:["acS"],lamp:1};if(!st.lampWarn){st.lampWarn=1;log("Лампа горит ярко — КЗ. Предохранитель цел.",true)}}}else if(st.surge&&now-st.surge.t0>700)st.surge=null;if(!shortC&&!st.surge)st.lampWarn=0}
  else if(!st.surge&&shortC)surgeStart(shortC,["acS"],now);
  if(st.surge&&!shortC&&!st.lamp&&!st.surge.lamp)st.surge=null;
  let surge=!!st.surge;
  if(surge&&!st.lamp&&now-st.surge.t0>(shortC&&shortC.includes("SW3")?150:900)){st.fuse=true;st.surge=null;surge=false;if(st.bug){st.bug=false;log("«Жучок» не сгорел — сгорели контакты SW1.",true)}else log("Сгорел предохранитель F1.",true)}
  const t1On=t1Pre&&!surge&&!st.fuse&&okp("F1");
  // high voltage
  const hvShort=is("C3","short")||is("D4","short")||is("MG1","short");
  const hvOK=t1On&&okp("T1")&&okp("F4")&&okp("C3")&&okp("D4")&&!is("MG1","open")&&!hvShort;
  let pw=hvOK?(is("MG1","dead")?.15:(is("C3","dry")?.5:1)):0;
  const mgOn=pw>0;
  const hvT=hvOK?4000:0;
  if(hvT>st.bulk)st.bulk+=(hvT-st.bulk)*(1-Math.exp(-dt/.05));else st.bulk*=Math.exp(-dt/(okp("R3")?1:900));
  // loads
  const coolOn=fanOn&&acS&&!surge&&okp("M2"),plateOn=fanOn&&acS&&!surge&&okp("M1"),lampOn=fanOn&&acS&&!surge;
  st.wt+=(pw*1.7-(st.wt-20)*.004)*sdt;if(st.wt>100)st.wt=100;
  if(mgOn&&!coolOn)st.hotT+=dt;else st.hotT=Math.max(0,st.hotT-dt*.3);
  // program bookkeeping
  if(st.running){st.left-=sdt;if(!(mgOn&&pw>.8&&coolOn&&plateOn))st.badRun=true;
    if(st.left<=0){st.running=false;st.ended=true;st.goodRun=!st.badRun&&st.wt-st.wt0>15;log(st.goodRun?"Сигнал «готово»: вода горячая.":"Сигнал «готово», но вода почти не нагрелась.",!st.goodRun)}}
  const selfRun=t1On&&!mgCmd;
  if(selfRun)st.selfSeen=true;
  if(!(is("Q1","short")||is("RL1","stuck")))st.selfSeen=false;
  // cascades
  const flags={t1:t1On,mgHot:mgOn&&!coolOn,coil1:coil1&&mgCmd,coil2:coil2,board:board};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&flags[cond]){st.casc[k]=(st.casc[k]||0)+dt;if(st.casc[k]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Щелчок — похоже, что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const mcuText=!mcuOn?(st.v12<1?"плата: нет питания 12 В":(st.v5<4.5?"плата: нет 5 В":"МК не работает (кварц или МК)")):(!mcu?"МК перезапускается…":(st.running?"МК: разогрев, осталось "+Math.ceil(st.left*2)+" с":(st.ended?"МК: End":"МК: ожидание")));
  const hum=t1On&&(hvShort||is("MG1","dead")||is("T1","short"));
  S={t,mains,pre,ac:acA,door,sw1,sw2,sw3,acS,board,v12:st.v12,v5:st.v5,mcu,mcuOn,mcuText,mgCmd,fanCmd,coil1,coil2,relayHot,fanOn,t1On,hvOK,pw,mgOn,bulk:st.bulk,dcv:st.bulk,
     coolOn,plateOn,lampOn,wt:st.wt,running:st.running,left:st.left,ended:st.ended,goodRun:st.goodRun,selfRun,hum,surge,surgeNet:{},fuse:st.fuse,lab,
     lampB:!st.lamp||!mains?0:(surge?1:(t1On?.95:(lampOn?.2:.04))),
     devOK:st.tv&&mcu&&!door&&!st.selfSeen&&okp("R3")&&now-st.rstT>3000&&(st.running?(mgOn&&pw>.8&&coolOn&&plateOn):st.goodRun),
     winReady:st.ended&&st.goodRun,sbyOn:board,llcOut:t1On,pfcSw:false};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});const ld=(s.t1On?1.4:0)+(s.lampOn?.4:0);
  const n={ac0:N(s.mains,"ac",.3+ld),ac1:N(s.pre,"ac",.3+ld),acA:N(s.ac,"ac",ld),acS:N(s.acS,"ac",ld),n0:N(0,"lv",0),fanL:N(s.lampOn,"ac",.5),rc2:N(s.coil2,"vcc",.4),
   acR:N(s.acS&&s.relayHot,"ac",s.t1On?1.4:0),acM:N(s.acS&&s.relayHot&&okp("F2"),"ac",s.t1On?1.4:0),t1n:N(s.t1On,"ac",1.4),rc1:N(s.coil1,"vcc",.4),
   hv:N(s.t1On,"hv",s.mgOn?1.2:.2),hv2:N(s.t1On&&okp("F4"),"hv",s.mgOn?1.2:.2),hvk:N(s.bulk>30,"hv",s.mgOn?1.2:0),hvg:N(0,"lv",0),fil:N(s.t1On,"vcc",.6),
   lv1:N(s.board,"ac",.3),lv2:N(s.board,"ac",.3),gnd:N(0,"lv",0),v12:N(s.v12>1,"vcc",.3),v5:N(s.v5>1,"vcc",.2),osc:N(s.mcuOn,"pu",0),
   mgc:N(s.mgCmd,"fb",.3),fanc:N(s.fanCmd,"fb",.3),qb1:N(s.mgCmd&&okp("R1"),"fb",.3),qb2:N(s.fanCmd&&okp("R2"),"fb",.3)};
  if(s.surge){n.acS.red=1;n.acS.f=5;n.n0.red=1;n.n0.on=true;n.n0.f=5}
  return n;
}
const LAB_RAILS={
 v12:{n:"+12 В (реле)",def:12,parts:["C1"],load:v=>(v>9?.01:0)+(v>7&&okp("IC2")?.03:.001)},
 v5:{n:"+5 В (микроконтроллер)",def:5,parts:["C2"],load:v=>(v>4.5&&okp("IC1")?.03:.001)}
};
