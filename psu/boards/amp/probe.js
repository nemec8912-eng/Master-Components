/* Усилитель TDA7294: выводы деталей, напряжения узлов, формы сигналов */
const PINS={
 F1:[["вход (от вилки)","acIn"],["выход","acF"]],T1:[["первичка","acF"],["первичка (N)","nIn"],["вторичка 1","s1"],["вторичка 2","s2"]],
 BD1:[["+V","vp"],["−V","vn"],["~","s1"],["~","s2"]],C1:[["+","vp"],["−","gnd"]],C2:[["+","gnd"],["−","vn"]],R2:[["+V","vp"],["анод LED1","ledA"]],LED1:[["анод","ledA"],["катод","gnd"]],
 C3:[["вход J1","jin"],["к R4","c3b"]],R4:[["от C3","c3b"],["IN+","inp"]],R3:[["IN+","inp"],["земля","gnd"]],
 R5:[["OUT","out"],["IN−","inm"]],R6:[["IN−","inm"],["к C4","c4a"]],C4:[["+","c4a"],["−","gnd"]],R7:[["+V","vp"],["MUTE/STBY","ms"]],C6:[["+","ms"],["−","gnd"]],
 IC1:[["3 IN+","inp"],["2 IN−","inm"],["10 MUTE","ms"],["9 STBY","ms"],["6 BOOT","boot"],["13,15 +Vs","vp"],["14 OUT","out"],["7,8 −Vs","vn"],["1,4 GND","gnd"]],
 C7:[["+V","vp"],["земля","gnd"]],C8:[["−V","vn"],["земля","gnd"]],R8:[["OUT","out"],["к C9","zob"]],C9:[["от R8","zob"],["земля","gnd"]],C5:[["+ (BOOT)","boot"],["− (OUT)","out"]],
 LS1:[["+","out"],["−","gnd"]]
};
function NODE(k){
  const s=S,rms=s.amp/1.414;
  switch(k){
   case"gnd":case"nIn":return[0,0];case"acIn":return[0,s.mains?230:0];case"acF":return[0,s.pre?230:0];case"s1":case"s2":return[0,s.pri?25:0];
   case"vp":return[s.vp,s.half||is("C1","dry")?3:.3];case"vn":return[s.vn,s.half||is("C2","dry")?3:.3];case"ledA":return[s.vp>3&&okp("R2")?(okp("LED1")?1.9:s.vp):0,0];
   case"jin":return[0,s.play?.35:0];case"c3b":return[0,s.play&&okp("C3")?.35:0];case"inp":return[s.floatIn?1.2:0,s.vin?.35:0];
   case"inm":return[0,s.active&&s.vin&&!s.openLoop?.35:0];case"c4a":return[0,0];case"ms":return[okp("R7")&&!is("C6","short")&&s.vp>3?5:0,0];
   case"boot":return[s.active?s.vp-2:0,s.active?rms:0];case"out":return[s.dc,s.active?rms:0];case"zob":return[0,s.active&&s.osc?2:(s.active?.02:0)];
  }
  return[0,0];
}
const ACN=new Set(["acIn","acF","s1","s2","jin","c3b"]);
const SECN=new Set(["gnd","vp","vn","ledA","jin","c3b","inp","inm","c4a","ms","boot","out","zob"]);
const MAINSN=new Set(["acIn","acF","nIn"]);
function wave(n){
  const s=S,[dc,ac]=NODE(n);
  if(["acIn","acF","s1","s2"].includes(n))return{lo:n[0]==="s"?-40:-400,hi:n[0]==="s"?40:400,u:"В",tb:"5 мс/дел",f:x=>ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="vp"||n==="vn"){const sg=n==="vp"?1:-1;return{lo:n==="vp"?0:-40,hi:n==="vp"?40:0,u:"В",tb:"5 мс/дел",f:x=>dc-sg*ac*((x*(s.half?2:4))%1)}}
  if(["jin","c3b","inp","inm"].includes(n))return{lo:-1,hi:1,u:"В",tb:"0,2 мс/дел",f:x=>dc+ac*1.414*Math.sin(2*Math.PI*x*2)};
  if(n==="out"||n==="boot"){const off=n==="boot"?s.vp-2:0;return{lo:-40+off,hi:40+off,u:"В",tb:"0,2 мс/дел",f:x=>{
    if(s.dc>20)return s.dc;if(!s.active||!s.amp)return off+(s.osc&&s.active?1.5*Math.sin(x*400):0);
    let v=s.amp*Math.sin(2*Math.PI*x*2);if(s.openLoop)v=Math.sign(v)*Math.min(Math.abs(v)*30,s.clipP);
    const cp=s.clipP-(s.half||is("C1","dry")?3*(1+Math.sin(2*Math.PI*x*.5)):0),cn=s.clipN-(s.half||is("C2","dry")?3*(1+Math.sin(2*Math.PI*x*.5)):0);
    v=Math.max(-cn,Math.min(cp,v));if(s.floatIn)v+=6*Math.sin(2*Math.PI*x*.1)+2*(Math.random()-.5);if(s.osc)v+=1.5*Math.sin(x*400);return off+v+s.dc}}}
  if(n==="zob")return{lo:-3,hi:3,u:"В",tb:"0,2 мс/дел",f:x=>s.osc&&s.active?2*Math.sin(x*400):0};
  return{lo:0,hi:Math.max(1,dc*1.4),u:"В",tb:"1 мс/дел",f:x=>dc};
}
