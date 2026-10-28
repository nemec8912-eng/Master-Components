/* Холодильник No Frost: модель работы (время ускорено) */
const FR0={v12:0,v5:0,tC:18,tE:18,ice:0,kT:30,kOpen:false,compCmd:false,defOn:false,defT:0,runT:0,defDone:0,e5:false,doorT:0,doorAl:false,
  pwr:0,c1On:false,c2On:false,rl1C:false,rl2C:false,lastTrip:-99,chatT:0,wasTv:false,emT:0};
Object.assign(st,JSON.parse(JSON.stringify(FR0)));
st.lab.rail="v12";st.lab.v=12;
BOARD.reset=()=>{Object.assign(st,JSON.parse(JSON.stringify(FR0)))};
const CASC=[
 ["D1","open","sw1",4,"Q1","short","Выбросы катушки реле без диода пробили ключ Q1 — компрессор теперь работает всегда."],
 ["D2","open","sw2",0,"Q2","short","Выбросы катушки реле оттайки пробили ключ Q2 — ТЭН греет постоянно."],
 ["Q2","short","heat",14,"F3","open","Испаритель перегрелся от постоянно включённого ТЭНа — сгорел термопредохранитель F3."],
 ["RL2","stuck","heat",14,"F3","open","Испаритель перегрелся — сгорел термопредохранитель F3."],
 ["RT1","open","hum",12,"F2","open","Клиxон сработал десятки раз и выгорел — контакты больше не замыкаются."]
];
const ERRS={E1:"E1 — неисправен датчик холодильной камеры",E2:"E2 — неисправен датчик испарителя",E5:"E5 — ошибка оттайки: испаритель не нагревается"};
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Хлопок! Короткое замыкание.":"Короткое замыкание: "+cause+".",true)}
function ntcR(T){return 5000*Math.exp(3900*(1/(T+273)-1/298))}
function ntcRead(rOK,id,T){if(!rOK)return 120;if(is(id,"open"))return -50;if(is(id,"short"))return 120;return T}
function sim(now,dt){
  const sdt=dt*st.speed;st.t+=sdt;const t=st.t;
  const mains=st.mains;
  let lab=null;
  if(st.lab.on){
    if(mains){st.lab.on=false;log("ЛБП отключён: вилка в розетке.",true);if(typeof labUi==="function")labUi()}
    else{const R=LAB_RAILS[st.lab.rail],sh=R.parts.filter(id=>is(id,"short")&&st.slot[id]!=="empty");
      let v=st.lab.v,i=0;if(sh.length){v=.12;i=st.lab.lim}else{i=R.load(v);if(i>st.lab.lim){i=st.lab.lim;v=Math.min(v,v*st.lab.lim/R.load(v))}}
      lab={rail:st.lab.rail,v,i,sh,cc:i>=st.lab.lim-1e-6}}}
  const pre=mains&&okp("F1")&&!st.fuse;
  let shortC=null;
  if(pre){
    if(is("RV1","short"))shortC="пробит варистор";
    else if(okp("T1")&&(is("BD1","short")||is("C1","short")))shortC="КЗ во вторичной цепи — трансформатор перегружен";
    else if(is("M1","short")&&st.rl1C&&okp("F2")&&!st.kOpen)shortC="пробой обмотки компрессора на корпус";
    else if(is("EH1","short")&&st.rl2C&&okp("F3"))shortC="пробой ТЭНа оттайки на корпус";}
  if(st.surge&&!shortC&&!st.lamp&&!st.surge.lamp)st.surge=null;
  if(st.lamp){if(shortC){if(!st.surge){st.surge={t0:now,cause:shortC,nets:["ac1"],lamp:1};if(!st.lampWarn){st.lampWarn=1;log("Лампа горит ярко — КЗ. Предохранитель цел.",true)}}}else if(st.surge&&now-st.surge.t0>700)st.surge=null;if(!shortC&&!st.surge)st.lampWarn=0}
  else if(!st.surge&&shortC)surgeStart(shortC,["ac1"],now);
  let surge=!!st.surge;
  if(surge&&!st.lamp&&now-st.surge.t0>(/вторичн/.test(st.surge.cause)?1500:400)){st.fuse=true;st.surge=null;surge=false;if(st.bug){st.bug=false;log("«Жучок» не сгорел — выгорела дорожка.",true)}else log("Сгорел предохранитель F1.",true)}
  const ac=pre&&!surge;
  const vr=ac&&okp("T1")&&okp("BD1")&&!is("C1","short")?17:0;
  const coils=(st.c1On?1:0)+(st.c2On?1:0);
  let v12T=vr>13&&okp("IC1")?(is("C1","dry")&&coils?8.2:12):0;
  st.v12+=(v12T-st.v12)*(1-Math.exp(-dt/.08));if(lab&&lab.rail==="v12")st.v12=lab.v;
  const v5T=st.v12>7&&okp("IC2")&&!is("C2","short")?5:0;
  st.v5+=(v5T-st.v5)*(1-Math.exp(-dt/.03));if(lab&&lab.rail==="v5")st.v5=lab.v;
  const mcu=st.v5>4.5&&okp("IC3");
  if(!st.tv||!mcu){st.e5=false;st.defOn=false;st.doorT=0;st.doorAl=false}
  if(st.tv&&!st.wasTv){st.e5=false;st.runT=0}st.wasTv=st.tv;
  // датчики
  const tCr=ntcRead(okp("R2"),"RT2",st.tC),tEr=ntcRead(okp("R3"),"RT3",st.tE);
  const e1=tCr<-40||tCr>90,e2=tEr<-40||tEr>90;
  const doorSw=okp("SW1");
  const on=mcu&&st.tv;
  if(on&&!doorSw){st.doorT+=sdt;if(st.doorT>6&&!st.doorAl){st.doorAl=true;log("Холодильник пищит: «дверь открыта».",true)}}
  // управление
  if(on){
    if(st.defOn){st.defT+=sdt;
      const end=e2?st.defT>10:(tEr>8||st.defT>16);
      if(end){st.defOn=false;st.runT=0;
        if(!e2&&tEr<=8){st.e5=true;log("Оттайка не удалась: испаритель не нагрелся. "+ERRS.E5,true)}
        else{st.defDone++;log("Оттайка закончена, лёд растаял.")}}}
    else if(st.runT>14&&!st.e5){st.defOn=true;st.defT=0;log("Началась оттайка испарителя: компрессор и вентилятор выключены, ТЭН греет.")}
    if(e1){st.emT+=sdt;st.compCmd=!st.defOn&&(st.emT%20)<10}
    else if(st.defOn)st.compCmd=false;
    else if(tCr>5)st.compCmd=true;else if(tCr<3)st.compCmd=false;
  }else st.compCmd=false;
  const err=on?(e1?"E1":(e2?"E2":(st.e5?"E5":null))):null;
  if(err&&err!==st.lastErr&&err!=="E5")log("Ошибка на дисплее: "+ERRS[err],true);st.lastErr=err;
  const fanCmd=on&&st.compCmd&&!st.defOn&&doorSw;
  // ключи и реле
  const prev1=st.c1On,prev2=st.c2On;
  st.c1On=st.v12>9&&okp("RL1")&&(is("Q1","short")||(on&&st.compCmd&&okp("R1")&&okp("Q1")));
  st.c2On=st.v12>9&&okp("RL2")&&(is("Q2","short")||(on&&st.defOn&&okp("R5")&&okp("Q2")));
  st.rl1C=st.c1On||is("RL1","stuck");st.rl2C=st.c2On||is("RL2","stuck");
  const sw1=prev1&&!st.c1On,sw2=prev2&&!st.c2On;
  if(!is("C1","dry"))st.chatT=0;else if(st.c1On!==prev1){st.chatT+=1;if(st.chatT===6)log("Реле компрессора трещит!",true)}
  // компрессор
  const pwr=ac&&st.rl1C&&okp("F2")&&!st.kOpen&&okp("M1");
  st.pwr=pwr?st.pwr+sdt:0;
  const locked=is("M1","dead")||is("RT1","open");
  const hum=pwr&&locked;
  const run=pwr&&!locked&&st.pwr>.4;
  const starting=pwr&&!locked&&(st.pwr<1.2||is("RT1","short"));
  const rs=is("RT1","short");const kTgt=hum?200:(run?(rs?170:62):25);
  st.kT+=(kTgt-st.kT)*(hum?.25:(run?(rs?.3:.12):.06))*sdt;
  const kTrip=is("F2","drift")?58:110;
  if(!st.kOpen&&st.kT>kTrip){st.kOpen=true;st.lastTrip=t;log("Щёлк! Сработал клиxон — компрессор отключён от перегрева.",true)}
  if(st.kOpen&&st.kT<(is("F2","drift")?40:55)){st.kOpen=false;log("Клиxон остыл и замкнулся.")}
  if(run)st.runT+=sdt;
  // оттайка и вентилятор
  const heat=ac&&st.rl2C&&okp("F3")&&okp("EH1");
  const fan=fanCmd&&st.v12>9&&okp("R6")&&okp("Q3")&&okp("M2");
  // тепло
  if(run)st.tE+=(-28-st.tE)*.25*sdt;
  if(heat)st.tE=Math.min(45,st.tE+5*sdt);
  if(!run&&!heat)st.tE+=(st.tC-st.tE)*.06*sdt;
  if(run)st.ice=Math.min(1,st.ice+.016*sdt);
  if(heat&&st.tE>0)st.ice=Math.max(0,st.ice-.2*sdt);
  const flow=fan?(1-.9*st.ice):.06;
  st.tC+=((st.tE-st.tC)*.05*flow+(22-st.tC)*.012+(heat?.05:0))*sdt;
  // каскады
  const flags={sw1,sw2,heat,hum};
  CASC.forEach(([id,m,cond,n,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&flags[cond]){st.casc[k]=(st.casc[k]||0)+(cond.startsWith("sw")?1:dt);if(st.casc[k]>n){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Щелчок — что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const mcuText=!mcu?(st.v12<1?"плата: нет +12 В":(st.v5<4.5?"плата: нет +5 В":"МК не работает")):(err?"МК: "+ERRS[err]:(!st.tv?"МК: выключен кнопкой":(st.defOn?"МК: оттайка":(st.compCmd?"МК: компрессор включён":"МК: камера охлаждена, пауза"))));
  const okNow=on&&!err&&!st.doorAl&&st.tC<6.5&&st.tC>.5&&t-st.lastTrip>60&&st.ice<.6&&st.chatT<3&&!hum;
  S={t,mains,pre,ac,vr,v12:st.v12,v5:st.v5,mcu,mcuText,err,on,compCmd:st.compCmd,c1On:st.c1On,c2On:st.c2On,rl1C:st.rl1C,rl2C:st.rl2C,
     run,hum,starting,kT:st.kT,kOpen:st.kOpen,heat,fan,defrost:st.defOn,ice:st.ice,tC:st.tC,tE:st.tE,tCr,tEr,doorSw,doorAl:st.doorAl,
     surge,surgeNet:{},fuse:st.fuse,lab,bulk:0,dcv:0,lampB:!st.lamp||!mains?0:(surge?1:(run?.6:.05)),
     devOK:okNow&&st.defDone>0,sbyOn:mcu,llcOut:run,pfcSw:false};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});const r=s.run||s.hum?1:0;
  const n={ac0:N(s.mains,"ac",.3+r),ac1:N(s.pre,"ac",.3),n0:N(s.mains,"ac",.3),s1:N(s.ac&&okp("T1"),"lv",.4),s2:N(s.ac&&okp("T1"),"lv",.4),vr:N(s.vr>2,"lv",.4),gnd:N(0,"lv",0),
   v12:N(s.v12>1,"vcc",.3),v5:N(s.v5>1,"vcc",.2),comp:N(s.compCmd&&s.mcu,"fb",.2),b1:N(s.c1On,"fb",.2),c1:N(s.c1On,"vcc",.3),cm:N(s.rl1C&&s.ac,"ac",r),k:N(s.rl1C&&s.ac&&okp("F2")&&!s.kOpen,"ac",r),
   st:N(s.starting,"hv",1),t1:N(s.v5>1,"fb",0),t2:N(s.v5>1,"fb",0),door:N(s.v5>1,"fb",0),def:N(s.defrost&&s.mcu,"fb",.2),fan:N(s.fan,"fb",.2),b2:N(s.c2On,"fb",.2),c2:N(s.c2On,"vcc",.3),
   hc:N(s.rl2C&&s.ac,"ac",s.heat?1:0),hf:N(s.rl2C&&s.ac&&okp("F3"),"hv",s.heat?1:0),fanb:N(s.fan,"fb",.2),fanm:N(s.fan,"vcc",.5)};
  if(s.surge){n.ac1.red=1;n.ac1.f=5;n.ac0.red=1;n.ac0.f=5}
  if(s.hum){n.k.red=1;n.cm.red=1}
  return n;
}
const LAB_RAILS={
 v12:{n:"+12 В (реле, вентилятор)",def:12,parts:[],load:v=>(v>7&&okp("IC2")?.03:.002)},
 v5:{n:"+5 В (МК, датчики)",def:5,parts:["C2"],load:v=>(v>4.5&&okp("IC3")?.02:.001)}
};
