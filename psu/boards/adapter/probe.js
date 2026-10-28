/* Адаптер 12 В: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 F1:[["вход (от вилки)","acIn"],["выход","acF"]],RV1:[["L","acF"],["N","nIn"]],CX1:[["L","acF"],["N","nIn"]],
 LF1:[["вход L","acF"],["выход L","acLF"]],TH1:[["вход","acLF"],["выход","acT"]],
 BD1:[["+","bplus"],["−","hg0"],["~ L","acT"],["~ N","nLF"]],C1:[["+","bplus"],["−","hg0"]],
 R1:[["B+","bplus"],["VCC","vcc"]],C2:[["+","vcc"],["−","hg0"]],R2:[["обмотка подпитки","auxAC"],["к D2","auxR"]],D2:[["анод","auxR"],["катод (VCC)","vcc"]],
 IC1:[["8 VREF","vref"],["4 RT/CT","rtct"],["2 FB","hg0"],["1 COMP","comp"],["7 VCC","vcc"],["6 OUT","gateIC"],["3 CS","csPin"],["5 GND","hg0"]],
 R3:[["VREF","vref"],["RT/CT","rtct"]],C3:[["RT/CT","rtct"],["земля","hg0"]],C4:[["VREF","vref"],["земля","hg0"]],
 PC1:[["анод LED","ledA"],["катод LED","tlK"],["коллектор (COMP)","comp"],["эмиттер","hg0"]],
 R5:[["шунт","cs"],["вывод CS","csPin"]],C6:[["вывод CS","csPin"],["земля","hg0"]],
 Q1:[["сток D","drain"],["затвор G","gateQ"],["исток S","cs"]],R7:[["OUT UC3842","gateIC"],["затвор","gateQ"]],R8:[["затвор","gateQ"],["исток","cs"]],
 R6:[["исток Q1","cs"],["земля","hg0"]],D3:[["анод (сток)","drain"],["катод","snub"]],R9:[["B+","bplus"],["снаббер","snub"]],C7:[["B+","bplus"],["снаббер","snub"]],
 T1:[["первичка (B+)","bplus"],["первичка (сток)","drain"],["вторичка","sec"],["подпитка","auxAC"]],CY1:[["горячая земля","hg0"],["холодная земля","cg0"]],
 D4:[["анод (обмотка)","sec"],["катод","v12r"]],C8:[["+","v12r"],["−","cg0"]],L1:[["вход","v12r"],["выход","v12"]],C9:[["+","v12"],["−","cg0"]],
 R10:[["+12 В","v12"],["земля","cg0"]],R11:[["+12 В","v12"],["анод LED1","indA"]],LED1:[["анод","indA"],["катод","cg0"]],
 R12:[["+12 В","v12"],["делитель","div"]],R13:[["делитель","div"],["земля","cg0"]],IC2:[["катод","tlK"],["анод","cg0"],["опорный","div"]],R14:[["+12 В","v12"],["анод LED PC1","ledA"]]
};
function NODE(k){
  const s=S,b=s.bulk;
  switch(k){
   case"hg0":case"cg0":case"nIn":case"nLF":return[0,0];
   case"acIn":return[0,s.mains?230:0];case"acF":return[0,s.pre?230:0];case"acLF":return[0,s.afterLF?230:0];case"acT":return[0,s.inPath?230:0];
   case"bplus":return[b,is("C1","dry")&&st.tv&&s.sw0?25:(s.sw0?3:.5)];
   case"drain":return[b,s.sw0?190:0];case"snub":return[b>20?b+(s.sw0?(okp("R9")?90:240):0):0,0];
   case"gateIC":return[s.gp?4.6:0,s.gp?5.2:0];case"gateQ":return[s.gp&&okp("R7")?4.6:0,s.gp&&okp("R7")?5.2:0];
   case"cs":return[s.sw0&&okp("R6")?.25:0,0];case"csPin":return[okp("R5")?(s.sw0?.22:0):(s.icOn?1.1:0),0];
   case"vcc":return[s.vcc,0];case"auxAC":return[0,s.auxOK?15:(s.sw0?4:0)];case"auxR":return[s.auxOK?s.vcc+.7:0,0];
   case"vref":return[s.icOn&&!is("C4","short")&&!is("IC1","dead")?5:0,0];case"rtct":return[s.icOn&&s.osc?1.7:0,s.icOn&&s.osc?.6:0];
   case"comp":return[s.icOn?(s.compLow?.2:(s.led2?2.3:5.5)):0,0];
   case"sec":return[0,s.sw0&&!s.outShort?14:0];case"v12r":return[s.v12r,s.rip];case"v12":return[s.v12,s.rip];
   case"div":return[is("R12","open")?0:(is("R13","open")?s.v12:s.v12*2.7/12.7),0];
   case"ledA":return[okp("R14")?(s.led2?s.v12-1:s.v12):0,0];case"tlK":return[s.led2?2.2:(okp("R14")?s.v12:0),0];
   case"indA":return[okp("R11")?(s.ind?2.1:s.v12):0,0];
  }
  return[0,0];
}
const ACN=new Set(["acIn","acF","acLF","acT","auxAC","sec"]);
const SECN=new Set(["cg0","sec","v12r","v12","div","ledA","tlK","indA"]);
const MAINSN=new Set(["acIn","acF","acLF","acT","nIn","nLF"]);
function wave(n){
  const s=S,b=s.bulk,[dc,ac]=NODE(n);const sq=(x,k,d)=>((x*k)%1)<d;
  if(["acIn","acF","acLF","acT"].includes(n))return{lo:-400,hi:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="drain")return{lo:0,hi:650,u:"В",tb:"5 мкс/дел",f:x=>{if(!s.sw0)return b;const p=(x*5)%1;if(p<.4)return 2;if(p<.75)return b+100+(okp("D3")&&okp("C7")?60:220)*Math.exp(-(p-.4)*40);return b+25*Math.sin((p-.75)*60)*Math.exp(-(p-.75)*8)}};
  if(n==="gateIC"||n==="gateQ")return{lo:0,hi:15,u:"В",tb:"5 мкс/дел",f:x=>dc>0?(sq(x,5,.4)?12:0):0};
  if(n==="cs"||n==="csPin")return{lo:0,hi:1.2,u:"В",tb:"5 мкс/дел",f:x=>s.sw0&&sq(x,5,.4)?((x*5)%1)/.4*.9:0};
  if(n==="rtct")return{lo:0,hi:3.5,u:"В",tb:"5 мкс/дел",f:x=>dc>0?1.2+1.6*(((x*5)%1)<.85?((x*5)%1)/.85:1-(((x*5)%1)-.85)/.15):0};
  if(n==="vcc")return{lo:0,hi:20,u:"В",tb:"500 мс/дел",f:x=>s.auxOK?s.vcc:(s.icOn||s.vcc>1?(okp("R1")&&!is("C2","short")?10+6*((x*2.5)%1):s.vcc):0)};
  if(n==="auxAC"||n==="sec")return{lo:-40,hi:40,u:"В",tb:"5 мкс/дел",f:x=>ac>0?(sq(x,5,.4)?-ac*1.6:ac*1.1):0};
  if(n==="snub")return{lo:0,hi:650,u:"В",tb:"5 мкс/дел",f:x=>dc};
  const top=Math.max(1,dc*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:ac>.2?"2 мс/дел":"1 мс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*(ac>.2?5:12))};
}
