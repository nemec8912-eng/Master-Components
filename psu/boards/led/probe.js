/* Драйвер LED-подсветки: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 F1:[["вход (от БП)","vin0"],["выход","vin"]],C1:[["+","vin"],["−","cg0"]],R1:[["24 В","vin"],["VCC","vcc"]],ZD1:[["катод","vcc"],["анод","cg0"]],C2:[["+","vcc"],["−","cg0"]],
 R2:[["BL_ON","blon"],["ENA","ena"]],R3:[["ENA","ena"],["земля","cg0"]],R4:[["DIM","dim"],["PWM","dimo"]],
 L1:[["вход 24 В","vin"],["выход (сток Q1)","sw"]],Q1:[["сток D","sw"],["затвор G","gateQ"],["исток S","isen"]],R5:[["GATE IC1","gate"],["затвор Q1","gateQ"]],R6:[["исток Q1","isen"],["земля","cg0"]],
 D1:[["анод","sw"],["катод (LED+)","ledp"]],C4:[["+","ledp"],["−","cg0"]],R7:[["LED+","ledp"],["OVP","ovp"]],R8:[["OVP","ovp"],["земля","cg0"]],
 IC1:[["VCC","vcc"],["ENA","ena"],["PWM","dimo"],["RT","rt"],["COMP","comp"],["GATE","gate"],["ISEN","isen"],["OVP","ovp"],["FB1","fb1"],["FB2","fb2"],["PWMO","pwmo"],["GND","cg0"]],
 C5:[["COMP","comp"],["земля","cg0"]],R10:[["RT","rt"],["земля","cg0"]],
 LB1:[["анод (LED+)","ledp"],["катод","ab"]],LB2:[["анод","ab"],["катод","dA"]],Q2:[["сток D","dA"],["затвор G","pwmo"],["исток S","fb1"]],R11:[["FB1","fb1"],["земля","cg0"]],
 LB3:[["анод (LED+)","ledp"],["катод","cd"]],LB4:[["анод","cd"],["катод","dB"]],Q3:[["сток D","dB"],["затвор G","pwmo"],["исток S","fb2"]],R12:[["FB2","fb2"],["земля","cg0"]]
};
function chainNodes(L1,L2,Q,R,i){const v=S.vout,parts=[L1,L2,Q,R];const brk=parts.findIndex(id=>(id===Q?is(id,"open"):!okp(id)));
  const norm=[v,v-54,Math.max(.3,v-108),i*10];if(brk<0)return norm;return norm.map((x,k)=>k<=brk?v:0)}
function NODE(k){
  const s=S;
  switch(k){
   case"cg0":return[0,0];case"vin0":return[s.mains?24:0,0];case"vin":return[s.vin,s.flick?.3:.04];case"vcc":return[s.vcc,is("C2","dry")&&s.run?1.5:0];
   case"blon":return[st.tv?3.3:0,0];case"ena":return[s.en?(okp("R3")?1.65:3.3):0,0];case"dim":return[st.tv?3.3:0,0];case"dimo":return[s.dim?3.3:0,0];
   case"sw":return[s.run?s.vin:(s.vin>1&&okp("L1")?s.vin:0),s.run?55:0];case"gate":return[s.run?5:0,s.run?5:0];case"gateQ":return[s.run&&okp("R5")?5:0,s.run&&okp("R5")?5:0];
   case"isen":return[s.run&&okp("R6")?.15:0,0];case"ledp":return[s.vout,is("C4","dry")&&s.run?4:.2];
   case"ovp":return[!okp("R7")?0:(is("R8","open")?s.vout:s.vout*10/1010),0];case"rt":return[s.icOK?1.2:0,0];case"comp":return[s.run?2:(s.vcc>9?.3:0),0];case"pwmo":return[s.run?5:0,0];
   case"ab":return[chainNodes("LB1","LB2","Q2","R11",s.iA)[1],0];case"dA":return[chainNodes("LB1","LB2","Q2","R11",s.iA)[2],0];case"fb1":return[chainNodes("LB1","LB2","Q2","R11",s.iA)[3],0];
   case"cd":return[chainNodes("LB3","LB4","Q3","R12",s.iB)[1],0];case"dB":return[chainNodes("LB3","LB4","Q3","R12",s.iB)[2],0];case"fb2":return[chainNodes("LB3","LB4","Q3","R12",s.iB)[3],0];
  }
  return[0,0];
}
const ACN=new Set([]);
const SECN=new Set(Object.values(PINS).flat().map(p=>p[1]));
const MAINSN=new Set([]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);const sq=(x,k,d)=>((x*k)%1)<d;
  if(n==="sw")return{lo:0,hi:160,u:"В",tb:"2 мкс/дел",f:x=>s.run?(sq(x,6,.75)?.5:s.vout+.5):dc};
  if(n==="gate"||n==="gateQ")return{lo:0,hi:8,u:"В",tb:"2 мкс/дел",f:x=>dc>0?(sq(x,6,.75)?5:0):0};
  if(n==="isen")return{lo:0,hi:.4,u:"В",tb:"2 мкс/дел",f:x=>s.run&&sq(x,6,.75)?((x*6)%1)/.75*.3:0};
  const top=Math.max(1,dc*1.3+ac*3);
  return{lo:0,hi:top,u:"В",tb:ac>.2?"2 мс/дел":"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*(ac>.2?5:12))};
}
