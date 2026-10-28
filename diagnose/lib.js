"use strict";
// Pure helpers shared by the app and the Node tests. No DOM access here.
(function(root){
const KEYS={data:"mdp-v1",meta:"mdp-meta-v1",checklists:"mdp-checklists-v1",guides:"mdp-guides-v1",progress:"mdp-guide-progress-v1",journal:"mdp-journal-v1",lastBackup:"mdp-last-backup",lastChange:"mdp-last-change",firstUse:"mdp-first-use",installDismissed:"mdp-install-dismissed"};
const DEFAULT_CATEGORIES=["Стиральные машины","Холодильники","Посудомойки","Сушильные машины","Телевизоры","Кофемашины","Другая техника"];

const normalize=s=>String(s??"").trim().toLocaleLowerCase("ru").replace(/ё/g,"е").replace(/\s+/g," ");
// Cyrillic letters that look like Latin ones are a common typo in error codes (Е5 vs E5).
const LOOKALIKE={"а":"a","в":"b","е":"e","к":"k","м":"m","н":"h","о":"o","р":"p","с":"c","т":"t","у":"y","х":"x"};
const normalizeCode=s=>normalize(s).replace(/[а-я]/g,c=>LOOKALIKE[c]||c).replace(/[\s\-_.:/\\]+/g,"");

function matchFault(f,query,mode){
 if(!query)return true;
 if(mode==="code"){const q=normalizeCode(query);return !!q&&normalizeCode(f.code).includes(q)}
 const hay=normalize([f.symptom,f.code,f.brand,f.model,f.check,f.fix,f.category].join(" "));
 const codeHay=normalizeCode(f.code);
 return normalize(query).split(" ").filter(Boolean).every(w=>hay.includes(w)||(codeHay&&codeHay.includes(normalizeCode(w))));
}

// Reference entries (built-in, read-only). Returns 0 (no match), 1 (match) or 2 (exact code).
function matchRef(e,query,mode){
 if(!query)return 1;
 if(mode==="code"){
  if(e.type!=="code")return 0;const q=normalizeCode(query);if(!q)return 0;
  const cs=e.codes.map(normalizeCode);
  return cs.includes(q)?2:cs.some(c=>c.startsWith(q))?1:0;
 }
 const hay=normalize([e.title,e.symptom,e.aliases,e.note,e.models,e.category,(e.brands||[]).join(" "),(e.codes||[]).join(" "),(e.causes||[]).join(" ")].join(" "));
 const codes=(e.codes||[]).map(normalizeCode);
 return normalize(query).split(" ").filter(Boolean).every(w=>hay.includes(w)||codes.includes(normalizeCode(w)))?1:0;
}
// Natural order for codes: E2 before E10.
const codeKey=c=>String(c).replace(/\d+/g,d=>d.padStart(4,"0"));

// ---------- validation ----------
const isStr=v=>typeof v==="string";
const isObj=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
const validFault=f=>isObj(f)&&isStr(f.id)&&isStr(f.category)&&isStr(f.symptom)&&isStr(f.check)&&(f.photos===undefined||(Array.isArray(f.photos)&&f.photos.every(isStr)));
const validData=d=>isObj(d)&&Array.isArray(d.categories)&&d.categories.every(isStr)&&Array.isArray(d.faults)&&d.faults.every(validFault);
const validChecklist=r=>isObj(r)&&isStr(r.name)&&Array.isArray(r.steps)&&r.steps.every(s=>isObj(s)&&isStr(s.text)&&typeof s.done==="boolean");
const validGuide=g=>isObj(g)&&isStr(g.id)&&isStr(g.title)&&Array.isArray(g.steps)&&g.steps.every(s=>isObj(s)&&isStr(s.title)&&isStr(s.instruction));
const validProgress=p=>isObj(p)&&Object.values(p).every(Array.isArray);
const validMeta=m=>isObj(m)&&(m.favorites===undefined||(Array.isArray(m.favorites)&&m.favorites.every(isStr)))&&(m.recent===undefined||(Array.isArray(m.recent)&&m.recent.every(isStr)));
const JOURNAL_RESULTS=["Исправлено","Причина найдена","Нужна запчасть","Не найдено","Отказ от ремонта"];
const validJournalEntry=j=>isObj(j)&&isStr(j.id)&&isStr(j.title)&&isStr(j.date)&&!Number.isNaN(Date.parse(j.date))&&isStr(j.result)&&(j.device===undefined||isStr(j.device))&&(j.note===undefined||isStr(j.note));
const validPhoto=p=>isObj(p)&&isStr(p.id)&&isStr(p.type)&&/^image\/(jpeg|png|webp|gif)$/.test(p.type)&&isStr(p.data)&&/^[A-Za-z0-9+/]+=*$/.test(p.data);
const cleanMeta=m=>({favorites:validMeta(m)&&m.favorites?[...new Set(m.favorites)]:[],recent:validMeta(m)&&m.recent?[...new Set(m.recent)].slice(0,15):[]});

// Accepts every backup format the app has ever produced. Returns the storage entries to write.
function parseBackup(v){
 if(!isObj(v))throw Error("Файл не является резервной копией");
 const entries={},summary=[];
 let photos;
 if(v.format==="mdp-complete"&&(v.version===1||v.version===2||v.version===3)){
  if(!validData(v.data))throw Error("Повреждены записи неисправностей");
  if(!Array.isArray(v.checklists)||!v.checklists.every(validChecklist))throw Error("Повреждены сценарии");
  if(v.guides!==undefined&&(!Array.isArray(v.guides)||!v.guides.every(validGuide)))throw Error("Повреждены алгоритмы");
  if(v.progress!==undefined&&!validProgress(v.progress))throw Error("Повреждён прогресс алгоритмов");
  if(v.meta!==undefined&&!validMeta(v.meta))throw Error("Повреждены избранное и история");
  if(v.journal!==undefined&&(!Array.isArray(v.journal)||!v.journal.every(validJournalEntry)))throw Error("Повреждён журнал диагностик");
  if(v.photos!==undefined&&(!Array.isArray(v.photos)||!v.photos.every(validPhoto)))throw Error("Повреждены фотографии");
  entries[KEYS.data]={categories:v.data.categories,faults:v.data.faults};
  entries[KEYS.checklists]=v.checklists;
  if(v.guides!==undefined)entries[KEYS.guides]=v.guides;
  if(v.progress!==undefined)entries[KEYS.progress]=v.progress;
  if(v.meta!==undefined)entries[KEYS.meta]=cleanMeta(v.meta);
  if(v.journal!==undefined)entries[KEYS.journal]=v.journal;
  if(v.photos!==undefined)photos=v.photos;
  summary.push(v.data.faults.length+" неисправн.",v.checklists.length+" сценар.",(v.guides||[]).length+" алгоритм.");
  if(v.journal!==undefined)summary.push(v.journal.length+" в журнале");
  if(photos)summary.push(photos.length+" фото");
 }else if(v.format==="master-diagnose-pro"&&v.version===1){
  if(!validData(v.data))throw Error("Повреждены записи неисправностей");
  entries[KEYS.data]={categories:v.data.categories,faults:v.data.faults};
  summary.push(v.data.faults.length+" неисправн. (только база)");
 }else if(v.format==="mdp-guides"&&v.version===1){
  if(!Array.isArray(v.guides)||!v.guides.every(validGuide))throw Error("Повреждены алгоритмы");
  if(v.progress!==undefined&&!validProgress(v.progress))throw Error("Повреждён прогресс алгоритмов");
  entries[KEYS.guides]=v.guides;entries[KEYS.progress]=v.progress||{};
  summary.push(v.guides.length+" алгоритм. (только алгоритмы)");
 }else throw Error("Неизвестный формат файла");
 return {entries,photos,summary:summary.join(", ")};
}

// ---------- guide text format ----------
// Blocks separated by a blank line. First line: title. Optional lines: РЕЖИМ:, ЩУПЫ:, НОРМА:, ФОТО: https://…, ДА -> N, НЕТ -> N.
function parseSteps(text){
 return String(text||"").replace(/\r/g,"").split(/\n\s*\n/).map(block=>{
  const lines=block.split("\n").map(s=>s.trim()).filter(Boolean);if(!lines.length)return null;
  const step={title:lines[0],instruction:"",yes:null,no:null,mode:"",points:"",expected:"",image:""},instruction=[];
  for(const line of lines.slice(1)){
   let m;
   if((m=line.match(/^(ДА|НЕТ)\s*(?:->|→|—>|-)\s*(\d+)$/i)))step[m[1].toUpperCase()==="ДА"?"yes":"no"]=Number(m[2])||null;
   else if((m=line.match(/^РЕЖИМ\s*:\s*(.+)$/i)))step.mode=m[1];
   else if((m=line.match(/^ЩУПЫ\s*:\s*(.+)$/i)))step.points=m[1];
   else if((m=line.match(/^НОРМА\s*:\s*(.+)$/i)))step.expected=m[1];
   else if((m=line.match(/^ФОТО\s*:\s*(https:\/\/\S+)$/i)))step.image=m[1];
   else if((m=line.match(/^ЗАМЕР\s*:\s*([a-z0-9-]+)$/i)))step.measure=m[1].toLowerCase();
   else instruction.push(line);
  }
  step.instruction=instruction.join(" ");
  return step;
 }).filter(Boolean);
}
function stepsToText(steps){
 return steps.map(s=>[s.title,s.instruction,s.mode&&"РЕЖИМ: "+s.mode,s.points&&"ЩУПЫ: "+s.points,s.expected&&"НОРМА: "+s.expected,s.image&&"ФОТО: "+s.image,s.measure&&"ЗАМЕР: "+s.measure,s.yes&&"ДА -> "+s.yes,s.no&&"НЕТ -> "+s.no].filter(Boolean).join("\n")).join("\n\n");
}
// Keeps the "done" flag for steps whose text did not change.
function mergeChecklistSteps(oldSteps,texts){
 const pool=new Map();for(const s of oldSteps){const a=pool.get(s.text)||[];a.push(s.done);pool.set(s.text,a)}
 return texts.map(text=>({text,done:!!(pool.get(text)?.shift())}));
}

// ---------- electronics ----------
const PREFIX={p:1e-12,n:1e-9,u:1e-6,"µ":1e-6,"мк":1e-6,m:1e-3,"м":1e-3,k:1e3,"к":1e3,K:1e3,M:1e6,"М":1e6,G:1e9,"Г":1e9};
// "4,7k", "4k7", "220", "0.5м", "10 мк" -> number. Empty -> null. Garbage -> NaN.
function parseValue(input){
 let s=String(input??"").trim().replace(/\s+/g,"").replace(",",".");
 if(!s)return null;
 s=s.replace(/(ом|ohm|Ω|в|v|а|a|вт|w|ф|f)$/i,"");
 const mid=s.match(/^(\d+)(мк|[pnuµmмkкKMМGГRr])(\d+)$/);
 if(mid)return Number(mid[1]+"."+mid[3])*(/[Rr]/.test(mid[2])?1:PREFIX[mid[2]]);
 const m=s.match(/^(-?\d*\.?\d+(?:e-?\d+)?)(мк|[pnuµmмkкKMМGГ])?$/i);
 if(!m)return NaN;
 const p=m[2]?(PREFIX[m[2]]??PREFIX[m[2].toLowerCase()]):1;
 return Number(m[1])*p;
}
function formatSI(x,unit,digits=3){
 if(x===null||!Number.isFinite(x))return "—";
 if(x===0)return "0 "+unit;
 const steps=[[1e9,"Г"],[1e6,"М"],[1e3,"к"],[1,""],[1e-3,"м"],[1e-6,"мк"],[1e-9,"н"],[1e-12,"п"]];
 const a=Math.abs(x);const [f,p]=steps.find(([f])=>a>=f*0.9995)||steps[steps.length-1];
 return String(Number((x/f).toPrecision(digits))).replace(".",",")+" "+p+unit;
}
// Any two of U, I, R, P -> all four.
function ohm({U=null,I=null,R=null,P=null}){
 const known=[U,I,R,P].filter(v=>v!==null&&v!==undefined);
 if(known.length!==2)throw Error("Заполните ровно два любых поля");
 if(known.some(v=>!Number.isFinite(v)))throw Error("Неверное число");
 if([R,P].some(v=>v!==null&&v<0))throw Error("Сопротивление и мощность не могут быть отрицательными");
 if(U!==null&&I!==null){R=U/I;P=U*I}
 else if(U!==null&&R!==null){I=U/R;P=U*U/R}
 else if(U!==null&&P!==null){I=P/U;R=U*U/P}
 else if(I!==null&&R!==null){U=I*R;P=I*I*R}
 else if(I!==null&&P!==null){U=P/I;R=P/(I*I)}
 else {U=Math.sqrt(P*R);I=Math.sqrt(P/R)}
 if(![U,I,R,P].every(Number.isFinite))throw Error("Деление на ноль — проверьте значения");
 return {U,I,R,P};
}
function divider({Uin,R1,R2}){
 if(![Uin,R1,R2].every(v=>Number.isFinite(v)))throw Error("Заполните Uвх, R1 и R2");
 if(R1<0||R2<0||R1+R2===0)throw Error("Сопротивления должны быть положительными");
 const I=Uin/(R1+R2);
 return {Uout:Uin*R2/(R1+R2),I,P1:I*I*R1,P2:I*I*R2};
}
// R2 for a wanted output voltage with a fixed R1.
function dividerR2({Uin,Uout,R1}){
 if(![Uin,Uout,R1].every(Number.isFinite))throw Error("Заполните Uвх, Uвых и R1");
 if(!(Uout>0&&Uout<Uin))throw Error("Uвых должно быть больше 0 и меньше Uвх");
 return R1*Uout/(Uin-Uout);
}

const COLORS=[
 {id:"black",name:"Чёрный",hex:"#111111",digit:0,mult:1,tcr:250},
 {id:"brown",name:"Коричневый",hex:"#7a4a24",digit:1,mult:10,tol:1,tcr:100},
 {id:"red",name:"Красный",hex:"#d32f2f",digit:2,mult:100,tol:2,tcr:50},
 {id:"orange",name:"Оранжевый",hex:"#f57c00",digit:3,mult:1e3,tcr:15},
 {id:"yellow",name:"Жёлтый",hex:"#fbc02d",digit:4,mult:1e4,tcr:25},
 {id:"green",name:"Зелёный",hex:"#388e3c",digit:5,mult:1e5,tol:0.5,tcr:20},
 {id:"blue",name:"Синий",hex:"#1976d2",digit:6,mult:1e6,tol:0.25,tcr:10},
 {id:"violet",name:"Фиолетовый",hex:"#7b1fa2",digit:7,mult:1e7,tol:0.1,tcr:5},
 {id:"grey",name:"Серый",hex:"#8a8a8a",digit:8,mult:1e8,tol:0.05,tcr:1},
 {id:"white",name:"Белый",hex:"#f5f5f5",digit:9,mult:1e9},
 {id:"gold",name:"Золотой",hex:"#c9a227",mult:0.1,tol:5},
 {id:"silver",name:"Серебристый",hex:"#c0c0c0",mult:0.01,tol:10},
 {id:"none",name:"Нет полосы",hex:"transparent",tol:20}
];
const color=id=>COLORS.find(c=>c.id===id);
// bands: array of color ids, length 3..6
function decodeColors(bands){
 const n=bands.length;if(n<3||n>6)throw Error("Нужно от 3 до 6 полос");
 const cs=bands.map(color);if(cs.some(c=>!c))throw Error("Неизвестный цвет");
 const digitsCount=n>=5?3:2;
 const digits=cs.slice(0,digitsCount);
 if(digits.some(c=>c.digit===undefined))throw Error("Цифровые полосы не могут быть "+digits.find(c=>c.digit===undefined).name.toLowerCase());
 const m=cs[digitsCount];if(m.mult===undefined)throw Error("Неверный цвет множителя");
 const tolC=n===3?color("none"):cs[digitsCount+1];
 if(tolC.tol===undefined||(tolC.id==="none"&&n!==3&&n!==4))throw Error("Неверный цвет допуска");
 const tcrC=n===6?cs[5]:null;if(tcrC&&tcrC.tcr===undefined)throw Error("Неверный цвет ТКС");
 const value=Number(digits.map(c=>c.digit).join(""))*m.mult;
 return {ohms:Number(value.toPrecision(12)),tolerance:tolC.tol,tcr:tcrC?tcrC.tcr:null};
}
// Value -> colour bands (only exact representations; null if impossible).
function encodeColors(ohms,bandCount=4,tol=5){
 if(!(ohms>0))return null;const digitsCount=bandCount>=5?3:2;
 for(let exp=-2;exp<=9;exp++){
  const sig=ohms/Math.pow(10,exp);
  if(Math.abs(sig-Math.round(sig))>1e-6*Math.max(1,sig))continue;
  const r=Math.round(sig);if(r<Math.pow(10,digitsCount-1)||r>=Math.pow(10,digitsCount))continue;
  const mult=COLORS.find(c=>c.mult!==undefined&&Math.abs(Math.log10(c.mult)-exp)<1e-9);if(!mult)continue;
  const tolC=COLORS.find(c=>c.tol===tol&&(c.id!=="none"||bandCount===4))||color("gold");
  return [...String(r)].map(d=>COLORS.find(c=>c.digit===Number(d)).id).concat(mult.id,tolC.id);
 }
 return null;
}
const E96=[100,102,105,107,110,113,115,118,121,124,127,130,133,137,140,143,147,150,154,158,162,165,169,174,178,182,187,191,196,200,205,210,215,221,226,232,237,243,249,255,261,267,274,280,287,294,301,309,316,324,332,340,348,357,365,374,383,392,402,412,422,432,442,453,464,475,487,499,511,523,536,549,562,576,590,604,619,634,649,665,681,698,715,732,750,768,787,806,825,845,866,887,909,931,953,976];
const EIA_MULT={Z:0.001,Y:0.01,R:0.01,X:0.1,S:0.1,A:1,B:10,H:10,C:100,D:1e3,E:1e4,F:1e5};
// SMD resistor marking: "103", "4702", "4R7", "R10", "01C" (EIA-96).
function decodeSMD(code){
 const s=String(code??"").trim().toUpperCase().replace(/\s/g,"");
 if(!s)throw Error("Введите маркировку");
 let m;
 if((m=s.match(/^(\d{2})([ZYRXSABHCDEF])$/))&&Number(m[1])>=1&&Number(m[1])<=96)return {ohms:Number((E96[Number(m[1])-1]*EIA_MULT[m[2]]).toPrecision(6)),system:"EIA-96 (1%)"};
 if(/^\d*R\d*$/.test(s)&&s!=="R")return {ohms:Number(s.replace("R",".").replace(/^\./,"0.")),system:"с буквой R (R — десятичная точка)"};
 if((m=s.match(/^(\d{2,3})(\d)$/)))return {ohms:Number(m[1])*Math.pow(10,Number(m[2])),system:m[1].length===2?"3 цифры (обычно 5%)":"4 цифры (обычно 1%)"};
 if(s==="0"||s==="000"||s==="0000")return {ohms:0,system:"перемычка 0 Ом"};
 throw Error("Маркировка не распознана");
}

// ---------- capacitors ----------
const CAP_VOLTAGE={"0G":4,"0L":5.5,"0J":6.3,"1A":10,"1C":16,"1D":20,"1E":25,"1V":35,"1H":50,"1J":63,"1K":80,"2A":100,"2Q":110,"2B":125,"2C":160,"2Z":180,"2D":200,"2P":220,"2E":250,"2F":315,"2V":350,"2G":400,"2W":450,"2H":500,"2J":630,"3A":1000};
const CAP_TOL={B:"±0,1 пФ",C:"±0,25 пФ",D:"±0,5 пФ",F:"±1%",G:"±2%",J:"±5%",K:"±10%",M:"±20%",Z:"+80/−20%"};
// "104", "2A104J", "473K", "4n7", "n47", "2u2", "1R5", "47" -> farads (+ tolerance / voltage if coded).
function decodeCapCode(code){
 let s=String(code??"").trim().toUpperCase().replace(/\s+/g,"").replace(/[МM]К/g,"U").replace(/Н/g,"N").replace(/П/g,"P").replace(/Μ|µ/g,"U");
 if(!s)throw Error("Введите маркировку");
 let voltage=null,tolerance=null,m;
 if((m=s.match(/^(\d[A-Z])(?=\d|[PNUR]\d)/))&&CAP_VOLTAGE[m[1]]){voltage=CAP_VOLTAGE[m[1]];s=s.slice(2)}
 if((m=s.match(/^(.+?)([BCDFGJKMZ])$/))&&!/[PNUR]$/.test(m[1])&&/\d$/.test(m[1])){tolerance=CAP_TOL[m[2]];s=m[1]}
 let pf;
 if((m=s.match(/^(\d*)([PNUR])(\d*)$/))&&(m[1]||m[3])){
  const mult={P:1,R:1,N:1e3,U:1e6}[m[2]];
  pf=Number((m[1]||"0")+"."+(m[3]||"0"))*mult;
 }else if((m=s.match(/^(\d{2})(\d)$/))){
  const e=Number(m[2]);if(e===6||e===7)throw Error("Множитель "+e+" в маркировке конденсаторов не используется");
  pf=Number(m[1])*(e===8?0.01:e===9?0.1:Math.pow(10,e));
 }else if(/^\d{1,2}$/.test(s))pf=Number(s);
 else throw Error("Маркировка не распознана");
 return {farads:Number((pf*1e-12).toPrecision(10)),pf:Number(pf.toPrecision(10)),tolerance,voltage};
}
// pF / nF / µF in the form repair techs use.
function formatCap(f){
 if(!Number.isFinite(f))return "—";
 const pf=f*1e12,fix=x=>String(Number(x.toPrecision(3))).replace(".",",");
 if(pf<1000)return fix(pf)+" пФ";
 if(pf<1e6)return fix(pf/1e3)+" нФ"+(pf>=1e5?" ("+fix(pf/1e6)+" мкФ)":"");
 return fix(pf/1e6)+" мкФ";
}

// ---------- combinations ----------
function combine(values,how,kind){
 if(!values.length||values.some(v=>!(v>0)))throw Error("Нужны положительные значения");
 const sum=a=>a.reduce((x,y)=>x+y,0);
 const recip=a=>1/sum(a.map(v=>1/v));
 // Resistors add in series; capacitors add in parallel.
 return (how==="series")===(kind==="R")?sum(values):recip(values);
}
const E24=[1,1.1,1.2,1.3,1.5,1.6,1.8,2,2.2,2.4,2.7,3,3.3,3.6,3.9,4.3,4.7,5.1,5.6,6.2,6.8,7.5,8.2,9.1];
const eSeries=(from,to)=>{const out=[];for(let d=-1;d<=7;d++)for(const v of E24){const x=Number((v*Math.pow(10,d)).toPrecision(3));if(x>=from&&x<=to)out.push(x)}return out};
function nearestE24(x,dir=0){
 if(!(x>0))return null;const all=eSeries(x/20,x*20);
 if(dir>0)return all.find(v=>v>=x*(1-1e-9))??null;
 return all.reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a);
}
// Best single, series pair and parallel pair of E24 resistors for a target value.
function pairFor(target){
 if(!(target>0))throw Error("Введите нужное сопротивление");
 const single=nearestE24(target);
 const vals=eSeries(target/100,target*100);
 let series=null,parallel=null;
 const err=v=>Math.abs(v-target)/target;
 for(let i=0;i<vals.length;i++)for(let j=i;j<vals.length;j++){
  const a=vals[i],b=vals[j];
  const sv=a+b;if(b<=target&&(!series||err(sv)<err(series.value)-1e-12))series={a,b,value:sv};
  const pv=a*b/(a+b);if(a>=target&&(!parallel||err(pv)<err(parallel.value)-1e-12))parallel={a,b,value:pv};
 }
 return {single:{value:single,error:err(single)},series:series&&{...series,error:err(series.value)},parallel:parallel&&{...parallel,error:err(parallel.value)}};
}
// LED series resistor: count LEDs in series on one supply.
function ledResistor({Us,Uled,I,count=1}){
 if(![Us,Uled,I].every(Number.isFinite)||!(I>0)||!(Uled>0))throw Error("Заполните напряжение питания, падение на светодиоде и ток");
 if(!(count>=1&&Number.isInteger(count)))throw Error("Количество светодиодов — целое число от 1");
 const drop=Us-Uled*count;
 if(drop<=0)throw Error("Питания не хватает: на светодиодах "+String(Uled*count).replace(".",",")+" В");
 const R=drop/I,Rstd=nearestE24(R,1),Ireal=drop/Rstd;
 return {R,Rstd,Ireal,P:drop*Ireal,Pled:Uled*Ireal};
}

const lib={matchRef,codeKey,decodeCapCode,formatCap,CAP_VOLTAGE,combine,E24,nearestE24,pairFor,ledResistor,KEYS,DEFAULT_CATEGORIES,JOURNAL_RESULTS,validJournalEntry,validPhoto,parseSteps,stepsToText,mergeChecklistSteps,normalize,normalizeCode,matchFault,validData,validChecklist,validGuide,validProgress,validMeta,cleanMeta,parseBackup,parseValue,formatSI,ohm,divider,dividerR2,COLORS,decodeColors,encodeColors,E96,decodeSMD};
if(typeof module!=="undefined"&&module.exports)module.exports=lib;else root.MDPLib=lib;
})(typeof self!=="undefined"?self:this);
