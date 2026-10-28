/* PCB view — вид «как на плате»: детали в реальных корпусах, сгруппированы по узлам схемы.
   Видимые повреждения: вздутые электролиты, обгоревшие резисторы, тёмный предохранитель, трещины.
   Работают те же приборы, тепловизор и перетаскивание в корзину. */
const RW=330,RH=250,RG=14;
const PCB_COLS=Math.max(...Object.values(PAN).map(p=>p[0]))+1,PCB_ROWS=Math.max(...Object.values(PAN).map(p=>p[1]))+1;
const PW0=RG+PCB_COLS*(RW+RG),PH0=RG+PCB_ROWS*(RH+RG);
const pcbSvg=el("svg",{id:"pcb",viewBox:`0 0 ${PW0} ${PH0}`,role:"img","aria-label":"Вид печатной платы"});
$("board").appendChild(pcbSvg);pcbSvg.style.display="none";
const pcbParts={};let pcbOn=false;
function fpOf(id){
  if(/^LS\d/.test(id))return{k:"spk",w:46,h:46};
  if(/^MG\d/.test(id))return{k:"xfmr",w:60,h:56};
  if(/^M\d/.test(id))return{k:"spk",w:38,h:38};
  if(/^SW\d/.test(id))return{k:"relay",w:30,h:16,t:"SW"};
  if(/^J\d/.test(id))return{k:"relay",w:34,h:14,t:id==="J1"?(BOARD.j1Label||"USB-C"):"BAT"};
  if(/^BT\d/.test(id))return{k:"relay",w:80,h:40,t:"Li-ion"};
  if(/^RL\d/.test(id))return{k:"relay",w:40,h:28};
  if(/^TR\d/.test(id))return{k:"to220",w:20,h:24};
  if(/^ZQ\d/.test(id))return{k:"xt",w:16,h:8};
  const v=P[id][1],c=catOf(id),t=TYPE_OF[id];
  if(c==="R"){const x=ohm(v),pw=/[12] Вт/.test(v);return{k:"res",w:pw?34:24,h:pw?11:8}}
  if(c==="CP"){const m=v.match(/([\d,]+)\s*мкФ\s*([\d,]+)V/),cap=m?parseFloat(m[1].replace(",",".")):47,vv=m?parseFloat(m[2].replace(",",".")):25;
    const d=Math.max(12,Math.min(46,7+5.2*Math.log10(cap*vv)));return{k:"ecap",w:d,h:d}}
  if(c==="C")return isHV(v)?{k:"box",w:24,h:12}:{k:"disc",w:12,h:12};
  if(c==="D"&&t==="DZ")return{k:"to92",w:14,h:12};
  if(c==="D")return /^SR3|^1N58/.test(v)?{k:"dio",w:18,h:6}:/Шоттки|STTH|MBR|STPS|SB\d|SR5|F16C/.test(v)?{k:"to220",w:20,h:24}:{k:"dio",w:18,h:6};
  if(c==="LED")return{k:"led",w:12,h:12};
  if(c==="Q")return t==="BJT"&&!/MJE|13009|13007/.test(v)?{k:"to92",w:14,h:12}:{k:"to220",w:20,h:24};
  if(c==="IC"){if(/TL43|эталон/.test(v))return{k:"to92",w:14,h:12};const n=(SCH[PANEL_OF[id]].c.find(x=>x.id===id&&x.pins)||{pins:[1,2,3,4,5,6,7,8]}).pins.length;return{k:"dip",w:n>8?46:34,h:22}}
  if(c==="OPT")return{k:"dip4",w:16,h:14};
  if(c==="F")return{k:"fuse",w:34,h:9};
  if(c==="TH")return{k:"ntc",w:16,h:16};
  if(c==="RV")return{k:"var",w:20,h:20};
  if(c==="BD")return{k:"sip",w:44,h:12};
  if(/^T\d/.test(id))return{k:"xfmr",w:id===(BOARD.mainT||"T2")?74:56,h:id===(BOARD.mainT||"T2")?60:46};
  return{k:"toroid",w:/LP1|LF1|L2/.test(id)?40:26,h:/LP1|LF1|L2/.test(id)?40:26};
}
function drawFp(g,id,f,x,y){
  const G=el("g",{class:"pc pfp",tabindex:"0",role:"button","aria-label":id+" "+P[id][0],transform:`translate(${x},${y})`},g);G.dataset.id=id;
  el("title",{},G).textContent=id+" — "+P[id][0]+" ("+P[id][1]+")";
  el("rect",{x:-4,y:-4,width:f.w+8,height:f.h+8,rx:4,class:"hit"},G);
  const {w,h}=f;const B=el("g",{class:"body"},G);
  const pad=(px,py)=>el("circle",{cx:px,cy:py,r:2.2,class:"pad"},G);
  switch(f.k){
    case"res":pad(-3,h/2);pad(w+3,h/2);el("rect",{x:0,y:0,width:w,height:h,rx:h/2,class:"res"},B);[.25,.4,.55,.75].forEach((k,i)=>el("rect",{x:w*k-1,y:0,width:2,height:h,class:"band b"+i},B));
      el("ellipse",{cx:w/2,cy:h/2,rx:w*.45,ry:h*.9,class:"char"},G);break;
    case"ecap":{const r=w/2;el("circle",{cx:r,cy:r,r,class:"ecap"},B);el("path",{d:`M${r},${r} m${-r},0 a${r},${r} 0 0 1 ${r*.6},${-r*.8} L${r},${r}Z`,class:"stripe"},B);
      el("path",{d:`M${r-r*.5},${r} H${r+r*.5} M${r},${r-r*.5} V${r+r*.5}`,class:"vent"},B);el("circle",{cx:r,cy:r,r:r*.75,class:"dome"},G);break}
    case"box":pad(3,h+3);pad(w-3,h+3);el("rect",{x:0,y:0,width:w,height:h,rx:2,class:"film"},B);break;
    case"disc":pad(3,h+3);pad(w-3,h+3);el("circle",{cx:w/2,cy:h/2,r:w/2,class:"disc"},B);break;
    case"dio":pad(-3,h/2);pad(w+3,h/2);el("rect",{x:0,y:0,width:w,height:h,rx:2,class:"dio"},B);el("rect",{x:w-5,y:0,width:2.5,height:h,class:"dband"},B);break;
    case"led":el("circle",{cx:w/2,cy:h/2,r:w/2,class:"ledp"},B);break;
    case"to92":el("path",{d:`M0,${h} H${w} V${h*.45} A${w/2},${h*.6} 0 0 0 0,${h*.45} Z`,class:"to92"},B);break;
    case"to220":el("rect",{x:-3,y:-10,width:w+6,height:10,class:"sink"},B);el("rect",{x:0,y:0,width:w,height:h,rx:1,class:"to220"},B);el("circle",{cx:w/2,cy:-4,r:2,class:"hole"},B);[.2,.5,.8].forEach(k=>el("rect",{x:w*k-1,y:h,width:2,height:5,class:"leg"},B));break;
    case"dip":case"dip4":{el("rect",{x:0,y:0,width:w,height:h,rx:2,class:f.k==="dip4"?"opto":"dip"},B);el("circle",{cx:4,cy:4,r:1.6,class:"hole"},B);const n=f.k==="dip4"?2:Math.round(w/8);for(let i=0;i<n;i++){const px=4+i*(w-8)/Math.max(1,n-1);el("rect",{x:px-1.2,y:-3,width:2.4,height:3,class:"leg"},B);el("rect",{x:px-1.2,y:h,width:2.4,height:3,class:"leg"},B)}break}
    case"fuse":pad(-3,h/2);pad(w+3,h/2);el("rect",{x:0,y:0,width:w,height:h,rx:2,class:"glass"},B);el("rect",{x:0,y:0,width:5,height:h,class:"cap"},B);el("rect",{x:w-5,y:0,width:5,height:h,class:"cap"},B);el("line",{x1:5,y1:h/2,x2:w-5,y2:h/2,class:"wire"},B);break;
    case"ntc":el("circle",{cx:w/2,cy:h/2,r:w/2,class:"ntc"},B);break;
    case"var":el("circle",{cx:w/2,cy:h/2,r:w/2,class:"var"},B);break;
    case"sip":el("rect",{x:0,y:0,width:w,height:h,rx:2,class:"sip"},B);el("text",{x:w/2,y:h/2+3,class:"mark","text-anchor":"middle"},B).textContent="~ + − ~";break;
    case"xfmr":el("rect",{x:0,y:h*.15,width:w,height:h*.7,rx:3,class:"core"},B);el("rect",{x:w*.12,y:0,width:w*.76,height:h,rx:4,class:"bobbin"},B);el("rect",{x:w*.18,y:h*.3,width:w*.64,height:h*.4,class:"tape"},B);break;
    case"relay":el("rect",{x:0,y:0,width:w,height:h,rx:3,class:"relay"},B);el("text",{x:w/2,y:h/2+3,class:"mark","text-anchor":"middle"},B).textContent=f.t||"12VDC";break;
    case"xt":el("rect",{x:0,y:0,width:w,height:h,rx:4,class:"xtal"},B);break;
    case"spk":el("circle",{cx:w/2,cy:h/2,r:w/2,class:"spkf"},B);el("circle",{cx:w/2,cy:h/2,r:w*.32,class:"spkc"},B);el("circle",{cx:w/2,cy:h/2,r:w*.1,class:"spkd"},B);break;
    case"toroid":el("circle",{cx:w/2,cy:h/2,r:w/2,class:"tor"},B);el("circle",{cx:w/2,cy:h/2,r:w*.22,class:"torh"},B);break;
  }
  el("path",{d:`M${w*.2},${h*.1} l${w*.25},${h*.35} l${-w*.12},${h*.15} l${w*.3},${h*.3}`,class:"crack"},G);
  const lab=el("text",{x:w/2,y:h+(f.k==="to220"?16:12),class:"silk","text-anchor":"middle"},G);lab.textContent=id;
  const val=el("text",{x:w/2,y:h+(f.k==="to220"?25:21),class:"silkv","text-anchor":"middle"},G);val.textContent=shortV(P[id][1]).slice(0,16);
  G.addEventListener("pointerdown",e=>{if(e.button!==0||e.pointerType==="touch")return;e.preventDefault();if(ms.tool!=="hand"){measureAt(id);return}dStart(e,"part",id,id+" · "+P[id][0])});
  G.addEventListener("click",()=>{if(lastPT!=="touch")return;if(ms.tool!=="hand")measureAt(id);else pick(id)});
  G.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(id)}});
  pcbParts[id]={G,f,x,y,val,orig:val.textContent};
}
function buildPcb(){
  el("rect",{x:2,y:2,width:PW0-4,height:PH0-4,rx:14,class:"pcbBoard"},pcbSvg);
  Object.entries(PAN).forEach(([pid,[cx,cy,title]])=>{
    const ox=RG+cx*(RW+RG),oy=RG+cy*(RH+RG),cold=(BOARD.cold||[]).includes(pid);
    el("rect",{x:ox,y:oy,width:RW,height:RH,rx:8,class:"region"+(cold?" cold":"")},pcbSvg);
    el("text",{x:ox+10,y:oy+16,class:"rtitle"},pcbSvg).textContent=title.replace(/^\d+ · /,"").toUpperCase()+(cold?" · ХОЛОДНАЯ ЧАСТЬ":"");
    const ids=[...new Set(SCH[pid].c.map(c=>c.id))].filter(id=>P[id]&&PANEL_OF[id]===pid);
    const fps=ids.map(id=>({id,f:fpOf(id)}));
    let x=ox+16,y=oy+34,rowH=0;const g=el("g",{},pcbSvg);
    fps.forEach(({id,f})=>{const tw=Math.max(f.w,id.length*7,shortV(P[id][1]).slice(0,16).length*5.2)+16,top=f.k==="to220"?12:4,th=f.h+top+26;
      if(x+tw>ox+RW-6){x=ox+16;y+=rowH+8;rowH=0}
      drawFp(g,id,f,x+(tw-16-f.w)/2,y+top);x+=tw;rowH=Math.max(rowH,th)});
  });
  el("text",{x:PW0-14,y:PH0-8,class:"rnote","text-anchor":"end"},pcbSvg).textContent="Вид условный: детали сгруппированы по узлам схемы. Видимые повреждения показаны так, как их видно глазом.";
}
buildPcb();
/* copper traces: pads of all parts that share a circuit node are joined (minimal spanning tree, L-shaped tracks) */
function padsOf(f){const {w,h,k}=f;
  switch(k){case"res":case"dio":case"fuse":return[[-3,h/2],[w+3,h/2]];case"box":case"disc":return[[3,h+3],[w-3,h+3]];
    case"ecap":case"led":return[[w*.3,h/2],[w*.7,h/2]];case"to92":return[[w*.2,h],[w*.5,h],[w*.8,h]];case"to220":return[[w*.2,h+5],[w*.5,h+5],[w*.8,h+5]];
    case"ntc":case"var":case"spk":case"xt":return[[w*.25,h],[w*.75,h]];case"relay":return[[2,h+2],[w*.35,h+2],[w*.65,h+2],[w-2,h+2]];case"sip":return[[w*.12,h],[w*.37,h],[w*.62,h],[w*.87,h]];
    case"xfmr":return[[0,h*.25],[0,h*.75],[w,h*.25],[w,h*.75]];case"toroid":return[[w*.15,h*.85],[w*.85,h*.85]];
    case"dip4":return[[2,h+3],[w-2,h+3],[w-2,-3],[2,-3]];
    case"dip":{const n=Math.round(w/8),r=[];for(let i=0;i<n;i++)r.push([4+i*(w-8)/Math.max(1,n-1),h+3]);for(let i=n-1;i>=0;i--)r.push([4+i*(w-8)/Math.max(1,n-1),-3]);return r}}
  return[[0,h/2],[w,h/2]]}
