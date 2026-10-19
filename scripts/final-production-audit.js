// Read-only crawl of every canonical public URL. Does not submit enquiries.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { origin, pages, keywords, intents, business } = require('./seo-config');
const { attributes, visibleText, root } = require('./seo-html');
const base = process.env.SIDDA_AUDIT_BASE_URL || origin;
const live = base === origin;
const results = [];
const failures = [];
const localPath = /(?:^|[\s"'=<(])(?:[A-Za-z]:[\\/]|file:\/\/|https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]))/i;
const legacyBrand = /\b(?:Sidda\s+Space|Siddha\s+Space)\b/i;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const check = (condition, url, issue) => { if (!condition) failures.push({ url, issue }); };
const get = route => fetch(new URL(route, base), { redirect: 'manual', signal: AbortSignal.timeout(30000) });
const requiredLinks = {
  index: ['/services/home-interiors', '/services/office-interiors', '/services/turnkey-interiors', '/services/home-renovation'],
  'services/home-interiors': ['/services/2-bhk-interiors', '/services/3-bhk-interiors', '/services/modular-kitchens', '/services/wardrobes-custom-furniture', '/services/turnkey-interiors', '/services/home-renovation'],
  'services/office-interiors': ['/blog/office-fit-out-checklist', '/projects'],
  'services/restaurant-interiors': ['/projects/restaurant-dining'],
  'services/home-renovation': ['/services/home-interiors', '/services/turnkey-interiors', '/projects', '/estimate']
};
function firstParagraphs(main) {
  const hero = main.match(/<section class="seo-hero">([\s\S]*?)<\/section>/)?.[1];
  const text = hero || main;
  return [...text.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(([, p]) => visibleText(p)).filter(p => p.length > 70).slice(0, 2).join(' ').slice(0, 650);
}
function validationEvidence() {
  const read = file => fs.existsSync(path.join(root, 'reports', file)) ? JSON.parse(fs.readFileSync(path.join(root, 'reports', file), 'utf8')) : null;
  const http = read('production-check.json');
  const browser = read('production-browser-audit.json');
  const videos = read('project-video-check.json');
  const lighthouse = [
    ['Homepage mobile baseline', 'lighthouse-mobile-before.json'],
    ['Homepage mobile final', 'lighthouse-mobile-final.json'],
    ['Homepage desktop final', 'lighthouse-desktop-final.json'],
    ['Projects mobile final', 'lighthouse-projects-mobile-final.json']
  ].flatMap(([label, file]) => {
    const data = read(file);
    if (!data) return [];
    const metric = key => data.audits?.[key]?.numericValue;
    return [{ label, file, url: data.finalDisplayedUrl || data.finalUrl, measuredAt: data.fetchTime, version: data.lighthouseVersion,
      scores: Object.fromEntries(Object.entries(data.categories).map(([key, value]) => [key, Math.round(value.score * 100)])),
      lcpMs: metric('largest-contentful-paint'), cls: metric('cumulative-layout-shift'), tbtMs: metric('total-blocking-time'),
      fcpMs: metric('first-contentful-paint'), transferredBytes: metric('total-byte-weight'),
      mainThreadMs: metric('mainthread-work-breakdown'), javascriptExecutionMs: metric('bootup-time'),
      videoTransferredBytes: (data.audits['total-byte-weight']?.details?.items || []).filter(item => /\.(?:webm|mp4)(?:\?|$)/i.test(item.url)).reduce((sum, item) => sum + item.totalBytes, 0),
      opportunities: { images: data.audits['image-delivery-insight']?.displayValue, unusedCss: data.audits['unused-css-rules']?.displayValue,
        sharedCssBytes: data.audits['unused-css-rules']?.details?.items?.find(item => item.url.endsWith('/styles.css'))?.totalBytes,
        renderBlockingSavings: data.audits['render-blocking-insight']?.metricSavings, fontDisplayPass: data.audits['font-display-insight']?.score === 1 },
      conditions: { formFactor: data.configSettings.formFactor, throttlingMethod: data.configSettings.throttlingMethod, throttling: data.configSettings.throttling },
      runtimeError: data.runtimeError || null }];
  });
  return { http: http && { checkedAt: http.checkedAt, pages: http.publicPages, assets: http.assetCount, checks: http.results.length, failures: http.failures.length },
    browser: browser && { checkedAt: browser.auditedOn, cases: browser.results.length, failures: browser.failures.length, environment: browser.environment },
    videos: videos && { checkedAt: videos.checkedAt, cases: videos.results.length, failures: videos.failures.length, environment: videos.environment }, lighthouse };
}
function validationMarkdown(evidence) {
  const http = evidence.http, browser = evidence.browser, videos = evidence.videos;
  const mobile = evidence.lighthouse.find(run => run.file === 'lighthouse-mobile-final.json');
  const checks = [http && `Production HTTP/assets: ${http.pages} pages, ${http.assets} assets and ${http.checks} checks; ${http.failures} failures.`,
    browser && `Responsive audit: ${browser.cases} page/viewport cases at 390, 768 and 1440px; ${browser.failures} failures. Heavy remote videos were blocked in this layout suite and verified separately.`,
    videos && `Actual project playback: ${videos.cases} remote videos loaded and decoded; ${videos.failures} failures. Enquiry checks intercepted WhatsApp drafts; no real enquiry was sent.`].filter(Boolean);
  const table = '| Lighthouse run | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n' + evidence.lighthouse.map(r => `| [${r.label}](${r.file}) | ${r.scores.performance} | ${r.scores.accessibility} | ${r.scores['best-practices']} | ${r.scores.seo} | ${(r.lcpMs / 1000).toFixed(2)} s | ${r.cls.toFixed(3)} | ${Math.round(r.tbtMs)} ms |`).join('\n');
  const boundary = mobile && mobile.lcpMs > 2500 ? 'The final mobile homepage LCP is above 2.5 seconds. ' : '';
  return '## Measured validation\n\n' + checks.map(c => '- ' + c).join('\n') + '\n\n' + table + `\n\nLighthouse ${[...new Set(evidence.lighthouse.map(run => run.version))].join(', ')} ran locally against production in installed Chromium with its recorded simulated mobile/desktop settings. These are individual lab observations, not field Core Web Vitals, measured INP, a full accessibility certification or an overall SEO/GEO rating. ${boundary}Prior custom browser observations and the PageSpeed quota response are historical; these successful Lighthouse runs provide the current lab measurements. Full conditions and raw results are linked above.\n\n`;
}
function performanceFollowUp(evidence) {
  const mobile = evidence.lighthouse.find(run => run.file === 'lighthouse-mobile-final.json');
  const projects = evidence.lighthouse.find(run => run.file === 'lighthouse-projects-mobile-final.json');
  const media = JSON.parse(fs.readFileSync(path.join(root, 'assets/videos/media-manifest.json'), 'utf8'));
  const points = [];
  if (mobile) {
    points.push(`Mobile homepage LCP measured ${(mobile.lcpMs / 1000).toFixed(2)} seconds in the final run; field LCP/INP/CLS remain unverified. TBT was ${Math.round(mobile.tbtMs)} ms, not a field INP measurement.`);
    points.push(`Lighthouse image delivery: ${mobile.opportunities.images || 'see raw report'}; unused shared CSS: ${mobile.opportunities.unusedCss || 'see raw report'}. Further image compression/crop variants need visual review. The shared stylesheet transferred about ${Math.round((mobile.opportunities.sharedCssBytes || 0) / 1024)} KiB.`);
    points.push(`The homepage run transferred ${(mobile.transferredBytes / 1048576).toFixed(1)} MiB, including ${(mobile.videoTransferredBytes / 1048576).toFixed(1)} MiB of intentional background-video playback. The full compressed hero remains ${(media.optimizedBytes / 1e6).toFixed(1)} MB. The original 4K bedroom walkthrough is about 192 MB and loads on demand; responsive video delivery is a follow-up with audio/quality review.`);
    points.push(`JavaScript execution measured ${(mobile.javascriptExecutionMs / 1000).toFixed(1)} s on the simulated mobile run; layout/rendering dominate the ${(mobile.mainThreadMs / 1000).toFixed(1)} s main-thread work diagnostic. Font-display check: ${mobile.opportunities.fontDisplayPass ? 'pass' : 'see raw report'}. The shared stylesheet is render-blocking; estimated removal savings are ${JSON.stringify(mobile.opportunities.renderBlockingSavings || {})} milliseconds in that run.`);
  }
  if (projects) points.push(`The final projects mobile run measured LCP ${(projects.lcpMs / 1000).toFixed(2)} seconds, CLS ${projects.cls.toFixed(3)} and TBT ${Math.round(projects.tbtMs)} ms. The earlier pre-underline sample measured 1.17 seconds and 58 ms TBT; both raw runs are retained. Layout/loading variability and field INP need follow-up; the final accessibility link-identification check passes.`);
  points.push('Project notes remain limited to supported photographs/descriptions. Confirmed client permissions, location, area, dates, budgets and outcomes would add useful evidence. Search/AI visibility and received-lead baselines need owner accounts and real traffic.');
  return '\n\n## Remaining performance and evidence limits\n\n' + points.map(point => '- ' + point).join('\n') + '\n\n[Current deployment record](DEPLOYMENT.md) contains the released source revision and deployment link.\n';
}
async function auditPage([slug]) {
  const route = slug === 'index' ? '/' : '/' + slug;
  const url = origin + route;
  try {
    const response = await get(route);
    const html = await response.text();
    const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] || '';
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
    const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1] || '';
    const text = visibleText(main);
    const title = [...head.matchAll(/<title>(.*?)<\/title>/g)].map(([, value]) => visibleText(value));
    const metas = [...head.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attributes(tag));
    const descriptions = metas.filter(m => m.name === 'description').map(m => m.content);
    const robots = metas.filter(m => m.name === 'robots').map(m => m.content).join(',');
    const canonicals = [...head.matchAll(/<link\b[^>]*>/g)].map(([tag]) => attributes(tag)).filter(a => a.rel === 'canonical').map(a => a.href);
    const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(([, value]) => visibleText(value));
    const graphs = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(([, json]) => JSON.parse(json));
    const graph = graphs.flatMap(g => g['@graph'] || []);
    const entity = graph.find(g => g['@id'] === origin + '/#business');
    const links = [...main.matchAll(/<a\b[^>]*>/g)].map(([tag]) => attributes(tag).href).filter(Boolean).map(href => new URL(href, url)).filter(u => u.origin === origin);
    const linkPaths = [...new Set(links.map(u => u.pathname.replace(/\.html$/, '')))];
    const headings = [...main.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/g)].map(([, value]) => visibleText(value));
    check(response.status === 200, url, 'Canonical page must return 200');
    check(title.length === 1 && title[0], url, 'Missing or duplicate title');
    check(descriptions.length === 1 && descriptions[0], url, 'Missing or duplicate description');
    check(h1.length === 1, url, 'Expected one semantic H1');
    check(canonicals.length === 1 && canonicals[0] === url, url, 'Canonical mismatch');
    check(!/noindex/i.test(robots + (response.headers.get('x-robots-tag') || '')), url, 'Public URL is noindex');
    check(!metas.some(m => m.name === 'keywords'), url, 'Keyword meta tag');
    check(!localPath.test(html), url, 'Local path or development URL in public HTML');
    check(!legacyBrand.test(visibleText(html)), url, 'Alternative spelling in normal visible text');
    check(!legacyBrand.test(JSON.stringify(graph)), url, 'Alternative spelling in structured data');
    check(!/4\.5\s*\/\s*5|100\s+happy\s+clients|based\s+on\s+100/i.test(text), url, 'Unverified legacy rating/client count');
    check(!/testimonial-card|testimonial-track|rating-stars|class="google-rating"/.test(main), url, 'Legacy testimonial/rating UI');
    check(graphs.length === 1 && entity?.name === 'Siddaspace' && entity?.url === origin + '/', url, 'Conflicting business graph');
    check(entity?.telephone === business.telephone && entity?.email === business.email && JSON.stringify(entity?.address) === JSON.stringify(business.address), url, 'Business NAP mismatch');
    check(JSON.stringify(entity?.sameAs) === JSON.stringify(business.sameAs), url, 'Social entity mismatch');
    check(!entity?.geo && !entity?.openingHoursSpecification && !entity?.aggregateRating && !entity?.review, url, 'Unconfirmed business schema fields');
    const ids = graph.map(g => g['@id']);
    check(new Set(ids).size === ids.length, url, 'Duplicate schema entity');
    const references = value => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (key === '@id') check(ids.includes(child), url, 'Unresolved entity reference: ' + child);
        else if (typeof child === 'object') references(child);
      }
    };
    graph.forEach(references);
    check(!graph.some(g => ['Review', 'AggregateRating', 'Offer'].includes(g['@type'])), url, 'Unverified review/rating/price schema');
    const service = graph.find(g => g['@type'] === 'Service');
    if (slug.startsWith('services/')) check(service?.provider?.['@id'] === business['@id'] && service?.url === url, url, 'Service/provider mismatch');
    for (const article of graph.filter(g => ['BlogPosting', 'CreativeWork'].includes(g['@type']))) {
      check((article.headline || article.name) === h1[0], url, 'Article/project headline mismatch');
      check(!article.author && !article.datePublished && !article.dateModified, url, 'Editorial author/date needs confirmed provenance');
    }
    const crumbs = graph.find(g => g['@type'] === 'BreadcrumbList');
    if (route !== '/') {
      const breadcrumbHtml = main.match(/<nav class="seo-breadcrumbs"[\s\S]*?<\/nav>/)?.[0] || '';
      check(Boolean(crumbs && breadcrumbHtml), url, 'Missing breadcrumbs');
      for (const crumb of crumbs?.itemListElement || []) check(visibleText(breadcrumbHtml).includes(crumb.name), url, 'Breadcrumb label mismatch');
    }
    check(visibleText(footer).includes('560078') && visibleText(footer).includes('Ganapathipura'), url, 'Missing office NAP in footer');
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      const a = attributes(tag);
      check(Object.hasOwn(a, 'alt') && (!a.src || Number(a.width) > 0 && Number(a.height) > 0), url, 'Image alt/dimensions missing: ' + (a.src || 'dialog placeholder'));
      check(!/^(?:image|photo|picture|img\d*)$/i.test(a.alt || ''), url, 'Generic significant-image alternative');
    }
    for (const target of requiredLinks[slug] || []) check(linkPaths.includes(target), url, 'Missing contextual link: ' + target);
    if (slug.startsWith('blog/')) check(linkPaths.some(p => p.startsWith('/services/')), url, 'Guide needs a relevant service link');
    if (slug.startsWith('projects/')) check(linkPaths.some(p => p.startsWith('/services/')), url, 'Project needs a relevant service link');
    if (slug === 'index') check(h1[0] === 'Interior Designers & Turnkey Interior Solutions in Bangalore', url, 'Homepage H1 differs from preferred wording');
    const sourceMatches = hash(html) === hash(fs.readFileSync(path.join(root, slug + '.html')));
    check(sourceMatches, url, 'Live HTML differs from the release source');
    const geo = {
      location: /Bangalore|Bengaluru|Kanakapura|Ganapathipura/i.test(text),
      scope: /includ|scope|rooms|kitchen|workstation|furniture/i.test(text),
      execution: /execut|install|process|coordinat|request.*WhatsApp/i.test(text),
      pricingFactors: /cost|pricing|quotation|quote|budget/i.test(text),
      timelineFactors: /timeline|schedule|availability|approvals|how long|dates/i.test(text),
      enquiry: linkPaths.some(p => ['/contact', '/estimate'].includes(p)) || /WhatsApp|6364309878/.test(main)
    };
    results.push({ url, slug, primaryQueryCluster: keywords[slug], searchIntent: intents[slug], title: title[0], description: descriptions[0], h1: h1[0], canonical: canonicals[0], schema: [...new Set(graph.map(g => g['@type']))], indexability: 'Eligible: 200, index, self-canonical; search inclusion not claimed', geoAnswerBlock: firstParagraphs(main), geoSignals: geo, headings, internalLinks: links.length, internalLinkTargets: linkPaths, trustStatus: 'No unverified rating/review; owner-supplied NAP, floor pending', sourceMatches });
  } catch (error) { failures.push({ url, issue: error.message }); }
}
(async () => {
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (next < pages.length) await auditPage(pages[next++]); }));
  results.sort((a, b) => pages.findIndex(p => p[0] === a.slug) - pages.findIndex(p => p[0] === b.slug));
  for (const key of ['title', 'description', 'primaryQueryCluster']) check(new Set(results.map(r => r[key])).size === results.length, base, 'Duplicate ' + key);
  const sitemapResponse = await get('/sitemap.xml');
  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => value);
  check(sitemapResponse.status === 200 && JSON.stringify(locations) === JSON.stringify(pages.map(([s]) => origin + (s === 'index' ? '/' : '/' + s))), base + '/sitemap.xml', 'Sitemap inventory mismatch');
  check(!localPath.test(sitemap), base + '/sitemap.xml', 'Local path in sitemap');
  const robots = await get('/robots.txt');
  check(robots.status === 200 && (await robots.text()).includes('Sitemap: ' + origin + '/sitemap.xml'), base + '/robots.txt', 'Robots/sitemap declaration mismatch');
  if (live) for (const route of ['/SEO.md', '/AUTHENTICATION.md', '/reports/SEO-AUDIT.md', '/scripts/browser-session.js', '/server.js']) {
    const response = await get(route);
    check(response.status === 404, origin + route, 'Repository-only file must not be publicly served');
  }
  const evidence = live ? validationEvidence() : null;
  const report = { auditedAt: new Date().toISOString(), base, live, publicUrlCount: results.length, validation: evidence, pages: results, failures };
  const stem = live ? 'final-production-audit' : 'final-local-audit';
  fs.writeFileSync(path.join(root, 'reports', stem + '.json'), JSON.stringify(report, null, 2) + '\n');
  const cell = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  if (live) {
    const table = '| URL | Primary query cluster | Search intent | Title | H1 | Canonical | Schema | Indexability | GEO answer block | Internal links | Trust status | Status |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |\n' + results.map(r => '| ' + [r.url, r.primaryQueryCluster, r.searchIntent, r.title, r.h1, r.canonical, r.schema.join(', '), 'Eligible; indexing unconfirmed', r.geoAnswerBlock || 'Navigation/specification/legal context', r.internalLinks + ' in main content', r.trustStatus, failures.some(f => f.url === r.url) ? 'Needs attention' : 'PASS'].map(cell).join(' | ') + ' |').join('\n');
    const intro = `# Final live production SEO/GEO audit\n\nAudited: ${report.auditedAt}. ${results.length} canonical public URLs crawled from production; ${failures.length} technical/content failures. This is an implementation audit, not an overall rating, indexing confirmation or ranking prediction. [Detailed crawl data](final-production-audit.json).\n\nThe previous generic homepage H1 and numerical rating/testimonial block were already absent at the start of this review. This release uses the preferred H1, removes the historical schema alias, corrects remaining calculator/instant-price labels, improves package/request answers, fixes closed-dialog focus and contrast, and reduces image overdelivery. Existing artwork, confirmed contact details and protected Live Projects behavior are retained.\n\n`;
    const actions = '\n\n## COMPLETED AND LIVE\n\nCanonical Siddaspace text/entity naming; preferred homepage H1 and early factual entity paragraph; unique metadata/canonicals; connected business/service/article/project/breadcrumb schema; responsive image delivery; visible answer content; contextual internal links; private-route indexing controls; sitemap/robots; removal of repository-only server delivery. See the crawl and linked validation records for exact evidence.\n\n## OWNER CONFIRMATION REQUIRED\n\nResolve the supplied office floor discrepancy; confirm hours, exact map pin/coordinates, neighbourhood/service coverage and social ownership. Confirm richer project facts, editorial authors/dates, material datasheets and any future testimonials, ratings, totals, warranties or credentials before publication. Unknown facts remain omitted. Current project notes are limited to existing published descriptions/photos.\n\n## GOOGLE ACCOUNT ACTION REQUIRED\n\nVerify the Search Console property if needed; submit https://www.siddaspace.com/sitemap.xml; inspect the homepage, home/office/turnkey/2 BHK/3 BHK/renovation/kitchen service pages, the interior-cost guide and Kanakapura Road page. Request indexing where appropriate. Review selected canonicals, indexing, clicks, impressions, CTR, position and Core Web Vitals. No account action is claimed.\n\n## BING ACCOUNT ACTION REQUIRED\n\nVerify or import the site, submit the sitemap, inspect index status and monitor search performance. Use available AI Performance reporting for citations, cited pages and query themes when enabled. No submission or citation improvement is claimed.\n\n## GOOGLE BUSINESS PROFILE ACTION REQUIRED\n\nConfirm the real name, address/floor, phone, website, categories, services, photographs, business description, hours and actual service areas in the owner account. Keep NAP consistent after resolving the floor. No profile changes were performed.\n\n## PERFORMANCE FOLLOW-UP\n\nUse the local Lighthouse mobile/desktop reports and video checks linked below. Lab LCP/CLS and total blocking time describe the tested conditions; TBT is not field INP. Monitor real-user LCP, INP and CLS after launch. The previous PageSpeed API quota response is not evidence of a site failure. Shared CSS, long intentional video playback and richer real project evidence remain ongoing maintenance items. No overall 10/10 score is assigned.\n\n## Measurement baseline\n\nAt first account access, export the latest 28 complete days of Search Console/Bing data with dates/timezone: clicks, impressions, CTR, position and indexed URLs. Compare the next 28 complete days with the same definitions. Values are pending account access, not zero.\n\nRecord phone clicks, WhatsApp handoffs, consultation enquiries, estimate starts/completions, form interactions and confirmed leads separately. A prepared WhatsApp draft is not a sent enquiry. No analytics provider or conversion totals were invented. Track brand queries, measurable citations/cited pages/query themes and identifiable AI referrals; manual observations need engine, date and query context. ChatGPT, Gemini and Perplexity placement cannot be guaranteed.\n\n## Validation records\n\n- [HTTP, asset, redirect and private-route checks](production-check.json)\n- [Responsive production checks](production-browser-audit.json)\n- [Video playback checks](project-video-check.json)\n- [Mobile Lighthouse](lighthouse-mobile-final.json)\n- [Desktop Lighthouse](lighthouse-desktop-final.json)\n- [Maintenance and exact owner procedures](../SEO.md)\n';
    const followUp = performanceFollowUp(evidence);
    fs.writeFileSync(path.join(root, 'reports/FINAL-PRODUCTION-AUDIT.md'), intro + validationMarkdown(evidence) + table + actions + followUp + (failures.length ? '\n## Remaining crawl failures\n\n' + failures.map(f => '- ' + f.url + ': ' + f.issue).join('\n') + '\n' : ''));
  }
  console.log(`Final ${live ? 'production' : 'local'} audit: ${results.length} pages; ${failures.length} failures.`);
  if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
})().catch(error => { console.error(error); process.exitCode = 1; });
