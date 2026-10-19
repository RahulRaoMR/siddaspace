// Short synthetic observations, not Lighthouse or field Core Web Vitals.
const fs = require('node:fs');
const { withBrowser } = require('./browser-session');
const results = [];
const diagnostic = process.argv.includes('--mobile-home');
withBrowser(async ({ call, evaluate, pause }) => {
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__lab={lcp:0,cls:0};
    new PerformanceObserver(list=>{for(const entry of list.getEntries()){window.__lab.lcp=entry.startTime;window.__lab.element=entry.element?.tagName+'.'+entry.element?.className;window.__lab.url=entry.url;}}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__lab.cls+=entry.value;}).observe({type:'layout-shift',buffered:true});
  ` });
  for (const mobile of diagnostic ? [true] : [true, false]) {
    await call('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: 960, deviceScaleFactor: 1, mobile });
    await call('Emulation.setCPUThrottlingRate', { rate: mobile ? 4 : 1 });
    await call('Network.emulateNetworkConditions', { offline: false, latency: mobile ? 150 : 20, downloadThroughput: (mobile ? 1600000 : 10000000) / 8, uploadThroughput: (mobile ? 750000 : 2000000) / 8, connectionType: mobile ? 'cellular4g' : 'ethernet' });
    for (const route of diagnostic ? ['/'] : ['/', '/services/home-interiors']) {
      await call('Page.navigate', { url: 'https://www.siddaspace.com' + route });
      let ready = false;
      for (let i = 0; i < 200 && !ready; i++) {
        ready = await evaluate(`location.pathname===${JSON.stringify(route)}&&document.readyState!=='loading'`);
        if (!ready) await pause(100);
      }
      if (!ready) throw new Error('Performance observation navigation failed: ' + route);
      await pause(10000);
      const data = await evaluate(`(() => {
        const navigation=performance.getEntriesByType('navigation')[0];
        const resources=performance.getEntriesByType('resource');
        const video=document.querySelector('.hero-bg');
        return {title:document.title,observedAtMs:Math.round(performance.now()),ttfbMs:Math.round(navigation.responseStart),domReadyMs:Math.round(navigation.domContentLoadedEventEnd),loadMs:Math.round(navigation.loadEventEnd),observedLcpMs:Math.round(window.__lab.lcp),lcpElement:window.__lab.element,lcpUrl:window.__lab.url,observedCls:Number(window.__lab.cls.toFixed(4)),completedResourceBytes:resources.reduce((sum,r)=>sum+(r.encodedBodySize||0),0),largestResources:resources.filter(r=>r.encodedBodySize).sort((a,b)=>b.encodedBodySize-a.encodedBodySize).slice(0,10).map(r=>({url:r.name,bytes:r.encodedBodySize,start:Math.round(r.startTime),end:Math.round(r.responseEnd),initiator:r.initiatorType})),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,hero:video?{readyState:video.readyState,currentTime:video.currentTime,paused:video.paused,currentSrc:video.currentSrc}:null};
      })()`);
      results.push({ route, device: mobile ? 'mobile' : 'desktop', ...data });
      console.log(JSON.stringify(results.at(-1)));
    }
  }
}).then(() => {
  const report = { checkedAt: new Date().toISOString(), environment: 'Isolated headless Edge, browser cache disabled, all media enabled. Mobile: 390px, 1.6Mbps down, 150ms added latency, CPU 4x. Desktop: 1440px, 10Mbps down, 20ms added latency. Single observations 10 seconds after HTML parsing. completedResourceBytes includes only completed transfers exposed by Resource Timing; cross-origin byte sizes may be unavailable. These are not Lighthouse, field Core Web Vitals or measured INP scores.', results };
  fs.writeFileSync(diagnostic ? 'reports/production-performance-diagnostic.json' : 'reports/production-performance.json', JSON.stringify(report, null, 2) + '\n');
}).catch(error => { console.error(error); process.exitCode = 1; });