const traceG=el("g",{class:"traces","aria-hidden":"true"});const traceOf={};
(function(){
  const nodes={};
  Object.entries(pcbParts).forEach(([id,p])=>{const pins=(typeof PINS!=="undefined"&&PINS[id])||[];const pads=padsOf(p.f);
    pins.forEach(([lab,n],k)=>{const q=pads[Math.min(k,pads.length-1)];(nodes[n]=nodes[n]||[]).push([p.x+q[0],p.y+q[1],id])})});
  Object.entries(nodes).forEach(([n,pts])=>{if(pts.length<2)return;const gnd=/^(hg0|cg0|pe0|nIn|nLF)$/.test(n);
    const inT=[pts[0]],out=pts.slice(1),segs=[];
    while(out.length){let best=null;inT.forEach(a=>out.forEach((b,j)=>{const d=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);if(!best||d<best.d)best={a,b,j,d}}));
      segs.push(`M${best.a[0].toFixed(1)},${best.a[1].toFixed(1)} H${best.b[0].toFixed(1)} V${best.b[1].toFixed(1)}`);inT.push(best.b);out.splice(best.j,1)}
    const path=el("path",{d:segs.join(" "),class:"trace"+(gnd?" gnd":""),"data-n":n},traceG);
    pts.forEach(([,,id])=>{(traceOf[id]=traceOf[id]||new Set()).add(path)})});
  const groups=[...pcbSvg.querySelectorAll(":scope > g")];
  pcbSvg.appendChild(traceG);groups.forEach(g=>pcbSvg.appendChild(g));
})();
let hlPart=null;
setInterval(()=>{if(!pcbOn||hlPart===sel)return;traceG.querySelectorAll(".hl").forEach(t=>t.classList.remove("hl"));hlPart=sel;(traceOf[sel]||[]).forEach(t=>t.classList.add("hl"))},200);
function damageOf(id){
  const m=st.F[id]||(id==="F1"&&st.fuse?"open":null),c=catOf(id);if(!m||st.slot[id]==="empty")return"";
  if(c==="F"&&st.fuse)return"blown";
  if(c==="CP"&&(m==="dry"||m==="short"))return"bulge";
  if(c==="R"&&m==="open"&&(st.sec[id]||/Вт/.test(P[id][1])))return"burnt";
  if((c==="Q"||c==="BD"||c==="RV")&&m==="short"&&(st.fuse||st.sec[id]))return"cracked";
  if(c==="TH"&&m==="open")return"cracked";
  return"";
}
setInterval(()=>{if(!pcbOn)return;Object.entries(pcbParts).forEach(([id,p])=>{const d=damageOf(id),sl=st.slot[id];
  p.G.classList.remove("blown","bulge","burnt","cracked");if(d)p.G.classList.add(d);
  p.G.classList.toggle("empty",sl==="empty");p.G.classList.toggle("sel",id===sel);
  const lbl=sl==="empty"?"пусто":(sl&&sl.l!==P[id][1]?sl.l.slice(0,16):p.orig);if(p.val.textContent!==lbl){p.val.textContent=lbl;p.val.classList.toggle("other",lbl!==p.orig)}})},250);
