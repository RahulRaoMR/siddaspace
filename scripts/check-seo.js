// Validate the generated HTML independently of the metadata configuration.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const origin = "https://www.siddaspace.com";
const {pages:inventory,keywords}=require('./seo-config');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const decode = value => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));
}
function inspect(html) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] || "";
  const meta = [...head.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attributes(tag));
  return {
    html,
    titles: [...head.matchAll(/<title>(.*?)<\/title>/g)].map(([, title]) => decode(title)),
    meta: key => meta.filter(a => a.name === key || a.property === key).map(a => a.content),
    canonical: [...head.matchAll(/<link\b[^>]*>/g)].map(([tag]) => attributes(tag)).filter(a => a.rel === "canonical").map(a => a.href),
    ids: new Set([...html.matchAll(/\bid="([^"]*)"/g)].map(([, id]) => id)),
    links: [...html.matchAll(/\b(?:href|src|poster)="([^"]*)"/g)].map(([, value]) => decode(value)),
    graphs: [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(([, json]) => JSON.parse(json))
  };
}
function resolveFile(pathname) {
  if (/^\/live-projects(?:\.html)?$/.test(pathname)) return path.join(root, 'api/live-projects.js');
  const relative = decodeURIComponent(pathname).replace(/^\//, "");
  const base = path.join(root, relative || "index.html");
  return [base, `${base}.html`].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
}
const urls = [...fs.readFileSync(path.join(root, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => decode(url));
assert(urls.length > 0 && new Set(urls).size === urls.length, "Sitemap must contain unique public URLs.");
const pages = new Map();
const titles = new Set();
const descriptions = new Set();
assert(new Set(Object.values(keywords)).size===Object.keys(keywords).length,'Primary keyword ownership must be distinct.');
assert(urls.length===inventory.length,'Sitemap/inventory count mismatch.');
for (const url of urls) {
  const location = new URL(url);
  assert(location.origin === origin && !location.pathname.endsWith(".html"), `${url}: noncanonical sitemap URL`);
  const filename = resolveFile(location.pathname);
  if (!filename) { errors.push(`${url}: missing HTML file`); continue; }
  const page = inspect(fs.readFileSync(filename, "utf8"));
  pages.set(url, page);
  assert(page.titles.length === 1 && page.titles[0], `${url}: expected one title`);
  assert(!titles.has(page.titles[0]), `${url}: duplicate title`);
  titles.add(page.titles[0]);
  assert((page.html.match(/<h1\b/g) || []).length === 1, `${url}: expected one H1`);
  assert((page.html.match(/<footer\b/g) || []).length === 1, `${url}: expected one static footer`);
  assert(page.canonical.length === 1 && page.canonical[0] === url, `${url}: canonical mismatch`);
  assert(page.meta('keywords').length===0,`${url}: keyword meta tag is not permitted`);
  const ids=[...page.html.matchAll(/\bid="([^"]*)"/g)].map(([,id])=>id);
  assert(new Set(ids).size===ids.length,`${url}: duplicate HTML IDs`);
  assert(page.html.includes('href="#main-content"'),`${url}: missing keyboard skip link`);
  for(const [tag]of page.html.matchAll(/<img\b[^>]*>/g)){
    const attrs=attributes(tag);
    assert(Object.hasOwn(attrs,'alt'),`${url}: image has no alt attribute`);
    if(attrs.src)assert(Number(attrs.width)>0&&Number(attrs.height)>0,`${url}: image has no intrinsic dimensions: ${attrs.src}`);
    if(attrs.srcset)for(const candidate of attrs.srcset.split(','))assert(resolveFile(new URL(candidate.trim().split(/\s+/)[0],url).pathname),`${url}: missing responsive image candidate`);
  }
  for(const [tag]of page.html.matchAll(/<script\b[^>]*src="[^"]+"[^>]*>/g))assert(tag.includes(' defer'),`${url}: blocking external script`);
  for (const key of ["description", "robots", "og:title", "og:description", "og:url", "og:image", "twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    assert(page.meta(key).length === 1 && page.meta(key)[0], `${url}: missing or duplicate ${key}`);
  }
  assert(!page.meta("robots").join().includes("noindex"), `${url}: public page is noindex`);
  assert(page.meta("og:url")[0] === url, `${url}: social URL mismatch`);
  assert(!descriptions.has(page.meta("description")[0]), `${url}: duplicate description`);
  descriptions.add(page.meta("description")[0]);
  assert(page.graphs.length === 1, `${url}: expected one JSON-LD graph`);
  const graph = page.graphs[0]?.["@graph"] || [];
  const business = graph.find(node => node["@id"] === `${origin}/#business`);
  assert(business?.telephone === "+916364309878" && business?.address?.postalCode === "560078", `${url}: inconsistent business details`);
  assert(business?.name==='Siddaspace'&&business?.description,`${url}: incomplete canonical business entity`);
  const entityIds=graph.map(node=>node['@id']);
  assert(new Set(entityIds).size===entityIds.length,`${url}: duplicate structured-data entities`);
  function references(value){if(!value||typeof value!=='object')return;for(const [key,v]of Object.entries(value)){if(key==='@id')assert(entityIds.includes(v),`${url}: unresolved entity ${v}`);else if(typeof v==='object')references(v);}}
  for(const node of graph)references(node);
  assert(!graph.some(node=>['AggregateRating','Review','Offer','FAQPage'].includes(node['@type'])),`${url}: unsupported rating, offer or FAQ schema`);
  if(location.pathname!=='/'){
    const visible=page.html.match(/<nav class="seo-breadcrumbs"[\s\S]*?<\/nav>/)?.[0];
    const crumbs=graph.find(node=>node['@type']==='BreadcrumbList')?.itemListElement;
    assert(visible&&crumbs,`${url}: missing matching visible breadcrumbs`);
    for(const crumb of crumbs||[])assert(visible?.includes(crumb.name.replace(/&/g,'&amp;')),`${url}: breadcrumb text mismatch`);
  }
  if (location.pathname.startsWith("/services/")) assert(graph.some(node => node["@type"] === "Service"), `${url}: missing Service data`);
  if (location.pathname.startsWith("/blog/")) assert(graph.some(node => node["@type"] === "BlogPosting"), `${url}: missing BlogPosting data`);
  for (const node of graph) {
    if (node["@type"] === "BreadcrumbList") {
      const crumbs = node.itemListElement;
      assert(crumbs.every((crumb, index) => crumb.position === index + 1) && crumbs.at(-1).item === url, `${url}: invalid breadcrumbs`);
    }
    for (const key of ["image", "logo"]) {
      if (typeof node[key] === "string" && node[key].startsWith(origin)) assert(resolveFile(new URL(node[key]).pathname), `${url}: missing schema image ${node[key]}`);
    }
  }
  for (const value of page.meta("og:image")) assert(resolveFile(new URL(value).pathname), `${url}: missing social image`);
}
for (const [url, page] of pages) {
  for (const link of page.links) {
    const target = new URL(link, url);
    if (target.origin !== origin) continue;
    const file = resolveFile(target.pathname);
    assert(file, `${url}: broken local target ${link}`);
    if (file?.endsWith(".html") && target.hash) {
      const destination = pages.get(`${origin}${target.pathname}`) || inspect(fs.readFileSync(file, "utf8"));
      assert(destination.ids.has(decodeURIComponent(target.hash.slice(1))), `${url}: missing anchor ${link}`);
    }
  }
}
const visited = new Set();
const pending = [`${origin}/`];
while (pending.length) {
  const url = pending.pop();
  if (visited.has(url) || !pages.has(url)) continue;
  visited.add(url);
  pending.push(...pages.get(url).links.map(link => new URL(link, url).href.split("#")[0]));
}
for (const url of urls) assert(visited.has(url), `${url}: orphan public page`);
for (const slug of ["login", "presentation", "404"]) {
  const page = inspect(fs.readFileSync(path.join(root, `${slug}.html`), "utf8"));
  assert(page.meta("robots").join().includes("noindex"), `${slug}: missing noindex`);
  assert(!urls.includes(`${origin}/${slug}`), `${slug}: excluded page in sitemap`);
}
assert(!fs.existsSync(path.join(root, 'live-projects.html')), 'Live Projects must not have an unprotected static HTML entry');
assert(fs.readFileSync(path.join(root, 'api/live-projects.js'), 'utf8').includes('name="robots" content="noindex'), 'Live Projects handler template needs noindex');
assert(!urls.includes(`${origin}/live-projects`), 'Live Projects excluded from sitemap');
assert(fs.readFileSync(path.join(root, "robots.txt"), "utf8").includes(`Sitemap: ${origin}/sitemap.xml`), "robots.txt sitemap mismatch");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`SEO checks passed for ${pages.size} public pages: metadata, JSON-LD, headings, footers, sitemap, assets, internal links, reachability and noindex exclusions.`);
}
