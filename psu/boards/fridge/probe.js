/* Холодильник: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 F1:[["вход L","ac0"],["выход","ac1"]],RV1:[["L","ac1"],["N","n0"]],T1:[["сеть L","ac1"],["сеть N","n0"],["вторичка 1","s1"],["вторичка 2","s2"]],
 BD1:[["~1","s1"],["~2","s2"],["+","vr"],["−","gnd"]],C1:[["+","vr"],["−","gnd"]],IC1:[["IN","vr"],["OUT +12","v12"],["GND","gnd"]],
 IC2:[["IN","v12"],["OUT +5","v5"],["GND","gnd"]],C2:[["+","v5"],["−","gnd"]],
 RL1:[["катушка +12","v12"],["катушка −","c1"],["контакт L","ac1"],["контакт на компрессор","cm"]],Q1:[["коллектор","c1"],["база","b1"],["эмиттер","gnd"]],
 R1:[["COMP (МК)","comp"],["база Q1","b1"]],D1:[["анод","c1"],["катод (+12)","v12"]],F2:[["от реле","cm"],["к компрессору","k"]],
 M1:[["C (общий)","k"],["R (рабочая)","n0"],["S (пусковая)","st"]],RT1:[["S","st"],["N","n0"]],
 IC3:[["VDD","v5"],["T КАМ","t1"],["T ИСП","t2"],["DOOR","door"],["COMP","comp"],["DEF","def"],["FAN","fan"],["GND","gnd"]],
 R2:[["+5","v5"],["T КАМ","t1"]],RT2:[["T КАМ","t1"],["GND","gnd"]],R3:[["+5","v5"],["T ИСП","t2"]],RT3:[["T ИСП","t2"],["GND","gnd"]],SW1:[["DOOR","door"],["GND","gnd"]],
 RL2:[["катушка +12","v12"],["катушка −","c2"],["контакт L","ac1"],["контакт на ТЭН","hc"]],Q2:[["коллектор","c2"],["база","b2"],["эмиттер","gnd"]],
 R5:[["DEF (МК)","def"],["база Q2","b2"]],D2:[["анод","c2"],["катод (+12)","v12"]],F3:[["от реле","hc"],["к ТЭНу","hf"]],EH1:[["L","hf"],["N","n0"]],
 M2:[["+12","v12"],["−","fanm"]],Q3:[["коллектор","fanm"],["база","fanb"],["эмиттер","gnd"]],R6:[["FAN (МК)","fan"],["база Q3","fanb"]]
};
function ntcV(T){if(T<-40)return 5;if(T>90)return 0;const R=ntcR(T);return 5*R/(R+10000)}
function NODE(k){
  const s=S;
  switch(k){
   case"ac0":return[0,s.mains?230:0];case"ac1":return[0,s.pre?230:0];case"n0":case"gnd":return[0,0];
   case"s1":return[0,s.ac&&okp("T1")?14:0];case"s2":return[0,0];case"vr":return[s.vr?(is("C1","dry")&&s.c1On?11:s.vr):0,is("C1","dry")?3.5:(s.vr?.3:0)];
   case"v12":return[s.v12,0];case"v5":return[s.v5,0];
   case"comp":return[s.mcu&&s.compCmd?5:0,0];case"b1":return[s.c1On&&!is("Q1","short")?.7:0,0];case"c1":return[s.c1On?.15:s.v12,0];
   case"cm":return[0,s.rl1C&&s.ac?230:0];case"k":return[0,s.rl1C&&s.ac&&okp("F2")&&!s.kOpen?(s.hum?205:228):0];case"st":return[0,s.starting?200:(s.run?140:0)];
   case"t1":return[s.v5>1?ntcV(s.tCr)*s.v5/5:0,0];case"t2":return[s.v5>1?ntcV(s.tEr)*s.v5/5:0,0];case"door":return[s.v5>1?(s.doorSw?0:4.9):0,0];
   case"def":return[s.mcu&&s.defrost?5:0,0];case"b2":return[s.c2On&&!is("Q2","short")?.7:0,0];case"c2":return[s.c2On?.15:s.v12,0];
   case"hc":return[0,s.rl2C&&s.ac?230:0];case"hf":return[0,s.rl2C&&s.ac&&okp("F3")?230:0];
   case"fan":return[s.mcu&&s.compCmd&&!s.defrost&&s.doorSw&&s.on?5:0,0];case"fanb":return[s.fan?.7:0,0];case"fanm":return[s.fan?.2:s.v12,0];
  }
  return[0,0];
}
const MAINSN=new Set(["ac0","ac1","n0","cm","k","st","hc","hf"]);
const ACN=new Set(["ac0","ac1","n0","cm","k","st","hc","hf","s1","s2"]);
const SECN=new Set(["s1","s2","vr","gnd","v12","v5","comp","b1","c1","t1","t2","door","def","b2","c2","fan","fanb","fanm"]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);
  if(ACN.has(n))return{lo:-400,hi:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="vr")return{lo:0,hi:22,u:"В",tb:"5 мс/дел",f:x=>dc?dc+ac*(((x*4)%1)-.5):0};
  const top=Math.max(1,Math.abs(dc)*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*6)};
}
