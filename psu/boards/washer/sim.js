/* Плата стиральной машины: модель работы и программа стирки */
Object.assign(st,{bulk:0,v12:0,v5:0,ph:"idle",pt:0,err:null,wt:20,wl:0,wasTv:false,rstT:-9,mcuWas:false,tRise0:20});
st.lab.rail="v12";st.lab.v=12;
BOARD.reset=()=>{Object.assign(st,{v12:0,v5:0,ph:"idle",pt:0,err:null,wt:20,wl:0,wasTv:false,rstT:-9,mcuWas:false,tRise0:20})};
const CASC=[
 ["D4","open","coil",2,"Q1","short","Выброс катушки реле пробил транзистор Q1 — ТЭН теперь включён всегда."],
 ["C8","short","mains",5,"R7","open","R7 перегрелся и сгорел."],
 ["D1","short","mains",1,"C1","short","Переменное напряжение пробило электролит C1."],
 ["D3","open","lnk",15,"IC2","dead","Стабилизатор 78L05 перегрелся от 24 В и сгорел."],
 ["R1","open","lnk",15,"IC2","dead","Стабилизатор 78L05 перегрелся от 24 В и сгорел."]
];
const ERR={dE:"dE — дверь не заблокирована",HE:"HE — ошибка нагрева воды",HOT:"HE — перегрев: ТЭН греет без команды","5E":"5E — вода не сливается","1E":"1E — не набирается вода",tE:"tE — неисправен датчик температуры"};
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Хлопок! На плате короткое замыкание.":"Короткое замыкание: "+cause+".",true)}
function ntcR(T){return 20000*Math.exp(3950*(1/(T+273)-1/298))}
function sim(now,dt){
  const sdt=dt*st.speed;st.t+=sdt;const t=st.t,F=st.F;
  const mains=st.mains;
  let lab=null;
  if(st.lab.on){
    if(mains||st.bulk>30){st.lab.on=false;log(mains?"ЛБП отключён: вилка в розетке.":"ЛБП отключён: на C1 опасное напряжение.",true);if(typeof labUi==="function")labUi()}
    else{const R=LAB_RAILS[st.lab.rail],sh=R.parts.filter(id=>is(id,"short")&&st.slot[id]!=="empty");
      let v=st.lab.v,i=0;if(sh.length){v=.12;i=st.lab.lim}else{i=R.load(v);if(i>st.lab.lim){i=st.lab.lim;v=Math.min(v,v*st.lab.lim/R.load(v))}}
      lab={rail:st.lab.rail,v,i,sh,cc:i>=st.lab.lim-1e-6}}}
  const pre=mains&&okp("F1")&&!st.fuse;
  let shortC=null;
  if(pre){if(is("RV1","short"))shortC="пробит варистор";else if(is("C1","short")&&!is("D1","open"))shortC="пробит C1";else if(is("IC1","short")&&okp("L1"))shortC="пробит ключ LNK304";}
  if(st.lamp){if(shortC){if(!st.surge){st.surge={t0:now,cause:shortC,nets:["dc"],lamp:1};if(!st.lampWarn){st.lampWarn=1;log("Лампа горит ярко — на плате КЗ. Предохранитель цел.",true)}}}else if(st.surge&&now-st.surge.t0>700)st.surge=null;if(!shortC&&!st.surge)st.lampWarn=0}
  else if(!st.surge&&shortC)surgeStart(shortC,["dc"],now);
  if(st.surge&&!shortC&&!st.lamp&&!st.surge.lamp)st.surge=null;
  let surge=!!st.surge;
  if(surge&&!st.lamp&&now-st.surge.t0>1000){st.fuse=true;st.surge=null;surge=false;if(st.bug){st.bug=false;log("«Жучок» не сгорел — выгорела дорожка у моста.",true)}else log("Сгорел предохранитель F1.",true)}
  const ac=pre&&!surge;
  // C1 300 V (half-wave)
  const dry1=is("C1","dry");
  let bT=ac&&okp("D1")?(is("D1","short")?0:(dry1&&Math.sin(2*Math.PI*t*.2)>.75?150:300)):0;
  st.bulk+=(bT-st.bulk)*(1-Math.exp(-dt/(bT>st.bulk?.15:(dry1?.15:(st.v12>5?2:20)))));
  // LNK304 buck
  const lnk=st.bulk>90&&!F.IC1&&!F.C3&&okp("D2")&&!is("D2","short")&&okp("L1")&&!is("C4","short");
  let v12T=0;
  if(lnk){v12T=12;if(is("R1","open")||is("D3","open"))v12T=24;else if(is("C5","dry"))v12T=15;else if(is("R2","open"))v12T=8;if(dry1&&st.bulk<260)v12T=6}
  st.v12+=(v12T-st.v12)*(1-Math.exp(-dt/.05));
  if(is("C4","dry")&&lnk)st.v12=v12T-1.5*(Math.sin(t*13)>.7?1:0);
  if(lab&&lab.rail==="v12")st.v12=lab.v;
  // 5 V
  let v5T=st.v12>7&&!is("IC2","dead")&&!is("C6","short")?5:0;
  st.v5+=(v5T-st.v5)*(1-Math.exp(-dt/.03));
  if(lab&&lab.rail==="v5")st.v5=lab.v;
  // MCU
  const glitch=(is("C6","dry")&&Math.sin(t*1.7)>.97)||(is("R3","open")&&Math.sin(t*2.3)>.98)||(is("C4","dry")&&lnk&&Math.sin(t*1.3)>.985)||(dry1&&st.bulk<260&&st.v12<7);
  const mcuOn=st.v5>4.5&&!is("IC3","dead")&&!is("ZQ1","dead")&&!is("C7","short");
  if(mcuOn&&glitch&&now-st.rstT>1500){st.rstT=now;st.ph="boot";st.pt=0;log("Микроконтроллер перезагрузился (сбой питания).",true)}
  const mcu=mcuOn&&now-st.rstT>600;
  if(!mcu&&st.mcuWas){st.ph="idle";st.pt=0}st.mcuWas=mcu;
  if(st.ph==="boot"&&mcu)st.ph="idle";
  // temperature reading
  let tRead;
  if(!okp("RT1")||is("R10","open"))tRead=-40;else if(is("RT1","short")||is("C9","short"))tRead=150;else tRead=st.wt;
  const tBad=tRead<-30||tRead>120;
  // program
  if(!st.tv){if(st.ph!=="idle"&&st.ph!=="boot"){st.ph="idle";st.pt=0;st.err=null}}
  if(st.tv&&!st.wasTv)st.err=null;st.wasTv=st.tv;
  if(mcu&&st.tv&&st.ph==="idle"&&!st.err){st.ph=tBad?"err":"lock";st.pt=0;if(tBad)st.err="tE"}
  if(mcu&&st.ph!=="idle")st.pt+=sdt;
  const P_=st.ph;
  const heatCmd=mcu&&P_==="heat",pumpCmd=mcu&&P_==="drain",lockCmd=mcu&&["lock","fill","heat","wash","drain"].includes(P_);
  const coilDrive=heatCmd&&okp("R4")&&st.v12>9&&!is("Q1","open");
  const coil=(coilDrive||is("Q1","short"))&&okp("RL1")&&st.v12>9&&ac;
  const heaterOn=ac&&(coil||is("RL1","stuck"));
  const pumpOn=ac&&((pumpCmd&&okp("R5")&&okp("U1")&&okp("R6")&&!is("TR1","open"))||is("TR1","short"));
  const lockOn=ac&&((lockCmd&&okp("R8")&&!is("TR2","open"))||is("TR2","short"));
  const lockSensed=lockOn&&okp("R9");
  // water
  const fillOn=mcu&&P_==="fill";
  st.wl=Math.max(0,Math.min(100,st.wl+(fillOn?40:0)*sdt-(pumpOn?35:0)*sdt));
  const heatRate=heaterOn?(st.wl>20?6:14):0;
  st.wt+=(heatRate-(st.wt-20)*.05)*sdt;
  // phase transitions
  if(mcu&&!st.err){
    if(heaterOn&&!heatCmd&&st.wt>80){st.err="HOT"}
    else if(P_==="lock"){if(lockSensed&&st.pt>1)st.ph="fill",st.pt=0;else if(st.pt>4)st.err="dE"}
    else if(P_==="fill"){if(st.wl>=95)st.ph="heat",st.pt=0,st.tRise0=st.wt;else if(st.pt>6)st.err="1E"}
    else if(P_==="heat"){if(tRead>=40)st.ph="wash",st.pt=0;else if(st.pt>7&&tRead-st.tRise0<5)st.err="HE"}
    else if(P_==="wash"){if(st.pt>3)st.ph="drain",st.pt=0}
    else if(P_==="drain"){if(st.wl<5)st.ph="end",st.pt=0;else if(st.pt>5&&st.wl>50)st.err="5E"}
    if(tBad&&P_!=="idle")st.err="tE";
    if(st.err){st.ph="err";st.pt=0;log("Ошибка на дисплее: "+ERR[st.err],true)}
  }
  // cascades
  const runFlags={coil:coil,mains:ac,lnk:lnk&&st.v12>20};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&runFlags[cond]){st.casc[k]=(st.casc[k]||0)+dt;if(st.casc[k]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Щелчок и запах гари — похоже, что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const sw=lnk?sq(t*1.6,.35):0;
  const mcuText=!mcuOn?(st.v5<4.5?"МК: нет питания 5 В":(is("ZQ1","dead")?"МК: нет тактовой частоты":(is("C7","short")?"МК: держится в сбросе":"МК: не работает"))):(!mcu?"МК: перезагрузка…":"МК: работает, этап — "+({idle:"ожидание",boot:"запуск",lock:"блокировка двери",fill:"набор воды",heat:"нагрев",wash:"стирка",drain:"слив",end:"конец",err:"ОШИБКА"}[st.ph]));
  const disp=!mcu?"":(st.err?st.err==="HOT"?"HE":st.err:({idle:st.tv?"…":"--",boot:"88",lock:"0:45",fill:"0:42",heat:"0:38",wash:"0:20",drain:"0:05",end:"End"}[st.ph]||""));
  const doorStuck=st.ph==="end"&&lockOn;
  S={t,mains,pre,ac,dcv:st.bulk,bulk:st.bulk,chg:ac&&okp("D1")&&Math.sin(2*Math.PI*t*.45)>.85,lnk,sw,v12:st.v12,v5:st.v5,mcu,mcuOn,mcuText,ph:st.ph,err:st.err,disp,tRead,wt:st.wt,wl:st.wl,
     heatCmd,pumpCmd,lockCmd,coil,heaterOn,pumpOn,lockOn,lockSensed,doorStuck,surge,surgeNet:{},fuse:st.fuse,lab,
     lampB:!st.lamp||!mains?0:(surge?1:(heaterOn?.9:(pumpOn?.2:.05))),
     devOK:st.tv&&mcu&&!st.err&&st.v12>11&&st.v12<13&&!(is("Q1","short")||is("RL1","stuck")||is("TR1","short"))&&!doorStuck&&now-st.rstT>3000&&!is("C8","short"),
     winReady:st.ph==="end",sbyOn:lnk,llcOut:mcu,pfcSw:false};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});
  const n={ac0:N(s.mains,"ac",s.chg?1:.2),ac1:N(s.pre,"ac",s.chg?1:.2),dc:N(s.dcv>20,"hv",s.lnk&&s.sw>0?1:0),bp:N(s.lnk,"vcc",0),sw:N(s.lnk,"hv",s.sw*1.2),fbk:N(s.lnk,"fb",0),smp:N(s.lnk,"fb",0),
   v12:N(s.v12>1,"vcc",s.coil?.8:.2),v5:N(s.v5>1,"vcc",.3),rst:N(s.v5>1,"fb",0),osc:N(s.mcuOn,"pu",0),
   heat:N(s.heatCmd,"fb",.4),qb:N(s.heatCmd&&okp("R4"),"fb",.4),rlc:N(s.coil,"vcc",.8),hot:N(s.heaterOn,"ac",1.4),lph:N(s.ac,"ac",(s.heaterOn?1.4:0)+(s.pumpOn?.6:0)+(s.lockOn?.3:0)),
   temp:N(s.v5>1,"fb",0),pumpc:N(s.pumpCmd,"fb",.4),u1a:N(s.pumpCmd&&okp("R5"),"fb",.4),mt2p:N(s.ac,"ac",s.pumpOn?.8:0),tr1g:N(s.pumpOn,"pu",.3),
   lockc:N(s.lockCmd,"fb",.4),tr2g:N(s.lockCmd&&okp("R8"),"pu",.3),lockn:N(s.ac,"ac",s.lockOn?.4:0),lsens:N(s.lockSensed,"fb",0),gnd:N(0,"lv",0)};
  if(s.surge){n.dc.red=1;n.dc.f=5;n.ac1.red=1}
  return n;
}
const LAB_RAILS={
 v12:{n:"+12 В (питание реле и 78L05)",def:12,parts:["C4"],load:v=>(v>7&&!is("IC2","dead")?.025:0)+.001},
 v5:{n:"+5 В (питание микроконтроллера)",def:5,parts:["C6"],load:v=>(v>4.5&&!is("IC3","dead")?.02:.001)}
};
