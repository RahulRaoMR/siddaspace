// Decode a frame from each real project video; never sends an enquiry.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { withBrowser } = require('./browser-session');
const base = process.env.SIDDA_PREVIEW_URL || 'https://www.siddaspace.com';
const results = [];
const runtimeErrors = [];
withBrowser(async ({ call, evaluate, pause, onEvent }) => {
  onEvent(message => {
    if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  await call('Page.navigate', { url: base + '/projects' });
  for (let i = 0; i < 200; i++) {
    if (await evaluate(`location.pathname==='/projects'&&document.readyState==='complete'`)) break;
    await pause(100);
  }
  const count = await evaluate(`document.querySelectorAll('.project-video-card video').length`);
  assert.equal(count, 5, 'Expected the five existing project videos');
  for (let index = 0; index < count; index++) {
    const result = await evaluate(`(async()=>{
      const video=document.querySelectorAll('.project-video-card video')[${index}];
      const source=video.querySelector('source');
      const url=source.dataset.src||source.src;
      const card=video.closest('article');
      const caption=card.querySelector('h3')?.textContent||video.getAttribute('aria-label');
      let timer;
      try {
        video.muted=true;video.preload='metadata';source.src=url;video.load();
        await new Promise((resolve,reject)=>{
          timer=setTimeout(()=>reject(new Error('Video metadata timed out')),25000);
          video.onloadedmetadata=()=>{clearTimeout(timer);resolve();};
          video.onerror=()=>{clearTimeout(timer);reject(new Error('Media error '+video.error?.code));};
        });
        const metadata={duration:video.duration,width:video.videoWidth,height:video.videoHeight};
        video.currentTime=Math.min(1,video.duration/2);
        await new Promise((resolve,reject)=>{
          timer=setTimeout(()=>reject(new Error('Video frame seek timed out')),15000);
          video.onseeked=()=>{clearTimeout(timer);resolve();};
          video.onerror=()=>{clearTimeout(timer);reject(new Error('Media error '+video.error?.code));};
        });
        return {url,caption,...metadata,readyState:video.readyState,seek:video.currentTime,controls:video.controls,autoplay:video.autoplay,responsive:video.getBoundingClientRect().width<=innerWidth,decoded:video.readyState>=2&&video.videoWidth>0,contextLinks:card.querySelectorAll('a[href^="/services/"]').length};
      } catch(error) {return {url,caption,error:error.message};}
      finally {clearTimeout(timer);video.pause();source.removeAttribute('src');video.removeAttribute('src');video.load();}
    })()`, 60000);
    results.push(result);
    console.log(JSON.stringify(result));
  }
}).then(() => {
  const failures = results.filter(r => r.error || !r.decoded || !r.controls || r.autoplay || !r.responsive || !r.contextLinks || !Number.isFinite(r.duration));
  fs.writeFileSync('reports/project-video-check.json', JSON.stringify({ checkedAt: new Date().toISOString(), base, environment: 'Headless installed Chromium; actual remote video metadata and frame decoding, no autoplay enabled by the test.', results, runtimeErrors, failures }, null, 2) + '\n');
  assert.equal(failures.length, 0, 'Project video checks failed');
  assert.equal(runtimeErrors.length, 0, 'Unexpected production JavaScript error');
  console.log('All five project videos decoded a frame with controls, responsive layout and relevant visible service context.');
}).catch(error => { console.error(error); process.exitCode = 1; });
