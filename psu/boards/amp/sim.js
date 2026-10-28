/* Усилитель TDA7294: модель работы */
Object.assign(st,{bulk:0,vn:0,therm:false,thT:25});
st.lab.rail="vp";st.lab.v=30;
BOARD.reset=()=>{Object.assign(st,{vn:0,therm:false,thT:25})};
const CASC=[
 ["R5","open","play",15,"LS1","open","На динамик шла постоянка и перегрузка — катушка сгорела."],
 ["C9","short","on",5,"R8","open","R8 перегрелся и сгорел."]
];
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Хлопок! Короткое замыкание — ток в несколько ампер.":"Короткое замыкание: "+cause+".",true)}
function sim(now,dt){
  const sdt=dt*st.speed;st.t+=sdt;const t=st.t,F=st.F;
  const mains=st.mains;
  let lab=null;
  if(st.lab.on){
    if(mains||st.bulk>30){st.lab.on=false;log(mains?"ЛБП отключён: вилка в розетке.":"ЛБП отключён: конденсаторы фильтра заряжены.",true);if(typeof labUi==="function")labUi()}
    else{const R=LAB_RAILS[st.lab.rail],sh=R.parts.filter(id=>is(id,"short")&&st.slot[id]!=="empty");
      let v=st.lab.v,i=0;if(sh.length){v=.12;i=st.lab.lim}else{i=R.load(v);if(i>st.lab.lim){i=st.lab.lim;v=Math.min(v,v*st.lab.lim/R.load(v))}}
      lab={rail:st.lab.rail,v,i,sh,cc:i>=st.lab.lim-1e-6}}}
  const pre=mains&&okp("F1")&&!st.fuse;
  const pri=pre&&okp("T1");
  let shortC=null;
  if(pri){if(is("BD1","short"))shortC="пробит диодный мост";else if(is("C1","short")||is("C7","short"))shortC="КЗ по питанию +V";else if(is("C2","short")||is("C8","short"))shortC="КЗ по питанию −V";
    else if(is("IC1","short")&&okp("LS1")&&st.bulk>20)shortC="пробит выход TDA7294 — +35 В идёт на динамик";}
  if(st.lamp){if(shortC){if(!st.surge){st.surge={t0:now,cause:shortC,nets:["vp","vn"],lamp:1};if(!st.lampWarn){st.lampWarn=1;log("Лампа горит ярко — в усилителе КЗ. Предохранитель цел.",true)}}}else if(st.surge&&now-st.surge.t0>700)st.surge=null;if(!shortC&&!st.surge)st.lampWarn=0}
  else if(!st.surge&&shortC)surgeStart(shortC,["vp","vn"],now);
  let surge=!!st.surge;
  if(surge&&!st.lamp&&now-st.surge.t0>1300){st.fuse=true;st.surge=null;surge=false;if(st.bug){st.bug=false;if(!st.F.T1)st.F.T1="open";st.sec.T1="F1";log("«Жучок» не сгорел — перегрелся и оборвался трансформатор.",true)}else log("Сгорел предохранитель F1.",true)}
  const rect=pri&&!surge&&!is("BD1","short");
  const play=st.tv;
  const muteOK=okp("R7")&&!is("C6","short");
  const load=play?1:.1;
  // rails with ripple
  const half=is("BD1","open");
  const ripP=(half?7:1.2)*load*(is("C1","dry")?5:1),ripN=(half?7:1.2)*load*(is("C2","dry")?5:1);
  const ph=Math.sin(2*Math.PI*t*(half?.45:.9));
  let vpT=rect?35-(st.lamp&&play?4:0)-ripP*(.5+.5*ph):0,vnT=rect?-(35-(st.lamp&&play?4:0)-ripN*(.5+.5*ph)):0;
  st.bulk+=(vpT-st.bulk)*(1-Math.exp(-dt/(vpT>st.bulk?.25:(rect?.15:(play&&muteOK?2:25)))));
  st.vn+=(vnT-st.vn)*(1-Math.exp(-dt/(vnT<st.vn?.25:(rect?.15:(play&&muteOK?2:25)))));
  if(!mains&&!rect&&!lab)st.vn=-st.bulk;
  if(lab&&lab.rail==="vp")st.bulk=lab.v;if(lab&&lab.rail==="vn")st.vn=-lab.v;
  const vp=st.bulk,vn=st.vn;
  // IC
  const powered=vp>12&&vn<-12;
  const icAlive=powered&&!is("IC1","dead")&&!is("IC1","short");
  const osc=icAlive&&(is("R8","open")||is("C7","open")||is("C8","open"));
  // thermal model of the IC (thermal mute at 150 °C)
  const hot=icAlive?(osc?175:(play&&muteOK?62:40)):25;
  st.thT+=(hot-st.thT)*(1-Math.exp(-dt*st.speed/(osc?6:8)));
  if(!st.therm&&st.thT>150){st.therm=true;log("Микросхема перегрелась — сработала тепловая защита, звук пропал.",true)}
  if(st.therm&&st.thT<120){st.therm=false;log("Микросхема остыла — звук вернулся.")}
  const active=icAlive&&muteOK&&!st.therm;
  const sigIn=play;
  const inPath=okp("C3")&&okp("R4");
  let gain=1+22000/680;if(is("R6","open"))gain=1;if(is("C4","dry"))gain*=.7;
  const openLoop=is("R5","open");
  const vin=inPath&&sigIn?.5:0;
  let amp=active?vin*gain:0;
  const clipP=vp-(is("C5","dry")?9:3),clipN=-vn-3;
  if(openLoop&&active)amp=Math.min(clipP,clipN);
  const floatIn=is("R3","open")&&active;
  const dc=is("IC1","short")&&vp>20?vp-2:(openLoop&&active?(vp-3)*.4:0);
  let quality="ok",qText="звук чистый";
  if(!powered){quality="off";qText="нет питания"}
  else if(is("IC1","short")){quality="dc";qText="на выходе постоянка +"+Math.round(vp)+" В!"}
  else if(!play){quality="off";qText="сигнала нет"}
  else if(!active){quality="silent";qText=st.therm?"тепловая защита — тишина":"тишина"}
  else if(!okp("LS1")){quality="silent";qText="на выходе сигнал есть, динамик молчит"}
  else if(openLoop){quality="dist";qText="сильный хрип, выход упирается в питание"}
  else if(floatIn){quality="noise";qText="громкий гул и треск"}
  else if(vin===0){quality="silent";qText="тишина: сигнал не доходит до микросхемы"}
  else if(half||is("C1","dry")||is("C2","dry")){quality="hum";qText="фон 100 Гц, хрип на громкости"}
  else if(amp>clipP||amp>clipN||is("C5","dry")){quality="dist";qText="хрип на громкости"}
  else if(gain<5){quality="quiet";qText="очень тихо"}
  else if(is("C4","dry")){quality="quiet";qText="тише обычного, без баса"}
  else if(osc){quality="osc";qText="звук есть, микросхема греется"}
  // cascades
  const runFlags={play:play&&active,on:powered&&active};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&runFlags[cond]){st.casc[k]=(st.casc[k]||0)+dt;if(st.casc[k]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Запахло гарью — что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const icState=!powered?"IC1: нет питания ±35 В":(is("IC1","dead")?"IC1: не работает":(!muteOK?"IC1: MUTE/STBY — дежурный режим":(st.therm?"IC1: ТЕПЛОВАЯ ЗАЩИТА":(play?"IC1: усиливает сигнал":"IC1: работает, сигнала нет"))));
  const acI=surge?(st.lamp?1:5)*Math.sign(Math.sin(t*6)||1):(rect?(play?1.2:.4)*Math.sign(Math.sin(2*Math.PI*t*.45)):0);
  S={t,mains,pre,pri,rect,vp,vn,bulk:vp,powered,active,play,sigIn,vin,gain,amp,clipP,clipN,dc,osc,floatIn,openLoop,half,quality,qText,icState,therm:st.therm,surge,surgeNet:{},fuse:st.fuse,lab,acI,
     lampB:!st.lamp||!mains?0:(surge?1:(play&&active?.18:.04)),
     devOK:play&&quality==="ok"&&okp("LS1")&&okp("LED1")&&okp("R2")&&!is("C6","dry"),sbyOn:powered,llcOut:active,pfcSw:false};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});
  const n={ac0:N(s.mains,"ac",s.acI),ac1:N(s.pre,"ac",s.acI),n0:N(s.mains,"ac",s.acI),s1:N(s.pri,"ac",s.acI),s2:N(s.pri,"ac",s.acI),
   vp:N(s.vp>2,"hv",s.active&&s.play?.8:.1),vn:N(s.vn<-2,"hv",s.active&&s.play?-.8:-.1),jin:N(s.play,"fb",.6),c3b:N(s.play&&okp("C3"),"fb",.6),inp:N(s.vin>0,"fb",.6),
   inm:N(s.active&&s.play,"fb",.4),ms:N(s.vp>5&&okp("R7"),"fb",0),boot:N(s.active,"pu",0),out:N(s.active&&s.amp>0||s.dc>1,"lv",s.amp>0?1.2:0),cg:N(0,"lv",0)};
  if(s.surge){n.vp.red=1;n.vn.red=1;n.vp.f=5;n.vn.f=-5}
  return n;
}
const LAB_RAILS={
 vp:{n:"+V (плюс питания микросхемы)",def:30,parts:["C1","C7","IC1"],load:v=>v/3300*(okp("R2")&&okp("LED1")?1:0)+.0005},
 vn:{n:"−V (минус питания микросхемы)",def:30,parts:["C2","C8"],load:v=>.0005}
};
