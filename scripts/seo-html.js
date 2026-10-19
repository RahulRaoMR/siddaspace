const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const decode = text => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const escape = text => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));
function attribute(tag, name, value) {
  const re = new RegExp(`\\s${name}="[^"]*"`, "g");
  const cleaned = tag.replace(re, "");
  return value === null ? cleaned : cleaned.replace(/\s*\/?>$/, match => ` ${name}="${escape(String(value))}"${match}`);
}
function sourcePath(source) {
  if (!source) return null;
  const pathname = decodeURIComponent(new URL(source, "https://www.siddaspace.com/").pathname);
  return path.posix.normalize(pathname);
}
function imageTag(tag, manifest, { eager = false, sizes = "(max-width: 640px) calc(100vw - 40px), (max-width: 1000px) 50vw, 420px" } = {}) {
  const attrs = attributes(tag);
  const source = sourcePath(attrs["data-original-src"] || attrs.src);
  if (!source || !manifest[source]) return tag;
  const image = manifest[source];
  const cityIcon = /\/icons\/city-/.test(source);
  const wordmark = /logo-on-/.test(source);
  const symbol = /sidda-space-symbol/.test(source);
  const footerLogo = /footer-logo/.test(source);
  tag = attribute(attribute(tag, "width", image.width), "height", image.height);
  tag = attribute(tag, "decoding", "async");
  const decorativeHeader = /logo|symbol|whatsapp|icons\//i.test(source);
  tag = attribute(tag, "loading", footerLogo ? "lazy" : eager || attrs.loading === "eager" || decorativeHeader ? "eager" : "lazy");
  if (image.variants.length) {
    const selected = image.variants.find(item => item.width >= (cityIcon ? 104 : wordmark || footerLogo ? 512 : symbol ? 128 : /\/team\//.test(source) ? 640 : 960)) || image.variants.at(-1);
    tag = attribute(tag, "data-original-src", source);
    tag = attribute(tag, "src", selected.src);
    tag = attribute(tag, "srcset", image.variants.map(item => `${item.src} ${item.width}w`).join(", "));
    tag = attribute(tag, "sizes", cityIcon ? '52px' : wordmark ? '(max-width: 640px) 220px, 320px' : symbol ? '64px' : footerLogo ? '260px' : sizes);
  }
  return tag;
}
function enhanceImages(html, manifest) {
  const split = html.indexOf("</head>") + 7;
  let body = html.slice(split);
  body = body.replace(/<img\b[^>]*>/g, (tag, offset) => {
    const attrs=attributes(tag);
    if((attrs.class||'').split(/\s+/).includes('brand-logo'))tag=attribute(attribute(tag,'data-original-src','/assets/sidda-space-logo-on-dark.png'),'src','/assets/sidda-space-logo-on-dark.png');
    const context=body.slice(Math.max(0,offset-120),offset);
    return imageTag(tag,manifest,{sizes:/sidda-person-photo/.test(context)?'180px':/service-evidence/.test(context)?'(max-width: 900px) calc(100vw - 40px), 860px':undefined});
  });
  body = body.replace(/<video\b[^>]*>/g, tag => {
    const attrs = attributes(tag);
    const source = sourcePath(attrs["data-original-poster"] || attrs['data-poster'] || attrs.poster);
    if (source && manifest[source]?.variants.length) {
      const selected = manifest[source].variants.at(-1);
      tag = attribute(attribute(tag, "data-original-poster", source), attrs['data-poster'] ? 'data-poster' : "poster", selected.src);
    }
    if (!tag.includes("autoplay")) tag = attribute(tag, "preload", "none");
    return tag;
  });
  return html.slice(0, split) + body;
}
function visibleText(html) {
  return decode(html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
module.exports = { attributes, attribute, escape, sourcePath, imageTag, enhanceImages, visibleText, root };
