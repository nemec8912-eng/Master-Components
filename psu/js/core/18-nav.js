/* Шаг назад: кнопка «Назад» системы, свайп от левого края (iPhone и Android), кнопка «‹ Назад» на телефоне.
   Окна и мобильные вкладки записываются в историю браузера, поэтому «назад» закрывает окно или возвращает
   на предыдущую вкладку, а не выходит из программы. */
let navSilent=false;
const navState=()=>history.state&&history.state.app;
function navPush(st_){if(navSilent)return;try{history.pushState({app:1,...st_},"")}catch(e){}navBackUi()}
/* вкладки на телефоне */
const _setMt6=setMt;
setMt=function(m){const prev=document.body.dataset.mt;_setMt6(m);const now=document.body.dataset.mt;if(prev&&now!==prev)navPush({mt:now,prev})};
/* окна */
const _openModal6=openModal;
openModal=function(t,h,c){const was=!$("modal").hidden;_openModal6(t,h,c);if(!was)navPush({modal:1})};
const _closeModal6=closeModal;
closeModal=function(){if($("modal").hidden)return;if(navState()&&history.state.modal){history.back();return}_closeModal6()};
addEventListener("popstate",e=>{
  navSilent=true;
  try{
    if(!$("modal").hidden){_closeModal6()}
    else if(!$("morePop").hidden){togglePop(false)}
    else if(!$("tour").hidden){tourShow(-1)}
    else{const s=e.state;const want=s&&s.app&&s.mt?s.mt:"board";if(document.body.dataset.mt!==want)_setMt6(want)}
  }finally{navSilent=false}
  navBackUi()});
/* кнопка «‹ Назад» в шапке (только телефон, когда есть куда возвращаться) */
{const b=document.createElement("button");b.type="button";b.id="navBack";b.className="navback lite";b.innerHTML="‹ Назад";b.hidden=true;
 $("devB").before(b);b.addEventListener("click",()=>history.back())}
function navBackUi(){const b=$("navBack");if(b)b.hidden=!navState()}
navBackUi();
/* свайп слева направо — шаг назад */
{const hint=document.createElement("div");hint.className="swipehint";hint.textContent="‹";document.body.appendChild(hint);
 let sx=0,sy=0,on=false,edge=false;
 addEventListener("touchstart",e=>{if(e.touches.length!==1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;
   const inModal=!$("modal").hidden;edge=sx<28;
   // от края — всегда; внутри окна — с любого места, если окно не прокручено вбок
   on=edge||(inModal&&$("modB").scrollLeft<=0)},{passive:true});
 addEventListener("touchmove",e=>{if(!on)return;const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
   if(Math.abs(dy)>Math.abs(dx)*1.2&&Math.abs(dy)>14){on=false;hint.style.opacity=0;return}
   if(dx>10){const k=Math.min(1,dx/90);hint.style.opacity=k;hint.style.transform=`translateX(${-44+44*k}px)`}},{passive:true});
 addEventListener("touchend",e=>{if(!on)return;on=false;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;hint.style.opacity=0;hint.style.transform="translateX(-44px)";
   if(dx>90&&Math.abs(dy)<70&&!document.body.classList.contains("dragging")){
     if(!$("modal").hidden)closeModal();
     else if(!$("morePop").hidden)togglePop(false);
     else if(!$("tour").hidden)tourShow(-1);
     else if(navState())history.back();
     else if(edge&&document.body.dataset.mt&&document.body.dataset.mt!=="board"&&mobile())_setMt6("board");
     else if(edge&&document.referrer&&new URL(document.referrer).origin===location.origin)history.back()}},{passive:true})}
