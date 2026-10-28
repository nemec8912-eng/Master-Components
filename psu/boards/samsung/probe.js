/* Samsung BN44: выводы деталей, напряжения узлов, формы сигналов */
/* pins: [label,node] — node voltages vs ground (hot ground on primary, cold on secondary, N for mains parts) */
const PINS={
 F1:[["вход (от вилки)","acIn"],["выход","acF"]],RV1:[["L","acF"],["N","nIn"]],CX1:[["L","acF"],["N","nIn"]],
 R1:[["L","acF"],["середина","acHalf"]],R2:[["середина","acHalf"],["N","nIn"]],LF1:[["вход L","acF"],["выход L","acLF"]],
 CX2:[["L","acLF"],["N","nLF"]],CY1:[["L","acLF"],["PE","pe0"]],CY2:[["N","nLF"],["PE","pe0"]],TH1:[["вход","acLF"],["выход","acT"]],
 BD1:[["+","rect"],["−","hg0"],["~ L","acT"],["~ N","nLF"]],C2:[["+","rect"],["−","hg0"]],LP1:[["вход (от моста)","rect"],["выход (сток Q1)","drain1"]],
 D1:[["анод (сток Q1)","drain1"],["катод (B+)","bplus"]],D2:[["анод (мост)","rect"],["катод (B+)","bplus"]],
 Q1:[["сток D","drain1"],["затвор G","q1g"],["исток S","cs1"]],R3:[["от IC1 (OUT)","gate1"],["к затвору Q1","q1g"]],
 R4:[["затвор Q1","q1g"],["земля","hg0"]],R5:[["исток Q1","cs1"],["земля","hg0"]],C1:[["+","bplus"],["−","hg0"]],
 IC1:[["VCC","vccM"],["COMP","comp"],["ZCD","zcdA"],["OUT","gate1"],["CS","cs1"],["INV","fb1"],["GND","hg0"]],
 C3:[["+","vccM"],["−","hg0"]],C4:[["COMP","comp"],["земля","hg0"]],R10:[["вывод ZCD","zcdA"],["обмотка LP1","zcdB"]],
 R6:[["B+","bplus"],["середина","div1"]],R7:[["середина","div1"],["INV","fb1"]],R9:[["INV","fb1"],["земля","hg0"]],
 IC2:[["D (сток)","sdrain"],["VCC","vccS"],["FB","fb2"],["CS","cs2"],["GND","hg0"]],
 T1:[["B+ (первичка)","bplus"],["сток (первичка)","sdrain"],["вторичка","sec5"],["обм. питания","auxAC"]],
 R11:[["B+","bplus"],["снаббер","snub"]],C5:[["B+","bplus"],["снаббер","snub"]],D3:[["анод (сток)","sdrain"],["катод (снаббер)","snub"]],
 R8:[["CS","cs2"],["земля","hg0"]],C9:[["FB","fb2"],["земля","hg0"]],D4:[["анод (обмотка)","auxAC"],["катод","vccAux"]],
 R12:[["от D4","vccAux"],["VCC IC2","vccS"]],C6:[["+","vccS"],["−","hg0"]],D5:[["анод (обмотка)","sec5"],["катод","v5raw"]],
 C7:[["+","v5raw"],["−","cg0"]],L1:[["вход","v5raw"],["выход A5V","a5v"]],C8:[["+","a5v"],["−","cg0"]],
 R13:[["A5V","a5v"],["делитель","div5"]],R14:[["делитель","div5"],["земля","cg0"]],IC4:[["катод","tl1k"],["анод","cg0"],["опорный","div5"]],
 R15:[["A5V","a5v"],["анод LED PC1","led1a"]],PC1:[["анод LED","led1a"],["катод LED","tl1k"],["коллектор (FB IC2)","fb2"],["эмиттер","hg0"]],
 R16:[["PS-ON","pson"],["база Q2","q2b"]],R17:[["A5V","a5v"],["анод LED PC3","l3a"]],Q2:[["коллектор","q2c"],["база","q2b"],["эмиттер","cg0"]],
 PC3:[["анод LED","l3a"],["катод LED","q2c"],["коллектор","q3b2"],["эмиттер","hg0"]],R18:[["база Q3","q3b"],["коллектор PC3","q3b2"]],
 R22:[["эмиттер Q3","vccS"],["база Q3","q3b"]],Q3:[["эмиттер","vccS"],["база","q3b"],["коллектор (VCC-M)","vccM"]],
 ZD1:[["катод","vccM"],["анод","hg0"]],C16:[["+","vccM"],["−","hg0"]],
 IC3:[["VCC","vccM"],["RT","rt"],["FB","fb3"],["HO","ho"],["VB","vb"],["VS","mid"],["LO","lo"],["GND","hg0"]],
 C12:[["+","vccM"],["−","hg0"]],R21:[["RT","rt"],["земля","hg0"]],PC2:[["анод LED","l2a"],["катод LED","tl2k"],["коллектор (FB IC3)","fb3"],["эмиттер","hg0"]],
 R19:[["HO IC3","ho"],["затвор Q4","gHi"]],R20:[["LO IC3","lo"],["затвор Q5","gLo"]],
 Q4:[["сток (B+)","bplus"],["затвор","gHi"],["исток (середина)","mid"]],Q5:[["сток (середина)","mid"],["затвор","gLo"],["исток","hg0"]],
 D6:[["анод (VCC-M)","vccM"],["катод (VB)","vb"]],C10:[["VB","vb"],["VS (середина)","mid"]],C11:[["середина","mid"],["к обмотке T2","crB"]],
 T2:[["первичка","crB"],["вторичка 13 В","t2a"],["обмотка 24 В","t24"]],
 D7:[["анод (обмотка)","t2a"],["катод (+13 В)","v13"]],C13:[["+","v13"],["−","cg0"]],C14:[["+","v13"],["−","cg0"]],R26:[["+13 В","v13"],["земля","cg0"]],
 D9:[["анод (обмотка)","t24"],["катод (+24 В)","v24"]],C15:[["+","v24"],["−","cg0"]],
 R23:[["+13 В","v13"],["делитель","div13"]],R24:[["делитель","div13"],["земля","cg0"]],IC5:[["катод","tl2k"],["анод","cg0"],["опорный","div13"]],
 R25:[["+13 В","v13"],["анод LED PC2","l2a"]]
};
function NODE(k){
  const s=S,b=s.bulk,on=s.llcOut,sb=s.sbyOn;
  switch(k){
   case"hg0":case"cg0":case"pe0":case"nIn":case"nLF":return[0,0];
   case"acIn":return[0,s.mains?230:0];case"acF":return[0,s.pre?230:0];case"acHalf":return[0,s.pre?115:0];
   case"acLF":return[0,s.afterLF?230:0];case"acT":return[0,s.inPath?230:0];
   case"rect":return[s.rectOK?(s.pfcBoost?207:Math.max(0,b-2)):0,s.rectOK?(s.pfcBoost?96:9):0];
   case"drain1":return[s.pfcSw?(s.pfcBoost?207:120):(s.rectOK?Math.max(0,b-2):0),s.pfcSw?185:0];
   case"bplus":return[b,(is("C1","dry")&&on)?28:(on?4:1)];
   case"gate1":{const g=s.pfcIC&&s.rectOK;return[g?6.1:0,g?5.6:0]}case"q1g":return[okp("R3")&&s.pfcSw?6.1:0,okp("R3")&&s.pfcSw?5.6:0];
   case"cs1":return[s.pfcSw&&okp("R5")?.24:0,0];case"comp":return[s.pfcIC?2.4:0,0];
   case"zcdA":return[okp("R10")&&s.pfcSw?.9:0,0];case"zcdB":return[s.pfcSw?1.1:0,s.pfcSw?14:0];
   case"fb1":return[Math.min(s.fbv,6.2),0];
   case"div1":return[okp("R6")?(okp("R7")&&okp("R9")?b*.336*(is("R6","drift")?.92:1):b):0,0];
   case"vccM":return[s.vccM,is("C16","dry")?2.5:0];case"vccS":return[s.vccS,is("C6","dry")?6:.1];
   case"vccAux":return[sb?17.2:(s.sbyMode==="hic"?3:0),0];case"auxAC":return[0,sb?14:0];
   case"sdrain":return[b,sb?120:0];case"snub":return[b>20?b+(sb?(okp("R11")?70:160):0):0,0];
   case"fb2":return[is("C9","short")?0:(sb?(s.led1?1.4:4.3):0),0];case"cs2":return[sb?.22:0,0];
   case"sec5":return[0,sb?5.6:0];case"v5raw":return[s.v5raw,is("C7","dry")?.45:.01];case"a5v":return[s.a5v,is("C7","dry")?.3:.005];
   case"div5":{const a=s.a5v;return[is("R13","open")?0:(is("R14","open")?a:a/2),0]}
   case"led1a":{const a=s.a5v;return[is("R15","open")?0:(s.led1?a-.35:a),0]}
   case"tl1k":return[s.led1?2:(is("R15","open")?0:s.a5v),0];
   case"pson":return[s.pson?3.3:0,0];
   case"q2b":return[(s.pson&&okp("R16"))?(is("Q2","open")?3.3:.68):0,0];
   case"l3a":return[okp("R17")?(s.led3?s.a5v-.5:s.a5v):0,0];case"q2c":return[s.q2?.12:(okp("R17")?s.a5v:0),0];
   case"q3b":return[s.q3?s.vccS-.7:s.vccS,0];case"q3b2":return[s.pt3?.2:s.vccS,0];
   case"mid":return[on?b/2:0,on?b*.5:0];case"crB":return[0,on?150:0];
   case"ho":return[s.llcGate?b/2+6+(b<30?6:0):0,0];case"lo":return[s.llcGate?6:0,0];
   case"gHi":return[(s.llcGate&&okp("R19"))?b/2+6+(b<30?6:0):0,0];case"gLo":return[(s.llcGate&&okp("R20"))?6:0,0];
   case"vb":return[on?b/2+14:(okp("D6")?Math.max(0,s.vccM-.6):0),0];
   case"rt":return[s.llcIC&&okp("R21")?2:0,0];case"fb3":return[on?(s.led2?1:4.5):0,0];
   case"t2a":return[0,on?14.5:0];case"t24":return[0,on&&okp("D9")?26:0];
   case"v13":return[s.v13,(is("C13","dry")||is("C14","dry"))?.9:.03];case"v24":return[s.v24,is("C15","dry")?1.8:.05];
   case"div13":{const v=s.v13;return[is("R23","open")?0:(is("R24","open")?v:v*9.1/48.1),0]}
   case"l2a":return[is("R25","open")?0:(s.led2?s.v13-1:s.v13),0];case"tl2k":return[s.led2?2.2:(is("R25","open")?0:s.v13),0];
  }
  return[0,0];
}
const ACN=new Set(["acIn","acF","acHalf","acLF","acT","auxAC","sec5","crB","t2a","t24"]);
const SECN=new Set(["cg0","v5raw","a5v","div5","led1a","tl1k","pson","q2b","l3a","q2c","v13","v24","div13","l2a","tl2k","sec5","t2a","t24"]);
const MAINSN=new Set(["acIn","acF","acHalf","acLF","acT","nIn","nLF","pe0"]);