/* view switch */
function setView(on){pcbOn=on;$("sch").style.display=on?"none":"";pcbSvg.style.display=on?"":"none";$("bView").textContent=on?"Вид: плата":"Вид: схема";$("bView").classList.toggle("on",on);
  heatSpots=null;if(ms.tool==="thermo"){heatG.innerHTML="";heatT.innerHTML="";drawHeat()}drawProbes();try{localStorage.setItem("psu.view",on?"pcb":"sch")}catch(e){}}
$("bView").addEventListener("click",()=>setView(!pcbOn));
const _applyZoom=applyZoom;
applyZoom=function(){_applyZoom();pcbSvg.style.width=Math.round(PW0*zoom*1.85)+"px";pcbSvg.style.height=Math.round(PH0*zoom*1.85)+"px"};
applyZoom();
/* thermal camera & probes on the board view */
const pHeatG=el("g",{class:"heat","aria-hidden":"true"},pcbSvg),pHeatT=el("g",{class:"heatT","aria-hidden":"true"},pcbSvg),pProbe=el("g",{},pcbSvg);
const _computeSpots=computeSpots;
computeSpots=function(){if(!pcbOn)return _computeSpots();heatSpots=[];pHeatG.innerHTML="";pHeatT.innerHTML="";
  Object.entries(pcbParts).forEach(([id,p])=>{const s={id,x:p.x+p.f.w/2,y:p.y+p.f.h/2,r:Math.max(12,Math.min(34,Math.max(p.f.w,p.f.h)*.75))};
    s.c=el("circle",{cx:s.x,cy:s.y,r:s.r},pHeatG);s.l=el("text",{x:s.x,y:s.y+4,"text-anchor":"middle",class:"htxt"},pHeatT);heatSpots.push(s)})};
