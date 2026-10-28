/* Питание ноутбука: модель работы */
const LP0={soc:40,pwr:false,vad:0,v5:0,v3:0,vcore:0,ecPrev:false,tvPrev:false,stuckT:0,stuckDone:false,onT:0,drops:0,offT:0,vcLatch:0,hicT:0,iLast:0,bootT:0,batWarn:false};
Object.assign(st,JSON.parse(JSON.stringify(LP0)));
st.lab.rail="vin";st.lab.v=19;st.lab.lim=1;
BOARD.reset=()=>{Object.assign(st,JSON.parse(JSON.stringify(LP0)))};
const CASC=[
 ["D1","short","inShort",1.5,"F1","open","TVS-диод замкнул вход — сгорел предохранитель F1."],
 ["Q3","short","acfet",3,"BT1","open","19 В попало прямо на батарею — её защита навсегда отключила элементы."],
 ["Q8","short","vcTry",.6,"IC4","dead","ШИМ VCORE выгорел, пытаясь запустить замкнутые ключи."]
];
function surgeStart(){}
function sim(now,dt){
  const sdt=dt*st.speed;st.t+=sdt;const t=st.t;
  const mains=st.mains;
  let lab=null;
  if(st.lab.on){
    if(mains){st.lab.on=false;log("ЛБП отключён: подключена зарядка.",true);if(typeof labUi==="function")labUi()}
    else{const R=LAB_RAILS[st.lab.rail],sh=R.parts.filter(id=>is(id,"short")&&st.slot[id]!=="empty");
      let v=st.lab.v,i=0;if(sh.length){v=.12;i=st.lab.lim}else{i=R.load(v);if(i>st.lab.lim){i=st.lab.lim;v=Math.min(v,v*st.lab.lim/R.load(v))}}
      lab={rail:st.lab.rail,v,i,sh,cc:i>=st.lab.lim-1e-6}}}
  // вход
  const inShort=is("D1","short")||is("C1","short");
  let vad=mains?19.5:0;
  const jOK=okp("J1"),fOK=okp("F1");
  if(mains&&jOK&&fOK&&inShort)vad=0;              // блок питания в защите
  if(lab&&lab.rail==="vin")vad=lab.sh.length?.12:lab.v;
  st.vad=vad;
  const vf=jOK&&fOK&&!inShort?vad:0;
  const acdet=vf>1?(okp("R1")?(okp("R2")?vf*47/247:vf):0):0;
  const bat=!is("BT1","open"),vbat=bat?10.9+st.soc*.017:0;
  const icPow=okp("IC1")&&(vf>5||bat);
  const acok=icPow&&acdet>2.4&&acdet<4.2;
  const acfet=acok&&okp("Q1")&&okp("Q2")&&okp("R3");
  const batRun=!acfet&&bat&&okp("Q5")&&st.soc>.5;
  let vsys=acfet?vf:(batRun?vbat:0);
  // зарядка
  const q3s=is("Q3","short");
  const chg=acfet&&bat&&okp("Q3")&&okp("L1")&&okp("R4")&&st.soc<100;
  const chgPath=acfet&&bat&&okp("Q3")&&okp("L1")&&okp("R4");
  const ichg=chg?(is("BT1","dead")?2:2.2):0;
  // дежурки
  const alw=vsys>6&&okp("IC2");
  const sh5=is("Q6","short")||is("C2","short"),sh3=is("C3","short");
  const hic=alw&&(sh5||sh3);
  if(hic)st.hicT+=sdt;
  let v5T=alw&&!hic&&okp("L2")?5:0,v3T=v5T&&okp("Q7")&&okp("L3")?3.3:0;
  // просадка 5 В под нагрузкой (C2 высох)
  if(v5T&&is("C2","dry")&&st.pwr&&st.onT>3){v5T=3.6}
  st.v5+=(v5T-st.v5)*(1-Math.exp(-dt/.02));st.v3+=(v3T-st.v3)*(1-Math.exp(-dt/.02));
  if(lab&&lab.rail==="v5")st.v5=lab.sh.length?.12:lab.v;if(lab&&lab.rail==="v3")st.v3=lab.sh.length?.12:lab.v;
  const ec=st.v3>3&&okp("IC3");
  // кнопка и включение
  const stuck=is("SW1","stuck"),pressOK=okp("SW1")&&okp("R5");
  if(!ec){st.pwr=false;st.stuckT=0;st.stuckDone=false}
  if(!st.tv){st.drops=0;st.vcLatch=0}
  if(ec&&stuck){if(!st.stuckDone){if(!st.pwr){st.pwr=true;log("Ноутбук включился сам — кнопка залипла.",true)}st.stuckT+=sdt;if(st.stuckT>4){st.pwr=false;st.stuckDone=true;log("Через 4 секунды «удержания» кнопки EC принудительно выключил ноутбук.",true)}}}
  else if(ec){
    if(st.tv&&!st.pwr&&pressOK&&(!st.tvPrev||!st.ecPrev||st.offT>2)&&st.vcLatch<1){st.pwr=true;st.onT=0}
    if(!st.tv&&st.pwr){st.pwr=false}
  }
  st.tvPrev=st.tv;st.ecPrev=ec;
  if(st.pwr)st.onT+=sdt;else st.offT+=sdt;if(st.pwr)st.offT=0;
  // VCORE
  const vcSh=is("Q8","short")||is("C4","short");
  const vcTry=st.pwr&&okp("IC4");
  let vcT=st.pwr&&okp("IC4")&&okp("L4")&&!vcSh&&st.v5>4.5?1.05:0;
  st.vcore+=(vcT-st.vcore)*(1-Math.exp(-dt/.05));if(lab&&lab.rail==="vcore")st.vcore=lab.sh.length?.05:lab.v;
  if(st.pwr&&vcSh&&okp("IC4")&&st.onT>.4){st.pwr=false;st.vcLatch++;log("КЗ по питанию процессора: ШИМ VCORE ушёл в защиту, ноутбук выключился.",true)}
  if(st.pwr&&is("C2","dry")&&st.onT>4.5){st.pwr=false;st.drops++;log("Ноутбук выключился: под нагрузкой просело питание 5 В.",true)}
  const booted=st.pwr&&st.vcore>.9&&st.v5>4.5;
  st.bootT=booted?st.bootT+sdt:0;
  // батарея
  if(chg)st.soc=Math.min(100,st.soc+(is("BT1","dead")?2.5:.45)*sdt);
  if(batRun&&(st.pwr||ec))st.soc=Math.max(0,st.soc-(st.pwr?(is("BT1","dead")?3:.4):.02)*sdt);
  if(st.soc<=.5&&batRun&&st.pwr){st.pwr=false;log("Батарея разряжена — ноутбук выключился.",true)}
  if(q3s&&acfet&&bat&&!st.batWarn){st.batWarn=true;log("Ключ зарядки пробит: на батарее 19 В!",true)}
  const ledOn=ec&&acfet&&okp("R7")&&okp("LED1");
  // ток от БП
  const iad=vf>5&&acfet?(.02+(st.pwr?(st.vcore>.5?1.35:(vcSh?.6:.25)):0)+ichg*.65):(mains&&inShort&&jOK&&fOK?0:0);
  st.iLast=hic?.05*(((t*3)%1)<.3?1:0):iad;
  // каскады
  const flags={inShort:mains&&jOK&&fOK&&inShort,acfet:acfet&&q3s,vcTry:vcTry&&vcSh};
  CASC.forEach(([id,m,cond,sec,tg,tm,msg])=>{const k=id+m;if(is(id,m)&&!st.F[tg]&&flags[cond]){st.casc[k]=(st.casc[k]||0)+dt;if(st.casc[k]>sec){st.F[tg]=tm;st.sec[tg]=id;log((game.on&&!game.reveal)?"Что-то ещё вышло из строя.":"Вторичная поломка: "+msg,true);renderCard()}}});
  Object.entries(st.later).forEach(([id,L])=>{if(!mains&&!batRun)return;L.t-=dt;if(L.t<=0){delete st.later[id];st.F[L.tg]=L.tm;if(L.tg!==id)st.sec[L.tg]=id;log(`${L.tg} вышел из строя: ${L.msg}`,true);renderCard()}});
  const ecText=!ec?(st.v3<1?"EC: нет питания 3,3 В":"EC не работает"):(stuck&&st.stuckDone?"EC: кнопка зажата — выключил":(st.pwr?(booted?"EC: VR_ON → PG есть, система работает":"EC: VR_ON дан, ждёт PG"):"EC: дежурный режим, ждёт кнопку"));
  const worn=is("BT1","dead");
  const okNow=mains&&st.tv&&booted&&st.bootT>1&&chgPath&&ledOn&&!worn&&st.drops===0&&!stuck;
  S={t,mains,icPow,vad,vf,iad:st.iLast,inShort:mains&&jOK&&fOK&&inShort,acdet,acok,acfet,vsys,vbat,bat,batOK:bat&&!q3s,batRun,soc:st.soc,chg,chgPath,ichg,
     alw,hic,v5:st.v5,v3:st.v3,ec,ecText,btnDown:stuck||(st.tv&&!st.pwr&&false),pwr:st.pwr,vcore:st.vcore,vcSh,booted,bootT:st.bootT,ledOn,worn,
     surge:false,surgeNet:{},fuse:false,lab,bulk:0,dcv:0,lampB:0,devOK:okNow,sbyOn:ec,llcOut:booted,pfcSw:false};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});const a=s.acfet?.8:0;
  const n={vin0:N(s.vad>1&&okp("J1"),"vcc",a+(s.inShort?3:0)),vf:N(s.vf>1,"vcc",a),gnd:N(0,"lv",0),acdet:N(s.acdet>.5,"fb",0),acdrv:N(s.acfet,"pu",0),vq:N(s.acfet,"vcc",a),
   vsys:N(s.vsys>5,"vcc",s.acfet?.8:(s.batRun?.5:0)),hidrv:N(s.chg,"pu",.3),lodrv:N(s.chg,"pu",.3),sw:N(s.chg,"vcc",.6),chgo:N(s.chg,"vcc",.6),vbat:N(s.bat,"lv",0),batdrv:N(s.batRun,"pu",0),
   drv5:N(s.v5>4,"pu",.3),sw5:N(s.v5>4,"vcc",.5),v5:N(s.v5>1,"vcc",.3),drv3:N(s.v3>3,"pu",.3),sw3:N(s.v3>3,"vcc",.5),v3:N(s.v3>1,"vcc",.2),
   btn:N(s.v3>1&&okp("R5"),"fb",0),leda:N(s.ledOn,"fb",.2),ledk:N(s.ledOn,"fb",.2),vron:N(s.pwr,"pu",0),pg:N(s.vcore>.9,"pu",0),gvc:N(s.vcore>.5,"pu",.4),swc:N(s.vcore>.5,"vcc",.9),vcore:N(s.vcore>.3,"vcc",.9)};
  if(s.inShort){n.vin0.red=1}
  if(s.hic){n.v5.red=is("C3","short")?0:1;n.v3.red=is("C3","short")?1:0;n.v5.on=n.v5.on||!is("C3","short");n.v3.on=n.v3.on||is("C3","short");n.v5.k=n.v3.k="vcc"}
  if(s.vcSh&&s.pwr){n.vcore.on=1;n.vcore.red=1}
  return n;
}
const LAB_RAILS={
 vin:{n:"вход 19 В (вместо зарядки)",def:19,parts:["D1","C1"],load:v=>Math.max(.005,st.iLast)},
 v5:{n:"+5 В (поиск КЗ)",def:1,parts:["Q6","C2"],load:v=>.01},
 v3:{n:"+3,3 В (поиск КЗ)",def:1,parts:["C3"],load:v=>.01},
 vcore:{n:"VCORE (поиск КЗ)",def:1,parts:["Q8","C4"],load:v=>.01}
};