/* oscilloscope waveform for a node */
function wave(n){
  const s=S,b=s.bulk,on=s.llcOut,[dc,ac]=NODE(n);
  const sq=(x,k,d)=>((x*k)%1)<d;
  if(["acIn","acF","acHalf","acLF","acT"].includes(n))return{lo:-400,hi:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="rect")return{lo:0,hi:400,u:"В",tb:"5 мс/дел",f:x=>s.rectOK?(s.pfcBoost?325*Math.abs(Math.sin(2*Math.PI*x*2)):Math.max(dc-9,325*Math.abs(Math.sin(2*Math.PI*x*2)))):0};
  if(n==="drain1")return{lo:0,hi:450,u:"В",tb:"5 мкс/дел",f:x=>s.pfcSw?(sq(x,6,.5)?2:(s.pfcBoost?392:330)):dc};
  if(n==="gate1"||n==="q1g")return{lo:0,hi:15,u:"В",tb:"5 мкс/дел",f:x=>dc>0?(sq(x,6,.5)?12:0):0};
  if(n==="cs1")return{lo:0,hi:.6,u:"В",tb:"5 мкс/дел",f:x=>dc>0&&sq(x,6,.5)?((x*6)%1)*.9:0};
  if(n==="sdrain")return{lo:0,hi:600,u:"В",tb:"5 мкс/дел",f:x=>s.sbyOn?(sq(x,5,.4)?3:b+95+40*Math.exp(-((x*5)%1-.4)*12)*Math.sin(((x*5)%1)*80)):b};
  if(n==="auxAC"||n==="sec5")return{lo:-30,hi:30,u:"В",tb:"5 мкс/дел",f:x=>s.sbyOn?(sq(x,5,.4)?-ac*.8:ac*1.3):0};
  if(n==="mid")return{lo:0,hi:420,u:"В",tb:"5 мкс/дел",f:x=>on?(sq(x,4,.5)?b:0):0};
  if(n==="ho"||n==="gHi")return{lo:0,hi:420,u:"В",tb:"5 мкс/дел",f:x=>dc>0?(sq(x,4,.47)?b+12:0):0};
  if(n==="lo"||n==="gLo")return{lo:0,hi:15,u:"В",tb:"5 мкс/дел",f:x=>dc>0?(!sq(x,4,.53)&&((x*4)%1)>.53?12:0):0};
  if(n==="crB")return{lo:-250,hi:250,u:"В",tb:"5 мкс/дел",f:x=>on?150*Math.sin(2*Math.PI*x*4):0};
  if(n==="t2a"||n==="t24")return{lo:-40,hi:40,u:"В",tb:"5 мкс/дел",f:x=>ac>0?(sq(x,4,.5)?ac*1.1:-ac*1.1):0};
  const rip=ac,top=Math.max(1,dc*1.4+rip*3);
  return{lo:0,hi:top,u:"В",tb:rip>.2?"2 мс/дел":"1 мс/дел",f:x=>dc+rip*Math.sin(2*Math.PI*x*(rip>.2?5:12))};
}
