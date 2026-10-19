// Read-only release verification. Never submits a form or uses account credentials.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const base = 'https://www.siddaspace.com';
const results = [];
const failures = [];
const externalVideos = new Set();
const hash = value => createHash('sha256').update(value).digest('hex');
async function check(label, work) {
  try { results.push({ label, ...await work() }); }
  catch (error) { failures.push({ label, error: error.message }); }
}
async function request(route, options = {}) {
  return fetch(new URL(route, base), { redirect: 'manual', signal: AbortSignal.timeout(30000), ...options, headers: { 'Accept-Encoding': 'identity', ...options.headers } });
}
async function redirectChain(route) {
  const chain = [];
  let current = new URL(route, base);
  for (let i = 0; i < 4; i++) {
    const response = await request(current.href);
    chain.push({ url: current.href, status: response.status, noindex: response.headers.get('x-robots-tag') });
    if (![301, 302, 307, 308].includes(response.status)) return { response, current, chain };
    current = new URL(response.headers.get('location'), current);
    assert.equal(current.origin, base, 'Unexpected redirect origin');
  }
  throw new Error('Too many redirects');
}
async function each(items, work, concurrency = 8) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) { const item = items[next++]; await work(item); }
  }));
}
(async () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url).pathname);
  const assets = new Set(['/styles.css', '/script.js', '/gallery.js', '/login.js', '/live-projects.js', '/favicon.ico', '/site.webmanifest', '/assets/gallery/gallery-data.json']);
  await each(routes, route => check(route, async () => {
    const response = await request(route);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /text\/html/);
    assert(!response.headers.get('x-robots-tag')?.includes('noindex'));
    const html = await response.text();
    const file = path.join(root, route === '/' ? 'index.html' : route.slice(1) + '.html');
    assert.equal(hash(html), hash(fs.readFileSync(file)), 'Published HTML differs from the release source');
    assert(html.includes(`<link rel="canonical" href="${base}${route}"`), 'Canonical URL');
    let schemas = 0;
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      JSON.parse(json); schemas++;
    }
    assert(schemas > 0, 'Structured data missing');
    for (const [, asset] of html.matchAll(/(?:src|poster|href|data-src)="(\/assets\/[^"?#]+)"/g)) assets.add(asset);
    for (const [, video] of html.matchAll(/data-src="(https:\/\/media\.githubusercontent\.com\/[^"?#]+\.mp4)"/g)) externalVideos.add(video);
    return { status: response.status, sourceMatches: true, schemas };
  }));
  for (const file of ['/robots.txt', '/sitemap.xml']) await check(file, async () => {
    const response = await request(file);
    assert.equal(response.status, 200);
    assert.equal(hash(await response.text()), hash(fs.readFileSync(path.join(root, file.slice(1)))));
    return { status: response.status, sourceMatches: true };
  });
  const imageManifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/optimized/manifest.json')));
  for (const item of Object.values(imageManifest)) for (const variant of item.variants) assets.add(variant.src);
  const media = JSON.parse(fs.readFileSync(path.join(root, 'assets/videos/media-manifest.json')));
  assets.add(media.hero);
  await each([...assets], asset => check(asset, async () => {
    const response = await request(asset, { method: 'HEAD' });
    assert.equal(response.status, 200);
    const local = path.join(root, decodeURIComponent(asset).replace(/^\//, ''));
    const size = fs.statSync(local).size;
    assert.equal(Number(response.headers.get('content-length')), size, 'Asset byte size differs');
    if (/\.(?:js|css)$/.test(asset)) {
      const body = await (await request(asset)).arrayBuffer();
      assert.equal(hash(Buffer.from(body)), hash(fs.readFileSync(local)), 'Asset content differs');
    }
    if (asset.startsWith('/assets/optimized/') || asset === media.hero) assert.match(response.headers.get('cache-control') || '', /immutable/);
    return { status: response.status, bytes: size };
  }), 12);
  await each([...externalVideos], video => check('video ' + video, async () => {
    const response = await request(video, { headers: { Range: 'bytes=0-99' } });
    if (response.status !== 206) { await response.body?.cancel(); assert.fail('Video host did not return a partial media response'); }
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, 100);
    assert(bytes.subarray(0, 32).includes(Buffer.from('ftyp')), 'Response is not an MP4 media file');
    return { status: response.status, range: response.headers.get('content-range') };
  }), 3);
  for (const [route, target] of [['/index.html', '/'], ['/about.html', '/about'], ['/about/', '/about'], ['/presentation', '/products'], ['/presentation.html', '/products'], ['https://siddaspace.com/', base + '/'], ['http://www.siddaspace.com/', base + '/']]) await check('redirect ' + route, async () => {
    const response = await request(route);
    assert([301, 308].includes(response.status));
    const resolved = await redirectChain(route);
    assert.equal(resolved.current.href, new URL(target, base).href);
    assert.equal(resolved.response.status, 200);
    return { status: response.status, chain: resolved.chain };
  });
  for (const route of ['/live-projects', '/live-projects.html', '/api/live-projects', '/%6cive-projects', '/live-projects%2ehtml']) await check('private ' + route, async () => {
    const resolved = await redirectChain(route);
    if (route.includes('%') && resolved.response.status === 404) {
      assert.match(await resolved.response.text(), /name="robots" content="noindex/);
      return { status: 404, privateDocumentNotServed: true };
    }
    assert(resolved.current.pathname.startsWith('/login'));
    assert(resolved.chain.slice(0, -1).some(item => /noindex/.test(item.noindex || '')), 'Private route missing noindex');
    assert.equal(resolved.response.status, 200);
    return { chain: resolved.chain, noindex: true };
  });
  await check('login indexing', async () => {
    const response = await request('/login');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
    assert.match(await response.text(), /name="robots" content="noindex/);
    return { status: response.status, noindex: true };
  });
  await check('anonymous session', async () => {
    const response = await request('/api/auth/session');
    assert.equal(response.status, 200);
    const session = await response.json();
    assert.equal(session.authenticated, false);
    assert.equal(session.user, null);
    return { status: response.status, authenticated: false };
  });
  await check('404', async () => {
    const response = await request('/this-page-does-not-exist-seo-check');
    assert.equal(response.status, 404);
    const html = await response.text();
    assert.match(html, /Page not found/);
    assert.match(html, /name="robots" content="noindex/);
    return { status: response.status };
  });
  await check('video range', async () => {
    const response = await request(media.hero, { headers: { Range: 'bytes=0-99' } });
    assert.equal(response.status, 206);
    assert.match(response.headers.get('content-type') || '', /video\/webm/);
    assert.equal((await response.arrayBuffer()).byteLength, 100);
    return { status: response.status };
  });
  for (const route of ['/SEO.md', '/reports/owner-confirmation.json', '/scripts/check-flows.js']) await check('developer file ' + route, async () => {
    const response = await request(route, { method: 'HEAD' });
    assert(response.status === 404 || /noindex/.test(response.headers.get('x-robots-tag') || ''), 'Developer file must be excluded or noindex');
    return { status: response.status, noindex: response.headers.get('x-robots-tag') };
  });
  const report = { checkedAt: new Date().toISOString(), base, publicPages: routes.length, assetCount: assets.size, externalVideoCount: externalVideos.size, results, failures };
  fs.writeFileSync(path.join(root, 'reports/production-check.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Production checks: ${routes.length} pages, ${assets.size} assets, ${results.length} passed; ${failures.length} failures.`);
  if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
})().catch(error => { console.error(error); process.exitCode = 1; });
