/* Индукционная плита: модель работы */
Object.assign(st,{v18:0,v5:0,tQ:30,tGlass:25,wt:20,noPanT:0,err:null,hotLatch:false,wasTv:false});
st.lab.rail="v18";st.lab.v=18;
BOARD.reset=()=>{Object.assign(st,{v18:0,v5:0,tQ:30,tGlass:25,wt:20,noPanT:0,err:null,hotLatch:false,wasTv:false})};
const CASC=[
 ["R5","open","heat",3,"Q1","short","IGBT открывался под полным напряжением без синхронизации — пробит."],
 ["Q3","open","heat",5,"Q1","short","IGBT закрывался медленно, перегрелся и пробился."],
 ["ZD1","open","heat",6,"Q1","short","Выбросы на затворе пробили IGBT."],
 ["C3","dry","heat",8,"Q1","short","IGBT открывался не полностью, перегрелся и пробился."],
 ["C2","short","heat",.5,"Q1","short","Индуктор закорочен — ток через IGBT огромный, он пробит."],
 ["R3","open","bus",10,"Q1","short","Затвор «висел» — IGBT приоткрылся от наводки и пробился."],
 ["Q1","short","fuseq",.2,"R2","open","Вместе с IGBT сгорел резистор затвора R2."],
 ["Q1","short","fuseq",.2,"R4","open","Ток КЗ пережёг шунт R4."]
];
const ERRS={E0:"E0 — нет посуды (плата не видит ток в индукторе)",E1:"E1 — низкое напряжение сети",E3:"E3 — неисправен датчик под стеклом",E4:"E4 — неисправен датчик IGBT",E5:"E5 — перегрев IGBT"};
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Хлопок! Короткое замыкание в силовой части.":"Короткое замыкание: "+cause+".",true)}
function ntcRead(okR,id,T){if(!okR||is(id,"open"))return -40;if(is(id,"short"))return 300;return T}
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
    if(is("RV1","short"))shortC="пробит варистор";else if(is("CX1","short"))shortC="пробит конденсатор CX1";else if(is("BD1","short"))shortC="пробит диодный мост";
    else if(is("C1","short")&&okp("L2"))shortC="пробит конденсатор шины";
    else if(is("Q1","short")&&okp("L2")&&okp("L3")&&okp("BD1"))shortC="пробит IGBT: шина замкнута через индуктор";}
  if(st.surge&&!shortC&&!st.lamp&&!st.surge.lamp)st.surge=null;
  if(st.lamp){if(shortC){if(!st.surge){st.surge={t0:now,cause:shortC,nets:["bp"],lamp:1};if(!st.lampWarn){st.lampWarn=1;log("Лампа горит ярко — КЗ. Предохранитель цел.",true)}}}else if(st.surge&&now-st.surge.t0>700)st.surge=null;if(!shortC&&!st.surge)st.lampWarn=0}
  else if(!st.surge&&shortC)surgeStart(shortC,["bp"],now);
  let surge=!!st.surge;
  if(surge&&!st.lamp&&now-st.surge.t0>500){st.fuse=true;st.surge=null;surge=false;if(st.bug){st.bug=false;log("«Жучок» не сгорел — выгорела дорожка.",true)}else log("Сгорел предохранитель F1.",true)}
  const ac=pre&&!surge;
  const bus=ac&&okp("BD1")&&okp("L2")?310:0;st.bulk=0;
  // питание платы
  let v18T=bus>100&&okp("IC2")&&!is("C3","short")?18:0;
  if(v18T&&is("C3","dry")&&st.heatPrev)v18T=12;
  st.v18+=(v18T-st.v18)*(1-Math.exp(-dt/.05));if(lab&&lab.rail==="v18")st.v18=lab.v;
  let v5T=st.v18>8&&okp("IC3")&&!is("C4","short")?5:0;
  st.v5+=(v5T-st.v5)*(1-Math.exp(-dt/.03));if(lab&&lab.rail==="v5")st.v5=lab.v;
  const mcu=st.v5>4.5&&okp("IC1");
  // датчики
  const tGl=ntcRead(okp("R9"),"RT1",st.tGlass),tQr=ntcRead(okp("R10"),"RT2",st.tQ);
  const uRead=okp("R8")?bus:0;
  if(st.tv&&!st.wasTv){st.err=null;st.noPanT=0}if(!st.tv){st.err=null;st.noPanT=0}st.wasTv=st.tv;
  if(st.tQ>90)st.hotLatch=true;if(st.tQ<60)st.hotLatch=false;
  let err=null;
  if(mcu&&st.tv){if(tGl<-20||tGl>250)err="E3";else if(tQr<-20||tQr>250)err="E4";else if(uRead<150)err="E1";else if(st.hotLatch)err="E5";else if(st.err==="E0")err="E0"}
  // драйвер и контур
  const want=mcu&&st.tv&&!err;
  const drv=want&&st.v18>10&&okp("IC4")&&okp("Q2")&&okp("R2")&&!is("ZD1","short")&&okp("R6");
  const heat=drv&&okp("Q1")&&okp("L3")&&okp("C2")&&okp("R4")&&bus>150&&!surge;
  if(want&&!heat){st.noPanT+=sdt;if(st.noPanT>1.5&&st.err!=="E0"){st.err="E0";log("Плата пищит: "+ERRS.E0,true)}}else if(heat)st.noPanT=0;
  if(err&&err!==st.lastErr&&err!=="E0")log("Ошибка на дисплее: "+ERRS[err],true);st.lastErr=err;
  const pw=heat?(is("C2","dry")?.45:1):0;st.heatPrev=heat;
  const sync=okp("R5");
  const fan=mcu&&st.tv&&st.v18>10&&okp("R7")&&okp("Q4")&&okp("M1");
  st.tQ+=((heat?(fan?2:8)*(pw+(sync?0:.6)):0)-(st.tQ-30)*(fan?.15:.02))*sdt;
  st.wt=Math.min(100,st.wt+pw*2*sdt-(st.wt-20)*.003*sdt);
  st.tGlass+=((heat?st.wt+12:st.wt)-st.tGlass)*Math.min(1,sdt*.5);
  // каскады
  const flags={heat,bus:bus>150,fuseq:is("Q1","short")&&pre};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&flags[cond]){st.casc[k]=(st.casc[k]||0)+dt;if(st.casc[k]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Щелчок и запах — что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains)return;if(L.tg==="Q1"&&!heat)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const mcuText=!mcu?(st.v18<1?"плата: нет +18 В":(st.v5<4.5?"плата: нет +5 В":"МК не работает")):(err?"МК: "+ERRS[err]:(heat?"МК: нагрев P6":(st.tv?"МК: ищет посуду…":"МК: ожидание")));
  S={t,mains,pre,ac,bus,bulk:0,dcv:0,v18:st.v18,v5:st.v5,mcu,mcuText,err,drv,heat,pw,sync,fan,tQ:st.tQ,tGl,tQr,wt:st.wt,iin:heat?8.7*pw:0,
     surge,surgeNet:{},fuse:st.fuse,lab,lampB:!st.lamp||!mains?0:(surge?1:(heat?.95:.05)),
     devOK:st.tv&&mcu&&heat&&pw>.8&&fan&&!err&&sync,sbyOn:mcu,llcOut:heat,pfcSw:false};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});const h=s.heat?1.2:0;
  const n={ac0:N(s.mains,"ac",.2+h),ac1:N(s.pre,"ac",.2+h),n0:N(s.mains,"ac",.2+h),bp0:N(s.ac&&okp("BD1"),"hv",h),bp:N(s.bus>20,"hv",h),hbr:N(s.heat,"lv",h),hg:N(0,"lv",0),
   usen:N(s.bus>20&&okp("R8"),"fb",0),isen:N(s.heat,"fb",.3),col:N(s.bus>20,"hv",h),gate:N(s.drv,"pu",.5),drv:N(s.drv,"pu",.6),vce:N(s.bus>20,"fb",.2),gnd:N(0,"lv",0),
   v18:N(s.v18>1,"vcc",.3),v5:N(s.v5>1,"vcc",.2),pwm:N(s.drv,"pu",.4),fanc:N(s.fan,"fb",.2),drvin:N(s.drv,"pu",.5),pan:N(s.heat,"fb",0),t1:N(s.v5>1,"fb",0),t2:N(s.v5>1,"fb",0),
   fanm:N(s.fan,"vcc",.5),fanb:N(s.fan,"fb",.2)};
  if(s.surge){n.bp.red=1;n.bp.f=5;n.col.red=1}
  return n;
}
const LAB_RAILS={
 v18:{n:"+18 В (драйвер, вентилятор)",def:18,parts:["C3"],load:v=>(v>8&&okp("IC3")?.02:.001)},
 v5:{n:"+5 В (МК, компаратор)",def:5,parts:["C4"],load:v=>(v>4.5&&okp("IC1")?.02:.001)}
};
