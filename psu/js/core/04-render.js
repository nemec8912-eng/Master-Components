/* rendering */
const svg=$("sch");
const HALF={R:13,FUSE:13,NTC:13,VAR:13,C:3,CP:3,D:6,DZ:6,LED:6,SW:12};
const parts={};   // id -> [painters]
const wires=[];   // {pts,len,segs,net,flow,dots,base}
const flags=[];
const dyns=[];
function parsePath(d){
  const t=d.match(/[MHVL]|-?\d+(\.\d+)?/g);let i=0,x=0,y=0,pts=[];
  while(i<t.length){const c=t[i++];if(c==="M"||c==="L"){x=+t[i++];y=+t[i++];pts.push([x,y])}else if(c==="H"){x=+t[i++];pts.push([x,y])}else if(c==="V"){y=+t[i++];pts.push([x,y])}}
  const segs=[];let L=0;for(let k=1;k<pts.length;k++){const l=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);segs.push([L,l,pts[k-1],pts[k]]);L+=l}
  return {pts,segs,len:L};
}
function ptAt(w,s){for(const [L0,l,a,b] of w.segs){if(s<=L0+l){const f=l?(s-L0)/l:0;return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]}}const b=w.pts[w.pts.length-1];return b}
function shortV(v){const a=v.split(" · ")[0];return a.includes("×")?a:a.split(" ").slice(0,2).join(" ")}
function gndSym(g,x,y,k){
  if(k==="h"){el("path",{d:`M${x-8},${y} H${x+8} L${x},${y+8} Z`,class:"dp",style:"fill:var(--ink);fill-opacity:.15"},g)}
  else if(k==="e"){[0,4,8].forEach((o,i)=>ln(g,x-8+i*2.5,y+o,x+8-i*2.5,y+o,"dp"))}
  else{ln(g,x-8,y,x+8,y,"dp");ln(g,x-5,y+4,x+5,y+4,"dp");ln(g,x-2,y+8,x+2,y+8,"dp")}
}
function drawPart(g,c){
  const id=c.id,pd=P[id];
  const G=el("g",{class:"pc",tabindex:c.nopart?"-1":"0",role:c.nopart?"img":"button","aria-label":pd?id+" "+pd[0]:id},g);
  if(pd)el("title",{},G).textContent=id+" — "+pd[0]+" ("+pd[1]+")";
  const parts_=[],fills=[],leads=[];let extra=null;
  const label=(x,y,anc,vy)=>{if(c.nolab||!pd)return;tx(G,x,y,c.lab||id,"did",{"text-anchor":anc});tx(G,x,vy,(c.vs||shortV(pd[1])),"dval",{"text-anchor":anc})};
  if(c.t==="TRIAC"){
    const [x,yb]=c.a,[,yt]=c.b,[gx,gy]=c.g,my=(yb+yt)/2;
    el("rect",{x:x-16,y:my-14,width:32,height:28,rx:4,class:"hit"},G);
    leads.push(ln(G,x,yb,x,my+9,"w"),ln(G,x,yt,x,my-9,"w"));
    parts_.push(ln(G,x-12,my-9,x+12,my-9,"dp"),ln(G,x-12,my+9,x+12,my+9,"dp"));
    fills.push(el("path",{d:`M${x-11},${my+9} L${x-1},${my+9} L${x-6},${my-9}Z`},G),el("path",{d:`M${x+1},${my-9} L${x+11},${my-9} L${x+6},${my+9}Z`},G));
    parts_.push(el("path",{d:`M${x-11},${my+9} L${x-18},${my+16} H${gx}`,class:"dp"},G));
    if(gx<x-18)leads.push(ln(G,x-18,my+16,gx,gy,"w"));
    tx(G,x+16,my-2,id,"did");tx(G,x+16,my+10,shortV(pd[1]),"dval");
  }else if(c.t==="XTAL"){
    const [ax,ay]=c.a,[bx,by]=c.b,mx=(ax+bx)/2,my=(ay+by)/2;el("rect",{x:mx-14,y:my-14,width:28,height:28,rx:4,class:"hit"},G);
    leads.push(ln(G,ax,ay,mx-8,my,"w"),ln(G,mx+8,my,bx,by,"w"));parts_.push(ln(G,mx-8,my-9,mx-8,my+9,"dp"),ln(G,mx+8,my-9,mx+8,my+9,"dp"),el("rect",{x:mx-5,y:my-7,width:10,height:14,class:"dp dbody"},G));
    tx(G,mx,my-14,id,"did",{"text-anchor":"middle"});tx(G,mx,my+22,shortV(pd[1]),"dval",{"text-anchor":"middle"});
  }else if(c.t==="RELAY"){
    const {x,y}=c;el("rect",{x:x-4,y:y-4,width:128,height:78,rx:6,class:"hit"},G);
    parts_.push(el("rect",{x,y:y+10,width:26,height:46,class:"dp dbody"},G),ln(G,x,y+56,x+26,y+10,"dp"));
    ln(G,x+30,y+33,x+70,y+33,"iso");
    leads.push(ln(G,x+80,y+60,x+80,y+48,"w"),ln(G,x+112,y+12,x+112,y+24,"w"));
    el("circle",{cx:x+80,cy:y+48,r:2.4,class:"jn"},G);el("circle",{cx:x+112,cy:y+24,r:2.4,class:"jn"},G);
    const lev=ln(G,x+80,y+48,x+106,y+30,"dp");parts_.push(lev);extra={lev,x,y};
    tx(G,x+60,y-8,id,"did",{"text-anchor":"middle"});tx(G,x+60,y+84,shortV(pd[1]),"dval",{"text-anchor":"middle"});
  }else if(c.t==="IC"){
    const r=el("rect",{x:c.x,y:c.y,width:c.w,height:c.h,rx:4,class:"dp dbody"},G);parts_.push(r);
    tx(G,c.x+c.w/2,c.ty!=null?c.y+c.ty:c.y+c.h/2+4,c.title,"did",{"text-anchor":"middle"});
    c.pins.forEach(([px,py,l,s])=>{const o={l:[5,3,"start"],r:[-5,3,"end"],t:[0,12,"middle"],b:[0,-5,"middle"]}[s];tx(G,px+o[0],py+o[1],l,"dval",{"text-anchor":o[2]});el("circle",{cx:px,cy:py,r:1.8,class:"jn"},G)});
    if(pd)tx(G,c.x+c.w/2,c.y+c.h/2+16,pd[1].split(" ")[0],"dval",{"text-anchor":"middle"});
    G.insertBefore(el("rect",{x:c.x-3,y:c.y-3,width:c.w+6,height:c.h+6,rx:6,class:"hit"},G),G.firstChild);
  }else if(c.t==="CORE"){
    if(c.h){G.insertBefore(el("rect",{x:c.x[0],y:c.y[0]-6,width:c.x[1]-c.x[0],height:c.y[1]-c.y[0]+12,class:"hit"},G),G.firstChild);parts_.push(ln(G,c.x[0],c.y[0],c.x[1],c.y[0],"dp"),ln(G,c.x[0],c.y[1],c.x[1],c.y[1],"dp"))}
    else{G.insertBefore(el("rect",{x:c.x[0]-6,y:c.y[0],width:c.x[1]-c.x[0]+12,height:c.y[1]-c.y[0],class:"hit"},G),G.firstChild);parts_.push(ln(G,c.x[0],c.y[0],c.x[0],c.y[1],"dp"),ln(G,c.x[1],c.y[0],c.x[1],c.y[1],"dp"))}
  }else if(c.t==="BR"){
    const [cx,cy]=c.c,r=c.r,T=[cx,cy-r],Bt=[cx,cy+r],R=[cx+r,cy],L=[cx-r,cy];
    el("rect",{x:cx-r-6,y:cy-r-6,width:2*r+12,height:2*r+12,rx:8,class:"hit"},G);
    const dio=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),ux=dx/l,uy=dy/l,nx=-uy,ny=ux,mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,s=6;
      const w=ln(G,a[0],a[1],b[0],b[1],"dp");const t=el("path",{d:`M${mx-ux*s+nx*s},${my-uy*s+ny*s} L${mx-ux*s-nx*s},${my-uy*s-ny*s} L${mx+ux*s},${my+uy*s}Z`},G);const br=ln(G,mx+ux*s+nx*s,my+uy*s+ny*s,mx+ux*s-nx*s,my+uy*s-ny*s,"dp");return [w,t,br]};
    const d=[dio(T,R),dio(Bt,R),dio(L,T),dio(L,Bt)];
    [T,Bt,R,L].forEach(p=>el("circle",{cx:p[0],cy:p[1],r:2.4,class:"jn"},G));
    tx(G,cx,cy+4,id,"did",{"text-anchor":"middle"});tx(G,cx+r+6,cy-6,"+","did");tx(G,cx-r-12,cy-6,"−","did");
    extra=(S,bad)=>{const pos=S.acV>=0,act=S.bridgeOn;d.forEach((q,i)=>{const on=act&&((pos&&(i===0||i===3))||(!pos&&(i===1||i===2)));const col=bad?C.bad:(on?(S.surgeNet&&S.surgeNet.rect?C.bad:C.hv):null);
      q[0].style.stroke=col||"";q[2].style.stroke=col||"";q[1].style.fill=col||"var(--ink)";q[0].style.strokeWidth=col?"2.2":""})};
  }else if(c.t==="Q"){
    const [dx,dy]=c.d,[sx,sy]=c.s,[gx,gy]=c.g,cx=dx,cy=(dy+sy)/2;
    el("circle",{cx:cx-3,cy,r:19,class:"hit"},G);el("circle",{cx:cx-3,cy,r:18,class:"dp"},G);
    parts_.push(el("path",{d:`M${dx},${dy} V${cy-8} H${cx-7} M${sx},${sy} V${cy+8} H${cx-7} M${cx-7},${cy-11} V${cy+11}`,class:"dp"},G));
    parts_.push(el("path",{d:`M${gx},${gy} H${cx-12} M${cx-12},${cy-9} V${cy+9}`,class:"dp"},G));
    fills.push(el("path",{d:`M${cx-7},${cy+8} l6,-3 v6 Z`},G));
    if(c.lq){tx(G,cx+c.lq[0],cy+c.lq[1],id,"did",{"text-anchor":"end"});tx(G,cx+c.lq[0],cy+c.lq[1]+11,pd[1].split(" · ")[0].replace(/^MOSFET /,""),"dval",{"text-anchor":"end"})}
    else{tx(G,cx+20,cy-6,id,"did");tx(G,cx+20,cy+6,pd[1].split(" · ")[0].replace(/^MOSFET /,""),"dval")}
  }else if(c.t==="BJT"){
    const [bx,by]=c.b,[cx_,cy_]=c.c,[ex,ey]=c.e,cx=cx_,m=by;
    el("circle",{cx:cx-3,cy:m,r:18,class:"hit"},G);el("circle",{cx:cx-3,cy:m,r:17,class:"dp"},G);
    parts_.push(el("path",{d:`M${bx},${by} H${cx-9} M${cx-9},${m-10} V${m+10} M${cx-9},${m-5} L${cx},${m-12} V${cy_} M${cx-9},${m+5} L${cx},${m+12} V${ey}`,class:"dp"},G));
    fills.push(el("path",{d:c.pnp?(ey<m?`M${cx-9},${m-5} l7,-2 l-3,6 Z`:`M${cx-9},${m+5} l7,2 l-3,-6 Z`):(ey>m?`M${cx},${m+12} l-7,-1 l3,-5 Z`:`M${cx},${m-12} l-7,1 l3,5 Z`)},G));
    {const [ox,oy]=c.lq||[18,-4];tx(G,cx+ox,m+oy,id,"did");tx(G,cx+ox,m+oy+12,pd[1].split(" ")[0],"dval")}
  }else if(c.t==="PT"){
    const [cx,cy]=c.c;el("circle",{cx,cy,r:19,class:"hit"},G);el("circle",{cx,cy,r:17,class:"dp"},G);
    parts_.push(el("path",{d:`M${cx-8},${cy-10} V${cy+10} M${cx-8},${cy-4} L${cx+8},${cy-14} V${cy-17} M${cx-8},${cy+4} L${cx+8},${cy+14} V${cy+17}`,class:"dp"},G));
    fills.push(el("path",{d:`M${cx+8},${cy+14} l-7,-1 l3,-5 Z`},G));
    const ar=el("path",{d:`M${cx-26},${cy-14} l9,7 m-4,0 h4 v-4 M${cx-26},${cy-4} l9,7 m-4,0 h4 v-4`,class:"dp"},G);parts_.push(ar);
  }else{
    const [ax,ay]=c.a,[bx,by]=c.b,dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,mx=(ax+bx)/2,my=(ay+by)/2;
    const h=c.t==="L"?(c.n||4)*5:HALF[c.t];
    leads.push(ln(G,ax,ay,mx-ux*h,my-uy*h,"w"),ln(G,mx+ux*h,my+uy*h,bx,by,"w"));
    const Bd=el("g",{transform:`translate(${mx},${my}) rotate(${Math.atan2(dy,dx)*180/Math.PI})`},G);
    el("rect",{x:-h-5,y:-13,width:2*h+10,height:26,rx:5,class:"hit"},Bd);
    const Pp=(t,a,cls="dp")=>{const e=el(t,a,Bd);e.setAttribute("class",cls);parts_.push(e);return e};
    switch(c.t){
      case"R":Pp("rect",{x:-13,y:-5,width:26,height:10},"dp dbody");break;
      case"SW":Pp("circle",{cx:-12,cy:0,r:2.4});Pp("circle",{cx:12,cy:0,r:2.4});extra=Pp("line",{x1:-10,y1:-1,x2:10,y2:-11});break;
      case"FUSE":Pp("rect",{x:-13,y:-5,width:26,height:10},"dp dbody");extra=Pp("line",{x1:-13,y1:0,x2:13,y2:0});break;
      case"NTC":Pp("rect",{x:-13,y:-5,width:26,height:10},"dp dbody");Pp("path",{d:"M-11,9 L9,-9 H14"});break;
      case"VAR":Pp("rect",{x:-13,y:-5,width:26,height:10},"dp dbody");Pp("path",{d:"M-16,9 H-11 L11,-9"});break;
      case"C":Pp("line",{x1:-3,y1:-10,x2:-3,y2:10});Pp("line",{x1:3,y1:-10,x2:3,y2:10});break;
      case"CP":Pp("line",{x1:-3,y1:-10,x2:-3,y2:10});Pp("rect",{x:2,y:-10,width:4,height:20},"dp dbody");break;
      case"L":{let d=`M${-h},0`;for(let i=0;i<(c.n||4);i++)d+=` a5,5 0 0 ${c.sw===0?0:1} 10,0`;Pp("path",{d});break}
      default:{fills.push(el("path",{d:"M-6,-7 L-6,7 L6,0 Z"},Bd));Pp("path",{d:c.t==="DZ"?"M9,-8 L6,-7 V7 L3,8":"M6,-7 V7"});
        if(c.t==="LED")Pp("path",{d:"M-1,-10 l6,-8 m-4,0 h4 v4 M5,-10 l6,-8 m-4,0 h4 v4"});}
    }
    let ix,iy,anc,vy;
    if(c.lo){ix=mx+c.lo[0];iy=my+c.lo[1];anc=c.la||"middle";vy=iy+11}
    else if(Math.abs(ux)>Math.abs(uy)){ix=mx;iy=my-13;anc="middle";vy=my+21}
    else{ix=mx+(c.lp==="l"?-12:12);iy=my-2;anc=c.lp==="l"?"end":"start";vy=iy+11}
    label(ix,iy,anc,vy);
    if(c.t==="CP"&&!c.nolab){tx(G,ax+ux*(L/2-h-7)+(Math.abs(ux)>Math.abs(uy)?0:-9),ay+uy*(L/2-h-7)+(Math.abs(ux)>Math.abs(uy)?-5:3),"+","dval")}
  }
  const badge=el("g",{style:"display:none"},G);
  let bb,bbx,bby;{const bx=c.t==="RELAY"?c.x+60:c.t==="IC"?c.x+c.w-6:(c.c?c.c[0]+14:(c.d?c.d[0]-22:(c.a?(c.a[0]+c.b[0])/2+10:(c.x?c.x[1]+6:0)))),by=c.t==="RELAY"?c.y+6:c.t==="IC"?c.y+6:(c.c?c.c[1]-18:(c.d?(c.d[1]+c.s[1])/2-20:(c.a?(c.a[1]+c.b[1])/2-16:(c.y?c.y[0]:0))));
    el("rect",{x:bx-2,y:by-9,width:24,height:12,rx:3,style:"fill:var(--bad)"},badge);bb=el("text",{x:bx+10,y:by,class:"badge","text-anchor":"middle"},badge);bbx=bx+10;bby=by}
  const tagT=el("text",{x:(c.t==="IC"?c.x+c.w/2:bbx),y:(c.t==="IC"?c.y+c.h+12:bby-12),class:"tag","text-anchor":"middle",style:"display:none"},G);
  if(!c.nopart){G.dataset.id=id;G.addEventListener("pointerdown",e=>{if(e.button!==0||e.pointerType==="touch")return;e.preventDefault();if(ms&&ms.tool!=="hand"){measureAt(id);return}dStart(e,"part",id,id+" · "+pd[0])});
    G.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(id)}})}
  let lastSlot;
  const painter={G,c,paint(col,bad,mode,S){
    parts_.forEach(p=>{p.style.stroke=col||"";p.style.strokeWidth=col?"2.2":""});fills.forEach(f=>f.style.fill=col||"var(--ink)");
    leads.forEach(l=>{l.style.stroke=col||"";l.style.strokeOpacity=col?"1":""});
    G.classList.toggle("failed",!!bad);
    if(c.t==="BR")extra(S,bad);
    if(c.t==="RELAY"&&extra){const cl=!!(c.closed&&c.closed(S));extra.lev.setAttribute("x2",extra.x+(cl?112:106));extra.lev.setAttribute("y2",extra.y+(cl?24:30))}
    if(c.t==="SW"&&extra){const cl=!!(c.closed&&c.closed(S));extra.setAttribute("x2",cl?12:10);extra.setAttribute("y2",cl?-2:-11)}
    if(c.t==="FUSE"&&extra){const blown=bad||S.fuse;extra.setAttribute("x2",blown?-4:13);extra.style.stroke=blown?C.bad:(col||"")}
    badge.style.display=bad?"":"none";if(bad)bb.textContent={open:"X",short:"КЗ",dry:"СУХ",dead:"✕",drift:"↑R",stuck:"ЗАЛ"}[bad]||"!";
  },slot(sl,first){const key=sl==="empty"?"e":(sl&&sl.l)||"";if(key===lastSlot)return;lastSlot=key;
    G.classList.toggle("empty",sl==="empty");
    const show=first&&sl&&sl!=="empty"&&sl.l!==pd[1];tagT.style.display=show?"":"none";if(show)tagT.textContent="стоит: "+sl.l.slice(0,26);
    if(first&&sl==="empty"){tagT.style.display="";tagT.textContent="пусто"}}};
  (parts[id]=parts[id]||[]).push(painter);
}
function flagSym(g,x,y,t,net,anc){
  const w=t.length*6+12,x0=anc==="end"?x-w:(anc==="middle"?x-w/2:x);
  const G=el("g",{class:"flag"},g);const r=el("rect",{x:x0,y:y-7,width:w,height:14,rx:7},G);el("text",{x:x0+w/2,y:y+3.5,"text-anchor":"middle"},G).textContent=t;
  flags.push({r,net});
}
function build(){
  svg.innerHTML="";
  Object.entries(PAN).forEach(([pid,[cx,cy,title]])=>{
    const ox=GX+cx*(PW+GX),oy=GY+cy*(PH+GY)+TOP;
    const g=el("g",{transform:`translate(${ox},${oy})`},svg);
    el("rect",{x:0,y:0,width:PW,height:PH,rx:10,class:"prect"},g);
    const sc=SCH[pid];
    const gx=el("g",{},g),gw=el("g",{},g),gd=el("g",{},g),gc=el("g",{},g),gt=el("g",{},g);
    (sc.x||[]).forEach(x=>{const a=Object.assign({},x);delete a.t;delete a.c;el(x.t,a,gx).setAttribute("class",x.c)});
    (sc.w||[]).forEach(([d,net,fl])=>{const p=parsePath(d);const base=el("path",{d,class:"w"},gw);const n=Math.max(1,Math.round(p.len/15));const dots=[];
      for(let i=0;i<n;i++)dots.push(el("circle",{r:2.5,style:"display:none"},gd));wires.push(Object.assign(p,{net,fl,base,dots,n,o:Math.random()*15}))});
    (sc.c||[]).forEach(c=>drawPart(gc,c));
    (sc.j||[]).forEach(([x,y])=>el("circle",{cx:x,cy:y,r:2.6,class:"jn"},gt));
    (sc.term||[]).forEach(([x,y])=>el("circle",{cx:x,cy:y,r:4,class:"dp dbody"},gt));
    (sc.g||[]).forEach(([x,y,k])=>gndSym(gt,x,y,k));
    (sc.f||[]).forEach(([x,y,t,net,a])=>flagSym(gt,x,y,t,net,a));
    (sc.tx||[]).forEach(([x,y,s,a])=>tx(gt,x,y,s,"dlab",{"text-anchor":a||"start"}));
    (sc.dyn||[]).forEach(([x,y,f,cf,a])=>dyns.push({e:tx(gt,x,y,"","dyn",{"text-anchor":a||"start"}),f,cf}));
    tx(g,4,-8,title,"ptitle");
  });
}
build();
const W0=GX+Math.max(...Object.values(PAN).map(p=>p[0]))*(PW+GX)+PW+GX,H0=GY+Math.max(...Object.values(PAN).map(p=>p[1]))*(PH+GY)+PH+GY;
svg.setAttribute("viewBox",`0 -4 ${W0} ${H0}`);
