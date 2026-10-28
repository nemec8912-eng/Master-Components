/* Плата кондиционера: выводы деталей, напряжения узлов (относительно минуса шины), формы сигналов */
const PINS={
 F1:[["вход L","ac0"],["выход","ac1"]],RV1:[["L","ac1"],["N","n0"]],L1:[["вход","ac1"],["выход","acl"]],RT1:[["от фильтра","acl"],["к мосту","acr"]],
 RL1:[["катушка +15","v15"],["катушка −","rlc"],["контакт 1","acl"],["контакт 2","acr"]],Q2:[["коллектор","rlc"],["база (RLY)","rly"],["эмиттер","hg"]],
 BD1:[["~ L","acr"],["~ N","n0"],["+","rect"],["−","hg"]],
 L2:[["вход","rect"],["выход (на ключ)","pfcn"]],Q1:[["C (коллектор)","pfcn"],["G (затвор)","pfcg"],["E (эмиттер)","hg"]],D1:[["анод","pfcn"],["катод (+380)","bus"]],
 C1:[["+","bus"],["−","hg"]],R1:[["+380","bus"],["к МК","bsen"]],
 IC1:[["D (сток)","tsw"],["S (исток)","hg"]],T1:[["первичка +380","bus"],["первичка (сток)","tsw"],["вторичка","t1s"],["вторичка −","hg"]],D2:[["анод","t1s"],["катод (+15)","v15"]],
 C2:[["+","v15"],["−","hg"]],IC2:[["IN","v15"],["OUT +5","v5"],["GND","hg"]],
 IC3:[["VDD","v5"],["RX","rx"],["TX","tx"],["U_BUS","bsen"],["PFC","pfcg"],["RLY","rly"],["IPM","pwm"],["FO","fo"],["T НАГН","td"],["GND","hg"]],
 R2:[["линия S","sl"],["к диоду","sl1"]],D3:[["анод","sl1"],["катод","sl2"]],PC1:[["A (светодиод)","sl2"],["K","sl3"],["C (к RX)","rx"],["E","hg"]],PC2:[["C (линия)","sl3"],["E (линия N)","nl"],["A (от TX)","tx"],["K","hg"]],
 IC4:[["P (+380)","bus"],["N (шунт)","ishunt"],["VCC +15","v15"],["VB","vb"],["IN (от МК)","pwm"],["FO (ошибка)","fo"],["U","pu"],["V","pv"],["W","pw"]],
 R3:[["N модуля","ishunt"],["минус шины","hg"]],C3:[["VB","vb"],["фаза U","pu"]],M1:[["U","pu"],["V","pv"],["W","pw"]],
 R4:[["+5","v5"],["T НАГН","td"]],RT2:[["T НАГН","td"],["минус","hg"]]
};
function NODE(k){
  const s=S;
  switch(k){
   case"ac0":return[0,s.mains?230:0];case"ac1":return[0,s.pre?230:0];case"acl":return[0,s.acl?230:0];case"acr":return[0,s.feed?(s.rl?229:(s.ptcTrip?20:200)):0];case"n0":return[0,0];
   case"hg":return[0,0];case"rect":return[s.bus>20?s.bus*(s.pfc?.55:.64):0,s.bus>20?100:0];case"pfcn":return[s.bus>20?s.bus*(s.pfc?.6:.64):0,s.pfc?180:(s.bus>20?100:0)];case"bus":return[s.bus,s.run?(is("C1","dry")?25:4):0];
   case"bsen":return[okp("R1")?s.bus*.01:0,0];case"rlc":return[s.coil?.2:s.v15,0];case"rly":return[s.coil&&okp("Q2")?.75:(s.mcu&&s.bus>250?.75:0),0];
   case"v15":return[s.v15,is("C2","dry")&&s.run?1.5:0];case"v5":return[s.v5,0];case"tsw":return[s.sby?s.bus:0,s.sby?150:0];case"t1s":return[s.sby?7:0,s.sby?14:0];
   case"pfcg":return[s.pfc?7:0,s.pfc?7:0];case"sl":return[0,s.mains?(s.comm?150:230):0];case"sl1":return[0,s.mains&&okp("R2")?(s.comm?60:0):0];case"sl2":case"sl3":return[0,s.comm?40:0];case"nl":return[0,0];
   case"rx":return[s.comm?2.5:(s.mcu?5:0),s.comm?2.5:0];case"tx":return[s.comm?2.5:0,s.comm?2.5:0];
   case"pwm":return[s.run||s.jerk?2.5:0,s.run||s.jerk?2.5:0];case"fo":return[s.mcu?(s.err==="P0"?0:5):0,0];
   case"td":{if(s.v5<1)return[0,0];if(!okp("R4"))return[0,0];if(s.tDr<-30)return[5,0];if(s.tDr>150)return[0,0];const R=ntcR50(s.tDr);return[5*R/(R+10000),0]}
   case"vb":return[s.v15>1?s.v15-.6+(s.run?s.bus/2:0):0,s.run?s.bus/2:0];case"ishunt":return[s.run?s.icomp*.02:0,s.run?.1:0];
   case"pu":case"pv":case"pw":return[s.run||s.jerk?s.bus/2:0,s.run?s.bus*.35:(s.jerk&&k==="pu"?s.bus*.3:0)];
  }
  return[0,0];
}
const MAINSN=new Set(["ac0","ac1","acl","acr","n0"]);
const ACN=new Set(["ac0","ac1","acl","acr","n0","sl","sl1","sl2","sl3","nl"]);
const SECN=new Set([]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);const sq=(x,k,d)=>((x*k)%1)<d;
  if(ACN.has(n))return{lo:-400,hi:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="rect")return{lo:0,hi:420,u:"В",tb:"5 мс/дел",f:x=>s.bus>20?Math.abs(325*Math.sin(2*Math.PI*x*2)):0};
  if(n==="pfcn"||n==="tsw")return{lo:-20,hi:450,u:"В",tb:"10 мкс/дел",f:x=>dc?(ac&&sq(x,5,.4)?0:s.bus):0};
  if(n==="pfcg")return{lo:-2,hi:18,u:"В",tb:"10 мкс/дел",f:x=>s.pfc&&sq(x,5,.4)?15:0};
  if(["pu","pv","pw"].includes(n)){const ph={pu:0,pv:1/3,pw:2/3}[n];const dead=s.jerk&&n==="pu";
    return{lo:-20,hi:420,u:"В",tb:"5 мс/дел",f:x=>{if(!(s.run||s.jerk))return 0;if(dead)return sq(x,40,.5)?0:2;const m=.5+.45*Math.sin(2*Math.PI*(x*2+ph));return ((x*40)%1)<m?s.bus:0}}}
  if(n==="pwm"||n==="rx"||n==="tx")return{lo:-1,hi:6,u:"В",tb:n==="pwm"?"50 мкс/дел":"5 мс/дел",f:x=>ac?(sq(x,n==="pwm"?8:3,.5)?5:0):dc};
  const top=Math.max(1,Math.abs(dc)*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*6)};
}
