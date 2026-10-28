/* replacement kit — варианты замены для любой детали.
   Плата может уточнить варианты функциями boardKit(id,k) (вернуть true, если всё описала сама)
   и boardKitPatch(id,list). */
function ohm(v){const m=v.match(/([\d,]+)\s*(МОм|кОм|Ом)/);if(!m)return null;return parseFloat(m[1].replace(",","."))*({"Ом":1,"кОм":1e3,"МОм":1e6}[m[2]])}
function fohm(x){const u=x>=1e6?["МОм",1e6]:x>=1e3?["кОм",1e3]:["Ом",1];let n=x/u[1];return (n>=10?Math.round(n):Math.round(n*10)/10).toString().replace(".",",")+" "+u[0]}
function hash(s){let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h)}
const isHV=v=>/X2|Y1|kV|630V|450V|400V|1kV/.test(v);
const isFastDiode=v=>/UF\d|FR\d|STTH|SR\d|MBR|STPS|SB\d|Шоттки|быстр/.test(v);
const isPowerR=(v,x)=>/Вт/.test(v)||(x!=null&&x<=47);
function kitFor(id){
  const v=P[id][1],modes=Object.keys(P[id][4]),m0=modes.includes("drift")?"drift":modes[0],o=[];
  const ok=(l)=>o.push({l,r:"ok",why:"Подходит по всем параметрам: схема снова работает."});
  const add=(l,r,m,s,why)=>o.push({l,r,m,s,why});
  const k={v,modes,m0,ok,add,o};
  if(!(typeof boardKit==="function"&&boardKit(id,k))){
    const c=catOf(id),t=TYPE_OF[id];
    if(c==="F"){ok(v);add("F1A 250V (быстрый)","now","open",0,"Быстрый предохранитель маленького тока сгорает от броска тока заряда C1 в момент включения в розетку.");add("10 А («жучок»)","bug",null,0,"Работает, но не защищает: при КЗ первыми выгорят мост и дорожки платы, а не предохранитель.")}
    else if(c==="TH"){ok(v);add("NTC 0,5 Ом","later","open",1.5,"Слишком малое сопротивление не ограничивает бросок тока: при включении в розетку обрывается сам термистор.");add("PTC (позистор) 5 Ом","later","open",6,"Позистор от нагрева увеличивает сопротивление, а не уменьшает: под нагрузкой он запирает сеть.")}
    else if(c==="RV"){ok(v);add("10D241K (240 В)","now","short",0,"Варистор на 240 В начинает проводить уже на пике сети 325 В — КЗ и сгоревший предохранитель.");add("20D821K (820 В)","ok2",null,0,"Работает, но защищает хуже: пропустит более сильный скачок.")}
    else if(c==="BD"){ok(v);add("мост 100 В","now","short",0,"Мост на 100 В пробивается от сетевого пика 325 В — КЗ, предохранитель сгорает.");add("DB107 · 1 А 1000 В","later","open",8,"Мост на 1 А не выдерживает ток нагрузки: перегревается и обрывается.")}
    else if(c==="Q"&&t==="BJT"){const pnp=/PNP|2SA|BC55|S8550/.test(v);ok(v);add(pnp?"2N3904 (NPN вместо PNP)":"2SA1015 (PNP вместо NPN)","same","open",0,"Транзистор другой структуры не открывается этим сигналом — цепь не работает.")}
    else if(c==="Q"){ok(v);add("MOSFET IRF640 · 200 В 18 А","now","short",0,"Транзистор на 200 В пробивается сразу: на нём больше 300 В.");add(v.split(" ·")[0]+" с другой цоколёвкой (G-S-D)","same","open",0,"Выводы перепутаны — ключ не открывается, схема не работает.")}
    else if(c==="IC"&&/TL43|эталон/.test(v)){ok("TL431 · 2,5 В");add("стабилитрон BZX55C2V4","same","open",0,"Обычный стабилитрон не управляется делителем — обратной связи нет.");add("TL432 (другая цоколёвка)","same","short",0,"Выводы катод и опорный перепутаны — светодиод оптопары горит всегда.")}
    else if(c==="IC"){ok(v);add("похожая микросхема с другой распиновкой","same",modes.includes("dead")?"dead":modes[0],0,"Распиновка другая — микросхема не запускается.")}
    else if(c==="TRI"){ok(v);add("симистор на 200 В","now","short",0,"Симистор на 200 В пробивается от пика сети 325 В — нагрузка включена всегда.");add("симистор с чувствительным затвором 3 мА (BT131) вместо 10 мА","ok2",null,0,"Работает, но может самопроизвольно открываться от помех.")}
    else if(c==="RL"){ok(v);add("реле с катушкой 24 В","same","open",0,"Катушка на 24 В не срабатывает от 12 В — контакты не замыкаются.");add("реле 12 В 5 А","later","stuck",8,"Контакты на 5 А не выдерживают ток ТЭНа 9 А — обгорают и привариваются.")}
    else if(c==="XT"){ok(v);add("резонатор 4 МГц","same","dead",0,"Микроконтроллер на другой частоте работает неправильно — программа не запускается.")}
    else if(c==="OPT"&&/MOC/.test(v)){ok(v);add("PC817 (оптопара с транзистором)","same","open",0,"Транзистор оптопары не может управлять симистором на переменном токе.")}
    else if(c==="OPT"){ok("PC817");add("MOC3021 (оптосимистор)","same","open",0,"Оптосимистор в цепи постоянного тока не работает как фототранзистор — сигнала ОС нет.")}
    else if(c==="D"&&/стабилитрон|ZD/.test(v+id)){ok(v);add("стабилитрон 5,1 В","same","short",0,"Стабилитрон на 5,1 В «сажает» шину — микросхемам не хватает питания.")}
    else if(c==="LED"){ok(v);add("ИК-светодиод","same","open",0,"Невидимое свечение — индикатор «не горит».")}
    else if(c==="D"){ok(v);
      if(isFastDiode(v))add("1N4007 (обычный, медленный)","later","short",6,"Медленный диод не успевает закрываться на высокой частоте, сильно греется и пробивается.");
      add("1N5819 · 40 В","now","short",0,"Диод на 40 В пробивается обратным напряжением этой цепи.")}
    else if(c==="CP"){const [cap,rest]=v.split(" мкФ");ok(v);
      add(cap+" мкФ "+(isHV(v)?"200V":"6,3V"),"later","short",4,"Напряжение конденсатора ниже рабочего: он нагревается, вздувается и пробивается.");
      add(fmtC(parseFloat(cap.replace(",","."))/10)+" мкФ"+(rest||""),"same","dry",0,"Ёмкость в 10 раз меньше — работает как высохший.");
      add(cap+" мкФ, 85°C, обычный (не Low ESR)","later","dry",20,"Обычный конденсатор на высокой частоте греется и быстро высыхает.")}
    else if(c==="C"){ok(v);
      if(isHV(v))add(v.split(/ X| Y| \d+V| 1kV| 630V| 450V| 400V/)[0]+" на 50 В","later","short",3,"Конденсатор на 50 В не выдерживает высокое напряжение и пробивается.");
      add(cdiv(v),"same",modes.includes("open")?"open":modes[0],0,"Ёмкости не хватает — деталь как будто отсутствует.")}
    else if(c==="R"){const x=ohm(v);ok(v);
      if(x){add(fohm(x*10),"same",m0,0,"Номинал в 10 раз больше — режим цепи нарушен, работает как неисправная.");add(fohm(x/10),"same",m0,0,"Номинал в 10 раз меньше — режим цепи нарушен.")}
      if(isPowerR(v,x))add(v.split(" ")[0]+" "+v.split(" ")[1]+" · 0,125 Вт","later","open",10,"Маломощный резистор перегревается и обрывается.")}
    else{ok(v);add(/^T/.test(id)?"трансформатор от другой модели":"дроссель с другой индуктивностью","same",modes[0],0,"Обмотки не подходят — энергия не передаётся как нужно.")}
  }
  if(typeof boardKitPatch==="function")boardKitPatch(id,o);
  return o.sort((a,b)=>hash(id+a.l)-hash(id+b.l));
}
function cdiv(v){const m=v.match(/([\d,]+)\s*(мкФ|нФ|пФ)/);if(!m)return "в 100 раз меньше";let pf=parseFloat(m[1].replace(",","."))*({"мкФ":1e6,"нФ":1e3,"пФ":1}[m[2]])/100;const u=pf>=1e6?["мкФ",1e6]:pf>=1e3?["нФ",1e3]:["пФ",1];return fmtC(pf/u[1])+" "+u[0]}
function fmtC(x){return (x>=10?Math.round(x):Math.round(x*10)/10).toString().replace(".",",")}
function install(id,opt){
  delete st.F[id];delete st.sec[id];delete st.later[id];if(catOf(id)==="F"){st.fuse=false;st.bug=false}if(BOARD.rcdPart===id)st.rcd=false;
  Object.keys(st.casc).forEach(k=>{if(k.startsWith(id))delete st.casc[k]});
  st.inst[id]=opt;st.slot[id]={l:opt.l,c:opt.c||catOf(id)};
  if((opt.r==="same"||opt.r==="now")&&opt.m)st.F[id]=opt.m;
  if(opt.r==="later")st.later[id]={t:opt.s,m:opt.m,tg:opt.tg||id,tm:opt.tm||opt.m,msg:opt.why};
  if(opt.r==="bug")st.bug=true;
  log(`На место ${id} установлено: ${opt.l}.`+(opt.r==="ok"||opt.r==="ok2"?"":" Посмотрим, что будет…"),opt.r==="now");
  renderCard();
}
