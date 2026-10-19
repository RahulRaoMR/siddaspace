// Read-only release verification. Never submits a form or uses account credentials.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const base = 'https://www.siddaspace.com';
const results = [];
const failures = [];
const hash = value => createHash('sha256').update(value).digest('hex');
async function check(label, work) {
  try { results.push({ label, ...await work() }); }
  catch (error) { failures.push({ label, error: error.message }); }
}
async function request(route, options = {}) {
  return fetch(new URL(route, base), { redirect: 'manual', signal: AbortSignal.timeout(30000), ...options, headers: { 'Accept-Encoding': 'identity', ...options.headers } });
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
  for (const [route, target] of [['/index.html', '/'], ['/about.html', '/about'], ['/about/', '/about'], ['/presentation', '/products'], ['/presentation.html', '/products'], ['https://siddaspace.com/', base + '/'], ['http://www.siddaspace.com/', base + '/']]) await check('redirect ' + route, async () => {
    const response = await request(route);
    assert([301, 308].includes(response.status));
    assert.equal(new URL(response.headers.get('location'), base).href, new URL(target, base).href);
    return { status: response.status, location: response.headers.get('location') };
  });
  for (const route of ['/live-projects', '/live-projects.html', '/api/live-projects']) await check('private ' + route, async () => {
    const response = await request(route);
    assert([302, 307, 308].includes(response.status));
    assert(new URL(response.headers.get('location'), base).pathname.startsWith('/login'));
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
    return { status: response.status, noindex: true };
  });
  await check('login indexing', async () => {
    const response = await request('/login');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
    assert.match(await response.text(), /name="robots" content="noindex/);
    return { status: response.status, noindex: true };
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
  const report = { checkedAt: new Date().toISOString(), base, publicPages: routes.length, assetCount: assets.size, results, failures };
  fs.writeFileSync(path.join(root, 'reports/production-check.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Production checks: ${routes.length} pages, ${assets.size} assets, ${results.length} passed; ${failures.length} failures.`);
  if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
})().catch(error => { console.error(error); process.exitCode = 1; });
