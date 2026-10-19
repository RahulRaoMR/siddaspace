// Exercise a disposable local server with in-memory test credentials only.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const auth=require('../auth');
const {pages}=require('./seo-config');
const base='http://127.0.0.1:4311';
const password=crypto.randomBytes(24).toString('hex');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),windowsHide:true,stdio:'ignore',env:{...process.env,PORT:'4311',AUTH_SESSION_SECRET:crypto.randomBytes(48).toString('hex'),AUTH_USERS_JSON:JSON.stringify([{username:'seo-test',passwordHash:auth.hashPassword(password),role:'test'}])}});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function request(route,options={}){return fetch(base+route,{redirect:'manual',...options});}
(async()=>{
 let ready=false;for(let i=0;i<50&&!ready;i++){try{ready=(await request('/')).status===200;}catch{}if(!ready)await pause(200);}
 assert(ready,'Disposable server failed to start');
 for(const [slug]of pages){const route=slug==='index'?'/':'/'+slug;const r=await request(route);assert.equal(r.status,200,route);assert.match(r.headers.get('content-type'),/text\/html/);assert(!r.headers.get('x-robots-tag')?.includes('noindex'),route);}
 for(const [route,target]of [['/index.html','/'],['/index','/'],['/about.html','/about'],['/about/','/about'],['/presentation','/products'],['/presentation.html','/products']]){const r=await request(route);assert.equal(r.status,308,route);assert.equal(r.headers.get('location'),target,route);}
 const missing=await request('/this-page-does-not-exist-seo-test');assert.equal(missing.status,404);assert.match(await missing.text(),/Page not found/);
 for(const [route,mime]of [['/robots.txt','text/plain'],['/sitemap.xml','application/xml'],['/site.webmanifest','application/manifest+json']]){const r=await request(route);assert.equal(r.status,200);assert(r.headers.get('content-type').startsWith(mime));}
 for(const route of ['/live-projects','/live-projects.html','/api/live-projects','/%6cive-projects','/live-projects%2ehtml']){const r=await request(route);assert.equal(r.status,302,route);assert(r.headers.get('location').startsWith('/login'));assert.match(r.headers.get('x-robots-tag'),/noindex/);}
 const invalid=await request('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'seo-test',password:'incorrect'})});assert.equal(invalid.status,401);
 const login=await request('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'seo-test',password})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);
 for(const route of ['/live-projects','/live-projects.html','/api/live-projects']){const r=await request(route,{headers:{Cookie:cookie}});assert.equal(r.status,200,route);assert.match(r.headers.get('cache-control'),/no-store/);assert.match(await r.text(),/name="robots" content="noindex/);}
 const session=await request('/api/auth/session',{headers:{Cookie:cookie}});assert.equal((await session.json()).authenticated,true);
 const logout=await request('/api/auth/logout',{method:'POST',headers:{Cookie:cookie}});assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
 const video=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/videos/media-manifest.json'),'utf8'));
 const range=await request(video.hero,{headers:{Range:'bytes=0-99'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,100);assert.match(range.headers.get('content-type'),/video\/webm/);
 const original=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/optimized/manifest.json'),'utf8'));
 const image=Object.values(original).find(i=>i.variants.length).variants[0].src;const r=await request(image);assert.match(r.headers.get('content-type'),/image\/webp/);assert.match(r.headers.get('cache-control'),/immutable/);
 console.log(`Route checks passed: ${pages.length} public pages, canonical redirects, 404, crawler files, asset headers, video ranges, anonymous/authenticated portal, login, session and logout.`);
})().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>server.kill());
