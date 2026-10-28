/* helpers — общие функции и состояние */
const NS="http://www.w3.org/2000/svg";
const el=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e};
const ln=(g,x1,y1,x2,y2,c="w")=>el("line",{x1,y1,x2,y2,class:c},g);
const tx=(g,x,y,s,c="dlab",a={})=>{const e=el("text",Object.assign({x,y,class:c},a),g);e.textContent=s;return e};
const $=id=>document.getElementById(id);
const C={ac:"var(--ac)",hv:"var(--hv)",pu:"var(--pu)",lv:"var(--lv)",fb:"var(--fb)",vcc:"var(--vcc)",bad:"var(--bad)",ink:"var(--ink)",mu:"var(--muted)"};
const fmt=(v,d=1)=>v.toFixed(d).replace(".",",");
const sq=(ph,dt)=>{ph=((ph%1)+1)%1;return ph<dt?1:(ph>=.5&&ph<.5+dt?-1:0)};
const ML={open:"Обрыв",short:"Пробой / КЗ",dry:"Высох",dead:"Не работает",drift:"Ушёл номинал",stuck:"Залипли контакты"};
const st={lamp:false,lab:{on:false,rail:"",v:15,lim:.5},temp:{},mains:true,tv:false,F:{},sec:{},fuse:false,rcd:false,surge:null,ovp:false,ovpT:0,bulk:0,casc:{},t:0,last:performance.now(),speed:1,inst:{},later:{},slot:{},trash:[],bug:false};
let S={};
const is=(i,m)=>st.F[i]===m, okp=i=>!st.F[i];
const logEl=$("log");
function log(msg,red){const li=document.createElement("li");if(red)li.className="r";const d=new Date();li.innerHTML=`<b>${d.toLocaleTimeString("ru-RU")}</b>`;li.append(msg);logEl.prepend(li);while(logEl.children.length>60)logEl.lastChild.remove()}
