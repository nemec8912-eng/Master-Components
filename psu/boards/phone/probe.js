/* Цепь зарядки телефона: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 J1:[["VBUS","vbus"],["CC1","cc1"],["CC2","cc2"],["GND","gnd"]],R1:[["CC1","cc1"],["земля","gnd"]],R2:[["CC2","cc2"],["земля","gnd"]],
 F1:[["VBUS","vbus"],["после F1","vf"]],D1:[["катод","vf"],["анод (земля)","gnd"]],C1:[["+","vf"],["−","gnd"]],
 IC2:[["IN","vf"],["OUT","vin"],["GND","gnd"]],C2:[["+","vin"],["−","gnd"]],
 IC1:[["VBUS","vin"],["ILIM","ilim"],["TS","ts"],["REGN","regn"],["SW","swn"],["SYS","vsys"],["BAT","vbatp"],["STAT","stat"],["GND","gnd"]],
 R3:[["ILIM","ilim"],["земля","gnd"]],R4:[["REGN","regn"],["TS","ts"]],L1:[["SW","swn"],["SYS","vsys"]],C3:[["SYS","vsys"],["земля","gnd"]],C4:[["BAT","vbatp"],["земля","gnd"]],
 J2:[["+ (плата)","vbatp"],["NTC (плата)","ts"],["− (плата)","gnd"],["+ (АКБ)","pp"],["NTC (АКБ)","ntc"],["− (АКБ)","pm"]],RT1:[["NTC","ntc"],["−","pm"]],
 R5:[["+ АКБ","pp"],["VCC DW01","dvcc"]],IC3:[["VCC","dvcc"],["GND (− ячейки)","cm"],["OD","od"],["CS","pm"]],
 BT1:[["+","pp"],["−","cm"]],Q1:[["сток (− ячейки)","cm"],["затворы (OD)","od"],["исток (− платы)","pm"]],
 R6:[["VSYS","vsys"],["анод D2","leda"]],D2:[["анод","leda"],["катод (STAT)","stat"]]
};
function NODE(k){
  const s=S;
  switch(k){
   case"gnd":case"pm":return[0,0];case"vbus":return[s.vbus,0];case"vf":return[okp("F1")?s.vbus:0,0];case"vin":return[s.vin,0];
   case"cc1":return[s.mains&&!s.flip?(okp("R1")?.42:1.7):0,0];case"cc2":return[s.mains&&s.flip?(okp("R2")?.42:1.7):0,0];
   case"ilim":return[s.pmic?(okp("R3")?.8:2.5):0,0];case"regn":return[s.pmic?4.8:0,0];
   case"ts":{if(!s.pmic)return[0,0];if(!okp("R4"))return[0,0];if(!okp("RT1")||!okp("J2"))return[4.8,0];if(is("RT1","short"))return[0,0];return[2.4,0]}
   case"ntc":return[s.pmic&&okp("J2")&&okp("RT1")&&okp("R4")?(is("RT1","short")?0:2.4):0,0];
   case"swn":return[s.buck?s.vbat:0,s.buck?2.5:0];case"vsys":return[s.vsys,0];case"vbatp":return[s.batConn||s.lab?s.vbat:(s.buck?s.vsys:0),0];
   case"pp":return[s.vbat,0];case"cm":return[s.batConn?0:(is("BT1","open")?0:-s.vbat*0),0];case"dvcc":return[okp("R5")?s.vbat:0,0];case"od":return[s.batConn?s.vbat:0,0];
   case"stat":return[s.ledOn?.1:(s.vsys>1?s.vsys-1.8:0),0];case"leda":return[s.ledOn?2:s.vsys,0];
  }
  return[0,0];
}
const ACN=new Set([]);const SECN=new Set(Object.values(PINS).flat().map(p=>p[1]));const MAINSN=new Set([]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);const sq=(x,k,d)=>((x*k)%1)<d;
  if(n==="swn")return{lo:-1,hi:6,u:"В",tb:"0,5 мкс/дел",f:x=>s.buck?(sq(x,6,.75)?s.vin:0):0};
  const top=Math.max(1,dc*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*6)};
}
