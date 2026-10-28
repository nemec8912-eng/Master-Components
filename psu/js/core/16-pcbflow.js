/* v3 ток на виде «Плата»: дорожки окрашиваются по напряжению, по дорожкам работающих цепей бегут точки */
const PF={segs:[],g:el("g",{class:"pflow","aria-hidden":"true"}),o:0,last:0};
traceG.after(PF.g);
{const nodeIds={};Object.entries(PINS).forEach(([id,pp])=>pp.forEach(([,n])=>{(nodeIds[n]=nodeIds[n]||new Set()).add(id)}));PF.nodeIds=nodeIds}
traceG.querySelectorAll("path.trace").forEach(path=>{const n=path.dataset.n,gnd=path.classList.contains("gnd");
  path.getAttribute("d").split("M").filter(Boolean).forEach(sd=>{const p=parsePath("M"+sd);if(p.len<4)return;const k=Math.max(1,Math.round(p.len/24)),dots=[];
    for(let i=0;i<k;i++)dots.push(el("circle",{r:2.7,class:"pdot",style:"display:none"},PF.g));PF.segs.push(Object.assign(p,{n,gnd,path,dots,k,ph:Math.random()*24}))})});
function nodeColor(n,dc,ac){if(ACN.has(n)||MAINSN.has(n)||ac>20)return C.ac;const a=Math.abs(dc);if(a>90)return C.hv;if(a>=8)return C.vcc;if(a>=2.5)return C.lv;return C.fb}
function activeParts(){const A=new Set();Object.entries(parts).forEach(([id,arr])=>{if(arr.some(p=>p.c.on&&!st.F[id]&&p.c.on(S)))A.add(id)});return A}
{const lg=document.createElement("div");lg.className="vleg";lg.setAttribute("aria-hidden","true");
 lg.innerHTML='<span class="vl-dot"></span>бегущие точки — идёт ток<span class="sw" style="--c:var(--ac)"></span>~ сеть<span class="sw" style="--c:var(--hv)"></span>высокое<span class="sw" style="--c:var(--vcc)"></span>питание<span class="sw" style="--c:var(--lv)"></span>низкое<span class="sw" style="--c:var(--fb)"></span>сигнал<span class="sw" style="--c:var(--bad)"></span>КЗ';
 $("board").prepend(lg)}
function pcbFlow(now){
  const dt=Math.min(.1,(now-(PF.last||now))/1000);PF.last=now;
  if(pcbOn&&OPT.flow){
    const A=activeParts(),V=34*st.speed;PF.o+=reduce?0:V*dt;const memo={};
    PF.segs.forEach(s=>{let m=memo[s.n];if(!m){const [dc,ac]=NODE(s.n);const live=Math.abs(dc)>.3||ac>.3;const ids=PF.nodeIds[s.n]||new Set();
        const flow=live&&!/^(gnd|hg|cg|hg0|cg0|pe|pe0|hvg|nIn)$/.test(s.n)&&[...ids].some(id=>A.has(id));m=memo[s.n]={live,flow,col:live?nodeColor(s.n,dc,ac):null}}
      s.path.style.stroke=m.live&&!s.gnd?m.col:"";s.path.classList.toggle("live",m.live&&!s.gnd);
      for(let i=0;i<s.k;i++){const d=s.dots[i];if(!m.flow){if(d.style.display!=="none")d.style.display="none";continue}
        const q=ptAt(s,((PF.o+s.ph+i*s.len/s.k)%s.len+s.len)%s.len);d.style.display="";d.setAttribute("cx",q[0]);d.setAttribute("cy",q[1]);d.style.setProperty("--c",m.col)}})}
  else if(PF.on){PF.segs.forEach(s=>{s.path.style.stroke="";s.path.classList.remove("live");s.dots.forEach(d=>d.style.display="none")})}
  PF.on=pcbOn&&OPT.flow;
  requestAnimationFrame(pcbFlow);
}
requestAnimationFrame(pcbFlow);
