/* Драйвер LED-подсветки: модель работы */
Object.assign(st,{bulk:24,vin:0,vout:0,vcc:0,prot:false,protT:0,iA:0,iB:0,wasTv:false});
st.lab.rail="vin";st.lab.v=24;
BOARD.reset=()=>{Object.assign(st,{vin:0,vout:0,vcc:0,prot:false,protT:0,iA:0,iB:0,wasTv:false})};
const CASC=[
 ["D1","open","run",2.5,"Q1","short","Энергии дросселя некуда было уйти — выброс пробил Q1."],
 ["Q2","short","lit",10,"LB1","open","Ток цепочки A не ограничен — светодиод в линейке LB1 перегрелся и сгорел."],
 ["Q3","short","lit",10,"LB3","open","Ток цепочки B не ограничен — светодиод в линейке LB3 перегрелся и сгорел."],
 ["LB1","short","lit",20,"LB2","open","Соседние светодиоды цепочки A работали с перегрузкой — сгорел светодиод в LB2."],
 ["LB2","short","lit",20,"LB1","open","Сгорел светодиод в LB1 от перегрузки."],
 ["LB3","short","lit",20,"LB4","open","Сгорел светодиод в LB4 от перегрузки."],
 ["LB4","short","lit",20,"LB3","open","Сгорел светодиод в LB3 от перегрузки."]
];
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Щелчок! Блок питания на секунду ушёл в защиту — в подсветке короткое замыкание.":"Короткое замыкание: "+cause+".",true)}
function sim(now,dt){
  const sdt=dt*st.speed;st.t+=sdt;const t=st.t,F=st.F;
  const supply=st.mains;
  // lab PSU
  let lab=null;
  if(st.lab.on){
    if(supply){st.lab.on=false;log("ЛБП отключён: на плату подано 24 В от блока питания.",true);if(typeof labUi==="function")labUi()}
    else{const R=LAB_RAILS[st.lab.rail],sh=R.parts.filter(id=>is(id,"short")&&st.slot[id]!=="empty");
      let v=st.lab.v,i=0;if(sh.length){v=.12;i=st.lab.lim}else{i=R.load(v);if(i>st.lab.lim){i=st.lab.lim;v=Math.min(v,v*st.lab.lim/R.load(v))}}
      lab={rail:st.lab.rail,v,i,sh,cc:i>=st.lab.lim-1e-6}}}
  const fuseOK=okp("F1")&&!st.fuse;
  // short circuits on the 24 V bus
  let shortC=null;
  if(supply&&fuseOK){if(is("C1","short"))shortC="пробит C1";else if(is("Q1","short")&&okp("L1"))shortC="пробит ключ Q1";else if(is("C4","short")&&okp("L1")&&!is("D1","open"))shortC="пробит C4";}
  if(!st.surge&&shortC)surgeStart(shortC,["vin","sw"],now);
  let surge=!!st.surge;
  if(surge&&now-st.surge.t0>900){st.fuse=true;st.surge=null;surge=false;
    if(st.bug){st.bug=false;log("«Жучок» не сгорел: выгорела дорожка шины 24 В, блок питания ушёл в защиту.",true)}else log("Сгорел предохранитель подсветки F1.",true)}
  let vinT=supply&&fuseOK&&!surge?24:0;
  st.vin+=(vinT-st.vin)*(1-Math.exp(-dt/.05));
  if(lab&&lab.rail==="vin")st.vin=lab.v;
  st.bulk=st.vin;
  // IC supply 12 V from R1 + ZD1
  let vccT=st.vin>13&&okp("R1")&&!is("ZD1","short")?12:(st.vin>1&&okp("R1")&&!is("ZD1","short")?st.vin*.9:0);
  if(is("C2","dry")&&st.run0)vccT*= (Math.sin(t*9)>.6?.6:1);
  st.vcc+=(vccT-st.vcc)*(1-Math.exp(-dt/.04));
  if(lab&&lab.rail==="vcc")st.vcc=lab.v;
  // enable & dimming
  if(st.tv&&!st.wasTv){st.prot=false;st.protT=0}st.wasTv=st.tv;
  const en=st.tv&&okp("R2"),dim=st.tv&&okp("R4");
  const icOK=st.vcc>9&&!is("IC1","dead")&&okp("R10")&&!is("C5","short");
  const ovpFalse=is("R8","open");
  const active=icOK&&en&&dim&&!st.prot&&!surge;
  const drv=okp("R5")&&!is("Q1","open")&&okp("R6")&&okp("L1");
  const run=active&&drv&&st.vin>15;
  st.run0=run;
  // strings
  const chainA=okp("LB1")&&okp("LB2")&&!is("Q2","open")&&okp("R11"),chainB=okp("LB3")&&okp("LB4")&&!is("Q3","open")&&okp("R12");
  const shortA=is("Q2","short"),shortB=is("Q3","short");
  const d1ok=!is("D1","open");
  let voT=0;
  if(run&&d1ok){voT=is("D1","short")?st.vin:(chainA&&chainB?(108-(is("LB1","short")||is("LB2","short")?6:0)):138);}
  else if(st.vin>1&&okp("L1")&&d1ok)voT=Math.max(0,st.vin-.5);
  if(is("C4","dry")&&run)voT+=6*Math.sin(t*31);
  st.vout+=(voT-st.vout)*(1-Math.exp(-dt/(voT>st.vout?.15:.3)));
  const lit=run&&st.vout>95;
  let iAT=lit&&chainA?(shortA?.6:.35):0,iBT=lit&&chainB?(shortB?.6:.35):0;
  if(is("C4","dry")&&lit){iAT*=1+.15*Math.sin(t*31);iBT*=1+.15*Math.sin(t*31)}
  st.iA+=(iAT-st.iA)*(1-Math.exp(-dt/.05));st.iB+=(iBT-st.iB)*(1-Math.exp(-dt/.05));
  // protection: open string / false OVP / D1 short (overcurrent)
  const fault=run&&(!chainA||!chainB||ovpFalse||is("D1","short"));
  if(fault){st.protT+=dt;if(st.protT>(ovpFalse?.25:1.4)&&!st.prot){st.prot=true;log((game.on&&!game.reveal)?"Подсветка погасла: сработала защита контроллера.":"Сработала защита IC1: "+(ovpFalse?"ложное перенапряжение (R8)":is("D1","short")?"перегрузка по току":"обрыв цепочки светодиодов")+".",true)}}else st.protT=0;
  // cascades
  const runFlags={run:run,lit:lit&&!st.prot};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&runFlags[cond]){st.casc[k]=(st.casc[k]||0)+dt;if(st.casc[k]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Подсветка мигнула и погасла — похоже, что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!supply)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const sw=run?sq(t*1.5,.45):0;
  const icState=st.vcc<9?"IC1: нет питания VCC":(!st.tv?"IC1: ждёт BL_ON (ТВ выключен)":(!en?"IC1: нет сигнала BL_ON":(!dim?"IC1: нет сигнала DIM":(!icOK?"IC1: не работает":(st.prot?"IC1: ЗАЩИТА — подсветка выключена":(run?"IC1: работает":"IC1: нет раскачки ключа"))))));
  S={t,mains:supply,vin:st.vin,bulk:st.vin,vcc:st.vcc,en,dim,icOK,run,sw,vout:st.vout,iA:st.iA,iB:st.iB,lit,prot:st.prot,surge,surgeNet:{},fuse:st.fuse,lab,icState,
     uneven:lit&&(shortA||shortB||is("LB1","short")||is("LB2","short")||is("LB3","short")||is("LB4","short")),flick:lit&&(is("C4","dry")||is("C2","dry")||is("C1","dry")),
     devOK:st.tv&&lit&&st.iA>.3&&st.iB>.3&&st.iA<.45&&st.iB<.45&&!is("C4","dry")&&!is("C2","dry")&&!is("C1","dry"),
     sbyOn:run,llcOut:lit,pfcSw:run,lampB:0};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});
  const n={vin0:N(s.mains,"ac",s.run?1:0),vin:N(s.vin>1,"ac",s.run?1:0),vcc:N(s.vcc>1,"vcc",.3),blon:N(st.tv,"fb",0),ena:N(s.en,"fb",0),dim:N(st.tv,"fb",.4),dimo:N(s.dim,"fb",.4),
   sw:N(s.run||s.vin>1,"hv",s.sw<0?1.3:0),gate:N(s.run,"pu",s.sw>0?1.2:0),isen:N(s.run,"pu",0),ledp:N(s.vout>5,"hv",s.lit?1:0),ovp:N(s.vout>5,"fb",0),
   rt:N(s.icOK,"pu",0),comp:N(s.icOK,"fb",0),fb1:N(s.iA>.05,"fb",0),fb2:N(s.iB>.05,"fb",0),pwmo:N(s.run,"pu",0),strA:N(s.iA>.05,"lv",1),strB:N(s.iB>.05,"lv",1),cg:N(0,"lv",0)};
  if(s.surge){n.vin.red=1;n.sw.red=1;n.vin.f=5;n.sw.f=5}
  return n;
}
const LAB_RAILS={
 vin:{n:"Вход 24 В (вместо блока питания)",def:24,parts:["C1","Q1","C4"],load:v=>(v>1&&okp("R1")?Math.min(v,12)/1000+(v>13?(v-12)/1000:0):0)+.001},
 vcc:{n:"VCC IC1 (12 В)",def:12,parts:["C2","ZD1"],load:v=>(v>9&&!is("IC1","dead")?.006:.0002)+(v>12.6?(v-12.6)/2:0)}
};
