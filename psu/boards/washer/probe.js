/* Плата стиральной машины: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 F1:[["вход L","acIn"],["выход","acF"]],RV1:[["L","acF"],["N","gnd"]],D1:[["анод","acF"],["катод","dc"]],C1:[["+","dc"],["−","gnd"]],
 IC1:[["D (сток)","dc"],["BP","bp"],["FB","fbk"],["S (исток)","sw"]],C3:[["BP","bp"],["S","sw"]],D2:[["анод (N)","gnd"],["катод (S)","sw"]],L1:[["S","sw"],["+12 В","v12"]],
 C4:[["+","v12"],["−","gnd"]],D3:[["анод (+12 В)","v12"],["катод","smp"]],C5:[["+","smp"],["− (S)","sw"]],R1:[["образец","smp"],["FB","fbk"]],R2:[["FB","fbk"],["S","sw"]],
 IC2:[["IN 12 В","v12"],["OUT 5 В","v5"],["GND","gnd"]],C6:[["+","v5"],["−","gnd"]],R3:[["+5 В","v5"],["RESET","rst"]],C7:[["RESET","rst"],["земля","gnd"]],ZQ1:[["OSC1","osc"],["OSC2","osc"]],
 IC3:[["VDD","v5"],["RESET","rst"],["OSC1","osc"],["OSC2","osc"],["HEAT","heat"],["PUMP","pumpc"],["LOCK","lockc"],["LSENS","lsens"],["TEMP","temp"],["GND","gnd"]],
 R4:[["HEAT","heat"],["база Q1","qb"]],Q1:[["коллектор","rlc"],["база","qb"],["эмиттер","gnd"]],D4:[["анод","rlc"],["катод (+12 В)","v12"]],
 RL1:[["катушка +12 В","v12"],["катушка (коллектор Q1)","rlc"],["контакт COM (L)","lph"],["контакт NO (ТЭН)","hot"]],
 R10:[["+5 В","v5"],["TEMP","temp"]],RT1:[["TEMP","temp"],["земля","gnd"]],C9:[["TEMP","temp"],["земля","gnd"]],
 R5:[["PUMP","pumpc"],["анод U1","u1a"]],U1:[["1 анод LED","u1a"],["2 катод LED","gnd"],["6 (к R6)","mt2p"],["4 (затвор TR1)","tr1g"]],R6:[["вывод 6 U1","mt2p"],["MT2 TR1","mt2p"]],
 TR1:[["MT2 (насос)","mt2p"],["затвор","tr1g"],["MT1 (N)","gnd"]],R7:[["MT2","mt2p"],["к C8","sn"]],C8:[["от R7","sn"],["N","gnd"]],
 R8:[["LOCK","lockc"],["затвор TR2","tr2g"]],TR2:[["MT2 (замок)","lockn"],["затвор","tr2g"],["MT1 (N)","gnd"]],R9:[["замок","lockn"],["LSENS","lsens"]]
};
function NODE(k){
  const s=S;
  switch(k){
   case"gnd":return[0,0];case"acIn":return[0,s.mains?230:0];case"acF":return[0,s.pre?230:0];case"lph":return[0,s.ac?230:0];
   case"dc":return[s.dcv,is("C1","dry")?30:4];case"sw":return[s.lnk?s.v12:0,s.lnk?150:0];case"bp":return[s.lnk?s.v12+5.8:0,0];case"fbk":return[s.lnk?s.v12+1.6:0,0];case"smp":return[s.lnk?s.v12*2:0,0];
   case"v12":return[s.v12,is("C4","dry")?1.2:.05];case"v5":return[s.v5,is("C6","dry")?.4:.01];case"rst":return[is("C7","short")?0:(okp("R3")?s.v5:s.v5*.4),0];case"osc":return[s.mcuOn?2.5:0,s.mcuOn&&!is("ZQ1","dead")?1:0];
   case"heat":return[s.heatCmd?5:0,0];case"qb":return[s.heatCmd&&okp("R4")?.7:0,0];case"rlc":return[s.coil?.1:s.v12,0];case"hot":return[0,s.heaterOn?230:0];
   case"temp":{if(s.v5<1)return[0,0];if(!okp("RT1"))return[s.v5,0];if(is("R10","open"))return[0,0];if(is("RT1","short")||is("C9","short"))return[0,0];const R=ntcR(s.wt);return[s.v5*R/(R+10000),0]}
   case"pumpc":return[s.pumpCmd?5:0,0];case"u1a":return[s.pumpCmd&&okp("R5")?1.2:0,0];case"mt2p":return[0,s.ac?(s.pumpOn?1:230):0];case"tr1g":return[0,s.pumpOn?1.2:0];case"sn":return[0,s.ac&&!s.pumpOn?(is("C8","short")?230:20):0];
   case"lockc":return[s.lockCmd?5:0,0];case"tr2g":return[s.lockCmd&&okp("R8")?.9:0,0];case"lockn":return[0,s.ac?(s.lockOn?1:230):0];case"lsens":return[s.lockSensed?4.8:0,0];
  }
  return[0,0];
}
const ACN=new Set(["acIn","acF","lph","hot","mt2p","tr1g","sn","lockn"]);
const SECN=new Set([]);
const MAINSN=new Set(["acIn","acF","lph","hot","mt2p","lockn","gnd"]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);const sq=(x,k,d)=>((x*k)%1)<d;
  if(["acIn","acF","lph","hot","mt2p","lockn","sn"].includes(n))return{lo:-400,hi:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="sw")return{lo:-20,hi:350,u:"В",tb:"5 мкс/дел",f:x=>s.lnk?(sq(x,5,.35)?s.dcv:-.7):0};
  if(n==="osc")return{lo:0,hi:5,u:"В",tb:"0,1 мкс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*8)};
  if(n==="dc")return{lo:0,hi:350,u:"В",tb:"5 мс/дел",f:x=>dc-ac*((x*2)%1)};
  const top=Math.max(1,dc*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*6)};
}
