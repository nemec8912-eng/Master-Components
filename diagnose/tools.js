"use strict";
// Electronics calculators. Pure maths lives in lib.js; this file only wires up the UI.
(()=>{
const L=MDPLib;
const show=(id,html,error=false)=>{const o=$(id);o.innerHTML=html;o.classList.toggle("error",error)};
const num=(form,name)=>L.parseValue(form.elements[name].value);
const fmt=(x,u)=>escapeHTML(L.formatSI(x,u));

// ---------- Ohm's law ----------
$("ohmForm").onsubmit=e=>{
 e.preventDefault();const f=e.target;
 try{
  const v={U:num(f,"U"),I:num(f,"I"),R:num(f,"R"),P:num(f,"P")};
  for(const [k,x] of Object.entries(v))if(Number.isNaN(x))throw Error("Не понял значение в поле "+k);
  const r=L.ohm(v);
  show("ohmResult","<b>U</b> = "+fmt(r.U,"В")+" · <b>I</b> = "+fmt(r.I,"А")+"<br><b>R</b> = "+fmt(r.R,"Ом")+" · <b>P</b> = "+fmt(r.P,"Вт")+
   (r.P>0?'<br><span class="hint">Резистор берите с запасом по мощности: от '+fmt(r.P*2,"Вт")+'</span>':""));
 }catch(err){show("ohmResult",escapeHTML(err.message),true)}
};
$("ohmForm").onreset=()=>show("ohmResult","");

// ---------- divider ----------
$("dividerForm").onsubmit=e=>{
 e.preventDefault();const f=e.target;
 try{
  const Uin=num(f,"Uin"),R1=num(f,"R1"),R2=num(f,"R2"),Uout=num(f,"Uout");
  if([Uin,R1,R2,Uout].some(Number.isNaN))throw Error("Проверьте формат чисел");
  if(R2!==null){
   const r=L.divider({Uin,R1,R2});
   show("dividerResult","<b>Uвых</b> = "+fmt(r.Uout,"В")+"<br>Ток делителя "+fmt(r.I,"А")+" · P(R1) "+fmt(r.P1,"Вт")+" · P(R2) "+fmt(r.P2,"Вт"));
  }else{
   const r2=L.dividerR2({Uin,Uout,R1});
   const e24=[1,1.1,1.2,1.3,1.5,1.6,1.8,2,2.2,2.4,2.7,3,3.3,3.6,3.9,4.3,4.7,5.1,5.6,6.2,6.8,7.5,8.2,9.1];
   const dec=Math.pow(10,Math.floor(Math.log10(r2)));
   const near=[...e24.map(x=>x*dec),10*dec].reduce((a,b)=>Math.abs(b-r2)<Math.abs(a-r2)?b:a);
   const real=L.divider({Uin,R1,R2:near}).Uout;
   show("dividerResult","<b>R2</b> = "+fmt(r2,"Ом")+"<br>Ближайший из ряда E24: "+fmt(near,"Ом")+" → Uвых = "+fmt(real,"В"));
  }
 }catch(err){show("dividerResult",escapeHTML(err.message),true)}
};
$("dividerForm").onreset=()=>show("dividerResult","");

// ---------- colour bands ----------
const roles={4:["1-я цифра","2-я цифра","Множитель","Допуск"],5:["1-я цифра","2-я цифра","3-я цифра","Множитель","Допуск"],6:["1-я цифра","2-я цифра","3-я цифра","Множитель","Допуск","ТКС"]};
const defaults={4:["yellow","violet","red","gold"],5:["yellow","violet","black","brown","brown"],6:["yellow","violet","black","brown","brown","brown"]};
function optionsFor(role){
 return L.COLORS.filter(c=>role.includes("цифра")?c.digit!==undefined:role==="Множитель"?c.mult!==undefined:role==="Допуск"?c.tol!==undefined:c.tcr!==undefined)
  .filter(c=>!(c.id==="none"&&role==="Допуск"&&$("bandCount").value!=="4"));
}
function buildBands(values){
 const n=$("bandCount").value;
 $("bandSelects").replaceChildren(...roles[n].map((role,i)=>{
  const label=document.createElement("label");label.textContent=role;
  const s=document.createElement("select");s.dataset.band=i;
  s.innerHTML=optionsFor(role).map(c=>'<option value="'+c.id+'">'+(role.includes("цифра")?c.digit+" · ":role==="Допуск"?"±"+String(c.tol).replace(".",",")+"% · ":role==="ТКС"?c.tcr+" ppm · ":role==="Множитель"?"×"+(c.mult<1?String(c.mult).replace(".",","):L.formatSI(c.mult,"").replace(" ",""))+" · ":"")+escapeHTML(c.name)+'</option>').join("");
  s.value=(values||defaults[n])[i];if(!s.value)s.selectedIndex=0;
  label.append(s);return label;
 }));
 decodeBands();
}
function decodeBands(){
 const bands=[...$("bandSelects").querySelectorAll("select")].map(s=>s.value);
 $("resistorPreview").innerHTML='<span class="lead"></span><span class="body">'+bands.map((b,i)=>'<i style="background:'+L.COLORS.find(c=>c.id===b).hex+(i===bands.length-1&&bands.length>3?';margin-left:auto':'')+'"></i>').join("")+'</span><span class="lead"></span>';
 try{const r=L.decodeColors(bands);show("colorResult","<b>"+fmt(r.ohms,"Ом")+"</b> ±"+String(r.tolerance).replace(".",",")+"%"+(r.tcr?" · ТКС "+r.tcr+" ppm/°C":""))}
 catch(err){show("colorResult",escapeHTML(err.message),true)}
}
$("bandCount").onchange=()=>buildBands();
$("bandSelects").onchange=decodeBands;
buildBands();

$("encodeForm").onsubmit=e=>{
 e.preventDefault();const v=L.parseValue($("encodeValue").value);
 if(!(v>0))return show("encodeResult","Введите номинал, например 4,7k или 220",true);
 const swatch=ids=>ids.map(id=>{const c=L.COLORS.find(x=>x.id===id);return '<span class="swatch"><i style="background:'+c.hex+'"></i>'+escapeHTML(c.name)+'</span>'}).join(" ");
 const four=L.encodeColors(v,4,5),five=L.encodeColors(v,5,1);
 if(!four&&!five)return show("encodeResult","Такой номинал нельзя записать цветными полосами точно",true);
 show("encodeResult","<b>"+fmt(v,"Ом")+"</b>"+(four?"<br>4 полосы (±5%): "+swatch(four):"")+(five?"<br>5 полос (±1%): "+swatch(five):""));
};
$("smdForm").onsubmit=e=>{
 e.preventDefault();
 try{const r=L.decodeSMD($("smdCode").value);show("smdResult","<b>"+fmt(r.ohms,"Ом")+"</b> · "+escapeHTML(r.system))}
 catch(err){show("smdResult",escapeHTML(err.message),true)}
};
})();

