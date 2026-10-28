"use strict";
// Key-value storage on IndexedDB with an in-memory cache, so the UI can read synchronously.
// Photos live in their own object store as Blobs and are read on demand.
// Old localStorage data is copied over on first launch and left untouched as a fallback.
(function(){
const DB_NAME="master-diagnose-pro",STORE="kv",PHOTOS="photos";
const KEYS=Object.values(MDPLib.KEYS);
// Writes to these keys are bookkeeping, not user data, so they do not count as a change.
const SERVICE=new Set([MDPLib.KEYS.lastBackup,MDPLib.KEYS.lastChange,MDPLib.KEYS.firstUse,MDPLib.KEYS.installDismissed]);
const cache=new Map(),errorHandlers=[];
let db=null,backend="indexeddb",queue=Promise.resolve();
const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
const readLocal=k=>{try{const raw=localStorage.getItem(k);return raw===null?undefined:JSON.parse(raw)}catch{return undefined}};
const writeLocal=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

function openDB(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in self))return reject(Error("IndexedDB недоступен"));
  const req=indexedDB.open(DB_NAME,2);
  req.onupgradeneeded=()=>{
   const d=req.result;
   if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE);
   if(!d.objectStoreNames.contains(PHOTOS))d.createObjectStore(PHOTOS);
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
  req.onblocked=()=>reject(Error("База заблокирована другой вкладкой — закройте её"));
 });
}
// Runs fn(stores) inside one transaction; resolves with fn's result after commit.
function tx(mode,names,fn){
 return new Promise((resolve,reject)=>{
  const list=[].concat(names),t=db.transaction(list,mode);
  const stores=list.map(n=>t.objectStore(n));let result;
  Promise.resolve(fn(...stores)).then(r=>result=r,err=>{try{t.abort()}catch{}reject(err)});
  t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error("Транзакция прервана"));
 });
}
const req2p=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});

// Modules start only after every script on the page has run: on a slow network the database
// can open while the parser is still waiting for a later file.
const domReady=document.readyState==="loading"?new Promise(r=>document.addEventListener("DOMContentLoaded",r,{once:true})):Promise.resolve();
const storageReady=(async()=>{
 try{
  db=await openDB();
  db.onversionchange=()=>{db.close();location.reload()};
  await tx("readonly",STORE,async s=>{
   const [keys,values]=await Promise.all([req2p(s.getAllKeys()),req2p(s.getAll())]);
   keys.forEach((k,i)=>cache.set(k,values[i]));
  });
  const migrate={};
  for(const k of KEYS)if(!cache.has(k)){const v=readLocal(k);if(v!==undefined){migrate[k]=v;cache.set(k,v)}}
  if(Object.keys(migrate).length)await tx("readwrite",STORE,s=>{for(const [k,v] of Object.entries(migrate))s.put(v,k)});
 }catch(err){
  console.warn("IndexedDB unavailable, using localStorage:",err);
  backend="localstorage";db=null;
  for(const k of KEYS){const v=readLocal(k);if(v!==undefined)cache.set(k,v)}
 }
 try{if(navigator.storage?.persist&&!(await navigator.storage.persisted()))await navigator.storage.persist()}catch{}
})();
const ready=Promise.all([storageReady,domReady]).then(()=>{});

function report(err){console.error(err);errorHandlers.forEach(h=>{try{h(err)}catch{}})}
function writeEntries(entries){
 if(backend==="localstorage"){for(const [k,v] of Object.entries(entries))writeLocal(k,v);return Promise.resolve()}
 return tx("readwrite",STORE,s=>{for(const [k,v] of Object.entries(entries))s.put(v,k)});
}
// Serialises an operation after earlier writes; the caller gets its own result or error.
function enqueue(op){const p=queue.then(op);queue=p.catch(()=>{});return p}
function needPhotos(){if(!db)throw Error("Фото недоступны: браузер не даёт доступ к IndexedDB")}

const photos={
 get available(){return !!db},
 put(id,blob){return enqueue(()=>{needPhotos();return tx("readwrite",PHOTOS,s=>{s.put(blob,id)})})},
 get(id){if(!db)return Promise.resolve(undefined);return tx("readonly",PHOTOS,s=>req2p(s.get(id)))},
 remove(ids){ids=[].concat(ids).filter(Boolean);if(!db||!ids.length)return Promise.resolve();return enqueue(()=>tx("readwrite",PHOTOS,s=>{ids.forEach(id=>s.delete(id))}))},
 keys(){if(!db)return Promise.resolve([]);return tx("readonly",PHOTOS,s=>req2p(s.getAllKeys()))},
 async all(){
  if(!db)return [];
  return tx("readonly",PHOTOS,async s=>{const [k,v]=await Promise.all([req2p(s.getAllKeys()),req2p(s.getAll())]);return k.map((id,i)=>({id,blob:v[i]}))});
 }
};

const MDPStore={
 ready,photos,
 get backend(){return backend},
 get(k,fallback){return cache.has(k)?clone(cache.get(k)):fallback},
 // Updates the cache immediately; the disk write is queued so writes never reorder.
 set(k,v){
  const value=clone(v),entries={[k]:value};cache.set(k,value);
  if(!SERVICE.has(k)){const now=new Date().toISOString();entries[MDPLib.KEYS.lastChange]=now;cache.set(MDPLib.KEYS.lastChange,now)}
  return enqueue(()=>writeEntries(entries)).catch(err=>{try{for(const [kk,vv] of Object.entries(entries))writeLocal(kk,vv)}catch{}report(err)});
 },
 // All-or-nothing restore. photoList (array of {id, blob}) replaces every stored photo when given.
 // Rejects without touching the cache on failure.
 restore(entries,photoList){
  const values=clone(entries);
  return enqueue(async()=>{
   if(photoList&&!db)throw Error("Фото из копии нельзя восстановить: IndexedDB недоступен");
   if(!db)await writeEntries(values);
   else await tx("readwrite",photoList?[STORE,PHOTOS]:[STORE],(kv,ph)=>{
    for(const [k,v] of Object.entries(values))kv.put(v,k);
    if(photoList){ph.clear();photoList.forEach(p=>ph.put(p.blob,p.id))}
   });
   for(const [k,v] of Object.entries(values))cache.set(k,v);
  });
 },
 flush(){return queue},
 onError(h){errorHandlers.push(h)},
 async info(){
  let usage=null,quota=null,persisted=null;
  try{const e=await navigator.storage.estimate();usage=e.usage;quota=e.quota}catch{}
  try{persisted=await navigator.storage.persisted()}catch{}
  return {backend,usage,quota,persisted};
 }
};
self.MDPStore=MDPStore;
})();
