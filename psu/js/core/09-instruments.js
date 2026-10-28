/* measuring instruments */
const CAPN=BOARD.capName||"C1";if($("discharge"))$("discharge").textContent="Разрядить "+CAPN+" резистором";
var TOOLS={hand:"Рука",dmm:"Мультиметр",esr:"ESR-метр",osc:"Осциллограф",tst:"Тестер деталей"};
const DMODES=[["vdc","V⎓"],["vac","V~"],["ohm","Ω"],["beep","•)))"],["diode","▷|"],["cap","⊣⊢"]];
var ms={tool:"hand",mode:"vdc",id:null,pin:0,trash:null};
/* physical state of the part actually sitting in a slot (or removed) */
function partPhys(id){
  const sl=st.slot[id];if(sl==="empty")return{empty:true,id};
  const ins=st.inst[id];const cat=(sl&&sl.c)||catOf(id),label=sl?sl.l:P[id][1];
  let mode=st.F[id]||(id==="F1"&&st.fuse?"open":null);if(ins&&ins.r==="same")mode=null;
  return{id,cat,label,mode};
}
function capVal(l){const m=l.match(/([\d,]+)\s*(мкФ|нФ|пФ)/);if(!m)return null;return parseFloat(m[1].replace(",","."))*({"мкФ":1,"нФ":1e-3,"пФ":1e-6}[m[2]])}
function fmtCap(u){return u>=1?fmt(u,u>=100?0:1)+" мкФ":u>=1e-3?fmt(u*1e3,u*1e3>=100?0:1)+" нФ":fmt(u*1e6,0)+" пФ"}
function fmtR(x){return x>=1e6?[fmt(x/1e6,2),"МΩ"]:x>=1e3?[fmt(x/1e3,x>=1e5?0:2),"кΩ"]:[fmt(x,x<10?2:1),"Ω"]}
function windR(id){if(BOARD.windR&&BOARD.windR[id]!=null)return BOARD.windR[id];return {T2:.15,T1:1.2,LP1:.12,LF1:.4,L1:.02}[id]??.3}
function diodeVf(l){if(/SR\d|MBR|STPS|1N5819|Шоттки/.test(l))return .21;if(/GBU|DB1|мост/.test(l))return .55;if(/стабилитрон|TL43/.test(l))return .72;if(/1N4148/.test(l))return .62;if(/1N400|1N540/.test(l))return .58;return .51}
/* passive reading of a physical part (power off) */
function passive(p,tool,mode){
  const {cat,label,mode:f}=p,r=(v,u,n)=>({v,u,n:n||""});
  if(typeof boardPassive==="function"){const q=boardPassive(p,tool,mode,r);if(q)return q}
  if(tool==="esr"){
    if(!["C","CP"].includes(cat))return r("—","","ESR-метр проверяет только конденсаторы.");
    if(f==="short")return r("0,00","Ω","Короткое замыкание внутри конденсатора.");
    if(f==="open")return r("OL","","Нет контакта с обкладками — конденсатор оборван.");
    const c=capVal(label)||1;let e=cat==="C"?.03:Math.max(.02,Math.min(2.5,22/Math.pow(c,.85)));if(/85°C|обычный/.test(label))e*=6;if(f==="dry")e=8.5;
    return r(fmt(e,2),"Ω",`Ёмкость ≈ ${fmtCap(c*(f==="dry"?.1:.96))}. `+(f==="dry"?"ESR очень большое — конденсатор высох.":(e>1.2&&cat==="CP"?"ESR выше нормы для такого конденсатора.":"ESR в норме.")));
  }
  if(tool==="tst"){
    if(cat==="LED"){if(/линейка/.test(label)){const m=label.match(/(\d+)×(\d+)/),n=m?+m[1]:9,u=m?+m[2]:6;
        if(f==="open")return r("—","","Тестер подсветки: линейка не светится — внутри сгорел светодиод (обрыв). Обычно виден тёмный кристалл или трещина на линзе.");
        if(f==="short")return r(fmt((n-1)*u,0),"В",`Тестер подсветки: линейка светится, но падение ${(n-1)*u} В вместо ${n*u} В — один светодиод замкнут, он не светит.`);
        return r(fmt(n*u,0),"В",`Тестер подсветки: светятся все ${n} светодиодов, падение ${n*u} В. Линейка исправна.`)}
      if(f==="open"||f==="dead")return r("??","","Тестер: деталь не обнаружена — светодиод оборван.");return r("1,9","В","Тестер: светодиод, прямое падение 1,9 В, светится.")}
    if(f==="short")return r("КЗ","","Тестер: «Деталь неисправна или КЗ». Сопротивление между выводами около 0.");
    if(f==="open"||f==="dead")return r("??","","Тестер: «Деталь не обнаружена». Выводы не связаны — деталь оборвана.");
    if(cat==="R"){const x=ohm(label);return x?r(...fmtR(x*1.003),"Тестер: резистор."):r("—","","Не распознано.")}
    if(cat==="C"||cat==="CP"){const c=capVal(label)||0;return r(fmtCap(c*(f==="dry"?.1:.97)).split(" ")[0],fmtCap(c).split(" ")[1],"Тестер: конденсатор"+(f==="dry"?", ёмкость сильно ниже номинала.":"."))}
    if(cat==="D")return r(fmt(diodeVf(label),2),"В","Тестер: диод, прямое падение "+fmt(diodeVf(label),2)+" В, обратно не проводит.");
    if(cat==="Q"){if(/цоколёвк/.test(label))return r("N-E","","Тестер: N-MOSFET, но порядок выводов G-S-D не совпадает с платой.");
      if(/PNP|2SA/.test(label))return r("PNP","","Тестер: PNP-транзистор, hFE 180, Uбэ 0,66 В.");if(/NPN|2N3904/.test(label))return r("NPN","","Тестер: NPN-транзистор, hFE 210, Uбэ 0,67 В.");
      if(/200 В|IRF640/.test(label))return r("N-E","","Тестер: N-MOSFET IRF640. Тестер не видит, что он рассчитан только на 200 В — читайте маркировку!");
      return r("N-E","","Тестер: N-MOSFET (обогащённый), Uпор 3,4 В, Cзатв 2,3 нФ, диод S→D 0,48 В. Исправен.")}
    if(cat==="OPT")return /MOC/.test(label)?r("1,2","В","Тестер видит только светодиод 1,2 В. Вместо транзистора внутри симистор."):r("1,1","В","Тестер: светодиод 1,1 В. Транзистор оптопары тестер не проверяет — нужна проверка в схеме.");
    if(cat==="IC")return /TL43/.test(label)?r("0,7","В","Тестер видит диод 0,7 В между анодом и катодом. TL431 полностью проверяется только в схеме."):r("—","","Микросхему тестер не проверит. Проверяйте напряжения на выводах при включённом блоке.");
    if(cat==="L")return r(...fmtR(windR(p.id)),"Тестер: катушка, сопротивление обмотки.");
    if(cat==="F")return r("0,1","Ω","Тестер: проводник 0,1 Ω — предохранитель цел.");
    if(cat==="TH")return r(...fmtR(ohm(label)||(/0,5/.test(label)?.5:5)),"Тестер: резистор"+(/PTC/.test(label)?" (это позистор, его сопротивление растёт при нагреве)":"")+".");
    if(cat==="RV")return r("??","","Варистор тестер не распознаёт: при низком напряжении он не проводит.");
    if(cat==="BD")return r("4×Д","","Тестер: 4 диода по 0,55 В — мост исправен.");
    if(cat==="SW"||cat==="MG"||cat==="MOT")return r("—","","Такую деталь тестер не проверяет — прозвоните её мультиметром.");
    if(cat==="BAT")return r(f==="open"?"0,4":"3,85","В",f==="open"?"Аккумулятор глубоко разряжен: 0,4 В. Его можно попробовать «раскачать» лабораторным БП током 50–100 мА.":(f==="dead"?"3,85 В, но внутреннее сопротивление 450 мΩ (норма до 150) — аккумулятор изношен.":"3,85 В, внутреннее сопротивление 90 мΩ — исправен."));
    if(cat==="CON")return r("—","","Разъём проверяют прозвонкой каждого контакта и осмотром под микроскопом.");
    return r("—","","");
  }
  // multimeter
  if(mode==="vdc"||mode==="vac")return null;
  if(mode==="cap"){if(!["C","CP"].includes(cat))return r("—","","Режим ёмкости — только для конденсаторов.");
    if(f==="short")return r("0,00","мкФ","Прибор показывает КЗ: конденсатор пробит.");if(f==="open")return r("0,00","нФ","Ёмкости нет — обрыв.");
    const c=capVal(label)||0;const v=fmtCap(c*(f==="dry"?.1:.96));return r(v.split(" ")[0],v.split(" ")[1],f==="dry"?"Ёмкость в 10 раз ниже номинала — высох.":"Ёмкость в норме (допуск ±20 %).")}
  if(mode==="diode"){
    if(cat==="LED"&&/линейка/.test(label))return r("OL","","Мультиметр подаёт около 3 В — этого мало, чтобы открыть линейку (нужно около 54 В). Проверяйте тестером подсветки или тестером деталей после выпайки.");
    if(cat==="LED"){if(f==="open"||f==="dead")return r("OL","","Не светится и не проводит — обрыв.");if(f==="short")return r("0,00","В","Пищит в обе стороны — пробит.");return r("1,90","В","Светодиод слабо светится, падение 1,9 В. Исправен.")}
    if(cat==="D"||cat==="BD"||(cat==="IC"&&/TL43/.test(label))||cat==="OPT"){const vf=cat==="OPT"?1.1:diodeVf(label);
      if(f==="short")return r("0,00","В","Писк в обе стороны — пробит.",[["красный → анод","0,00 В"],["красный → катод","0,00 В"]]);
      if(f==="open"||f==="dead")return r("OL","","Не проводит ни в одну сторону — обрыв.",[["красный → анод","OL"],["красный → катод","OL"]]);
      return r(fmt(vf,2),"В","В прямую сторону падение "+fmt(vf,2)+" В, в обратную — OL. Исправен.",[["красный → анод",fmt(vf,2)+" В"],["красный → катод","OL"]]);}
    if(cat==="Q"){const pnp=/PNP|2SA/.test(label),bjt=pnp||/NPN|2N3904/.test(label);
      if(f==="short")return r("0,00","В","Все выводы звонятся между собой — пробит.",[["любая пара","0,00 В"]]);
      if(f==="open")return r("OL","","Переходы не проводят — обрыв.",[["любая пара","OL"]]);
      if(bjt)return r("0,66","В",pnp?"PNP: чёрный на базе, красный на эмиттер/коллектор — по 0,65 В.":"NPN: красный на базе, чёрный на эмиттер/коллектор — по 0,65 В.",[["база–эмиттер","0,66 В"],["база–коллектор","0,64 В"],["коллектор–эмиттер","OL"]]);
      return r("0,48","В","Встроенный диод исток→сток 0,48 В. Остальные пары — OL.",[["исток → сток","0,48 В"],["сток → исток","OL"],["затвор → исток","OL"]]);}
    return r("—","","Режим диода — для диодов, транзисторов и оптопар.")}
  // ohm / beep
  let x=null,note="";
  if(f==="short")x=0.1;else if(f==="open"||f==="dead")x=Infinity;
  else if(cat==="R"){x=ohm(label);if(f==="drift")x*=2.7;note=" На плате значение может быть меньше из-за параллельных цепей."}
  else if(cat==="SW"){x=f==="stuck"?.1:Infinity;note=f==="stuck"?" Контакты сварились: кнопка не нажата, а цепь замкнута.":" Кнопка не нажата — контакты разомкнуты. Нажмите рычажок — должно стать 0 Ω."}
  else if(cat==="MG"){x=.3;note=" Это сопротивление нити накала. Между нитью и корпусом должно быть OL."}
  else if(cat==="MOT")x=windR(p.id);
  else if(cat==="CON"){x=.05;note=" Контакты разъёма звонятся. Проверьте и соседние контакты на замыкание."}
  else if(cat==="BAT"){return r("—","","Сопротивление аккумулятора омметром не мерят — измерьте напряжение или проверьте тестером.")}
  else if(cat==="F")x=.1;else if(cat==="TH")x=ohm(label)||(/0,5/.test(label)?.5:4.8);else if(cat==="L")x=windR(p.id);
  else if(cat==="C"||cat==="CP"){x=Infinity;note=" Показания сначала растут — конденсатор заряжается от прибора — затем OL."}
  else x=Infinity;
  if(cat==="IC"&&f!=="short"&&!/TL43/.test(label))return r("—","","Сопротивления между выводами микросхемы мало что скажут. Проверяйте напряжения на выводах при включённом блоке.");
  if(mode==="beep"){const b=x<40;return r(b?fmt(x,1):"OL",b?"Ω":"",b?"🔊 Пищит — цепь замкнута.":"Не пищит — цепи нет.")}
  if(x===Infinity)return r("OL","","Бесконечное сопротивление."+note);
  const [v,u]=fmtR(x);return r(v,u,(f==="short"?"Почти 0 — короткое замыкание.":"")+note);
}
function measure(){
  const id=ms.id;if(!id&&!ms.trash)return null;
  const tool=ms.tool,mode=ms.mode;
  if(ms.trash){const x=ms.trash;const p={id:x.id,cat:x.c||catOf(x.id),label:x.l,mode:x.mode};
    if(tool==="osc"||(tool==="dmm"&&(mode==="vdc"||mode==="vac")))return{v:"—",u:"",n:"Деталь выпаяна и лежит в корзине — напряжения на ней нет. Для этого режима нужна деталь на работающей плате.",where:"в корзине"};
    const r=passive(p,tool,mode);return Object.assign(r,{where:"вне платы"});}
  const p=partPhys(id);
  if(p.empty)return{v:"—",u:"",n:"Место пустое — деталь выпаяна.",where:"на плате"};
  if(tool==="tst")return{v:"—",u:"",n:"Тестер деталей работает только с выпаянной деталью. Перетащите её в корзину и измерьте там.",where:"на плате"};
  const pins=PINS[id]||[];
  if(tool==="osc"||mode==="vdc"||mode==="vac"){
    const ac=mode==="vac"&&tool==="dmm";
    const rows=pins.map(([l,n])=>{const [dc,acv]=NODE(n);return[l,ac?(acv>.05?fmt(acv,acv<10?2:0)+" В~":"0,00 В~"):(ACN.has(n)?"0 В (это переменное — V~)":fmt(dc,dc<10?2:(dc<100?1:0))+" В"),n]});
    if(tool==="osc")return{osc:true,rows,where:"на плате",n:"Щуп осциллографа на выводе «"+(pins[ms.pin]||["—"])[0]+"», земля — на "+(SECN.has((pins[ms.pin]||[])[1])?"холодной":"горячей")+" земле."};
    let v="—",u="";
    if(pins.length>=2){const a=NODE(pins[0][1]),b=NODE(pins[1][1]);
      if(ac){let d=Math.abs((a[1]||0)-(b[1]||0));if(MAINSN.has(pins[0][1])&&MAINSN.has(pins[1][1]))d=Math.abs(a[1]-b[1]);if(p.mode==="short")d=0;v=fmt(d,d<10?2:0);u="В~"}
      else{let d=a[0]-b[0];if(p.mode==="short")d=0;v=fmt(d,Math.abs(d)<10?2:(Math.abs(d)<100?1:0));u="В"}}
    const note=(!S.mains&&S.bulk>30?"Вилка выдернута, но "+CAPN+" всё ещё заряжен! ":"")+"На табло — напряжение между первыми двумя выводами. Ниже — каждый вывод относительно "+(SECN.has((pins[1]||pins[0]||[])[1])?"холодной":"горячей")+" земли.";
    return{v,u,n:note,rows,where:"на плате"};
  }
  // passive modes in circuit: need power off and discharged
  if(S.mains)return{v:"⚠",u:"",n:"Блок под напряжением! Сопротивление, диоды, ёмкость и ESR меряют только на обесточенной плате. Выньте вилку из розетки.",warn:1,where:"на плате"};
  if(S.bulk>30)return{v:"⚠",u:"",n:`На ${CAPN} ещё ${Math.round(S.bulk)} В. Сначала разрядите конденсатор — кнопка «Разрядить ${CAPN}».`,warn:1,where:"на плате"};
  const r=passive(p,tool,mode);return Object.assign(r,{where:"на плате (обесточена)"});
}
/* probes on the schematic */
const probeG=el("g",{},svg);
function probePts(id){
  const arr=parts[id];if(!arr)return null;const pid=PANEL_OF[id];const [cx,cy]=PAN[pid];const ox=GX+cx*(PW+GX),oy=GY+cy*(PH+GY);
  const c=(arr.find(p=>p.c.a||p.c.d||p.c.pins||p.c.c&&p.c.t!=="CORE")||arr[0]).c;
  let A,B;
  if(c.a){A=c.a;B=c.b}else if(c.d){A=c.s;B=c.d}else if(c.t==="BJT"){A=c.b;B=c.e}else if(c.t==="PT"){A=[c.c[0]+8,c.c[1]-17];B=[c.c[0]+8,c.c[1]+17]}
  else if(c.t==="BR"){A=[c.c[0]+c.r,c.c[1]];B=[c.c[0]-c.r,c.c[1]]}else if(c.pins){A=c.pins[ms.pin%c.pins.length]||c.pins[0];const g=c.pins.find(p=>p[2]==="GND")||c.pins[c.pins.length-1];B=g}
  else return null;
  if(ms.tool==="osc"||(ms.tool==="dmm"&&ms.mode==="vdc"&&c.a&&ms.pin===1)){if(c.a&&ms.pin===1){const t=A;A=B;B=t}}
  return[[A[0]+ox,A[1]+oy],[B[0]+ox,B[1]+oy]];
}
function drawProbes(){
  probeG.innerHTML="";if(!ms.id||ms.tool==="hand"||ms.tool==="tst"||ms.tool==="thermo")return;const pp=probePts(ms.id);if(!pp)return;
  const one=(p,col,dx,lab)=>{const g=el("g",{},probeG);el("circle",{cx:p[0],cy:p[1],r:7,class:"pring",style:`stroke:${col}`},g);
    el("line",{x1:p[0],y1:p[1],x2:p[0]+dx,y2:p[1]-34,style:`stroke:${col};stroke-width:7;stroke-linecap:round`},g);
    el("line",{x1:p[0],y1:p[1],x2:p[0]+dx*.25,y2:p[1]-8.5,style:`stroke:${col};stroke-width:2.2`},g);el("circle",{cx:p[0],cy:p[1],r:3,style:`fill:${col}`},g);
    const t=el("text",{x:p[0]+dx*1.15,y:p[1]-39,"text-anchor":"middle",class:"dyn",style:`fill:${col}`},g);t.textContent=lab};
  one(pp[0],"var(--probe-r)",-18,ms.tool==="osc"?"щуп":"+");
  if(ms.tool!=="osc")one(pp[1],"var(--probe-b)",18,"COM");
}
/* UI */
function setTool(t){ms.tool=t;document.body.classList.toggle("tool-on",t!=="hand");
  document.querySelectorAll("#tools button[data-t]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.t===t));
  $("dmodes").hidden=t!=="dmm";if(t==="hand"){ms.id=null;ms.trash=null}renderMeter();drawProbes();renderTrash()}
function setDMode(m){ms.mode=m;document.querySelectorAll("#dmodes button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.m===m));renderMeter();drawProbes()}
function measureAt(id){ms.id=id;ms.trash=null;ms.pin=0;renderMeter();drawProbes();
  if(game.on)log(`${TOOLS[ms.tool]}${ms.tool==="dmm"?" ("+DMODES.find(d=>d[0]===ms.mode)[1]+")":""}: щупы на ${id}.`)}
function measureTrash(i){ms.trash=st.trash[i];ms.id=null;renderMeter();drawProbes()}
let oscCtx=null;
function renderMeter(){
  const box=$("meter");if(ms.tool==="hand"){box.hidden=true;return}box.hidden=false;
  const r=measure();
  $("mTool").textContent=TOOLS[ms.tool]+(ms.tool==="dmm"?" · "+DMODES.find(d=>d[0]===ms.mode)[1]:"");
  const tgt=ms.trash?ms.trash.id+" (из корзины)":(ms.id?ms.id+" — "+P[ms.id][0]:"");
  $("mTgt").textContent=tgt||"Наведите прибор на деталь на схеме и нажмите";
  const lcd=$("mLcd"),osc=$("mOsc");
  if(!r){lcd.hidden=false;osc.hidden=true;$("mV").textContent="- - -";$("mU").textContent="";$("mN").textContent="";$("mRows").innerHTML="";return}
  if(r.osc){lcd.hidden=true;osc.hidden=false;drawOsc()}else{lcd.hidden=false;osc.hidden=true;$("mV").textContent=r.v;$("mU").textContent=r.u}
  lcd.classList.toggle("warn",!!r.warn);
  $("mN").textContent=r.n||"";
  const rows=r.rows||[];
  $("mRows").innerHTML=rows.map((x,i)=>`<li${(r.osc||ms.mode==="vdc"||ms.mode==="vac")&&i===ms.pin?' class="on"':""}>${r.osc||ms.mode==="vdc"||ms.mode==="vac"?`<button type="button" data-p="${i}">`:"<span>"}<span>${x[0]}</span><b>${x[1]}</b>${r.osc||ms.mode==="vdc"||ms.mode==="vac"?"</button>":"</span>"}</li>`).join("");
  $("mRows").querySelectorAll("[data-p]").forEach(b=>b.addEventListener("click",()=>{ms.pin=+b.dataset.p;renderMeter();drawProbes()}));
}
function drawOsc(){
  const cv=$("oscC"),d=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w)return;
  if(cv.width!==Math.round(w*d)){cv.width=Math.round(w*d);cv.height=Math.round(h*d)}
  const g=cv.getContext("2d");g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);
  g.fillStyle="#0b1a12";g.fillRect(0,0,w,h);g.strokeStyle="#1f4a33";g.lineWidth=1;
  for(let i=1;i<10;i++){g.beginPath();g.moveTo(w*i/10,0);g.lineTo(w*i/10,h);g.stroke()}for(let i=1;i<8;i++){g.beginPath();g.moveTo(0,h*i/8);g.lineTo(w,h*i/8);g.stroke()}
  const pins=PINS[ms.id]||[];const n=(pins[ms.pin]||[])[1];if(!n)return;const W=wave(n),Y=v=>h-6-(h-12)*(v-W.lo)/(W.hi-W.lo);
  if(W.lo<0){g.strokeStyle="#2f6b4c";g.beginPath();g.moveTo(0,Y(0));g.lineTo(w,Y(0));g.stroke()}
  g.strokeStyle="#5df2a0";g.lineWidth=2;g.beginPath();const ph=(performance.now()/4000)%1;
  for(let k=0;k<=w;k++){const v=W.f(k/w+ph*.0);k?g.lineTo(k,Y(v)):g.moveTo(k,Y(v))}g.stroke();
  g.fillStyle="#9ff5c6";g.font="11px "+getComputedStyle(document.documentElement).getPropertyValue("--f-mono");
  g.fillText(`${fmt(W.hi,W.hi<10?1:0)} ${W.u}`,4,12);g.fillText(`${fmt(W.lo,W.lo>-10&&W.lo<10?1:0)} ${W.u}`,4,h-4);g.textAlign="right";g.fillText(W.tb,w-4,12);g.textAlign="left";
}
$("tools").querySelectorAll("button[data-t]").forEach(b=>b.addEventListener("click",()=>setTool(b.dataset.t)));
$("dmodes").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>setDMode(b.dataset.m)));
$("discharge").addEventListener("click",()=>{if(S.mains){toast("Сначала выньте вилку из розетки.");return}if(S.bulk<5){toast(CAPN+" уже разряжен.");return}
  st.bulk=0;log(CAPN+" разряжен через резистор 10 кОм 5 Вт. Теперь можно мерить сопротивление и диоды.");renderMeter()});
setInterval(()=>{if(ms.tool!=="hand"&&(ms.id||ms.trash))renderMeter()},250);