// ---------- capacitors, combinations, LED ----------
(()=>{
const L=MDPLib;
const show=(id,html,error=false)=>{const o=$(id);o.innerHTML=html;o.classList.toggle("error",error)};
const pct=e=>e<5e-5?"точно":(e*100).toFixed(e<0.01?2:1).replace(".",",")+"%";
const R=x=>escapeHTML(L.formatSI(x,"Ом"));
$("capForm").onsubmit=e=>{
 e.preventDefault();
 try{const r=L.decodeCapCode($("capCode").value);
  show("capResult","<b>"+escapeHTML(L.formatCap(r.farads))+"</b>"+(r.tolerance?" · допуск "+escapeHTML(r.tolerance):"")+(r.voltage?" · "+String(r.voltage).replace(".",",")+" В":"")+
   '<br><span class="hint">'+escapeHTML(String(r.pf).replace(".",","))+" пФ</span>")}
 catch(err){show("capResult",escapeHTML(err.message),true)}
};
$("combineForm").onsubmit=e=>{
 e.preventDefault();const f=e.target;
 try{
  const raw=f.elements.values.value.split(/[\s;]+/).filter(Boolean),kind=f.elements.kind.value,how=f.elements.how.value;
  if(raw.length<2)throw Error("Введите хотя бы два номинала");
  const vals=raw.map(v=>{const x=kind==="C"?parseCap(v):L.parseValue(v);if(!(x>0))throw Error("Не понял номинал «"+v+"»");return x});
  const total=L.combine(vals,how,kind);
  show("combineResult","Итого: <b>"+escapeHTML(kind==="C"?L.formatCap(total):L.formatSI(total,"Ом"))+"</b>");
 }catch(err){show("combineResult",escapeHTML(err.message),true)}
};
// Capacitor values: "100n", "4,7мк", "104", plain number = µF (as printed on electrolytics).
function parseCap(v){
 const s=String(v).trim().replace(",",".");
 // 104, 473, 229 — a code; 100, 220, 470 — a value in µF as printed on electrolytics.
 if(/^\d\d[1-589]$/.test(s))return L.decodeCapCode(s).farads;
 if(/^\d*\.?\d+$/.test(s))return Number(s)*1e-6;
 try{return L.decodeCapCode(s).farads}catch{}
 const x=L.parseValue(s);return x;
}
$("pairForm").onsubmit=e=>{
 e.preventDefault();
 try{
  const t=L.parseValue($("pairTarget").value);if(!(t>0))throw Error("Введите номинал, например 4,99k");
  const r=L.pairFor(t),lines=[];
  lines.push((r.single.error<5e-5?"Есть в ряду E24: ":"Ближайший из E24: ")+"<b>"+R(r.single.value)+"</b> ("+pct(r.single.error)+")");
  if(r.single.error>=5e-5){
   if(r.series)lines.push("Последовательно: <b>"+R(r.series.a)+" + "+R(r.series.b)+"</b> = "+R(r.series.value)+" ("+pct(r.series.error)+")");
   if(r.parallel)lines.push("Параллельно: <b>"+R(r.parallel.a)+" ∥ "+R(r.parallel.b)+"</b> = "+R(r.parallel.value)+" ("+pct(r.parallel.error)+")");
  }
  show("pairResult",lines.join("<br>"));
 }catch(err){show("pairResult",escapeHTML(err.message),true)}
};
$("ledForm").onsubmit=e=>{
 e.preventDefault();const f=e.target;
 try{
  const mA=L.parseValue(f.elements.I.value);
  const r=L.ledResistor({Us:L.parseValue(f.elements.Us.value),Uled:L.parseValue(f.elements.Uled.value),I:mA/1000,count:Number(f.elements.count.value||1)});
  show("ledResult","Расчёт: "+R(r.R)+" → ставьте <b>"+R(r.Rstd)+"</b> (E24)<br>Ток "+escapeHTML(L.formatSI(r.Ireal,"А"))+" · на резисторе "+escapeHTML(L.formatSI(r.P,"Вт"))+
   '<br><span class="hint">Мощность резистора — от '+escapeHTML(L.formatSI(Math.max(r.P*2,0.125),"Вт"))+"</span>");
 }catch(err){show("ledResult",escapeHTML(err.message),true)}
};
})();
