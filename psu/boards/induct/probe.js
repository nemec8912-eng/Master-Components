/* Индукционная плита: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 F1:[["вход L","acIn"],["выход","ac1"]],RV1:[["L","ac1"],["N","nIn"]],CX1:[["L","ac1"],["N","nIn"]],BD1:[["~ L","ac1"],["~ N","nIn"],["+","bp0"],["−","hbr"]],
 L2:[["от моста","bp0"],["шина","bp"]],C1:[["+","bp"],["−","hg"]],R8:[["шина","bp"],["к МК","usen"]],R4:[["от моста","hbr"],["GND","hg"]],
 L3:[["+310","bp"],["коллектор","col"]],C2:[["+310","bp"],["коллектор","col"]],Q1:[["C (коллектор)","col"],["G (затвор)","gate"],["E (эмиттер)","hg"]],
 R2:[["DRV","drv"],["затвор","gate"]],ZD1:[["катод (затвор)","gate"],["анод","hg"]],R3:[["затвор","gate"],["эмиттер","hg"]],R5:[["коллектор","col"],["VCE","vce"]],R6:[["VCE","vce"],["земля","gnd"]],
 IC2:[["IN (+310)","bp"],["OUT +18","v18"],["GND","gnd"]],C3:[["+","v18"],["−","gnd"]],IC3:[["IN","v18"],["OUT","v5"],["GND","gnd"]],C4:[["+","v5"],["−","gnd"]],
 IC1:[["VDD","v5"],["PWM","pwm"],["FAN","fanc"],["T1","t1"],["T2","t2"],["GND","gnd"]],
 Q2:[["коллектор (+18)","v18"],["база","drvin"],["эмиттер (DRV)","drv"]],Q3:[["эмиттер (DRV)","drv"],["база","drvin"],["коллектор","gnd"]],
 IC4:[["VCE","vce"],["PWM","pwm"],["ISEN","isen"],["USET","usen"],["OUT","drvin"],["PAN","pan"]],
 R9:[["+5","v5"],["T1","t1"]],RT1:[["T1","t1"],["земля","gnd"]],R10:[["+5","v5"],["T2","t2"]],RT2:[["T2","t2"],["земля","gnd"]],
 R7:[["FAN","fanc"],["база Q4","fanb"]],Q4:[["коллектор","fanm"],["база","fanb"],["эмиттер","gnd"]],M1:[["+18","v18"],["−","fanm"]]
};
function ntcV(Tread){if(Tread<-20)return 5;if(Tread>250)return 0;const R=100000*Math.exp(3950*(1/(Tread+273)-1/298));return 5*R/(R+10000)}
function NODE(k){
  const s=S;
  switch(k){
   case"acIn":case"nIn":return[0,s.mains?230:0];case"ac1":return[0,s.pre?230:0];case"hg":case"gnd":return[0,0];
   case"bp0":case"bp":return[s.bus*.64,s.bus*.32];case"hbr":return[s.heat?-.09:0,0];case"usen":return[okp("R8")?s.bus*.012:0,0];case"isen":return[s.heat?-.09:0,0];
   case"col":return[s.bus*.64,s.heat?420:0];case"gate":return[s.drv?8:0,s.drv?8:0];case"drv":return[s.drv?8:0,s.drv?8:0];case"vce":return[s.bus>20&&okp("R5")?s.bus*.006:0,0];
   case"v18":return[s.v18,is("C3","dry")&&s.heat?2.5:.05];case"v5":return[s.v5,0];case"pwm":return[s.drv?2.5:0,s.drv?2.5:0];case"drvin":return[s.drv?9:0,s.drv?9:0];case"pan":return[s.heat?5:0,0];
   case"fanc":return[s.fan||(s.mcu&&st.tv)?5:0,0];case"fanb":return[s.fan?.7:0,0];case"fanm":return[s.fan?.2:s.v18,0];
   case"t1":return[s.v5>1?ntcV(s.tGl)*s.v5/5:0,0];case"t2":return[s.v5>1?ntcV(s.tQr)*s.v5/5:0,0];
  }
  return[0,0];
}
const ACN=new Set(["acIn","ac1","nIn"]);
const SECN=new Set(["v5","t1","t2","pwm","fanc","pan","gnd"]);
const MAINSN=new Set(["acIn","ac1","nIn"]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);const sq=(x,k,d)=>((x*k)%1)<d;
  if(MAINSN.has(n))return{lo:-400,hi:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="bp"||n==="bp0")return{lo:0,hi:350,u:"В",tb:"5 мс/дел",f:x=>s.bus?Math.abs(310*Math.sin(2*Math.PI*x*2)):0};
  if(n==="col")return{lo:-50,hi:1200,u:"В",tb:"10 мкс/дел",f:x=>{if(!s.bus)return 0;if(!s.heat)return s.bus;const y=(x*4)%1;const top=s.sync?900:1100;return y<.35?(s.sync?0:-30):top*Math.sin(Math.PI*(y-.35)/.65)}};
  if(["gate","drv","drvin","pwm"].includes(n))return{lo:-2,hi:20,u:"В",tb:"10 мкс/дел",f:x=>s.drv?(sq(x,4,.35)?(n==="pwm"?5:16):0):0};
  const top=Math.max(1,Math.abs(dc)*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*6)};
}
