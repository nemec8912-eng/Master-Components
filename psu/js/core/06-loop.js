/* paint loop */
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function frame(now){
  const dt=Math.min(.1,(now-st.last)/1000);st.last=now;
  sim(now,dt);
  const NT=nets(),V=40*st.speed;
  wires.forEach(w=>{const n=NT[w.net]||{on:0,f:0};let f=w.fl?w.fl(S):n.f;if(!n.on)f=0;
    const col=n.red?C.bad:C[n.k];
    w.base.style.stroke=n.on?col:"";w.base.style.strokeOpacity=n.on?(n.red?".9":".55"):"";w.base.style.strokeWidth=n.red?"2.6":"";
    const vis=Math.abs(f)>.05;w.o+=reduce?0:f*V*dt;
    for(let i=0;i<w.n;i++){const d=w.dots[i];if(!vis){if(d.style.display!=="none")d.style.display="none";continue}
      const s=((w.o+i*w.len/w.n)%w.len+w.len)%w.len,p=ptAt(w,s);d.style.display="";d.setAttribute("cx",p[0]);d.setAttribute("cy",p[1]);d.style.fill=col}
  });
  flags.forEach(fl=>{const n=NT[fl.net];fl.r.style.stroke=n&&n.on?(n.red?C.bad:C[n.k]):"";fl.r.style.strokeWidth=n&&n.on?"1.8":""});
  const hide=game.on&&!game.reveal;
  Object.entries(parts).forEach(([id,arr])=>arr.forEach((p,i)=>{const real=st.F[id]||(id==="F1"&&st.fuse?"open":null);const bad=hide?null:real;const col=p.c.on&&!real?p.c.on(S):null;p.paint(col,bad,bad,S);p.slot(st.slot[id],i===0)}));
  dyns.forEach(d=>{d.e.textContent=d.f(S);d.e.style.fill=d.cf(S)});
  if(now-(st.uiT||0)>200){st.uiT=now;renderTv();if(sel&&st.later[sel])renderCard();checkWin()}
  requestAnimationFrame(frame);
}
