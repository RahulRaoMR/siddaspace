const fs = require("node:fs");
const path = require("node:path");
const { withBrowser } = require("./browser-session");
const baseline = process.argv.includes("--baseline");
const base = process.env.SIDDA_PREVIEW_URL || "http://localhost:3000";
const routes = baseline ? ["/", "/about", "/services/home-interiors", "/gallery", "/estimate"] :
  [...fs.readFileSync(path.join(__dirname, "../sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url).pathname);
const results = [];
const failures = [];
withBrowser(async ({ call, evaluate, pause, onEvent }) => {
  let errors = [];
  onEvent(message => { if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text); });
  // Keep the structural/local lab audit repeatable. External stock imagery and
  // large original video downloads are not representative of local page checks.
  await call("Network.setBlockedURLs", { urls: ["*images.unsplash.com*", "*media.githubusercontent.com*", "*hero-*-720p-v1.webm"] });
  await call("Page.addScriptToEvaluateOnNewDocument", { source: `window.__qaVitals={lcp:0,cls:0};new PerformanceObserver(l=>{for(const e of l.getEntries())window.__qaVitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__qaVitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});` });
  for (const width of baseline ? [390, 1440] : [390, 768, 1440]) {
    for (const route of routes) {
      errors = [];
      await call("Emulation.setDeviceMetricsOverride", { width, height: 960, deviceScaleFactor: 1, mobile: width < 500 });
      await call("Page.navigate", { url: `${base}${route}` });
      // Navigation acknowledgement can precede HTML parsing and deferred scripts.
      // Wait for a complete document before assessing menus/layout/footers.
      let ready=false;
      for(let attempt=0;attempt<100&&!ready;attempt++){
        ready=await evaluate(`location.pathname===${JSON.stringify(route)}&&document.readyState==='complete'&&!!document.querySelector('footer')`);
        if(!ready)await pause(100);
      }
      if(!ready)failures.push({route,width,error:'Document did not complete loading'});
      await pause(baseline ? 1400 : 300);
      const data = await evaluate(`(() => {
        const h1=[...document.querySelectorAll('main h1')];
        const breadcrumbs=document.querySelector('.seo-breadcrumbs');
        const location=document.querySelector('.header-location');
        const images=[...document.images];
        return {title:document.title,h1:h1.map(x=>x.textContent.trim().replace(/\\s+/g,' ')),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,footers:document.querySelectorAll('footer').length,
          breadcrumbsClear:!breadcrumbs||!location||breadcrumbs.getBoundingClientRect().top>=location.getBoundingClientRect().bottom,
          images:images.length,imagesWithoutDimensions:images.filter(i=>i.getAttribute('src')&&(!i.hasAttribute('width')||!i.hasAttribute('height'))).length,imagesWithoutAlt:images.filter(i=>!i.hasAttribute('alt')).length,
          brokenLocalImages:images.filter(i=>i.currentSrc.startsWith(window.location.origin)&&i.complete&&i.naturalWidth===0&&i.getAttribute('src')).map(i=>i.getAttribute('src')),
          localResourceBytes:Math.round(performance.getEntriesByType('resource').filter(r=>r.name.startsWith(window.location.origin)).reduce((n,r)=>n+(r.encodedBodySize||0),0)),lab:window.__qaVitals,
          mainLandmarks:document.querySelectorAll('main').length,skipLink:!!document.querySelector('a[href="#main-content"]'),
          unnamedInputs:[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(i=>!i.labels?.length&&!i.getAttribute('aria-label')&&!i.getAttribute('aria-labelledby')).length};
      })()`);
      // Exercise the existing mobile menu without navigating or submitting leads.
      if (width < 500 && route !== "/estimate") {
        data.mobileMenu = await evaluate(`(() => {const b=document.querySelector('.menu-toggle');if(!b)return false;b.click();const open=b.getAttribute('aria-expanded')==='true';b.click();return open;})()`);
      }
      const row = { route, width, ...data, runtimeErrors: [...errors] };
      results.push(row);
      if (!baseline && (data.h1.length !== 1 || data.horizontalOverflow || data.footers !== 1 || !data.breadcrumbsClear || data.imagesWithoutAlt || data.imagesWithoutDimensions || data.brokenLocalImages.length || data.unnamedInputs || errors.length || data.mobileMenu === false || !data.skipLink)) failures.push({ route, width, ...data, runtimeErrors: [...errors] });
      if (process.argv.includes("--screenshots") && ["/", "/services/turnkey-interiors", "/projects/executive-office", "/gallery", "/estimate"].includes(route) && width !== 768) {
        const image = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        const directory = path.join(__dirname, "../reports/screenshots"); fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(path.join(directory, `${route.replace(/\//g, "-") || "home"}-${width}.png`), Buffer.from(image.data, "base64"));
      }
    }
    console.log(`Checked ${routes.length} pages at ${width}px.`);
  }
}).then(() => {
  const directory = path.join(__dirname, "../reports"); fs.mkdirSync(directory, { recursive: true });
  const production = new URL(base).hostname === "www.siddaspace.com";
  fs.writeFileSync(path.join(directory, production ? "production-browser-audit.json" : baseline ? "seo-baseline.json" : "browser-audit.json"), JSON.stringify({ auditedOn: new Date().toISOString(), base, environment: "Headless browser; external stock imagery, GitHub video downloads and hero playback blocked. Lab observations are not field Core Web Vitals or Lighthouse scores.", results, failures }, null, 2) + "\n");
  console.log(`${results.length} page/viewport checks; ${failures.length} failures.`);
  if (failures.length) { console.error(JSON.stringify(failures)); process.exitCode = 1; }
}).catch(error => { console.error(error); process.exitCode = 1; });
