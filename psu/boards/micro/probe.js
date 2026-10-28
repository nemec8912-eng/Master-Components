/* Микроволновая печь: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 F1:[["вход L","acIn"],["выход","ac1"]],F3:[["от F1","ac1"],["к SW1","acA"]],SW1:[["от F3","acA"],["к нагрузкам (L*)","acS"]],SW3:[["L*","acS"],["N","nIn"]],
 RL2:[["катушка +12 В","v12"],["катушка (K2)","rc2"],["контакт COM (L*)","acS"],["контакт NO (нагрузки)","fanL"]],
 M1:[["L","fanL"],["N","nIn"]],M2:[["L","fanL"],["N","nIn"]],
 RL1:[["катушка +12 В","v12"],["катушка (K1)","rc1"],["контакт COM (L*)","acS"],["контакт NO","acR"]],
 F2:[["от RL1","acR"],["к T1","acM"]],T1:[["первичная (L)","acM"],["первичная (к SW2)","t1n"],["вторичная HV","hv"],["вторичная (корпус)","hvg"],["накал","fil"],["накал / катод","hvk"]],
 SW2:[["от T1","t1n"],["N","nIn"]],
 F4:[["от T1","hv"],["к C3","hv2"]],C3:[["от F4","hv2"],["катод магнетрона","hvk"]],R3:[["вывод 1 C3","hv2"],["вывод 2 C3","hvk"]],D4:[["анод (катод МГ)","hvk"],["катод (корпус)","hvg"]],
 MG1:[["катод K","hvk"],["накал F","fil"],["анод (корпус)","hvg"]],
 T2:[["первичная L","ac1"],["первичная N","nIn"],["вторичная 1","lv1"],["вторичная 2","lv2"]],BD1:[["~","lv1"],["~","lv2"],["+","v12"],["−","gnd"]],
 C1:[["+","v12"],["−","gnd"]],IC2:[["IN","v12"],["OUT","v5"],["GND","gnd"]],C2:[["+","v5"],["−","gnd"]],
 IC1:[["VDD","v5"],["MG","mgc"],["FAN","fanc"],["OSC1","osc"],["OSC2","osc"],["GND","gnd"]],ZQ1:[["OSC1","osc"],["OSC2","osc"]],
 R1:[["MG","mgc"],["база Q1","qb1"]],Q1:[["коллектор (K1)","rc1"],["база","qb1"],["эмиттер","gnd"]],D2:[["анод (K1)","rc1"],["катод (+12)","v12"]],
 R2:[["FAN","fanc"],["база Q2","qb2"]],Q2:[["коллектор (K2)","rc2"],["база","qb2"],["эмиттер","gnd"]],D3:[["анод (K2)","rc2"],["катод (+12)","v12"]]
};
function NODE(k){
  const s=S;
  switch(k){
   case"acIn":return[0,s.mains?230:0];case"ac1":return[0,s.pre?230:0];case"acA":return[0,s.ac?230:0];case"acS":return[0,s.acS?230:0];case"nIn":case"gnd":case"hvg":return[0,0];
   case"fanL":return[0,s.lampOn?230:0];case"acR":return[0,s.acS&&s.relayHot?230:0];case"acM":return[0,s.acS&&s.relayHot&&okp("F2")?230:0];case"t1n":return[0,s.acS&&s.relayHot&&okp("F2")&&!s.sw2?230:0];
   case"hv":return[0,s.t1On&&okp("T1")?2100:0];case"hv2":return[s.mgOn?-2000:0,s.t1On&&okp("T1")&&okp("F4")?2100:0];case"hvk":return[-s.bulk/2,s.mgOn?2000:0];case"fil":return[-s.bulk/2,s.t1On?3.3:0];
   case"lv1":case"lv2":return[0,s.board?6:0];case"v12":return[s.v12,is("C1","dry")?1.5:.05];case"v5":return[s.v5,0];case"osc":return[s.mcuOn?2.5:0,s.mcuOn?1:0];
   case"mgc":return[s.mgCmd?5:0,0];case"fanc":return[s.fanCmd?5:0,0];case"qb1":return[s.mgCmd&&okp("R1")?.7:0,0];case"qb2":return[s.fanCmd&&okp("R2")?.7:0,0];
   case"rc1":return[s.coil1?.1:s.v12,0];case"rc2":return[s.coil2?.1:s.v12,0];
  }
  return[0,0];
}
const ACN=new Set(["acIn","ac1","acA","acS","fanL","acR","acM","t1n","hv","lv1","lv2"]);
const SECN=new Set(["lv1","lv2","v12","v5","gnd","osc","mgc","fanc","qb1","qb2","rc1","rc2"]);
const MAINSN=new Set(["acIn","ac1","acA","acS","nIn","fanL","acR","acM","t1n"]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);
  if(MAINSN.has(n)||n==="lv1"||n==="lv2")return{lo:-400,hi:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="hv")return{lo:-3500,hi:3500,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="hvk"||n==="fil"||n==="hv2")return{lo:-4500,hi:500,u:"В",tb:"5 мс/дел",f:x=>s.mgOn?Math.min(0,-2000-2000*Math.sin(2*Math.PI*x*2)):dc};
  if(n==="osc")return{lo:0,hi:5,u:"В",tb:"0,1 мкс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*8)};
  if(n==="v12"&&is("C1","dry"))return{lo:0,hi:16,u:"В",tb:"5 мс/дел",f:x=>dc-ac*((x*4)%1)};
  const top=Math.max(1,Math.abs(dc)*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*6)};
}
