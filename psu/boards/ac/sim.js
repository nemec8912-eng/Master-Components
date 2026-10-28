/* Плата наружного блока кондиционера: модель работы */
const AC0={bulk:0,v15:0,v5:0,rtT:25,ptcTrip:false,coil:false,rl:false,tvT:0,err:null,pfcT:0,freq:0,startT:0,runT:0,room:29,tDis:30,iin:0,wasTv:false,noBusT:0};
Object.assign(st,JSON.parse(JSON.stringify(AC0)));
st.lab.rail="v15";st.lab.v=15;
BOARD.reset=()=>{Object.assign(st,JSON.parse(JSON.stringify(AC0)))};
const CASC=[
 ["D1","short","pfcOn",.3,"Q1","short","Диод PFC пробит: при первом же включении ключа шина замкнулась через IGBT — он пробит."],
 ["M1","short","start",.5,"IC4","short","КЗ в обмотке компрессора пробило модуль IPM."],
 ["RL1","open","ptcHot",5,"RT1","open","Позистор много раз перегревался под рабочим током и треснул."],
 ["Q2","open","ptcHot",5,"RT1","open","Позистор много раз перегревался под рабочим током и треснул."]
];
const ERRS={E1:"E1 — нет связи с наружным блоком",P0:"P0 — защита модуля IPM",P1:"P1 — ненормальное напряжение шины",P2:"P2 — ошибка корректора мощности (PFC)",F3:"F3 — ошибка датчика нагнетания",P5:"P5 — компрессор не запускается"};
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Хлопок в наружном блоке!":"Короткое замыкание: "+cause+".",true)}
function ntcR50(T){return 50000*Math.exp(3950*(1/(T+273)-1/298))}
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
  const acl=pre&&okp("L1");
  st.rl=st.coil||is("RL1","stuck");
  const ptcPath=okp("RT1")&&!st.ptcTrip;
  const feed=acl&&(st.rl||ptcPath);
  const afterShort=is("BD1","short")||is("Q1","short")||is("C1","short")||is("IC4","short");
  let shortC=null;
  if(pre){
    if(is("RV1","short"))shortC="пробит варистор";
    else if(acl&&(st.rl||(st.surge&&!st.surge.lamp))&&afterShort)shortC=is("IC4","short")?"пробит модуль IPM: шина замкнута":(is("Q1","short")?"пробит IGBT корректора мощности":(is("BD1","short")?"пробит диодный мост":"пробиты конденсаторы шины"));
    else if(acl&&is("RL1","stuck")&&st.bulk<150)shortC="бросок тока заряда конденсаторов через сварившиеся контакты реле";}
  if(st.surge&&!shortC&&!st.lamp&&!st.surge.lamp)st.surge=null;
  if(st.lamp){if(shortC){if(!st.surge){st.surge={t0:now,cause:shortC,nets:["acr"],lamp:1};if(!st.lampWarn){st.lampWarn=1;log("Лампа горит ярко — КЗ. Предохранитель цел.",true)}}}else if(st.surge&&now-st.surge.t0>700)st.surge=null;if(!shortC&&!st.surge)st.lampWarn=0}
  else if(!st.surge&&shortC)surgeStart(shortC,["acr"],now);
  let surge=!!st.surge;
  if(surge&&!st.lamp&&now-st.surge.t0>400){st.fuse=true;st.surge=null;surge=false;if(st.bug){st.bug=false;log("«Жучок» не сгорел — выгорела дорожка.",true)}else log("Сгорел предохранитель F1.",true)}
  // позистор
  const shortViaPtc=feed&&!st.rl&&afterShort;
  const charging=feed&&!st.rl&&st.bulk<280;
  const loadViaPtc=feed&&!st.rl&&st.freq>5;
  const ptcHeat=shortViaPtc?90:(loadViaPtc?28:(charging?6:0));
  st.rtT+=(ptcHeat-(st.rtT-25)*.12)*sdt;
  if(!st.ptcTrip&&st.rtT>130){st.ptcTrip=true;log("Позистор RT1 раскалился и отключил ток"+(shortViaPtc?" — после него короткое замыкание.":" — через него идёт рабочий ток."),true)}
  if(st.ptcTrip&&st.rtT<70)st.ptcTrip=false;
  // шина
  const rectOK=feed&&!surge&&okp("BD1")&&!afterShort;
  const chainOK=rectOK&&okp("L2")&&!is("D1","open");
  const pfcCmd=st.pfcT>0;
  const pfc=chainOK&&pfcCmd&&okp("Q1")&&st.v15>12;
  let busT=chainOK?(pfc?380:310):0;
  if(chainOK&&is("C1","dry")&&st.freq>20)busT-=100;
  if(chainOK&&!st.rl&&st.freq>5)busT-=40;
  const tau=st.rl?.05:.35;
  st.bulk+=(busT-st.bulk)*(1-Math.exp(-sdt/(busT>st.bulk?tau:1.2)));if(!chainOK&&afterShort)st.bulk=0;
  const bus=st.bulk;
  // дежурка
  const sby=bus>150&&okp("IC1")&&okp("T1")&&okp("D2")&&!is("C2","short");
  let v15T=sby?15:0;if(sby&&is("C2","dry")&&st.freq>5)v15T=11.5;
  st.v15+=(v15T-st.v15)*(1-Math.exp(-dt/.05));if(lab&&lab.rail==="v15")st.v15=lab.sh.length?.1:lab.v;
  const v5T=st.v15>7&&okp("IC2")?5:0;st.v5+=(v5T-st.v5)*(1-Math.exp(-dt/.03));if(lab&&lab.rail==="v5")st.v5=lab.sh.length?.1:lab.v;
  const mcu=st.v5>4.5&&okp("IC3");
  st.coil=mcu&&bus>250&&st.v15>10&&okp("Q2")&&okp("RL1");
  const busRead=okp("R1")?bus:0;
  const comm=mcu&&okp("PC1")&&okp("PC2")&&okp("R2")&&okp("D3");
  const tDr=okp("R4")?(is("RT2","open")?-40:(is("RT2","short")?200:st.tDis)):200;
  // логика
  if(st.tv&&!st.wasTv){st.err=null;st.tvT=0;st.pfcT=0;st.startT=0;st.noBusT=0}
  if(!st.tv){st.err=null;st.tvT=0}
  st.wasTv=st.tv;
  const setErr=e=>{if(!st.err){st.err=e;log("Ошибка на внутреннем блоке: "+ERRS[e],true)}};
  if(st.tv){st.tvT+=sdt;if(!comm&&st.tvT>4)setErr("E1");if(comm&&st.err==="E1"){st.err=null;st.tvT=0;st.pfcT=0;st.startT=0;st.noBusT=0;log("Связь с наружным блоком восстановилась.")}}
  const work=st.tv&&comm&&!st.err;
  if(work){
    if(tDr<-30||tDr>150)setErr("F3");
    if(busRead<200&&st.tvT>1.5){st.noBusT+=sdt;if(st.noBusT>.6)setErr("P1")}else st.noBusT=0;
  }
  if(work&&!st.err&&st.tvT>1.5)st.pfcT+=sdt;else st.pfcT=0;
  if(st.pfcT>2&&busRead<350&&busRead>200&&!st.err&&!is("C1","dry")&&st.rl)setErr("P2");
  // компрессор
  const ipmOK=okp("IC4")&&okp("R3")&&st.v15>12.5;
  const startCmd=work&&!st.err&&st.pfcT>2.5;
  let run=false,jerk=false,icomp=0;
  if(startCmd){st.startT+=sdt;
    if(!okp("R3")||(st.v15<12.5&&st.v15>1))setErr("P0");
    else if(is("M1","short")||is("M1","dead")){icomp=25;if(st.startT>.8)setErr("P0")}
    else if(is("IC4","dead")||is("M1","open")||is("C3","dry")){jerk=true;icomp=3;if(st.startT>2.5)setErr("P5")}
    else if(ipmOK){run=true}}
  else st.startT=0;
  if(run){st.freq=Math.min(60,st.freq+15*sdt);st.runT+=sdt}else{st.freq=Math.max(0,st.freq-30*sdt);st.runT=0}
  if(run&&busRead<300){st.noBusT+=sdt;if(st.noBusT>1)setErr("P1")}
  if(run)icomp=st.freq/60*7;
  st.tDis+=((run?75:30)-st.tDis)*.15*sdt;
  st.room+=((run?st.room-1.5*st.freq/60:29)-st.room)*.05*sdt;st.room=Math.max(22,st.room);
  const iin=feed&&!surge?(.1+icomp*.62+(charging?1:0)):0;st.iin=iin;
  // каскады
  const flags={pfcOn:pfcCmd&&chainOK&&st.v15>12,start:startCmd,ptcHot:st.ptcTrip};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&flags[cond]){st.casc[k]=(st.casc[k]||0)+dt;if(st.casc[k]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Щелчок и запах — что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains)return;if(L.tg==="IC4"&&!run)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const err=st.err;
  const mcuText=!mcu?(st.v15<1?"плата: нет +15 В":(st.v5<4.5?"плата: нет +5 В":"МК не работает")):(err?"МК: "+ERRS[err]:(!st.tv?"МК: ожидание команды":(!comm?"МК: нет связи":(run?"МК: компрессор "+Math.round(st.freq)+" Гц":(pfcCmd?"МК: PFC, запуск компрессора…":"МК: связь есть, подготовка")))));
  S={t,mains,pre,acl,feed,rl:st.rl,coil:st.coil,rtT:st.rtT,ptcTrip:st.ptcTrip,ptcI:feed&&!st.rl,bus,busRead,pfc,pfcCmd,sby,v15:st.v15,v5:st.v5,mcu,comm,mcuText,err,run,jerk,freq:st.freq,icomp,tDr,room:st.room,iin,
     surge,surgeNet:{},fuse:st.fuse,lab,bulk:bus,dcv:bus,lampB:!st.lamp||!mains?0:(surge?1:(run?.8:.05)),
     devOK:st.tv&&run&&st.freq>55&&pfc&&!err&&bus>360&&st.rl,sbyOn:mcu,llcOut:run,pfcSw:pfc};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});const p=s.iin>.5?1:.25;
  const n={ac0:N(s.mains,"ac",p),ac1:N(s.pre,"ac",p),acl:N(s.acl,"ac",p),acr:N(s.feed,"ac",p),n0:N(s.mains,"ac",p),rect:N(s.bus>20,"hv",p),pfcn:N(s.bus>20,"hv",s.pfc?1.2:p),bus:N(s.bus>20,"hv",s.run?1:.2),
   hg:N(0,"lv",0),rlc:N(s.coil,"vcc",.3),rly:N(s.coil,"fb",.2),v15:N(s.v15>1,"vcc",.3),v5:N(s.v5>1,"vcc",.2),pfcg:N(s.pfc,"pu",.5),bsen:N(s.bus>20&&okp("R1"),"fb",0),
   tsw:N(s.sby,"hv",.5),t1s:N(s.sby,"vcc",.5),sl:N(s.mains,"ac",s.comm?.5:0),sl1:N(s.mains&&okp("R2"),"ac",.4),sl2:N(s.comm,"ac",.4),sl3:N(s.comm,"ac",.4),nl:N(s.mains,"ac",.4),rx:N(s.comm,"fb",.3),tx:N(s.comm,"fb",.3),
   pwm:N(s.run||s.jerk,"pu",.5),fo:N(s.mcu,"fb",0),td:N(s.v5>1,"fb",0),vb:N(s.v15>1,"vcc",0),ishunt:N(s.run,"hv",1),pu:N(s.run||s.jerk,"hv",1),pv:N(s.run||s.jerk,"hv",1),pw:N(s.run||s.jerk,"hv",1)};
  if(s.surge){n.acr.red=1;n.acr.f=5;n.ac1.red=1;n.ac1.f=5}
  if(s.jerk){n.pu.red=n.pv.red=n.pw.red=1}
  return n;
}
const LAB_RAILS={
 v15:{n:"+15 В (IPM, реле)",def:15,parts:["C2"],load:v=>(v>7&&okp("IC2")?.04:.002)},
 v5:{n:"+5 В (МК, датчики)",def:5,parts:[],load:v=>(v>4.5&&okp("IC3")?.03:.001)}
};
