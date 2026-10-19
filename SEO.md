# Siddaspace SEO

The site contains 34 indexable pages with static titles, unique descriptions, canonical URLs, social sharing metadata, and JSON-LD. Service pages include `Service` data; guides include `BlogPosting` data; three portfolio notes include `CreativeWork` data. Public pages share the homepage footer so service and office links remain available without JavaScript. See [the full URL audit](reports/SEO-AUDIT.md) for every page's intent, title, H1, schema and internal links.

## Keyword ownership

| Page | Primary cluster | Supporting searches |
| --- | --- | --- |
| `/` | Interior designers in Bangalore | Interior design company, design with execution |
| `/about` | Interior design company in Bangalore | Residential, commercial and civil execution |
| `/services/home-interiors` | Home interior designers Bangalore | Residential, apartment, flat and villa interiors; living rooms, bedrooms and false ceilings |
| `/services/office-interiors` | Office interior designers Bangalore | Commercial interiors, corporate workspaces, office renovation, fit-outs, cafeteria planning |
| `/services/restaurant-interiors` | Restaurant interior designers Bangalore | Hospitality design, dining layouts, counters and lighting |
| `/services/modular-kitchens` | Modular kitchen Bangalore | Kitchen designers, cabinets, storage and installation |
| `/services/wardrobes-custom-furniture` | Wardrobe designers Bangalore | Custom furniture, TV units, pooja units, crockery units, study tables and space-saving storage |
| `/services/2-bhk-interiors` | 2 BHK interior design Bangalore | Compact apartment interiors and budget planning |
| `/services/3-bhk-interiors` | 3 BHK interior design Bangalore | Complete home interiors, custom furniture and premium finishes |
| `/services/home-renovation` | Home renovation Bangalore | Civil and interior contractors, apartment renovation, flooring, tile laying, waterproofing, painting, carpentry, electrical and plumbing |
| `/services/turnkey-interiors` | Turnkey interior designers Bangalore | End-to-end interior design, turnkey renovation and coordinated execution |
| `/packages` | Home interior packages Bangalore | Affordable scopes, complete home interiors and premium custom work |
| `/estimate` | Home interior quotation request Bangalore | Room and package selection for a reviewed quotation; no numeric calculator is implemented |
| `/projects` | Interior projects Bangalore | Residential, office and restaurant project examples |
| `/locations/kanakapura-road` | Interior designers Kanakapura Road | Ganapathipura interior designers, office visits and local contact details |
| `/blog/interior-design-cost-bangalore` | 2 BHK and 3 BHK interior design cost Bangalore | Complete home cost, scope comparison and quotation exclusions |
| `/blog/home-interior-styles` | Modern interior design Bangalore | Minimalist, Scandinavian, contemporary, luxury and space-saving interiors |
| `/blog/office-fit-out-checklist` | Office fit-out planning Bangalore | Corporate interiors, office renovation and execution checklists |

