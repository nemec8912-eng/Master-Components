"use strict";
// Photo helpers: shrink camera shots before saving, cache object URLs, full-screen viewer.
(()=>{
const MAX_SIDE=1600,QUALITY=0.82;
const urls=new Map(),blobs=new Map();

function loadImage(file){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
  img.onerror=()=>{URL.revokeObjectURL(url);reject(Error("Не удалось открыть изображение «"+file.name+"»"))};
  img.src=url;
 });
}
// Browsers apply the EXIF rotation when drawing an <img>, so portrait shots stay upright.
async function compress(file){
 if(!/^image\//.test(file.type)&&!/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))throw Error("«"+file.name+"» — не изображение");
 const img=await loadImage(file);
 const k=Math.min(1,MAX_SIDE/Math.max(img.naturalWidth,img.naturalHeight));
 const w=Math.max(1,Math.round(img.naturalWidth*k)),h=Math.max(1,Math.round(img.naturalHeight*k));
 const c=document.createElement("canvas");c.width=w;c.height=h;
 const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
 const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",QUALITY));
 if(!blob)throw Error("Не удалось сжать изображение");
 // Keep the original if it is already smaller (e.g. a small PNG schematic).
 return file.size<blob.size&&k===1&&/^image\/(jpeg|png|webp)$/.test(file.type)?file:blob;
}
async function url(id){
 if(urls.has(id))return urls.get(id);
 const blob=await MDPStore.photos.get(id);if(!blob)return null;
 const u=URL.createObjectURL(blob);urls.set(id,u);blobs.set(id,blob);return u;
}
function forget(ids){for(const id of [].concat(ids)){const u=urls.get(id);if(u){URL.revokeObjectURL(u);urls.delete(id)}blobs.delete(id)}}
// Already-loaded photo, without waiting: sharing must start right inside the tap.
const loaded=id=>blobs.get(id)||null;
// Fills every <img data-photo="id"> inside root.
function hydrate(root){
 root.querySelectorAll("img[data-photo]:not([src])").forEach(async img=>{
  const u=await url(img.dataset.photo).catch(()=>null);
  if(u)img.src=u;else{img.alt="Фото не найдено";img.classList.add("missing")}
 });
}
const toBase64=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)});
function fromBase64(data,type){const bin=atob(data),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new Blob([bytes],{type})}
const newId=()=>"ph-"+(crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2));

let viewerList=[],viewerIndex=0;
function showViewer(){
 const id=viewerList[viewerIndex];const img=$("viewerImage");
 img.removeAttribute("src");img.alt="Фото "+(viewerIndex+1)+" из "+viewerList.length;
 url(id).then(u=>{if(u&&viewerList[viewerIndex]===id)img.src=u});
 $("viewerCount").textContent=viewerList.length>1?(viewerIndex+1)+" / "+viewerList.length:"";
 $("viewerPrev").hidden=$("viewerNext").hidden=viewerList.length<2;
}
function open(ids,start=0){viewerList=[].concat(ids);viewerIndex=Math.max(0,Math.min(start,viewerList.length-1));showViewer();if(!$("photoViewer").open)$("photoViewer").showModal()}
$("viewerClose").onclick=()=>$("photoViewer").close();
$("viewerPrev").onclick=()=>{viewerIndex=(viewerIndex-1+viewerList.length)%viewerList.length;showViewer()};
$("viewerNext").onclick=()=>{viewerIndex=(viewerIndex+1)%viewerList.length;showViewer()};
// Swipe left/right between photos.
let x0=null;
$("viewerImage").addEventListener("touchstart",e=>{x0=e.touches.length===1?e.touches[0].clientX:null},{passive:true});
$("viewerImage").addEventListener("touchend",e=>{if(x0===null||viewerList.length<2)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)(dx<0?$("viewerNext"):$("viewerPrev")).click();x0=null});

self.MDPPhotos={compress,url,forget,hydrate,toBase64,fromBase64,newId,open,loaded};
})();
