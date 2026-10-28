"use strict";
// Draws a measurement picture as inline SVG: the multimeter (display, dial, jacks), the part with its
// terminals, and the red/black probes on the points being measured. Drawings are schematic: terminal
// placement is generic and is labelled as such — the real layout comes from the part itself.
(()=>{
const C={bg:"#0f172a",panel:"#16213a",metal:"#9aa7b8",metalDark:"#5b6778",brass:"#d4a64a",body:"#2b3a52",bodyLine:"#4b5d78",text:"#e2e8f0",muted:"#94a3b8",ok:"#22c55e",bad:"#ef4444",red:"#ef4444",black:"#111827",meter:"#f2b705",lcd:"#c9d7b5",lcdText:"#16210f"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const T=(x,y,s,o={})=>'<text x="'+x+'" y="'+y+'" fill="'+(o.fill||C.text)+'" font-size="'+(o.size||11)+'" font-family="system-ui,sans-serif" text-anchor="'+(o.anchor||"middle")+'"'+(o.weight?' font-weight="'+o.weight+'"':"")+'>'+esc(s)+'</text>';
const terminal=(x,y,label,o={})=>'<rect x="'+(x-7)+'" y="'+(y-9)+'" width="14" height="18" rx="2" fill="'+(o.fill||C.brass)+'" stroke="#7a5a1c"/>'+(label?T(x,y-14,label,{size:10,fill:C.muted}):"");
const screw=(x,y,r=8,label)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+C.brass+'" stroke="#7a5a1c"/><path d="M'+(x-r*0.6)+' '+y+'H'+(x+r*0.6)+'" stroke="#7a5a1c" stroke-width="2"/>'+(label?T(x,y-r-5,label,{size:10,fill:C.muted}):"");
const caseMark=(x,y,label="корпус")=>'<circle cx="'+x+'" cy="'+y+'" r="5" fill="'+C.metal+'" stroke="#fff" stroke-dasharray="2 2"/>'+T(x,y+18,label,{size:10,fill:C.muted});

// Each part: drawing + named probe points.
const PARTS={
 heater(){return {svg:
  '<rect x="180" y="66" width="160" height="104" rx="12" fill="'+C.metal+'" stroke="'+C.metalDark+'"/>'+
  '<rect x="188" y="74" width="144" height="88" rx="9" fill="none" stroke="#333" stroke-width="6" opacity=".55"/>'+
  screw(215,100,9)+screw(305,100,9)+
  '<circle cx="260" cy="136" r="10" fill="'+C.metalDark+'"/><circle cx="260" cy="136" r="5" fill="'+C.metal+'"/>'+T(260,160,"шпилька = корпус",{size:9,fill:"#1f2937",weight:600})+T(215,124,"1",{size:10,fill:"#1f2937",weight:700})+T(305,124,"2",{size:10,fill:"#1f2937",weight:700})+
  T(260,60,"ТЭН (вид на фланец)",{size:11,weight:600}),
  points:{t1:[215,100],t2:[305,100],case:[260,136]}}},
 tube(){return {svg:
  '<path d="M195 92 H320 Q345 92 345 130 Q345 168 320 168 H195" fill="none" stroke="'+C.metal+'" stroke-width="12" stroke-linecap="round"/>'+
  terminal(190,92,"вывод 1")+terminal(190,168,"вывод 2")+caseMark(328,130,"оболочка")+T(270,60,"Трубчатый нагреватель",{size:11,weight:600}),
  points:{t1:[190,92],t2:[190,168],case:[328,130]}}},
 coil(){return {svg:
  '<rect x="186" y="104" width="150" height="70" rx="10" fill="#e5e7eb" stroke="#9ca3af"/>'+
  '<rect x="196" y="78" width="54" height="40" rx="6" fill="'+C.body+'" stroke="'+C.bodyLine+'"/><rect x="272" y="78" width="54" height="40" rx="6" fill="'+C.body+'" stroke="'+C.bodyLine+'"/>'+
  terminal(210,84,"")+terminal(236,84,"")+terminal(286,84,"")+terminal(312,84,"")+
  T(223,136,"катушка 1",{size:10,fill:"#334155"})+T(299,136,"катушка 2",{size:10,fill:"#334155"})+
  '<circle cx="216" cy="190" r="10" fill="#9ca3af"/><circle cx="306" cy="190" r="10" fill="#9ca3af"/>'+T(261,60,"Заливной клапан",{size:11,weight:600}),
  points:{a1:[210,84],a2:[236,84],b1:[286,84],b2:[312,84]}}},
 pump(){return {svg:
  '<circle cx="262" cy="138" r="54" fill="'+C.body+'" stroke="'+C.bodyLine+'" stroke-width="2"/><circle cx="262" cy="138" r="22" fill="#1e293b" stroke="'+C.bodyLine+'"/>'+
  '<rect x="226" y="72" width="72" height="22" rx="4" fill="#374151"/>'+terminal(244,82,"")+terminal(280,82,"")+
  '<path d="M316 150 h28 v-14 h10 v40 h-10 v-14 h-28z" fill="#4b5563"/>'+T(262,60,"Насос / мотор",{size:11,weight:600}),
  points:{a:[244,82],b:[280,82],case:[262,190]}}},
 ntc(){return {svg:
  '<rect x="200" y="112" width="130" height="30" rx="15" fill="#d1d5db" stroke="#9ca3af"/>'+T(272,132,"NTC",{size:12,fill:"#334155",weight:700})+
  '<rect x="206" y="84" width="58" height="30" rx="4" fill="#374151"/>'+terminal(222,92,"")+terminal(248,92,"")+T(265,60,"Датчик температуры",{size:11,weight:600}),
  points:{a:[222,92],b:[248,92]}}},
 pswitch(){return {svg:
  '<circle cx="265" cy="140" r="48" fill="#e5e7eb" stroke="#9ca3af"/><rect x="255" y="186" width="20" height="22" rx="4" fill="#9ca3af"/>'+
  terminal(228,96,"общ.")+terminal(265,92,"НЗ")+terminal(302,96,"НР")+T(265,148,"прессостат",{size:10,fill:"#334155"})+T(265,60,"Датчик уровня (прессостат)",{size:11,weight:600}),
  points:{com:[228,96],nc:[265,92],no:[302,96],tube:[265,208]}}},
 lock(){return {svg:
  '<rect x="196" y="86" width="140" height="96" rx="8" fill="#e5e7eb" stroke="#9ca3af"/><rect x="210" y="150" width="40" height="18" rx="3" fill="#9ca3af"/>'+
  terminal(226,96,"")+terminal(266,96,"")+terminal(306,96,"")+T(226,124,"1",{size:10,fill:"#334155"})+T(266,124,"2",{size:10,fill:"#334155"})+T(306,124,"3",{size:10,fill:"#334155"})+
  T(266,60,"УБЛ (выводы по схеме модели)",{size:11,weight:600}),
  points:{p1:[226,96],p2:[266,96],p3:[306,96]}}},
 motor(){const xs=[200,224,248,272,296,320],lab=["Т1","Т2","С1","С2","Щ1","Щ2"];return {svg:
  '<rect x="186" y="96" width="150" height="96" rx="16" fill="'+C.body+'" stroke="'+C.bodyLine+'" stroke-width="2"/><rect x="190" y="74" width="142" height="26" rx="4" fill="#374151"/>'+
  xs.map((x,i)=>terminal(x,86,"")+T(x,116,lab[i],{size:9,fill:C.muted})).join("")+
  caseMark(318,172)+T(262,46,"Коллекторный двигатель",{size:11,weight:600})+T(262,62,"Т — тахо, С — статор, Щ — щётки",{size:9,fill:C.muted}),
  points:{t1:[200,86],t2:[224,86],s1:[248,86],s2:[272,86],r1:[296,86],r2:[320,86],case:[318,172]}}},
 compressor(){return {svg:
  '<ellipse cx="262" cy="150" rx="80" ry="58" fill="#1f2937" stroke="#4b5563" stroke-width="2"/><circle cx="262" cy="128" r="30" fill="#374151"/>'+
  '<circle cx="262" cy="114" r="6" fill="'+C.brass+'"/><circle cx="246" cy="138" r="6" fill="'+C.brass+'"/><circle cx="278" cy="138" r="6" fill="'+C.brass+'"/>'+
  T(262,106,"C",{size:10,fill:C.text})+T(234,150,"S",{size:10})+T(290,150,"R",{size:10})+caseMark(322,192,"трубка")+
  T(262,50,"Компрессор",{size:11,weight:600})+T(262,66,"C — общий, S — пуск., R — рабочая",{size:9,fill:C.muted}),
  points:{c:[262,114],s:[246,138],r:[278,138],case:[322,192]}}},
 ptc(){return {svg:
  '<rect x="206" y="84" width="112" height="96" rx="8" fill="#111827" stroke="#4b5563"/>'+
  '<circle cx="236" cy="132" r="9" fill="#000" stroke="'+C.brass+'" stroke-width="3"/><circle cx="288" cy="132" r="9" fill="#000" stroke="'+C.brass+'" stroke-width="3"/>'+
  T(262,170,"гнёзда на штыри компрессора",{size:9,fill:C.muted})+T(262,64,"Пусковое реле (PTC)",{size:11,weight:600}),
  points:{a:[236,132],b:[288,132]}}},
 fuse(){return {svg:
  '<path d="M196 132 H226 M298 132 H330" stroke="'+C.metal+'" stroke-width="4"/><rect x="226" y="118" width="72" height="28" rx="6" fill="#d1d5db" stroke="#9ca3af"/>'+
  '<circle cx="196" cy="132" r="5" fill="'+C.brass+'"/><circle cx="330" cy="132" r="5" fill="'+C.brass+'"/>'+T(262,82,"Термопредохранитель",{size:11,weight:600}),
  points:{a:[196,132],b:[330,132]}}},
 thermostat(){return {svg:
  '<circle cx="246" cy="134" r="40" fill="#e5e7eb" stroke="#9ca3af"/><rect x="238" y="80" width="16" height="24" fill="#9ca3af"/>'+
  '<path d="M206 150 C 170 180, 200 210, 240 200" stroke="'+C.metal+'" stroke-width="2" fill="none"/>'+
  terminal(306,116,"")+terminal(306,152,"")+'<path d="M286 116 H299 M286 152 H299" stroke="'+C.metal+'" stroke-width="3"/>'+
  T(262,64,"Капиллярный термостат",{size:11,weight:600}),
  points:{a:[306,116],b:[306,152]}}},
 magnetron(){return {svg:
  '<rect x="206" y="94" width="120" height="96" rx="6" fill="#9ca3af" stroke="#6b7280"/>'+
  [0,1,2,3,4].map(i=>'<rect x="216" y="'+(102+i*16)+'" width="100" height="6" fill="#d1d5db"/>').join("")+
  '<rect x="186" y="118" width="22" height="40" rx="3" fill="#374151"/>'+screw(197,126,6,"")+screw(197,150,6,"")+
  caseMark(320,198)+T(262,74,"Магнетрон: выводы накала",{size:11,weight:600}),
  points:{f1:[197,126],f2:[197,150],case:[320,198]}}},
 capacitor(){return {svg:
  '<ellipse cx="262" cy="140" rx="64" ry="42" fill="#d1d5db" stroke="#9ca3af"/>'+terminal(236,104,"")+terminal(288,104,"")+
  caseMark(330,186)+T(262,145,"ВВ-конденсатор",{size:10,fill:"#334155"})+T(262,70,"Высоковольтный конденсатор",{size:11,weight:600}),
  points:{a:[236,104],b:[288,104],case:[330,186]}}},
 transformer(){return {svg:
  '<rect x="196" y="96" width="132" height="96" fill="#6b7280" stroke="#4b5563"/><rect x="214" y="110" width="40" height="68" fill="#b45309"/><rect x="272" y="110" width="40" height="68" fill="#b45309" opacity=".8"/>'+
  terminal(210,92,"")+terminal(236,92,"")+terminal(306,92,"ВВ")+T(223,82,"первичка",{size:9,fill:C.muted})+caseMark(306,200,"корпус/шасси")+
  T(262,62,"Высоковольтный трансформатор",{size:11,weight:600}),
  points:{p1:[210,92],p2:[236,92],hv:[306,92],case:[306,200]}}},
 hvdiode(){return {svg:
  '<path d="M196 112 L 330 168" stroke="'+C.metal+'" stroke-width="3"/><rect x="236" y="122" width="56" height="22" rx="6" fill="#111827" stroke="#4b5563" transform="rotate(22 264 133)"/>'+
  '<circle cx="196" cy="112" r="6" fill="'+C.brass+'"/><circle cx="330" cy="168" r="6" fill="'+C.brass+'"/>'+T(262,80,"Высоковольтный диод",{size:11,weight:600}),
  points:{a:[196,112],b:[330,168]}}},
 microswitch(){return {svg:
  '<rect x="206" y="104" width="112" height="70" rx="6" fill="#111827" stroke="#4b5563"/><rect x="250" y="88" width="24" height="18" rx="3" fill="#9ca3af"/>'+
  terminal(226,186,"COM")+terminal(262,186,"NO")+terminal(298,186,"NC")+T(262,70,"Микровыключатель дверцы",{size:11,weight:600}),
  points:{com:[226,186],no:[262,186],nc:[298,186]}}},
 bridge(){return {svg:
  '<rect x="214" y="96" width="96" height="84" rx="6" fill="#111827" stroke="#4b5563"/>'+T(262,144,"мост",{size:10,fill:C.muted})+
  [["~",226],["+",250],["−",274],["~",298]].map(([l,x])=>'<rect x="'+(x-3)+'" y="180" width="6" height="26" fill="'+C.metal+'"/>'+T(x,172,l,{size:12,weight:700})).join("")+
  T(262,82,"Диодный мост (выпаян)",{size:11,weight:600}),
  points:{ac1:[226,204],plus:[250,204],minus:[274,204],ac2:[298,204]}}},
 mosfet(){return {svg:
  '<rect x="226" y="72" width="72" height="20" rx="3" fill="'+C.metal+'"/><circle cx="262" cy="82" r="6" fill="'+C.bg+'"/>'+
  '<rect x="222" y="92" width="80" height="70" rx="4" fill="#111827" stroke="#4b5563"/>'+T(262,132,"MOSFET",{size:10,fill:C.muted})+
  [["G",238],["D",262],["S",286]].map(([l,x])=>'<rect x="'+(x-3)+'" y="162" width="6" height="40" fill="'+C.metal+'"/>'+T(x,220,l,{size:12,weight:700})).join("")+
  T(262,60,"Силовой ключ (выпаян)",{size:11,weight:600}),
  points:{g:[238,198],d:[262,198],s:[286,198]}}},
 ecap(){return {svg:
  '<rect x="228" y="76" width="68" height="104" rx="10" fill="#1d4ed8" stroke="#1e3a8a"/><rect x="278" y="76" width="18" height="104" fill="#93c5fd" opacity=".6"/>'+
  T(287,130,"−",{size:16,fill:"#1e3a8a",weight:700})+T(252,118,"100мкФ",{size:9,fill:"#dbeafe"})+T(252,132,"450В",{size:9,fill:"#dbeafe"})+
  '<path d="M246 180 V206 M282 180 V206" stroke="'+C.metal+'" stroke-width="4"/>'+T(246,224,"+",{size:12,weight:700})+T(282,224,"−",{size:12,weight:700})+
  T(262,62,"Электролитический конденсатор",{size:11,weight:600}),
  points:{plus:[246,204],minus:[282,204]}}},
 runcap(){return {svg:
  '<rect x="214" y="86" width="96" height="110" rx="14" fill="#e5e7eb" stroke="#9ca3af"/>'+T(262,140,"ёмкость и допуск",{size:9,fill:"#334155"})+T(262,154,"— на корпусе",{size:9,fill:"#334155"})+
  terminal(244,92,"")+terminal(280,92,"")+T(262,66,"Пусковой / рабочий конденсатор",{size:11,weight:600}),
  points:{a:[244,92],b:[280,92]}}},
 ledstrip(){return {svg:
  '<rect x="186" y="118" width="160" height="34" rx="4" fill="#e5e7eb" stroke="#9ca3af"/>'+
  [0,1,2].map(i=>'<rect x="'+(204+i*50)+'" y="124" width="24" height="22" rx="3" fill="#fef9c3" stroke="#ca8a04"/><circle cx="'+(216+i*50)+'" cy="135" r="6" fill="#fde047"/>').join("")+
  '<circle cx="204" cy="160" r="3" fill="'+C.brass+'"/><circle cx="228" cy="160" r="3" fill="'+C.brass+'"/>'+T(204,176,"A+",{size:9})+T(228,176,"K−",{size:9})+
  T(266,90,"Светодиодная линейка подсветки",{size:11,weight:600})+T(266,104,"мерим один светодиод",{size:9,fill:C.muted}),
  points:{a:[204,160],k:[228,160]}}},
 vpump(){return {svg:
  '<rect x="204" y="104" width="120" height="60" rx="8" fill="#111827" stroke="#4b5563"/><rect x="324" y="122" width="22" height="24" fill="'+C.brass+'"/><rect x="182" y="122" width="22" height="24" fill="#9ca3af"/>'+
  terminal(240,98,"")+terminal(288,98,"")+T(264,140,"катушка + диод",{size:10,fill:C.muted})+T(264,72,"Вибрационный насос",{size:11,weight:600}),
  points:{a:[240,98],b:[288,98]}}},
 disc(){return {svg:
  '<circle cx="262" cy="138" r="40" fill="#d1d5db" stroke="#9ca3af"/><circle cx="262" cy="138" r="26" fill="#e5e7eb"/>'+T(262,143,"t°",{size:14,fill:"#334155",weight:700})+
  terminal(232,94,"")+terminal(292,94,"")+T(262,70,"Термостат-«таблетка» (Klixon)",{size:11,weight:600}),
  points:{a:[232,94],b:[292,94]}}},
};

const DIALS={"cap":"⊣⊢ ёмкость",'200':"Ω 200","2k":"Ω 2k","20k":"Ω 20k","200k":"Ω 200k","2M":"Ω 2M","20M":"Ω 20M","buzz":"•))) прозвонка","diode":"→|— диод","vac":"V~ 200м"};
function meter(display,unit,dial){
 const angle={"cap":135,"buzz":-120,"diode":-95,"200":-60,"2k":-35,"20k":-10,"200k":15,"2M":40,"20M":65,"vac":110}[dial]??0;
 const rad=(angle-90)*Math.PI/180,px=70+Math.cos(rad)*22,py=134+Math.sin(rad)*22;
 return '<rect x="12" y="34" width="116" height="176" rx="14" fill="'+C.meter+'" stroke="#a37c00"/>'+
  '<rect x="20" y="42" width="100" height="160" rx="9" fill="#1f2937"/>'+
  '<rect x="26" y="48" width="88" height="40" rx="4" fill="'+C.lcd+'"/>'+
  '<text x="'+(unit?92:108)+'" y="78" fill="'+C.lcdText+'" font-size="'+(String(display).length>4?18:22)+'" font-family="ui-monospace,Menlo,monospace" text-anchor="end" font-weight="700">'+esc(display)+'</text>'+
  (unit?'<text x="110" y="78" fill="'+C.lcdText+'" font-size="11" font-family="system-ui" text-anchor="end">'+esc(unit)+'</text>':"")+
  '<circle cx="70" cy="134" r="28" fill="#374151" stroke="#111"/><line x1="70" y1="134" x2="'+px.toFixed(1)+'" y2="'+py.toFixed(1)+'" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>'+
  T(70,104,DIALS[dial]||dial,{size:10,fill:"#fde68a",weight:600})+
  '<circle cx="46" cy="186" r="7" fill="#000" stroke="#555"/><circle cx="94" cy="186" r="7" fill="#000" stroke="'+C.red+'"/>'+
  T(46,174,"COM",{size:8,fill:"#cbd5e1"})+T(94,174,"VΩ",{size:8,fill:"#cbd5e1"});
}
function probe(from,to,color){
 if(color==="black")return probeLine(from,to,"#cbd5e1",7)+probeLine(from,to,"#0b0b0b",4,true);
 return probeLine(from,to,color,4,true);
}
function probeLine(from,to,color,width,withTip){
 const [x1,y1]=from,[x2,y2]=to;
 const cx1=x1+(x2-x1)*0.25,cy1=Math.max(y1,y2)+40,cx2=x2-30,cy2=y2+50;
 // Probe handle along the last part of the lead, ending in a metal tip on the point.
 const ang=Math.atan2(y2-cy2,x2-cx2),hx=x2-Math.cos(ang)*26,hy=y2-Math.sin(ang)*26,tx=x2-Math.cos(ang)*8,ty=y2-Math.sin(ang)*8;
 return '<path d="M'+x1+' '+y1+' C'+cx1+' '+cy1+' '+cx2+' '+cy2+' '+hx.toFixed(1)+' '+hy.toFixed(1)+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"/>'+
  '<line x1="'+hx.toFixed(1)+'" y1="'+hy.toFixed(1)+'" x2="'+tx.toFixed(1)+'" y2="'+ty.toFixed(1)+'" stroke="'+color+'" stroke-width="'+(width+5)+'" stroke-linecap="round"/>'+
  (withTip?'<line x1="'+tx.toFixed(1)+'" y1="'+ty.toFixed(1)+'" x2="'+x2+'" y2="'+y2+'" stroke="#e5e7eb" stroke-width="2.5" stroke-linecap="round"/>'+
  '<circle cx="'+x2+'" cy="'+y2+'" r="4.5" fill="none" stroke="#fde047" stroke-width="2"/>':"");
}
const EXTRA={
 heat:'<path d="M222 160 q6 -10 0 -18 q-6 -8 0 -16 M248 160 q6 -10 0 -18 q-6 -8 0 -16 M274 160 q6 -10 0 -18 q-6 -8 0 -16" stroke="#f97316" stroke-width="3" fill="none"/>'+'<text x="300" y="176" fill="#fdba74" font-size="10" font-family="system-ui">нагрев</text>',
 blow:'<path d="M300 220 L272 210" stroke="#38bdf8" stroke-width="3" marker-end="url(#arrow)"/><text x="300" y="214" fill="#7dd3fc" font-size="10" font-family="system-ui">подуть</text>',
 press:'<path d="M262 60 V82" stroke="#38bdf8" stroke-width="3" marker-end="url(#arrow)"/><text x="292" y="72" fill="#7dd3fc" font-size="10" font-family="system-ui">нажат</text>',
 rotate:'<path d="M228 170 a24 24 0 1 0 0 -1" stroke="#38bdf8" stroke-width="2" fill="none" marker-end="url(#arrow)"/><text x="196" y="208" fill="#7dd3fc" font-size="10" font-family="system-ui">медленно вращать вал</text>',
};
// opts: {part, from, to, dial, display, unit, ok:boolean, label, extra}
function draw(o){
 const part=(PARTS[o.part]||PARTS.pump)();
 const a=part.points[o.from],b=part.points[o.to];
 const status=o.ok?"ИСПРАВНО":"НЕИСПРАВНО"+(o.label?" · "+o.label:"");
 return '<svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+esc(status+": на дисплее "+o.display+" "+(o.unit||""))+'" class="measureSvg">'+
  '<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#38bdf8"/></marker></defs>'+
  '<rect width="360" height="240" rx="12" fill="'+C.bg+'"/>'+
  '<rect x="0" y="0" width="360" height="24" rx="12" fill="'+(o.ok?C.ok:C.bad)+'"/><rect x="0" y="12" width="360" height="12" fill="'+(o.ok?C.ok:C.bad)+'"/>'+
  T(180,17,status,{size:12,fill:"#fff",weight:700})+
  part.svg+(EXTRA[o.extra]||"")+meter(o.display,o.unit,o.dial)+
  (a?probe([94,186],a,C.red):"")+(b?probe([46,186],b,"black"):"")+
  T(352,232,"схема условная",{size:8,fill:"#64748b",anchor:"end"})+
 '</svg>';
}
self.MDPMeasureDraw={draw,parts:Object.keys(PARTS)};
})();
