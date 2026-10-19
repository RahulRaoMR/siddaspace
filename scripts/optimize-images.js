// Optional: create responsive WebP derivatives with the installed browser's
// canvas encoder. Originals remain unchanged. Start npm run dev first.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { withBrowser } = require("./browser-session");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "assets/optimized");
const base = process.env.SIDDA_PREVIEW_URL || "http://localhost:3000";
const targets = new Map();
for (const dir of ["", "services", "blog", "locations", "projects"]) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) continue;
  for (const name of fs.readdirSync(absolute)) {
    if (!name.endsWith(".html")) continue;
    const body = fs.readFileSync(path.join(absolute, name), "utf8").split("</head>")[1] || "";
    for (const [tag] of body.matchAll(/<(?:img|video)\b[^>]*>/g)) {
      const source = tag.match(/data-original-(?:src|poster)="([^"]+)"/)?.[1] || tag.match(/(?:src|poster)="([^"]+)"/)?.[1];
      if (!source?.match(/^\/?assets\/.*\.(?:png|jpe?g|svg)$/i)) continue;
      targets.set(`/${source.replace(/^\//, "")}`, tag.match(/alt="([^"]*)"/)?.[1] || path.basename(source, path.extname(source)));
    }
  }
}
const galleryFile=path.join(root,'assets/gallery/gallery-data.json');
if(fs.existsSync(galleryFile))for(const image of JSON.parse(fs.readFileSync(galleryFile,'utf8')))targets.set(image.src,image.alt);
for(const [,source]of fs.readFileSync(path.join(root,'styles.css'),'utf8').matchAll(/url\(["']?(\/assets\/[^)"']+\.(?:png|jpe?g|svg))["']?\)/g))targets.set(source,path.basename(source,path.extname(source)));
const manifestFile = path.join(output, "manifest.json");
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : {};
withBrowser(async ({ call, evaluate }) => {
  await call("Page.navigate", { url: `${base}/` });
  await evaluate("document.readyState");
  fs.mkdirSync(output, { recursive: true });
  let completed = 0;
  for (const [source, label] of targets) {
    const filename = path.join(root, source.slice(1));
    const data = fs.readFileSync(filename);
    const hash = crypto.createHash("sha256").update(data).digest("hex").slice(0, 10);
    const cityIcon = /\/icons\/city-/.test(source);
    const brandImage = /\/sidda-space-(?:logo-on-(?:dark|light)|symbol|footer-logo)\.png$/.test(source);
    const widths = cityIcon ? [52,104,208] : brandImage ? (source.includes('symbol') ? [64,128,256,500] : [256,512,1024]) : [320,640,960,1280,1600];
    const maxWidth = cityIcon ? 208 : brandImage ? (source.includes('symbol') ? 500 : 1024) : 1600;
    if (manifest[source]?.hash === hash && (!(cityIcon || brandImage) || manifest[source].variants.length)) continue;
    const small = !(cityIcon || brandImage) && (data.length < 25000 || /logo|symbol|favicon|icon/i.test(source) || source.endsWith(".svg"));
    const result = await evaluate(`(async()=>{
      const image=new Image();image.src=${JSON.stringify(`${base}${source.split('/').map(encodeURIComponent).join('/')}`)};
      await image.decode();
      const width=image.naturalWidth,height=image.naturalHeight;
      const variants=[];
      if(!${small})for(const target of [...new Set(${JSON.stringify(widths)}.filter(w=>w<width).concat(Math.min(width,${maxWidth})))]){
        const canvas=document.createElement('canvas');canvas.width=target;canvas.height=Math.round(height*target/width);
        const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);
        const encoded=canvas.toDataURL('image/webp',${brandImage ? 1 : source.includes('/team/') ? 0.88 : 0.84});
        variants.push({width:canvas.width,height:canvas.height,data:encoded.split(',')[1]});
      }
      return {width,height,variants};
    })()`);
    const stem = label.toLowerCase().replace(/&[^;]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || path.basename(source, path.extname(source));
    const variants = result.variants.map(variant => {
      const name = `${stem}-${hash}-${variant.width}.webp`;
      const bytes = Buffer.from(variant.data, "base64");
      fs.writeFileSync(path.join(output, name), bytes);
      return { width: variant.width, height: variant.height, src: `/assets/optimized/${name}`, bytes: bytes.length };
    });
    manifest[source] = { hash, width: result.width, height: result.height, originalBytes: data.length, variants };
    completed++;
    if (completed % 30 === 0) console.log(`Processed ${completed} images.`);
  }
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Image manifest: ${Object.keys(manifest).length} originals; ${completed} processed. Original files preserved.`);
}).catch(error => { console.error(error); process.exitCode = 1; });
