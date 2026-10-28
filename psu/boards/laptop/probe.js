/* Питание ноутбука: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 J1:[["+ (центр)","vin0"],["− (корпус)","gnd"]],F1:[["от гнезда","vin0"],["на плату","vf"]],D1:[["катод (+19)","vf"],["анод (земля)","gnd"]],C1:[["+19","vf"],["земля","gnd"]],
 R1:[["+19","vf"],["ACDET","acdet"]],R2:[["ACDET","acdet"],["земля","gnd"]],
 Q1:[["S (вход)","vf"],["G (ACDRV)","acdrv"],["D (между ключами)","vq"]],Q2:[["D (между ключами)","vq"],["G (ACDRV)","acdrv"],["S (к шунту)","vq"]],R3:[["от ключей","vq"],["VSYS","vsys"]],
 IC1:[["VCC","vsys"],["ACDET","acdet"],["ACDRV","acdrv"],["HIDRV","hidrv"],["LODRV","lodrv"],["SRP","chgo"],["SRN","vbat"],["BATDRV","batdrv"],["GND","gnd"]],
 Q3:[["D верхнего (VSYS)","vsys"],["G верхнего","hidrv"],["фаза (S верх. / D нижн.)","sw"],["G нижнего","lodrv"],["S нижнего (земля)","gnd"]],
 L1:[["фаза","sw"],["выход","chgo"]],R4:[["SRP","chgo"],["SRN (батарея)","vbat"]],Q5:[["D (VSYS)","vsys"],["G (BATDRV)","batdrv"],["S (батарея)","vbat"]],BT1:[["+","vbat"],["−","gnd"]],
 IC2:[["VIN","vsys"],["DRV5","drv5"],["FB5","v5"],["DRV3","drv3"],["FB3","v3"],["GND","gnd"]],
 Q6:[["D (VSYS)","vsys"],["G","drv5"],["фаза 5 В","sw5"]],L2:[["фаза","sw5"],["+5 В","v5"]],C2:[["+","v5"],["−","gnd"]],
 Q7:[["D (VSYS)","vsys"],["G","drv3"],["фаза 3 В","sw3"]],L3:[["фаза","sw3"],["+3,3 В","v3"]],C3:[["+","v3"],["−","gnd"]],
 IC3:[["VCC","v3"],["PWRBTN","btn"],["LED","ledk"],["VR_ON","vron"],["PG","pg"],["GND","gnd"]],R5:[["+3,3","v3"],["PWRBTN","btn"]],SW1:[["PWRBTN","btn"],["земля","gnd"]],
 R7:[["+3,3","v3"],["анод LED","leda"]],LED1:[["анод","leda"],["катод (к EC)","ledk"]],
 IC4:[["EN (VR_ON)","vron"],["PWM","gvc"],["PG","pg"]],Q8:[["VIN (VSYS)","vsys"],["PWM","gvc"],["фаза","swc"]],L4:[["фаза","swc"],["VCORE","vcore"]],C4:[["+","vcore"],["−","gnd"]]
};
function NODE(k){
  const s=S;
  switch(k){
   case"gnd":return[0,0];case"vin0":return[okp("J1")?s.vad:0,0];case"vf":return[s.vf,0];case"acdet":return[s.acdet,0];
   case"acdrv":return[s.acfet?s.vf-8:s.vf,0];case"vq":return[s.acfet?s.vf:(s.vf>1&&okp("Q1")?s.vf-.5:0),0];case"vsys":return[s.vsys,s.chg?.05:0];
   case"hidrv":case"lodrv":return[s.chg?(k==="hidrv"?s.vsys*.6+3:2.5):0,s.chg?2:0];case"sw":return[s.chg?s.vbat:(is("Q3","short")&&s.acfet?s.vsys:0),s.chg?6:0];
   case"chgo":return[s.chg?s.vbat+.02:(s.bat?s.vbat:0),0];case"vbat":return[is("Q3","short")&&s.acfet?s.vsys:s.vbat,0];case"batdrv":return[s.batRun?s.vsys-8:s.vsys,0];
   case"drv5":return[s.v5>4?3:0,s.v5>4?3:0];case"sw5":return[s.v5,s.v5>4?6:0];case"v5":return[s.v5,is("C2","dry")&&s.pwr?.4:(s.hic?1:0)];
   case"drv3":return[s.v3>3?3:0,s.v3>3?3:0];case"sw3":return[s.v3,s.v3>3?6:0];case"v3":return[s.v3,s.hic?.6:0];
   case"btn":return[okp("R5")&&s.v3>1?(is("SW1","stuck")?0:s.v3):0,0];case"leda":return[s.v3>1?(s.ledOn?1.9+.3:s.v3):0,0];case"ledk":return[s.ledOn?.2:(s.v3>1&&okp("R7")&&okp("LED1")?1.5:0),0];
   case"vron":return[s.pwr?3.3:0,0];case"pg":return[s.vcore>.9?3.3:0,0];case"gvc":return[s.vcore>.5?1.6:0,s.vcore>.5?1.6:0];case"swc":return[s.vcore,s.vcore>.5?8:0];case"vcore":return[s.vcore,0];
  }
  return[0,0];
}
const ACN=new Set([]);const MAINSN=new Set([]);
const SECN=new Set(Object.values(PINS).flat().map(p=>p[1]));
function wave(n){
  const s=S,[dc,ac]=NODE(n);const sq=(x,k,d)=>((x*k)%1)<d;
  if(["sw","sw5","sw3","swc"].includes(n)){const on={sw:s.chg,sw5:s.v5>4,sw3:s.v3>3,swc:s.vcore>.5}[n],top=n==="swc"||n==="sw"?s.vsys:s.vsys;const d={sw:.6,sw5:.27,sw3:.18,swc:.06}[n];
    return{lo:-2,hi:Math.max(5,top*1.2),u:"В",tb:"1 мкс/дел",f:x=>on?(sq(x,5,d)?top:0):dc}}
  if(["hidrv","lodrv","drv5","drv3","gvc"].includes(n))return{lo:-2,hi:30,u:"В",tb:"1 мкс/дел",f:x=>ac?(sq(x,5,n==="lodrv"?.4:.3)?(n==="hidrv"?s.vsys+5:5):0):0};
  if(n==="v5"&&s.hic)return{lo:0,hi:6,u:"В",tb:"20 мс/дел",f:x=>sq(x,2,.15)?2:0};
  if(n==="v3"&&s.hic)return{lo:0,hi:4,u:"В",tb:"20 мс/дел",f:x=>sq(x,2,.15)?1.2:0};
  const top=Math.max(1,Math.abs(dc)*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*6)};
}
