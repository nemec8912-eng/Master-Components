"use strict";
// Bump CACHE whenever any file in ASSETS changes, so phones pick up the new version.
const CACHE="mdp-shell-v24";
const ASSETS=["./","./index.html","./styles.css","./lib.js","./store.js","./reference.js","./app.js","./algorithms.js","./guides.js","./checklists.js","./tools.js","./measurements.js","./measure-draw.js","./measure.js","./photos.js","./journal.js","./manifest.webmanifest","./icons/icon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("mdp-shell-")&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.method!=="GET"||new URL(req.url).origin!==self.location.origin)return;
 // Page loads (also with ?query or #hash) are served from the cached shell when offline.
 if(req.mode==="navigate"){e.respondWith(caches.match("./index.html").then(c=>c||fetch(req)).catch(()=>caches.match("./index.html")));return}
 e.respondWith(caches.match(req,{ignoreSearch:true}).then(c=>c||fetch(req)));
});
