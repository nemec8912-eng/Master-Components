/* Сварочный инвертор: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 F1:[["вход L","acIn"],["выход","ac1"]],CX1:[["L","ac1"],["N","nIn"]],BD1:[["~ L","ac1"],["~ N","nIn"],["+","bp0"],["−","hg"]],
 R1:[["от моста","bp0"],["к шине","bp"]],RL1:[["катушка +15","v15"],["катушка K","rly"],["контакт (мост)","bp0"],["контакт (шина)","bp"]],
 C1:[["+","bp"],["−","hg"]],C2:[["+","bp"],["−","hg"]],
 T3:[["первичная (+310)","bp"],["первичная (DRAIN)","sbd"],["вторичная","s15"],["вторичная (земля)","cg"]],IC2:[["DRAIN","sbd"],["SOURCE","hg"]],
 D5:[["анод","s15"],["катод","v15"]],C5:[["+","v15"],["−","cg"]],M1:[["+","v15"],["−","cg"]],
 SW1:[["+15","v15"],["ТЕРМО","therm"]],R3:[["+15","v15"],["анод LED1","ledA"]],LED1:[["анод","ledA"],["катод (ТЕРМО)","therm"]],
 IC1:[["7 VCC","v15"],["4 RT/CT","rtct"],["8 VREF","vref"],["1 COMP","therm"],["3 CS","cs"],["6 OUT","out"],["5 GND","cg"]],
 R8:[["VREF","vref"],["RT/CT","rtct"]],C7:[["RT/CT","rtct"],["земля","cg"]],R11:[["CS","cs"],["земля","cg"]],
 Q4:[["коллектор (+15)","v15"],["база (OUT)","out"],["эмиттер","drv"]],Q5:[["эмиттер","drv"],["база (OUT)","out"],["коллектор (земля)","cg"]],
 C8:[["от драйвера","drv"],["к T2","drvc"]],T2:[["первичная","drvc"],["первичная (земля)","cg"],["G1","g1"],["E1","pa"],["G2","g2"],["E2 (GND1)","hg"]],
 R5:[["G1","g1"],["затвор Q1","g1"]],R6:[["G2","g2"],["затвор Q2","g2"]],
 Q1:[["C (коллектор)","bp"],["G (затвор)","g1"],["E (эмиттер)","pa"]],Q2:[["C (коллектор)","pb"],["G (затвор)","g2"],["E (эмиттер)","hg"]],
 D1:[["анод (GND1)","hg"],["катод","pa"]],D2:[["анод","pb"],["катод (+310)","bp"]],
 T1:[["первичная (Q1)","pa"],["первичная (Q2)","pb"],["вторичная S1","s1"],["вторичная S2","s2"]],
 D3:[["анод","s1"],["катод","kout"]],D4:[["анод (−)","s2"],["катод","kout"]],R7:[["от катода D3","kout"],["к C4","snb"]],C4:[["от R7","snb"],["−","s2"]],
 L1:[["вход","kout"],["выход +","outp"]],T4:[["провод «−»","s2"],["провод «−» (к клемме)","outm"],["выход датчика","ctp"],["земля","cg"]],
 D8:[["анод","ctp"],["катод (CS)","cs"]],R12:[["CS","cs"],["земля","cg"]]
};
function NODE(k){
  const s=S;
  switch(k){
   case"acIn":case"nIn":return[0,s.mains?230:0];case"ac1":return[0,s.pre?230:0];case"hg":case"cg":case"s2":return[0,0];
   case"bp0":return[s.ac&&okp("BD1")?Math.max(s.bulk,300):0,0];case"bp":return[s.bulk,(is("C1","dry")||is("C2","dry")||is("BD1","open"))&&s.arc?60:4];
   case"rly":return[s.coil?.2:s.v15,0];case"sbd":return[s.bulk,s.sbOn?150:0];case"s15":return[s.v15*.9,s.v15>1?12:0];case"v15":return[s.v15,is("C5","dry")?2:.05];
   case"therm":return[s.thOK?s.v15:(okp("R3")&&okp("LED1")?s.v15-2:0),0];case"ledA":return[s.v15>1?(s.thOK?s.v15:s.v15-.1):0,0];
   case"rtct":return[s.icRun?1.8:0,s.icRun?1:0];case"vref":return[s.icRun?5:0,0];case"cs":return[s.arc?s.iarc/120*.6:0,0];
   case"out":case"drv":return[s.drive?7:0,s.drive?7:0];case"drvc":return[0,s.drive&&okp("C8")?12:0];case"g1":case"g2":return[0,s.drive&&okp("T2")?12:0];
   case"pa":return[s.power?s.bulk/3:0,s.power?150:0];case"pb":return[s.power?s.bulk*2/3:s.bulk,s.power?150:0];
   case"s1":return[0,s.power?60:0];case"kout":return[s.ocv,s.power?20:0];case"snb":return[0,s.power?10:0];case"outp":return[s.arc?24:s.ocv,s.arc?.3:0];case"outm":return[0,0];case"ctp":return[0,s.arc?1:0];
  }
  return[0,0];
}
const ACN=new Set(["acIn","ac1","nIn","s1","drvc","g1","g2","ctp","snb"]);
const SECN=new Set(["cg","s15","v15","therm","ledA","rtct","vref","cs","out","drv","drvc","s1","s2","kout","snb","outp","outm","ctp"]);
const MAINSN=new Set(["acIn","ac1","nIn"]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);const sq=(x,k,d)=>((x*k)%1)<d;
  if(MAINSN.has(n))return{lo:-400,hi:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="rtct")return{lo:0,hi:4,u:"В",tb:"5 мкс/дел",f:x=>s.icRun?1+1.8*((x*6)%1):0};
  if(["out","drv","drvc","g1","g2"].includes(n))return{lo:-16,hi:16,u:"В",tb:"5 мкс/дел",f:x=>s.drive?(sq(x,5,.4)?(n==="out"||n==="drv"?14:12):(n==="out"||n==="drv"?0:-6)):0};
  if(n==="pa"||n==="pb")return{lo:-20,hi:350,u:"В",tb:"5 мкс/дел",f:x=>s.power?(sq(x,5,.4)?(n==="pa"?s.bulk:0):(sq(x+.1,5,.15)?(n==="pa"?0:s.bulk):s.bulk/2)):dc};
  if(n==="s1"||n==="kout")return{lo:-80,hi:100,u:"В",tb:"5 мкс/дел",f:x=>s.power?(sq(x,5,.4)?75:(n==="s1"?-40:0)):0};
  if(n==="bp")return{lo:0,hi:350,u:"В",tb:"5 мс/дел",f:x=>dc-ac*((x*2)%1)};
  const top=Math.max(1,dc*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*6)};
}
