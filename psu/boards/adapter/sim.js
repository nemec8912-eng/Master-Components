/* Адаптер 12 В на UC3842: модель работы */
Object.assign(st,{vcc:0,v12:0,v12r:0,icOn:false,runT:0,lastOn:-1e9,lastOff:-1e9});
st.lab.rail="vcc";
BOARD.reset=()=>{Object.assign(st,{vcc:0,v12:0,v12r:0,icOn:false,runT:0,lastOn:-1e9,lastOff:-1e9})};
const CASC=[
 ["D3","open","run",5,"Q1","short","Без диода снаббера выбросы на стоке пробили Q1."],
 ["R9","open","run",12,"Q1","short","C7 зарядился и перестал гасить выбросы — Q1 пробит."],
 ["C7","open","run",15,"Q1","short","Снаббер не работает — Q1 пробит выбросами."],
 ["D3","short","run",8,"R9","open","Через пробитый D3 резистор R9 перегрелся и оборвался."],
 ["R8","open","run",10,"Q1","short","Затвор «висел» — Q1 перегрелся и пробился."],
 ["L1","open","run",15,"C8","short","На C8 больше 25 В — конденсатор вздулся и пробился."]
];
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Хлопок! Короткое замыкание на первичной стороне — ток в десятки ампер.":"Короткое замыкание: "+cause+". Ток в десятки ампер!",true)}
function sim(now,dt){
  const sdt=dt*st.speed;st.t+=sdt;const t=st.t,F=st.F;
  const acV=Math.sin(2*Math.PI*t*.45);
  const mains=st.mains&&!st.rcd;
  const pre=mains&&okp("F1")&&!st.fuse;
  const afterLF=pre&&okp("LF1");
  const inPath=afterLF&&okp("TH1");
  // lab PSU
  let lab=null;
  if(st.lab.on){
    if(mains||st.bulk>30){st.lab.on=false;log(mains?"ЛБП отключён: вилка в розетке.":"ЛБП отключён: на C1 опасное напряжение.",true);if(typeof labUi==="function")labUi()}
    else{const R=LAB_RAILS[st.lab.rail],sh=R.parts.filter(id=>is(id,"short")&&st.slot[id]!=="empty");
      let v=st.lab.v,i=0;
      if(sh.length){v=.12;i=st.lab.lim}else{i=R.load(v);if(i>st.lab.lim){i=st.lab.lim;v=Math.min(v,v*st.lab.lim/R.load(v))}}
      lab={rail:st.lab.rail,v,i,sh,cc:i>=st.lab.lim-1e-6}}}
  // short circuits on the primary side
  let shortC=null,shortN=null;
  if(pre){let c=null,nets=["ac0","ac1","n0"];
    if(is("RV1","short"))c="пробит варистор RV1";else if(is("CX1","short"))c="пробит CX1";
    else if(inPath){nets.push("ac1b","acT","n2");
      if(is("BD1","short"))c="пробит диодный мост BD1";
      else if(is("C1","short")){c="пробит C1";nets.push("bplus")}
      else if(is("Q1","short")){c="пробит ключ Q1";nets.push("bplus","drain","cs","hg")}}
    if(c){shortC=c;shortN=nets}}
  if(st.lamp){
    if(shortC){if(!st.surge){st.surge={t0:now,cause:shortC,nets:shortN,lamp:1};if(!st.lampWarn){st.lampWarn=1;log((game.on&&!game.reveal)?"Лампа вспыхнула ярко и не гаснет — в адаптере короткое замыкание. Предохранитель цел.":"Лампа горит ярко: "+shortC+". Предохранитель защищён лампой.",true)}}}
    else if(st.surge&&now-st.surge.t0>700)st.surge=null;
    if(!shortC&&!st.surge)st.lampWarn=0;
  }else if(!st.surge&&shortC)surgeStart(shortC,shortN,now);
  let surge=!!st.surge,surgeNet={};
  if(surge){st.surge.nets.forEach(n=>surgeNet[n]=1);if(!st.lamp&&now-st.surge.t0>(st.bug?2600:1400)){st.fuse=true;st.surge=null;surge=false;surgeNet={};
    if(st.bug){st.bug=false;if(!st.F.BD1)st.F.BD1="short";st.sec.BD1="F1";log("«Жучок» не сгорел вовремя: выгорели мост BD1 и дорожка на плате.",true)}
    else log("Сгорел предохранитель F1. Замените его, но только после устранения причины.",true)}}
  const rectOK=inPath&&!st.fuse&&!is("BD1","open")&&!surge;
  // --- UC3842
  const osc=okp("R3")&&!F.C3&&!is("C4","short")&&!is("IC1","dead");
  const compLow=is("PC1","short")||is("IC2","short")||is("R13","open");
  const drive=okp("R7")&&!is("Q1","open")&&okp("R6")&&okp("T1")&&okp("R5");
  const gp=st.icOn&&osc&&!compLow;                       // импульсы на выходе микросхемы
  const sw0=gp&&drive&&st.bulk>80&&!surge;               // ключ реально работает
  if(sw0){st.runT+=dt;st.lastSw=now}else st.runT=0;
  const outShort=is("D4","short")||is("C8","short")||is("C9","short");
  const fbOV=is("IC2","open")||is("R12","open")||is("R14","open")||is("PC1","open");
  const auxOK=sw0&&st.runT>.12&&okp("D2")&&okp("R2")&&okp("T1")&&!outShort&&!is("D4","open");
  const r1=okp("R1")&&st.bulk>60&&!is("C2","short");
  const dry=is("C2","dry");
  let dv=0;
  if(r1)dv+=dry?40:12;
  if(st.icOn)dv-=dry?150:(gp?20:14);
  if(auxOK)st.vcc+=((fbOV?21:14)-st.vcc)*(1-Math.exp(-dt/.03));else st.vcc=Math.max(0,st.vcc+dv*dt*Math.min(st.speed,1.5));
  if(!r1&&!st.icOn&&!auxOK)st.vcc=Math.max(0,st.vcc-dt*(dry?20:2));
  if(is("C2","short"))st.vcc=0;
  if(lab&&lab.rail==="vcc")st.vcc=lab.v;
  if(!st.icOn&&st.vcc>=16){st.icOn=true;st.lastOn=now}
  if(st.icOn&&st.vcc<10){st.icOn=false;st.lastOff=now}
  // --- C1
  const loadOn=st.tv;
  let bT=rectOK?322:0;
  const rip1=is("C1","dry")&&loadOn&&sw0?(40+30*Math.sin(2*Math.PI*t*.9)):0;
  bT-=rip1;if(st.lamp&&sw0&&loadOn)bT-=12;
  const charging=rectOK&&Math.abs(acV)>.93&&(sw0||st.bulk<300);
  st.bulk+=(bT-st.bulk)*(1-Math.exp(-dt/(bT>st.bulk?.35:(sw0?(loadOn?.6:3):(rectOK?6:(st.icOn?3:25))))));
  // --- output
  let vrT=0;
  if(sw0&&okp("D4"))vrT=outShort?.3:(is("L1","open")?30:(fbOV?19.2:12.05+(is("C8","dry")&&loadOn?.55*Math.sin(t*37):0)));
  st.v12r+=(vrT-st.v12r)*(1-Math.exp(-dt/(vrT<st.v12r?(sw0?.04:.25):.05)));
  let v12T=is("L1","open")?0:st.v12r*(is("C9","dry")&&loadOn?1+.02*Math.sin(t*41):1);
  if(is("C1","dry")&&loadOn&&sw0&&!fbOV)v12T-=.9+.9*Math.sin(2*Math.PI*t*.9);
  st.v12+=(v12T-st.v12)*(1-Math.exp(-dt/.03));
  if(lab&&lab.rail==="v12"){st.v12=lab.v;st.v12r=lab.v}
  const ind=st.v12>3&&okp("R11")&&okp("LED1");
  const led2=st.v12>11.3&&!fbOV&&okp("R14");
  const rip=(is("C8","dry")||is("C9","dry")||is("C1","dry"))&&loadOn&&sw0?.6:(sw0?.04:0);
  // cascades
  const runFlags={run:sw0};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&runFlags[cond]){st.casc[k]=(st.casc[k]||0)+dt;if(st.casc[k]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Щелчок и запах гари — похоже, что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const sw=sw0?sq(t*1.4,.4):0;
  const lampB=!st.lamp||!mains?0:(surge?1:Math.min(1,Math.max(0,(bT-st.bulk)/160)*(rectOK?1:0)+(sw0&&loadOn?.12:0)+(sw0?.03:0)));
  const acI=st.lamp&&surge?1.2*Math.sign(acV||1):surge?6*Math.sign(acV||1):(charging?2*Math.sign(acV):0);
  const hic=now-st.lastOn<2500&&now-st.lastOff<2500,ticking=hic&&now-(st.lastSw||-1e9)<2500;
  S={t,acV,acI,mains,pre,afterLF,inPath,rectOK,surge,surgeNet,fuse:st.fuse,bulk:st.bulk,vcc:st.vcc,icOn:st.icOn,osc,gp,sw0,sw,auxOK,hic,ticking,compLow,fbOV,outShort,
     vccCharge:r1&&!auxOK,v12:st.v12,v12r:st.v12r,ind,led2,rip,charging,bridgeOn:charging&&rectOK,lab,lampB,
     devOK:st.tv&&Math.abs(st.v12-12)<.6&&ind&&rip<.25,
     sbyOn:sw0,llcOut:false,pfcSw:false};
}
function nets(){
  const s=S,R=s.surgeNet||{};
  const N=(on,k,f)=>({on:!!on,k,f:on?f:0});
  const n={
   ac0:N(s.mains,"ac",s.acI),ac1:N(s.pre,"ac",s.acI),ac1b:N(s.afterLF,"ac",s.acI),acT:N(s.inPath,"ac",s.acI),n0:N(s.mains,"ac",s.acI),n2:N(s.inPath,"ac",s.acI),
   bplus:N(s.bulk>20||R.bplus,"hv",R.bplus?5:(s.charging?1.5:(s.sw>0?1:0))),hg:N(s.bulk>20||R.hg,"hv",R.hg?5:(s.sw>0?.9:0)),
   drain:N(s.sw0||R.drain,"hv",R.drain?5:(s.sw>0?1.6:0)),snub:N(s.sw0,"hv",s.sw<0?.5:0),
   gate:N(s.gp,"pu",s.sw>0||(!s.sw0&&s.gp)?1.2:0),cs:N(s.sw0||R.cs,"pu",R.cs?5:0),
   aux:N(s.auxOK,"vcc",s.sw<0?1:0),vcc:N(s.vcc>1,"vcc",s.vccCharge?.3:(s.auxOK?.5:0)),vref:N(s.icOn&&!is("C4","short"),"fb",0),rtct:N(s.icOn&&s.osc,"pu",0),comp:N(s.icOn,"fb",s.led2?.5:0),
   sec:N(s.sw<0&&s.v12r>.5,"lv",1.4),v12r:N(s.v12r>.5,"lv",s.sw<0?1.3:0),v12:N(s.v12>.5,"lv",.3+(st.tv?1:0)),sense:N(s.v12>.5,"fb",0),fbref:N(s.v12>.5,"fb",0),led:N(s.led2,"fb",.6),cg:N(0,"lv",0)
  };
  Object.keys(R).forEach(k=>{if(n[k])n[k].red=1});
  return n;
}
const LAB_RAILS={
 vcc:{n:"VCC UC3842 (питание микросхемы)",def:15,parts:["C2"],load:v=>(st.icOn&&!is("IC1","dead")?.011:.0003)+(is("D2","short")?0:0)},
 v12:{n:"+12 В (выход)",def:12,parts:["C8","C9","D4"],load:v=>v/2200+(v>2&&okp("R11")&&okp("LED1")?(v-2)/1000:0)+v/12700+(v>12&&!is("IC2","open")?Math.min(.02,(v-12)*.05):0)}
};
