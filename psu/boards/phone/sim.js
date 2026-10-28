/* Цепь зарядки телефона: модель работы */
Object.assign(st,{soc:40,flip:false,wasMains:true,vbus:0,ichg:0,revT:0,wornV:0,offSeen:false});
st.lab.rail="bat";st.lab.v=4;st.lab.lim=.1;
BOARD.reset=()=>{Object.assign(st,{soc:40,flip:false,wasMains:true,vbus:0,ichg:0,revT:0,wornV:0,offSeen:false})};
const CASC=[];
function surgeStart(){}
function sim(now,dt){
  const sdt=dt*st.speed;st.t+=sdt;const t=st.t;
  const mains=st.mains;
  if(mains&&!st.wasMains){st.flip=!st.flip;log("Штекер вставлен "+(st.flip?"перевёрнутым":"прямо")+".")}st.wasMains=mains;
  // lab PSU on the battery terminals (only without the charger)
  let lab=null;
  if(st.lab.on){
    if(mains){st.lab.on=false;log("ЛБП отключён: подключена зарядка.",true);if(typeof labUi==="function")labUi()}
    else{const sh=is("C4","short");let v=st.lab.v,i=sh?st.lab.lim:Math.min(st.lab.lim,Math.max(0,(v-3.2)*.5));if(sh)v=.05;
      lab={rail:"bat",v,i,sh:sh?["C4"]:[],cc:i>=st.lab.lim-1e-6};
      if(is("BT1","open")&&!sh&&v>3.5&&i>.03){st.revT+=sdt;if(st.revT>4){delete st.F.BT1;st.revT=0;st.soc=3;log("Аккумулятор «раскачан» током ЛБП: напряжение поднялось до 3,3 В, защита разблокировалась.",true);renderCard()}}}}
  // USB-C and input protection
  const ccOn=mains&&(st.flip?okp("R2"):okp("R1"));
  const vbusShort=is("J1","short")||is("D1","short")||is("C1","short")||is("IC1","short");
  let vbusT=ccOn&&okp("J1")&&!vbusShort?5.05:0;
  st.vbus+=(vbusT-st.vbus)*(1-Math.exp(-dt/.03));
  const vin=st.vbus>4&&okp("F1")&&okp("IC2")&&!is("C2","short")?st.vbus-.05:0;
  const pmic=vin>4.3&&okp("IC1");
  const buck=pmic&&okp("L1");
  // battery path
  const prot=okp("IC3")&&okp("R5")&&okp("Q1");
  const cellOK=!is("BT1","open");
  const batConn=okp("J2")&&cellOK&&prot&&!is("C4","short");
  const tsOK=okp("RT1")&&okp("R4")&&okp("J2");
  const worn=is("BT1","dead");
  // charging
  let ichg=0,chgText="";
  if(!mains)chgText="зарядка не подключена";
  else if(!ccOn)chgText="нет 5 В: зарядка не видит телефон";
  else if(vbusShort)chgText="VBUS замкнут — зарядка в защите";
  else if(!vin)chgText="5 В не доходят до контроллера";
  else if(!pmic)chgText="контроллер не работает";
  else if(!buck)chgText="контроллер не может преобразовать напряжение";
  else if(!batConn)chgText="аккумулятор не обнаружен";
  else if(!tsOK)chgText="заряд приостановлен: температура батареи вне нормы";
  else{ichg=okp("R3")?2:.1;if(worn)ichg=st.soc>60?.3:1.2;if(st.soc>97)ichg=Math.min(ichg,.15);chgText=ichg>1.5?"быстрый заряд":(ichg>.2?"заряд":"заряд малым током")}
  st.ichg+=(ichg-st.ichg)*(1-Math.exp(-dt/.1));
  // load and battery
  const phoneWant=st.tv;
  const vsysSrc=buck||batConn;
  const iload=phoneWant?1.1:0;
  let vbat=batConn||lab?3.45+.0075*st.soc:(cellOK?0:.4);
  if(lab)vbat=lab.v;
  let idis=0;
  if(batConn&&!buck&&phoneWant){idis=iload;vbat-=worn?1.2*iload*.4:.1*iload;}
  const cap=worn?900:4000;
  st.soc+=((batConn?st.ichg:0)*(buck?1:0)-idis)*sdt*(1000/cap)*2.5;st.soc=Math.max(0,Math.min(100,st.soc));
  if(worn&&batConn&&buck&&st.ichg>.05&&st.soc<100)st.soc=Math.min(100,st.soc+sdt*3);
  const phone=phoneWant&&vsysSrc&&!is("C3","short")&&(buck||vbat>3.3);
  if(phoneWant&&!phone&&batConn&&!buck)st.offSeen=true;
  if(!worn)st.offSeen=false;
  const vsys=is("C3","short")?0:(buck?Math.max(3.7,vbat+.1):(batConn?vbat:0));
  const ledOn=st.ichg>.05&&okp("R6")&&okp("D2");
  S={t,mains,flip:st.flip,ccOn,vbus:st.vbus,vin,pmic,buck,batConn,tsOK,ichg:st.ichg,idis,chgText,vbat,soc:st.soc,phone,vsys,iload:phone?iload:0,ledOn,worn,lab,
     bulk:0,dcv:0,surge:false,surgeNet:{},fuse:false,lampB:0,
     devOK:st.tv&&mains&&phone&&batConn&&st.ichg>1.5&&ledOn,sbyOn:mains,llcOut:buck,pfcSw:false};
}
function nets(){
  const s=S,N=(on,k,f)=>({on:!!on,k,f:on?f:0});const ch=s.ichg>.05?1:0;
  return{vbus:N(s.vbus>1,"vcc",ch),vf:N(s.vbus>1&&okp("F1"),"vcc",ch),vin:N(s.vin>1,"vcc",ch),cc1:N(s.ccOn&&!s.flip,"fb",0),cc2:N(s.ccOn&&s.flip,"fb",0),gnd:N(0,"lv",0),
   ilim:N(s.pmic,"fb",0),ts:N(s.pmic,"fb",0),regn:N(s.pmic,"fb",0),swn:N(s.buck,"pu",1.2),vsys:N(s.vsys>1,"lv",s.phone?.6:.2),vbatp:N(s.vbat>1,"lv",s.ichg>.05||s.idis>.05?1:0),stat:N(s.ledOn,"fb",.3),
   pp:N(s.vbat>1,"lv",s.ichg>.05||s.idis>.05?1:0),ntc:N(s.pmic,"fb",0),dvcc:N(s.batConn,"fb",0),cm:N(s.batConn,"lv",0),od:N(s.batConn,"pu",0),pm:N(s.batConn,"lv",s.ichg>.05||s.idis>.05?1:0),leda:N(s.ledOn,"fb",.3)};
}
const LAB_RAILS={bat:{n:"клеммы аккумулятора",def:4,parts:["C4"],load:v=>Math.max(.001,(v-3.2)*.5)}};
