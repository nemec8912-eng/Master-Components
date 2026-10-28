/* Блок питания ATX: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 F1:[["вход L","acIn"],["выход","acF"]],TH1:[["от F1","acF"],["к мосту","acT"]],
 BD1:[["~ (L)","acT"],["~ (N)","nIn"],["+","bp"],["−","hg"]],
 C1:[["+","bp"],["−","mid"]],C2:[["+","mid"],["−","hg"]],R1:[["+310","bp"],["MID","mid"]],R2:[["MID","mid"],["GND1","hg"]],
 R3:[["+310","bp"],["затвор Q3","sbg"]],T2:[["первичная (+310)","bp"],["первичная (сток Q3)","sbd"],["обмотка 5 В","vsbr"],["обмотка VCC","auxa"]],
 Q3:[["D (сток)","sbd"],["G (затвор)","sbg"],["S (исток)","src"]],R4:[["исток Q3","src"],["GND1","hg"]],
 PC1:[["1 анод LED","vsb"],["2 катод LED","kled"],["4 коллектор","sbg"],["3 эмиттер","hg"]],R5:[["+5VSB","vsb"],["анод PC1","vsb"]],
 IC3:[["катод","kled"],["REF","ref"],["анод","cg"]],R6:[["+5VSB","vsb"],["REF","ref"]],R7:[["REF","ref"],["земля","cg"]],
 D5:[["анод","vsbr"],["катод","vsb"]],C5:[["+","vsb"],["−","cg"]],D4:[["анод","auxa"],["катод","vcc"]],C4:[["+","vcc"],["−","cg"]],
 IC1:[["12 VCC","vcc"],["6 RT","rt"],["5 CT","ct"],["14 VREF","vref"],["4 DTC","dtc"],["1 IN (ОС)","fbk"],["9 OUT1","o1"],["10 OUT2","o2"],["7 GND","cg"]],
 R8:[["RT","rt"],["земля","cg"]],C6:[["CT","ct"],["земля","cg"]],
 Q6:[["коллектор (VREF)","vref"],["база (PS_ON)","pson"],["эмиттер (DTC)","dtc"]],R9:[["+5VSB","vsb"],["PS_ON","pson"]],R10:[["DTC","dtc"],["земля","cg"]],C7:[["+ VREF","vref"],["− DTC","dtc"]],
 Q4:[["коллектор","dr1"],["база","o1"],["эмиттер","cg"]],Q5:[["коллектор","dr2"],["база","o2"],["эмиттер","cg"]],
 T3:[["первичная 1","dr1"],["средняя точка (VCC)","vcc"],["первичная 2","dr2"],["к базе Q1","b1"],["к базе Q2","b2"]],
 IC2:[["вход контроля","mon"],["выход PG","pg"],["питание","vsb"],["земля","cg"]],R13:[["+5VSB","vsb"],["PG","pg"]],
 Q1:[["коллектор (+310)","bp"],["база","b1"],["эмиттер (середина)","hb"]],Q2:[["коллектор (середина)","hb"],["база","b2"],["эмиттер","hg"]],
 T1:[["первичная (середина)","hb"],["первичная (к C3)","t1b"],["обмотка 12 В","s12"],["обмотка 5 В","s5"]],C3:[["от T1","t1b"],["MID","mid"]],
 D6:[["анод","s12"],["катод","k12"]],D7:[["анод","s5"],["катод","k5"]],L1:[["вход 12","k12"],["выход +12 В","v12"],["вход 5","k5"],["выход +5 В","v5"]],
 C8:[["+","v12"],["−","cg"]],C9:[["+","v5"],["−","cg"]],R11:[["+12 В","v12"],["ОС","fbk"]],R12:[["ОС","fbk"],["земля","cg"]]
};
function NODE(k){
  const s=S;
  switch(k){
   case"acIn":case"nIn":return[0,s.mains?230:0];case"acF":return[0,s.pre?230:0];case"acT":return[0,s.ac?230:0];
   case"bp":return[s.bulk,(is("C1","dry")||is("C2","dry")||is("BD1","open"))&&s.power?40:3];case"mid":return[s.c2v,0];case"hg":case"cg":return[0,0];
   case"sbd":return[s.sbOn?s.bulk:s.bulk,s.sbOn?120:0];case"sbg":return[s.sbOn?2.5:(okp("R3")?.3:0),s.sbOn?3:0];case"src":return[s.sbOn?.2:0,s.sbOn?.2:0];
   case"vsbr":return[s.vsb*.9,s.vsb>1?5:0];case"vsb":return[s.vsb,is("C5","dry")?.5:.02];case"kled":return[s.sbLed?2.2:(s.vsb>1?s.vsb-1.1:0),0];
   case"ref":{if(s.vsb<1)return[0,0];if(is("R6","open"))return[0,0];if(is("R7","open"))return[s.vsb,0];return[s.vsb/2,0]}
   case"auxa":return[s.vcc*.9,s.vcc>1?10:0];case"vcc":return[s.vcc,is("C4","dry")?1.5:.05];
   case"rt":return[s.icRun?3.6:0,0];case"ct":return[s.icRun?1.8:0,s.icRun?1:0];case"vref":return[s.vcc>7&&okp("IC1")?5:0,0];
   case"dtc":return[s.dtcHi&&s.vcc>7?4.3:(s.icRun?.1:0),0];case"pson":return[!okp("R9")?0:(st.tv?0:s.vsb),0];case"fbk":return[s.v12*4.7/28.7,0];
   case"o1":case"o2":return[s.drive?.7:0,s.drive?.5:0];case"dr1":case"dr2":return[s.vcc*(s.drive?.5:1),s.drive?s.vcc/2:0];
   case"b1":case"b2":return[0,s.drive&&okp("T3")?1.5:0];case"hb":return[s.bulk/2,s.power?150:0];case"t1b":return[s.c2v,s.power?140:0];
   case"s12":return[0,s.v12>1?25:0];case"s5":return[0,s.v5>1?11:0];case"k12":return[s.v12,s.v12>1?1:0];case"k5":return[s.v5,s.v5>1?.5:0];
   case"v12":return[s.v12,s.rip12?1.2:.03];case"v5":return[s.v5,s.rip5?.6:.02];case"pg":return[s.pg?5:0,0];case"mon":return[s.v5,0];
  }
  return[0,0];
}
const ACN=new Set(["acIn","acF","acT","nIn","s12","s5","b1","b2"]);
const SECN=new Set(["cg","vsbr","vsb","kled","ref","auxa","vcc","rt","ct","vref","dtc","pson","fbk","o1","o2","dr1","dr2","s12","s5","k12","k5","v12","v5","pg","mon"]);
const MAINSN=new Set(["acIn","acF","acT","nIn"]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);const sq=(x,k,d)=>((x*k)%1)<d;
  if(MAINSN.has(n))return{lo:-400,hi:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="hb")return{lo:-20,hi:340,u:"В",tb:"5 мкс/дел",f:x=>s.power?(sq(x,5,.5)?s.bulk:0):s.bulk/2};
  if(n==="sbd")return{lo:-20,hi:600,u:"В",tb:"5 мкс/дел",f:x=>s.sbOn?(sq(x,6,.4)?.5:s.bulk+120):s.bulk};
  if(n==="ct")return{lo:0,hi:4,u:"В",tb:"5 мкс/дел",f:x=>s.icRun?.3+3*((x*6)%1):0};
  if(n==="o1"||n==="o2")return{lo:0,hi:2,u:"В",tb:"5 мкс/дел",f:x=>s.drive?(sq(x+(n==="o2"?.1:0),5,.4)?.7:0):0};
  if(n==="s12"||n==="s5"||n==="b1"||n==="b2")return{lo:-40,hi:40,u:"В",tb:"5 мкс/дел",f:x=>{const y=(x*5)%1;return y<.4?ac:(y>=.5&&y<.9?-ac:0)}};
  if(n==="bp")return{lo:0,hi:350,u:"В",tb:"5 мс/дел",f:x=>dc-ac*((x*2)%1)};
  if(n==="vsb"&&is("C5","dry"))return{lo:0,hi:8,u:"В",tb:"5 мкс/дел",f:x=>dc+ac*((x*6)%1)};
  const top=Math.max(1,dc*1.4+ac*3);
  return{lo:0,hi:top,u:"В",tb:"5 мкс/дел",f:x=>dc+ac*Math.sin(2*Math.PI*x*6)};
}
