/* Блок питания ATX на TL494: модель работы */
Object.assign(st,{vsb:0,vcc:0,v12:0,v5:0,runT:0,prot:false,protT:-9,autoSeen:false,pgDrop:-1e9,c4T:0,c4Off:0});
st.lab.rail="vsb";st.lab.v=5;
BOARD.reset=()=>{Object.assign(st,{vsb:0,vcc:0,v12:0,v5:0,runT:0,prot:false,protT:-9,autoSeen:false,pgDrop:-1e9,c4T:0,c4Off:0})};
const CASC=[
 ["C1","short","mains",3,"C2","short","C2 получил все 310 В вместо 155 В и пробился."],
 ["C2","short","mains",3,"C1","short","C1 получил все 310 В и пробился."],
 ["R1","open","mains",15,"C2","dry","На C2 больше 200 В — он вздулся."],
 ["R2","open","mains",15,"C1","dry","На C1 больше 200 В — он вздулся."],
 ["C3","short","power",2,"Q1","short","Сердечник T1 насытился постоянным током — пробит силовой ключ Q1."],
 ["IC3","open","sb",10,"C5","dry","9 В на конденсаторе 10 В — C5 вздулся."],
 ["PC1","dead","sb",10,"C5","dry","9 В на конденсаторе 10 В — C5 вздулся."]
];
function surgeStart(cause,nets,now){st.surge={t0:now,cause,nets};log((game.on&&!game.reveal)?"Хлопок! На горячей стороне короткое замыкание.":"Короткое замыкание: "+cause+".",true)}
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
  const inPath=pre&&okp("TH1");
  // standby
  const sbParts=okp("T2")&&okp("R3")&&okp("Q3")&&okp("R4");
  const sbCan=st.bulk>100&&sbParts;
  // primary-side shorts
  let shortC=null;
  if(inPath){
    if(is("BD1","short"))shortC="пробит диодный мост";
    else if(is("C1","short")&&is("C2","short"))shortC="пробиты оба конденсатора полумоста";
    else if(is("Q3","short")&&okp("T2"))shortC="пробит ключ дежурки Q3";
    else if((is("Q1","short")||is("Q2","short"))&&st.runT>.05)shortC="сквозной ток через пробитый ключ полумоста";
  }
  if(st.lamp){if(shortC){if(!st.surge){st.surge={t0:now,cause:shortC,nets:["bp"],lamp:1};if(!st.lampWarn){st.lampWarn=1;log("Лампа горит ярко — на горячей стороне КЗ. Предохранитель цел.",true)}}}else if(st.surge&&now-st.surge.t0>700)st.surge=null;if(!shortC&&!st.surge)st.lampWarn=0}
  else if(!st.surge&&shortC)surgeStart(shortC,["bp"],now);
  if(st.surge&&!shortC&&!st.lamp&&!st.surge.lamp)st.surge=null;
  let surge=!!st.surge;
  if(surge&&!st.lamp&&now-st.surge.t0>1000){st.fuse=true;st.surge=null;surge=false;if(st.bug){st.bug=false;log("«Жучок» не сгорел — выгорела дорожка у моста.",true)}else log("Сгорел предохранитель F1.",true)}
  const ac=inPath&&!surge;
  // bulk 310 V
  const half=is("BD1","open"),dry=is("C1","dry")||is("C2","dry");
  const load=st.runT>0?1:0;
  const ripA=(half?70:0)+(dry?60:0);
  const peak=load&&Math.sin(t*.9)>.2;
  const bT=ac&&!is("BD1","short")?310-(ripA&&peak?ripA*(.5+.5*Math.sin(2*Math.PI*t*(half?.45:.9))):0):0;
  st.bulk+=(bT-st.bulk)*(1-Math.exp(-dt/(bT>st.bulk?.12:(ripA&&peak?.1:(sbCan?3:30)))));
  const bulk=st.bulk;
  let c1v=bulk/2,c2v=bulk/2;
  if(is("C1","short")){c1v=0;c2v=bulk}else if(is("C2","short")){c2v=0;c1v=bulk}
  else if(is("R1","open")&&!is("R2","open")){c1v=bulk*.3;c2v=bulk*.7}else if(is("R2","open")&&!is("R1","open")){c1v=bulk*.7;c2v=bulk*.3}
  // standby output
  const sbOn=sbCan&&!is("D5","short")&&!is("C5","short");
  const fbOpen=is("PC1","dead")||is("R5","open")||is("IC3","open")||is("R6","open");
  let vsbT=0;
  if(sbOn&&okp("D5")){vsbT=fbOpen?9:(is("IC3","short")||is("R7","open")?2.5:5.02);if(is("C5","dry")&&!fbOpen)vsbT=Math.min(vsbT,4.4)}
  st.vsb+=(vsbT-st.vsb)*(1-Math.exp(-dt/.05));
  if(lab&&lab.rail==="vsb")st.vsb=lab.v;
  const vsb=st.vsb;
  // VCC of TL494 (second winding)
  let vccT=sbOn&&okp("D4")&&!is("C4","short")?vsbT*2.9:0;
  if(is("C4","dry")&&st.runT>0)st.c4T+=sdt;else st.c4T=0;
  if(is("C4","dry")&&st.c4T>.6){st.c4Off=t+1.2;st.c4T=0}
  if(t<st.c4Off)vccT=Math.min(vccT,6);
  st.vcc+=(vccT-st.vcc)*(1-Math.exp(-dt/.04));
  if(lab&&lab.rail==="vcc")st.vcc=lab.v;
  const vcc=st.vcc;
  // TL494
  const icRun=vcc>7&&okp("IC1")&&okp("R8")&&okp("C6");
  const pcOn=st.tv&&vsb>4.6;
  const psHigh=!pcOn&&vsb>3;
  const dtcHi=(psHigh&&okp("R9")&&!is("Q6","open"))||is("Q6","short")||is("C7","short")||is("R10","open");
  if(!st.tv&&!(is("Q6","open")||is("R9","open"))){st.prot=false}
  if(!mains)st.prot=false;
  const drive=icRun&&!dtcHi&&!st.prot;
  const halfDrv=is("Q4","open")||is("Q5","open")||is("Q1","open")||is("Q2","open");
  const drvOK=drive&&okp("T3")&&!is("Q4","short")&&!is("Q5","short");
  const power=drvOK&&bulk>150&&okp("C3")&&okp("T1")&&!is("Q1","short")&&!is("Q2","short");
  if(drive)st.runT+=sdt;else st.runT=0;
  // outputs
  let k=power?(halfDrv?.5:1):0;
  let duty=1;if(is("R11","open"))duty=1.3;else if(is("R12","open"))duty=.55;
  if(ripA&&power)k*=Math.max(.6,(bulk/310));
  const ocp=is("D6","short")||is("D7","short")||is("C8","short")||is("C9","short");
  let v12T=k&&okp("L1")&&okp("D6")&&!ocp?12.05*duty*k:0,v5T=k&&okp("L1")&&okp("D7")&&!ocp?5.03*duty*k:0;
  if(ripA&&power&&bulk>285){v12T=12.05*duty;v5T=5.03*duty}
  st.v12+=(v12T-st.v12)*(1-Math.exp(-dt/.04));st.v5+=(v5T-st.v5)*(1-Math.exp(-dt/.04));
  if(lab&&lab.rail==="v12")st.v12=lab.v;if(lab&&lab.rail==="v5")st.v5=lab.v;
  const v12=st.v12,v5=st.v5;
  // supervisor (LM339): protection and Power Good
  const sup=okp("IC2")&&vsb>4;
  const inRange=v12>11.4&&v12<12.6&&v5>4.75&&v5<5.25;
  if(sup&&drive&&st.runT>.35&&!st.prot){
    let why=null;
    if(ocp&&st.runT>.08)why="перегрузка по току (КЗ на выходе)";
    else if(v12>13.4||v5>5.8)why="перенапряжение на выходе";
    else if(v12<9||v5<3.8)why="пониженное напряжение на выходе";
    if(why){st.prot=true;st.protT=now;log("Блок ушёл в защиту: "+why+".",true)}
  }
  const pg=sup&&okp("R13")&&drive&&st.runT>.5&&inRange;
  if(st.tv&&!pg&&st.wasPg)st.pgDrop=now;st.wasPg=pg;
  // self start (PS_ON ignored)
  if(mains&&!st.tv&&drive&&st.runT>.3)st.autoSeen=true;
  if(!mains||!(is("Q6","open")||is("R9","open")))st.autoSeen=false;
  // cascades
  const flags={mains:ac,power:power,sb:sbOn&&vsb>7};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const kk=id+m;if(is(id,m)&&!st.F[tg]&&flags[cond]){st.casc[kk]=(st.casc[kk]||0)+dt;if(st.casc[kk]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Щелчок и запах — похоже, что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains)return;if(L.tm==="short"&&/^Q[12]$/.test(L.tg)&&!power)return;L.t-=dt;if(L.tg&&L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const rip12=is("C8","dry")&&power,rip5=is("C9","dry")&&power;
  const sw=power?sq(t*1.6,.4):0;
  S={t,mains,pre,ac,bulk,dcv:bulk,c1v,c2v,chg:ac&&Math.sin(2*Math.PI*t*.9)>.7,sbOn,sbLed:sbOn&&vsb>4.9&&!fbOpen,vsb,vcc,icRun,dtcHi,drive,power,sw,v12,v5,pg,prot:st.prot,rip12,rip5,
     ripText:rip12?"пульсации +12 В: 1,2 В!":(rip5?"пульсации +5 В: 0,6 В!":(ripA&&power?"проседания при нагрузке":"")),
     surge,surgeNet:{},fuse:st.fuse,lab,lampB:!st.lamp||!mains?0:(surge?1:(power?.5:.08)),
     devOK:st.tv&&pg&&vsb>4.75&&vsb<5.25&&!rip12&&!rip5&&!st.autoSeen&&now-st.pgDrop>3000,
     sbyOn:sbOn,llcOut:power,pfcSw:false};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});
  const n={ac0:N(s.mains,"ac",s.chg?1:.2),ac1:N(s.pre,"ac",s.chg?1:.2),acT:N(s.ac,"ac",s.chg?1:.2),n0:N(s.mains,"ac",s.chg?1:.2),
   bp:N(s.bulk>20,"hv",s.power?1:.1),mid:N(s.bulk>20,"hv",s.power?.6:0),hg:N(0,"lv",0),sbd:N(s.sbOn,"hv",.5),sbg:N(s.sbOn,"pu",.2),src:N(s.sbOn,"pu",.4),
   vsbr:N(s.vsb>1,"lv",.5),vsb:N(s.vsb>1,"lv",.3),ref:N(s.vsb>1,"fb",0),kled:N(s.sbLed,"fb",.2),auxa:N(s.vcc>1,"vcc",.4),vcc:N(s.vcc>1,"vcc",.3),
   rt:N(s.icRun,"pu",0),ct:N(s.icRun,"pu",0),vref:N(s.icRun,"fb",0),dtc:N(s.icRun,"fb",0),pson:N(s.vsb>1&&!st.tv,"fb",0),fbk:N(s.v12>1,"fb",0),
   o1:N(s.drive,"pu",.5),o2:N(s.drive,"pu",.5),dr1:N(s.drive,"pu",.6),dr2:N(s.drive,"pu",.6),b1:N(s.drive&&okp("T3"),"pu",.6),b2:N(s.drive&&okp("T3"),"pu",.6),
   hb:N(s.power,"hv",s.sw*1.4),t1b:N(s.power,"hv",s.sw*1.2),s12:N(s.v12>1,"lv",s.sw*1.2),s5:N(s.v5>1,"lv",s.sw*1.2),k12:N(s.v12>1,"lv",1),k5:N(s.v5>1,"lv",1),
   v12:N(s.v12>1,"lv",1),v5:N(s.v5>1,"lv",1),pg:N(s.pg,"fb",0),mon:N(s.v12>1,"fb",0),cg:N(0,"lv",0)};
  if(s.surge){n.bp.red=1;n.bp.f=5;n.acT.red=1}
  return n;
}
const LAB_RAILS={
 vsb:{n:"+5VSB (дежурка)",def:5,parts:["C5"],load:v=>.01+(v>3?.02:0)},
 vcc:{n:"VCC TL494",def:12,parts:["C4"],load:v=>(v>7&&okp("IC1")?.012:.001)},
 v12:{n:"+12 В (выход)",def:12,parts:["C8"],load:v=>v/2000},
 v5:{n:"+5 В (выход)",def:5,parts:["C9"],load:v=>v/1000}
};