const _setTool2=setTool;
setTool=function(t){_setTool2(t);if(t!=="thermo"){pHeatG.innerHTML="";pHeatT.innerHTML=""}};
const _drawProbes=drawProbes;
drawProbes=function(){_drawProbes();pProbe.innerHTML="";if(!pcbOn||!ms.id||["hand","tst","thermo"].includes(ms.tool))return;const p=pcbParts[ms.id];if(!p)return;
  const A=[p.x-3,p.y+p.f.h/2],B=[p.x+p.f.w+3,p.y+p.f.h/2];
  const one=(q,col,dx)=>{el("line",{x1:q[0],y1:q[1],x2:q[0]+dx,y2:q[1]-30,style:`stroke:${col};stroke-width:6;stroke-linecap:round`},pProbe);el("circle",{cx:q[0],cy:q[1],r:3,style:`fill:${col}`},pProbe)};
  one(A,"var(--probe-r)",-14);if(ms.tool!=="osc")one(B,"var(--probe-b)",14)};
const _pick=pick;
pick=function(id,scroll){_pick(id,scroll&&!pcbOn);if(scroll&&pcbOn&&pcbParts[id]){const r=pcbParts[id].G.getBoundingClientRect(),b=$("board").getBoundingClientRect();$("board").scrollBy({left:r.left-b.left-b.width/2,top:r.top-b.top-b.height/2,behavior:"smooth"})}};
try{if(localStorage.getItem("psu.view")==="pcb")setView(true)}catch(e){}
