/* v4: предзагрузка всего симулятора для офлайн-использования, а не только открытой страницы */
const CACHE="repair-sim-v7";
const ASSETS=["css/style.css","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","sw.js","index.html","adapter.html","led.html","amp.html","washer.html","atx.html","micro.html","weld.html","phone.html","extra/psu-basics.html","js/core/01-helpers.js","js/core/04-render.js","js/core/06-loop.js","js/core/07-kit.js","js/core/08-workshop.js","js/core/09-instruments.js","js/core/10-ui.js","js/core/11-extras.js","js/core/12-pcb.js","js/core/13-exam.js","js/core/14-ux.js","js/core/15-assist.js","js/core/16-pcbflow.js","js/core/17-more.js","js/core/18-nav.js","boards/samsung/parts.js","boards/samsung/schematic.js","boards/samsung/sim.js","boards/samsung/scenarios.js","boards/samsung/probe.js","boards/samsung/device.js","boards/adapter/parts.js","boards/adapter/schematic.js","boards/adapter/sim.js","boards/adapter/scenarios.js","boards/adapter/probe.js","boards/adapter/device.js","boards/led/parts.js","boards/led/schematic.js","boards/led/sim.js","boards/led/scenarios.js","boards/led/probe.js","boards/led/device.js","boards/amp/parts.js","boards/amp/schematic.js","boards/amp/sim.js","boards/amp/scenarios.js","boards/amp/probe.js","boards/amp/device.js","boards/washer/parts.js","boards/washer/schematic.js","boards/washer/sim.js","boards/washer/scenarios.js","boards/washer/probe.js","boards/washer/device.js","boards/atx/parts.js","boards/atx/schematic.js","boards/atx/sim.js","boards/atx/scenarios.js","boards/atx/probe.js","boards/atx/device.js","boards/micro/parts.js","boards/micro/schematic.js","boards/micro/sim.js","boards/micro/scenarios.js","boards/micro/probe.js","boards/micro/device.js","boards/weld/parts.js","boards/weld/schematic.js","boards/weld/sim.js","boards/weld/scenarios.js","boards/weld/probe.js","boards/weld/device.js","boards/phone/parts.js","boards/phone/schematic.js","boards/phone/sim.js","boards/phone/scenarios.js","boards/phone/probe.js","boards/phone/device.js","induct.html","boards/induct/parts.js","boards/induct/schematic.js","boards/induct/sim.js","boards/induct/scenarios.js","boards/induct/probe.js","boards/induct/device.js","fridge.html","boards/fridge/parts.js","boards/fridge/schematic.js","boards/fridge/sim.js","boards/fridge/scenarios.js","boards/fridge/probe.js","boards/fridge/device.js","laptop.html","boards/laptop/parts.js","boards/laptop/schematic.js","boards/laptop/sim.js","boards/laptop/scenarios.js","boards/laptop/probe.js","boards/laptop/device.js","ac.html","boards/ac/parts.js","boards/ac/schematic.js","boards/ac/sim.js","boards/ac/scenarios.js","boards/ac/probe.js","boards/ac/device.js"];
self.addEventListener("install",event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // Отсутствие необязательного файла не блокирует установку приложения.
  await Promise.allSettled(ASSETS.map(async path=>{
    const req=new Request(new URL(path,self.registration.scope).href,{cache:"reload"});
    const response=await fetch(req);
    if(response.ok)await cache.put(req,response);
  }));
  await self.skipWaiting();
})()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(n=>n.startsWith("repair-sim-")&&n!==CACHE).map(n=>caches.delete(n)));
  await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET"||!/^https?:/.test(req.url))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(req);
      if(response.ok&&new URL(req.url).origin===self.location.origin)await cache.put(req,response.clone());
      return response
    }catch(e){
      return (await cache.match(req,{ignoreSearch:true}))||
        (req.mode==="navigate"?await cache.match(new URL("index.html",self.registration.scope).href):undefined)||
        Response.error()
    }
  })())
});