“Bangalore” and “Bengaluru” refer to the same city. Keywords appear in relevant titles, headings, copy and links. No keyword meta tags, invented ratings, fixed project prices, awards, opening hours or unsupported branch locations are added. Google does not use the keywords meta tag: [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

The confirmed office address, phone and email are consistent with the user-provided location. The existing site lists Bangalore, Tumakur and Mysore as service cities. The Kanakapura Road page describes the existing Ganapathipura office. Confirm actual service coverage and useful local project details before adding pages for Whitefield, HSR Layout, Indiranagar or other areas. Retail and showroom services also need confirmation before dedicated landing pages are created.

## Other public page purposes

| Pages | Purpose |
| --- | --- |
| `/services` | Route customers to the relevant service |
| `/blog` | Guide navigation |
| `/team` | Published team names and roles |
| `/gallery` | Crawlable sofa and living-room imagery |
| `/products` | Office furniture overview |
| `/office-chairs`, `/workstations`, `/conference-tables`, `/reception-tables`, `/storage-solutions` | Separate furniture categories and published specifications |
| `/contact` | Office contact and consultation details |
| `/projects/executive-office` | Existing executive-office project description and photographs |
| `/projects/lobby-lounge` | Existing lobby/lounge project description and photographs |
| `/projects/restaurant-dining` | Existing restaurant project description and photographs |
| `/privacy-policy`, `/terms` | Legal information |

Do not create competing service pages for superficial variations such as "best", "near me" or Bangalore/Bengaluru. Use natural supporting language within the page that owns the intent. Project notes support a service with specific evidence; they do not duplicate its full sales content.

## Business facts and entity consistency

Use **Siddaspace** as the canonical name and `https://www.siddaspace.com/` as the canonical origin. Preserve stylised logo artwork, existing filenames and genuine social handles. Historical spelling is documented for audit purposes only; the published business graph no longer declares a competing text alias.

- Telephone: **+91 6364309878**; structured value `+916364309878`.
- Email: **Info@siddaspace.com**.
- Supplied address: **Siddaspace, 1st floor, Parallel8/20/21, 3rd Floor, Chunchaghatta Main Road, Kanakapura Main Rd, Ganapathipura, Bengaluru, Karnataka 560078**.
- The supplied address contains both "1st floor" and "3rd Floor". Preserve it until the owner confirms the correct floor and entrance. Do not infer a correction from a map query.
- The supplied Maps directions link remains the office link. Its query is not evidence of exact coordinates.
- Existing published service cities are Bangalore, Tumakur and Mysore; confirm spelling and coverage before expanding these statements.
- Social profile references come from the existing site: Instagram `siddaspace`, YouTube `@SiddaSpaceTrend`, X `Siddaspace`, and the existing Facebook profile. Confirm ownership before replacing or expanding `sameAs`.

Edit business values in `scripts/seo-config.js`, regenerate all pages, and check the visible contact page, local page and shared footer. Do not update schema alone.

## Answer content and conversational discovery

Each service page provides an early definition, intended customer, scope, preparation, execution process, cost and timeline factors, FAQs and enquiry links. Keep these answers specific to the service and supported by the offered scope.

| Customer question | Main destination |
| --- | --- |
| What does Siddaspace do? | `/`, `/about` |
| Does Siddaspace handle design and execution? | `/services/turnkey-interiors` |
| What is included in complete home interiors? | `/services/home-interiors` |
| What should I plan for a 2 BHK? | `/services/2-bhk-interiors` |
| What should I plan for a 3 BHK? | `/services/3-bhk-interiors` |
| What affects home interior cost? | `/blog/interior-design-cost-bangalore` |
| How are packages different? | `/packages` |
| How do I request a quotation? | `/estimate` |
| Does the company design kitchens? | `/services/modular-kitchens` |
| Can I request wardrobes or custom furniture? | `/services/wardrobes-custom-furniture` |
| Can an existing apartment be renovated? | `/services/home-renovation` |
| Are civil works coordinated with interiors? | `/services/home-renovation`, `/services/turnkey-interiors` |
| Does Siddaspace handle office interiors? | `/services/office-interiors` |
| What should I prepare for an office fit-out? | `/blog/office-fit-out-checklist` |
| Does Siddaspace design restaurant interiors? | `/services/restaurant-interiors` |
| Where can I see actual work? | `/projects` and its three project notes |
| Can I visit near Kanakapura Road? | `/locations/kanakapura-road`, `/contact` |

Use comparison tables when they help explain scope: 2 BHK versus 3 BHK, renovation versus a full fit-out, modular versus custom kitchens, and design versus turnkey execution. Do not invent price ranges, completion periods or measured outcomes.

Google states that its AI search features use the same underlying SEO practices; no special AI schema or machine-only text file is required. Keep useful information in crawlable HTML and keep snippets eligible. [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

## Structured data rules

`scripts/seo-config.js` owns page metadata and the connected entity graph. The static generator writes consistent business, website and page identifiers. Appropriate pages add `Service`, `BreadcrumbList`, `ImageObject`, `Person`, `CreativeWork` or `BlogPosting` entries.

- Business address, telephone and services must match visible content.
- Breadcrumb schema must match the visible breadcrumb links.
- The six team entries use published names and roles; do not add unsupported biographies or qualifications.
- Guide publisher data is present. Add an author, publication date or update date only when the person and dates are genuine and visible.
- Project notes use original published descriptions and photographs. Their city-level references do not establish a particular neighbourhood, client, budget, area or completion date.
- Unknown coordinates, hours, ratings, awards, warranties and prices are omitted.
- Visible FAQs remain ordinary content. FAQ rich results were retired in May 2026; FAQ markup is not added to promise search enhancements. [Google Search updates](https://developers.google.com/search/updates).

Use Google's Rich Results Test and Schema.org's validator after a schema change. Valid JSON and Schema.org vocabulary do not guarantee a Google enhancement, indexing or an AI citation.

## Project and claim evidence

See `reports/project-evidence.json` for photo and description provenance. Add new project facts only after receiving owner records and permission to publish them. Link each project to its relevant service and link useful examples back from the service page.

Legacy anonymous testimonials, numerical ratings/client totals, workforce figures, qualifications and blanket delivery promises are archived in `reports/owner-confirmation.json`. They require evidence before republication. Their omission does not assert that they were false.

## Static content, links and indexing

All 34 public pages are extensionless HTTPS URLs on the `www` host. Each uses a self-referencing canonical. The homepage canonical ends with `/`; internal page canonicals do not have a trailing slash.

The sitemap includes only canonical public pages. Do not add login, Live Projects, API endpoints, the error page, redirect sources, search parameters or duplicate `.html` URLs. Do not manufacture `lastmod` dates. `robots.txt` permits public crawling and points to the production sitemap.

`/presentation` and `/presentation.html` permanently redirect to `/products`. Existing hosting redirects enforce HTTPS, `www`, clean URLs and trailing-slash conventions. Missing pages return HTTP 404 with helpful noindex content.

Authentication protects Live Projects. Private routes and login carry noindex controls. Authentication, robots and canonical URLs serve different purposes; do not replace access control with crawler directives.

The gallery is pre-rendered HTML with ordinary full-image links. Its JavaScript enhances the dialog without providing the only path to the images. Use descriptive links between related services, relevant project notes, guides, packages and the quotation request.

## Images, video and accessibility

Original images remain available. `assets/optimized/manifest.json` records image dimensions and responsive WebP variants. There are 711 derivative files covering 182 normalised source references. The two location icons have 52px, 104px and 208px variants; their combined default 104px files are about 7 KB, compared with 1.17 MB for the originals. Use accurate alternative text; decorative images have an empty alternative. Preserve explicit dimensions and lazy loading below the fold.

The hero video is now a full-duration 1280x720 WebM, reduced from 308,611,515 to 21,547,497 bytes, approximately 93%. `assets/videos/media-manifest.json` records its provenance and dimensions. The hero waits for initial document loading and an idle opportunity before loading its video. Offscreen video posters and sources are assigned when they approach the viewport. Reduced-motion and data-saving preferences are respected. Original long project walkthroughs remain available on demand.

Optional media tooling uses installed software without adding package dependencies:

```powershell
node scripts/optimize-images.js
node scripts/optimize-video.js
```

Review these tools before regenerating assets. Video encoding requires an installed Chromium browser and a compatible FFmpeg executable, configured through `SIDDA_BROWSER_PATH` and `SIDDA_FFMPEG_PATH` when needed. Keep versioned asset filenames so immutable caches remain safe.

Preserve skip links, visible focus, labelled inputs, phone validation, mobile navigation, scrollable comparison tables, dialog focus restoration and sufficient contrast when editing styles. Browser checks are not an accessibility certification.

## Enquiries and measurement

Consultation and quotation forms validate input and prepare a WhatsApp draft for the customer to review. They do not submit an enquiry directly to a website backend. The quotation planner collects home type, rooms, package preference and contact details; it does not calculate a numeric project price.

Source attribution includes only the public source path. It does not store query strings or contact details in session storage. No new analytics provider was installed. Treat a CTA click or prepared WhatsApp draft as an interaction, not a confirmed lead or sale.

If an analytics system is later approved, define events for consultation opening, quotation steps, WhatsApp handoff and confirmed follow-up separately. Check consent and privacy wording against the actual installation. Never send form names, phone numbers, email addresses or WhatsApp message text to analytics.

## Maintenance and release commands

Edit page content in the HTML files; edit metadata, entity values, keyword and intent ownership in `scripts/seo-config.js`. The generator rewrites managed head content, breadcrumbs, footers, image attributes and sitemap. Its source footer comes from `index.html`.

```powershell
npm run seo:generate
npm run seo:check
npm run seo:routes
```

Run the local server in a separate shell for browser and flow checks:

```powershell
npm start
```

```powershell
npm run seo:browser
npm run seo:flows
npm run seo:report
```

The route suite starts a disposable server with random in-memory test credentials. Browser tooling uses an isolated headless browser profile. Flow checks intercept `window.open`, so no real WhatsApp message is sent. The browser suite covers all 34 pages at 390, 768 and 1440px; these checks are not Lighthouse or field Core Web Vitals scores.

The site deploys through the existing GitHub `main` branch connection to the Vercel `siddaspace` project. `vercel.json` defines the root static output and existing API handlers. The ignored `dist/` folder is older output and must not be uploaded as the new site.

After the production deployment succeeds:

```powershell
npm run seo:production
$env:SIDDA_PREVIEW_URL='https://www.siddaspace.com'
npm run seo:browser
npm run seo:flows
Remove-Item Env:SIDDA_PREVIEW_URL
```

The production checker makes read-only requests, compares all public HTML with the release source, checks referenced and responsive assets, and verifies canonicals, JSON-LD, indexing controls, redirects, 404 and video ranges. Browser results for the production host are written separately from the local results. Never test using a real enquiry submission.

For targeted visual rechecks, set `SIDDA_AUDIT_ROUTES` to comma-separated public paths; these results are stored separately so the full audit remains available. `npm run seo:performance` records short synthetic mobile/desktop observations with all media enabled. Its report states the network and CPU conditions; it is not a Lighthouse or field performance score.

`.vercelignore` excludes development reports, scripts and local artefacts from uploads. Verify actual deployment exclusion or noindex controls after a hosting change. Do not deploy environment files or local credentials. Keep the unrelated `gallery-contact-sheet.jpg` out of the release.

## Procedure for adding a public page

1. Confirm the service, location or project facts and assign a distinct customer intent.
2. Add factual HTML with a useful answer, logical headings, relevant imagery and an enquiry route.
3. Register metadata, keyword ownership, intent and appropriate schema in `scripts/seo-config.js`.
4. Add contextual links from the relevant service, project or guide index and link back.
5. Generate, validate and check responsive rendering before release.
6. After publishing, verify the live URL, canonical, sitemap entry, image responses and index eligibility.

Do not set editorial dates merely because files were regenerated. Use genuine original publication and material-update dates when records exist.

## Search Console, Bing and Google Business Profile

These tasks require the owner's respective administrator accounts. No verification or indexing submission is claimed by this repository.

### Google Search Console — owner action required

1. Verify the domain/property if needed using the owner's account.
2. Submit `https://www.siddaspace.com/sitemap.xml` in the Sitemaps report and confirm that Google can read it.
3. Use URL Inspection for each priority URL below. Review fetch/indexability and the Google-selected canonical, then request indexing where appropriate after resolving errors.
4. Monitor clicks, impressions, CTR, average position, indexed URLs, indexing exclusions and Core Web Vitals. A successful live inspection or sitemap submission does not establish that a URL is indexed. [Google URL Inspection](https://support.google.com/webmasters/answer/9012289), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

| Priority page | URL |
| --- | --- |
| Homepage | https://www.siddaspace.com/ |
| Home interiors | https://www.siddaspace.com/services/home-interiors |
| Office interiors | https://www.siddaspace.com/services/office-interiors |
| Turnkey interiors | https://www.siddaspace.com/services/turnkey-interiors |
| 2 BHK interiors | https://www.siddaspace.com/services/2-bhk-interiors |
| 3 BHK interiors | https://www.siddaspace.com/services/3-bhk-interiors |
| Home renovation | https://www.siddaspace.com/services/home-renovation |
| Modular kitchens | https://www.siddaspace.com/services/modular-kitchens |
| Interior cost guide | https://www.siddaspace.com/blog/interior-design-cost-bangalore |
| Kanakapura Road office | https://www.siddaspace.com/locations/kanakapura-road |

### Bing Webmaster Tools — owner action required

1. Verify the site or import the verified property through the owner account.
2. Submit `https://www.siddaspace.com/sitemap.xml`.
3. Inspect priority URL index status, crawl errors and markup using Bing's URL Inspection tool.
4. Monitor search clicks, impressions, queries and indexed pages.
5. When available for the account, review AI Performance citations, cited pages, grounding/query themes and query-to-page relationships. Record Topics information if that beta is enabled. These reports cover the supported Bing/Microsoft/partner surfaces, not every AI assistant. [Bing URL Inspection](https://www.bing.com/webmasters/help/url-inspection-55a30305), [AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/), [Topics beta](https://blogs.bing.com/webmaster/2026/10/introducing-topics-portfolio-beta-in-ai-performance/).

### Google Business Profile — owner action required

Confirm the business name, complete address and floor/entrance, telephone, website, primary category, accurate secondary categories, offered services, photographs, business description, opening hours and actual service areas. Confirm the map pin against the real entrance. Keep the website and profile NAP aligned after the floor discrepancy is resolved. Do not create extra profiles or branch pages for unconfirmed addresses.

Upload owner-approved real photos and updates. Request genuine reviews without incentives or fabricated text. Even a genuine testimonial does not automatically qualify the company's own LocalBusiness/Organization pages for Google review stars; follow the self-serving-review restrictions before adding any review markup. [Google review snippet rules](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).

## Owner confirmation required

- Correct floor and entrance in the supplied office address.
- Actual business and consultation hours, appointment policy, exact coordinates and map pin.
- Served neighbourhoods and the published Tumakur/Mysore coverage.
- Ownership and preferred URLs for all social profiles.
- Business registration, warranties, manufacturing/material details and any professional credentials proposed for publication.
- Project neighbourhoods, dates, areas, budgets, scope records, outcomes and customer/photo permissions.
- Named guide authors and genuine publication or update dates.
- Evidence and permission for testimonials, ratings, client/workforce totals, delivery guarantees, awards or certifications.
- Current manufacturer datasheets, selected models/materials and availability for specifications reproduced from the published product profile. A material test specification does not establish a company certification.

Continue maintaining supported content while these facts are pending. Unknown facts must remain absent from both visible claims and structured data.

## Monthly review

Review Search Console and Bing impressions, clicks, queries, landing pages, indexing exclusions and canonical selection. Compare actual enquiries and qualified leads by landing page where consented measurement exists. Check field LCP, INP and CLS separately from lab checks. Track AI citations when a platform exposes them; manual spot checks vary by query, time and user context.

Review broken links, redirects, media loading, phone/WhatsApp handoffs, mobile navigation and account/profile consistency after each material release. Publish useful new project evidence when available. A technical pass confirms implementation quality; it is not a ranking, indexing or citation guarantee.

## Post-deployment measurement baseline

At first account access, export the most recent 28 complete days and record the date range and timezone. Compare the following 28 complete days using the same definitions; account for seasonality and changes in lead qualification. Actual account metrics are pending access and must not be entered as zero.

| Measure | Source and definition | Baseline status |
| --- | --- | --- |
| Organic clicks, impressions, CTR, average position | Search Console/Bing by query and landing page | Pending owner account export |
| Indexed canonical URLs | Search Console/Bing URL/page-indexing reports | Pending account inspection; 34 URLs are technically eligible |
| Phone clicks | Consented analytics click event for `tel:` links | Not newly instrumented; no count claimed |
| WhatsApp handoffs | Click/draft-opening event | Not a confirmed sent enquiry |
| Consultation enquiries | Confirmed requests received by the business | Pending owner records |
| Estimate starts | First intentional quotation-planner interaction | Not newly instrumented |
| Estimate completions | Valid completed planner handoff | Distinct from received enquiries and sales |
| Form submissions | Define the actual handoff separately from backend receipt | Current public forms prepare WhatsApp drafts |
| Commercial conversions | Qualified lead/appointment/project in owner records | No conversion total invented |
| Brand searches | Brand-query trends in search reports | Pending account export |
| AI citations, cited pages, query themes | Available Bing AI Performance and identifiable platform reports | Pending account access/availability |
| AI referral traffic | Identifiable referral sources in approved analytics | Not all assistants provide referrers |
| Mobile/desktop loading | Local Lighthouse plus field LCP, INP and CLS | Lab evidence recorded separately; field status pending |

For manual AI observations, record the engine, exact question, date, region/context and cited URL. Keep observations separate from rankings or comprehensive visibility claims. ChatGPT, Gemini and Perplexity inclusion cannot be guaranteed. Do not send contact details or full WhatsApp message text into analytics.

## Final production review tooling

`npm run seo:final` re-crawls all canonical public URLs, validates entity/trust/indexing data and required contextual links, and writes the full production table in `reports/FINAL-PRODUCTION-AUDIT.md`. `npm run seo:videos` verifies metadata and decodes a frame from every existing project video in an isolated browser. These tools never submit an enquiry.

Local Lighthouse CLI runs use a temporary npm cache and the installed Chromium browser, without adding website dependencies. The mobile and desktop reports record the version, device/throttling assumptions, LCP, CLS, TBT and opportunities. TBT is a lab blocking-work indicator; it is not measured field INP. A PageSpeed API quota error is a service limit, not a site-performance result. Report real remaining weaknesses alongside successful checks, without assigning the whole implementation a 10/10 rating.
