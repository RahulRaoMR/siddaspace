# Siddaspace production deployment

Published on 19 October 2026 to **https://www.siddaspace.com/** through the existing GitHub main branch and Vercel project.

- [Content release de728ef](https://github.com/RahulRaoMR/siddaspace/commit/de728eff4a45a949e105d322cf910399cea1d01a)
- [Successful Vercel production deployment](https://vercel.com/rahul-s-projects-f3944ce2/siddaspace/BHRUBroDdXoLKY9Vm8r6b5C4VQp6)

## Production verification

- All **34 public pages** match the release HTML, including metadata, canonicals and connected JSON-LD.
- **977 referenced/responsive assets** checked; **1,038 production checks passed with no failures**. Original GitHub-hosted MP4 files and the new WebM support partial media requests.
- Sitemap, robots, clean URLs, legacy presentation redirects, custom 404, image/video responses and cache controls checked.
- Anonymous Live Projects access redirects to login. Encoded path variants return a safe noindex 404. Local tests also verified successful login, authenticated portal access, sessions and logout with disposable in-memory credentials. Owner credentials were not used for a production login.
- Live consultation and quotation validation, intercepted WhatsApp draft contents, source attribution, static gallery links, gallery focus restoration, reduced motion, deferred video posters and actual WebM decoding/seeking passed. **No real enquiry was sent.**
- The full live browser audit covered 102 page/viewport cases. Thirty targeted copy rechecks passed, followed by 12 final checks covering homepage, home interiors, projects and gallery at 390, 768 and 1440px. Representative production screenshots were inspected.

An initial mobile gallery run hit the QA readiness limit. Its raw failures are retained; subsequent isolated rechecks passed. Browser tooling now brings the tested tab to the foreground and allows up to 30 seconds for document readiness.

## Corrections found during deployment

The static Live Projects HTML took precedence over Vercel's authentication rewrite. Its unchanged page content now lives in the authenticated handler, and both the local and hosted routes use that handler. No public page URL was removed.

Two local project MP4 URLs returned Git LFS pointers on Vercel. They now use the same working GitHub media host as the other original walkthroughs. Legacy `.html` redirects may use Vercel's clean-URL hop before reaching their final destination.

The quotation planner collects room/package preferences and prepares a quotation request; it does not calculate a price. Titles, headings, related links, terms and WhatsApp wording now reflect that behavior.

The hero remains full length while its file size falls from 308,611,515 to 21,547,497 bytes, about 93%. Two location icons now have responsive WebP variants: their combined default 104px versions total 7,032 bytes, compared with 1,169,588 original bytes. There are now 698 WebP derivatives. Offscreen video posters are deferred, and hero playback waits for initial loading and an idle opportunity.

## Performance evidence and limits

[Production performance observations](production-performance.json) record synthetic mobile and desktop runs for the homepage and home-interior service page with all media enabled. The file states its network and CPU settings. These single observations are not Lighthouse scores, field Core Web Vitals, measured INP, ranking guarantees or an SEO/GEO rating.

Earlier samples are retained for diagnosis. They predate explicit browser foregrounding and include variable response/paint timing; they must not be used to claim a measured before/after LCP improvement. Asset byte reductions are directly verifiable. Monitor real-user LCP, INP and CLS after traffic accumulates, including cold mobile visits.

The mobile homepage's LCP observation was unavailable in this probe. Verify that page with Lighthouse/PageSpeed and Search Console field data before claiming it meets Core Web Vitals targets.

An independent Google PageSpeed API request returned HTTP 429 because its daily quota was exhausted. [The recorded response](pagespeed-mobile.json) contains no Lighthouse result or performance score.

An independent Google PageSpeed API request returned HTTP 429 because its daily quota was exhausted. [The recorded response](pagespeed-mobile.json) contains no Lighthouse result or performance score.

## Owner/account work remaining

Google Search Console verification, sitemap submission and URL inspection; Bing Webmaster Tools submission and AI reporting; Google Business Profile updates require the respective owner/admin accounts. No search-account changes or submissions were performed.

Confirm the address's conflicting floor references, hours, exact coordinates/map pin, service-area coverage and supporting records for any future business/performance claims. Unsupported facts remain omitted. See [SEO.md](../SEO.md) for the maintenance procedure and owner-confirmation list.

## Supporting records

- [Full URL and implementation audit](SEO-AUDIT.md)
- [Production HTTP and asset checks](production-check.json)
- [Full live browser audit](production-browser-audit.json)
- [Copy and gallery rechecks](production-browser-copy-recheck.json)
- [Final responsive checks](production-browser-recheck.json)
- [Project evidence](project-evidence.json)
