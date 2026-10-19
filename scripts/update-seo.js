// Generate static metadata, visible breadcrumbs, responsive media and sitemap.
const fs=require('node:fs');
const path=require('node:path');
const {origin,pages,business}=require('./seo-config');
const {attributes,attribute,escape,enhanceImages,visibleText,root}=require('./seo-html');
const manifestFile=path.join(root,'assets/optimized/manifest.json');
const manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{};
const mediaFile=path.join(root,'assets/videos/media-manifest.json');
const media=fs.existsSync(mediaFile)?JSON.parse(fs.readFileSync(mediaFile,'utf8')):null;
const home=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const footer=enhanceImages('<head></head>'+home.match(/  <footer class="site-footer">[\s\S]*?<\/footer>/)[0],manifest).replace('<head></head>','');
const productSlugs=['office-chairs','workstations','conference-tables','reception-tables','storage-solutions'];
const {imageTag}=require('./seo-html');
for(const [slug,title,description,label,serviceType,pageImage,articleType]of pages){
 const file=path.join(root,slug+'.html');let html=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
 const url=origin+(slug==='index'?'/':'/'+slug),selectedImage=pageImage||'/assets/projects/project-01.jpeg',image=origin+selectedImage,dimensions=manifest[selectedImage];
 const imageElement=[...html.matchAll(/<img\b[^>]*>/g)].map(([tag])=>attributes(tag)).find(a=>(a['data-original-src']||a.src)===selectedImage);
 const imageAlt=imageElement?.alt||(selectedImage.includes('icon-')?'Siddaspace logo':'Siddaspace interior portfolio');
 const h1=visibleText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||title);
 const crumbs=[{name:'Home',item:origin+'/'}];
 const parent=slug.startsWith('services/')?'services':slug.startsWith('blog/')?'blog':slug.startsWith('projects/')?'projects':productSlugs.includes(slug)?'products':null;
 if(parent)crumbs.push({name:parent[0].toUpperCase()+parent.slice(1),item:origin+'/'+parent});
 if(slug!=='index')crumbs.push({name:label,item:url});
 const entity=JSON.parse(JSON.stringify(business));
 const type=slug==='contact'?'ContactPage':slug==='about'?'AboutPage':['projects','gallery','blog','products','services'].includes(slug)?'CollectionPage':'WebPage';
 const page={'@type':type,'@id':url+'#webpage',url,name:title,description,inLanguage:'en-IN',isPartOf:{'@id':origin+'/#website'},about:{'@id':entity['@id']},...(slug!=='index'?{breadcrumb:{'@id':url+'#breadcrumb'}}:{})};
 const graph=[entity,{'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'Siddaspace',inLanguage:'en-IN',publisher:{'@id':entity['@id']}},page];
 if(slug!=='index')graph.push({'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,...c}))});
 if(imageElement){page.primaryImageOfPage={'@id':url+'#primary-image'};graph.push({'@type':'ImageObject','@id':url+'#primary-image',contentUrl:image,caption:imageAlt,...(dimensions?{width:dimensions.width,height:dimensions.height}:{})});}
 if(serviceType){page.mainEntity={'@id':url+'#service'};graph.push({'@type':'Service','@id':url+'#service',name:h1,serviceType,description,url,provider:{'@id':entity['@id']},areaServed:{'@type':'City',name:'Bangalore'}});}
 if(articleType){const project=articleType==='CreativeWork';page.mainEntity={'@id':url+(project?'#project':'#article')};graph.push({'@type':articleType,'@id':page.mainEntity['@id'],...(project?{name:h1,creator:{'@id':entity['@id']}}:{headline:h1,publisher:{'@id':entity['@id']}}),description,image,mainEntityOfPage:{'@id':page['@id']},inLanguage:'en-IN'});}
 if(slug==='team'){
  entity.member=[];
  for(const [,body]of html.matchAll(/<article class="team-card">([\s\S]*?)<\/article>/g)){
   const name=visibleText(body.match(/<h3>(.*?)<\/h3>/)[1]),role=visibleText(body.match(/<p>(.*?)<\/p>/)[1]),id=url+'#'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
   entity.member.push({'@id':id});graph.push({'@type':'Person','@id':id,name,jobTitle:role,worksFor:{'@id':entity['@id']}});
  }
 }
 html=html.replace(/<head>([\s\S]*?)<\/head>/,(_,original)=>{
  const clean=original.replace(/\n\s*<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/\n\s*<meta\b[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/gi,'').replace(/\n\s*<link\b[^>]*rel="(?:canonical|preload)"[^>]*>/gi,'').replace(/\n\s*<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,'').trimEnd();
  const poster=slug==='index'?(manifest['/assets/projects/project-01.jpeg']?.variants.at(-1)?.src||'/assets/projects/project-01.jpeg'):null;
  const tags=[`<title>${escape(title)}</title>`,`<meta name="description" content="${escape(description)}">`,'<meta name="robots" content="index, follow, max-image-preview:large">',`<link rel="canonical" href="${url}">`,...(poster?[`<link rel="preload" as="image" href="${poster}" fetchpriority="high">`]:[]),`<meta property="og:type" content="${articleType==='BlogPosting'?'article':'website'}">`,'<meta property="og:locale" content="en_IN">','<meta property="og:site_name" content="Siddaspace">',`<meta property="og:title" content="${escape(title)}">`,`<meta property="og:description" content="${escape(description)}">`,`<meta property="og:url" content="${url}">`,`<meta property="og:image" content="${image}">`,`<meta property="og:image:alt" content="${escape(imageAlt)}">`,...(dimensions?[`<meta property="og:image:width" content="${dimensions.width}">`,`<meta property="og:image:height" content="${dimensions.height}">`]:[]),'<meta name="twitter:card" content="summary_large_image">',`<meta name="twitter:title" content="${escape(title)}">`,`<meta name="twitter:description" content="${escape(description)}">`,`<meta name="twitter:image" content="${image}">`];
  const json=JSON.stringify({'@context':'https://schema.org','@graph':graph},null,2).replace(/</g,'\\u003c').split('\n').map(line=>'    '+line).join('\n');
  return '<head>'+clean.replace(/\n\s*<link\b[^>]*rel="preconnect"[^>]*images\.unsplash\.com[^>]*>/g,'')+'\n  '+tags.join('\n  ')+'\n  <script type="application/ld+json">\n'+json+'\n  </script>\n</head>';
 });
 if(slug!=='index'){
  if(html.includes('<footer class="site-footer">'))html=html.replace(/  <footer class="site-footer">[\s\S]*?<\/footer>/,()=>footer);else html=html.replace('</main>','</main>\n\n'+footer);
  const breadcrumb='<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><ol>'+crumbs.map((c,i)=>i===crumbs.length-1?`<li aria-current="page">${escape(c.name)}</li>`:`<li><a href="${new URL(c.item).pathname}">${escape(c.name)}</a></li>`).join('')+'</ol></nav>';
  if(html.includes('class="seo-breadcrumbs"'))html=html.replace(/<nav class="seo-breadcrumbs"[\s\S]*?<\/nav>/,breadcrumb);else html=html.replace(/(<main\b[^>]*>)/,'$1\n    '+breadcrumb);
 }
 html=html.replace(/<main\b[^>]*>/,tag=>attribute(attribute(tag,'id','main-content'),'tabindex','-1'));
 if(slug==='gallery'){
  const images=JSON.parse(fs.readFileSync(path.join(root,'assets/gallery/gallery-data.json'),'utf8'));
  const items=images.map((entry,index)=>{const details=manifest[entry.src];if(!details)throw new Error('Missing image manifest entry: '+entry.src);const tag=imageTag(`<img src="${escape(entry.src)}" alt="${escape(entry.alt)}">`,manifest,{eager:index<3,sizes:'(max-width: 640px) calc(50vw - 30px), (max-width: 1000px) 33vw, 280px'});return `<a class="product-gallery-item" data-gallery-image data-width="${details.width}" data-height="${details.height}" href="${entry.src.split('/').map(encodeURIComponent).join('/')}" aria-label="Preview ${escape(entry.alt.toLowerCase())}">${tag}</a>`;}).join('\n        ');
  html=html.replace(/<div class="product-gallery-grid"[^>]*>[\s\S]*?<\/div>/,`<div class="product-gallery-grid" data-gallery-grid>\n        ${items}\n      </div>`);
 }
 if(!html.includes('class="skip-link"'))html=html.replace(/(<body\b[^>]*>)/,'$1\n  <a class="skip-link" href="#main-content">Skip to main content</a>');
 if(articleType==='BlogPosting'&&!html.includes('class="guide-publisher"'))html=html.replace(/(<section class="seo-hero">[\s\S]*?)(<\/section>)/,'$1<p class="guide-publisher">A planning guide from <a href="/about">Siddaspace</a>. <a href="/contact">Discuss your project requirements</a>.</p>$2');
 html=html.replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*>/g,tag=>tag.includes(' defer')?tag:tag.replace('<script','<script defer'));
 html=html.replace(/<input\b[^>]*>/g,tag=>{
  const a=attributes(tag);
  if(a.type==='tel')return attribute(attribute(attribute(attribute(tag,'autocomplete','tel'),'inputmode','tel'),'maxlength','24'),'aria-describedby',a.name==='estimatePhone'?'estimate-phone-hint':'phone-hint');
  if(a.type==='email')return attribute(tag,'autocomplete','email');
  if(a.type==='text'&&/name/i.test(a.name||''))return attribute(tag,'autocomplete','name');
  return tag;
 });
 if(slug==='estimate'&&!html.includes('id="estimate-phone-hint"'))html=html.replace(/(<input\b[^>]*name="estimatePhone"[^>]*>)/,'$1<small id="estimate-phone-hint">Include your country code if needed.</small>');
 if(slug==='estimate'&&!html.includes('<noscript>'))html=html.replace(/(<main\b[^>]*>)/,'$1<noscript><p class="home-entity-intro">The estimate planner needs JavaScript. You can also <a href="/contact">call or WhatsApp Siddaspace with your room requirements</a>.</p></noscript>');
 if(!html.includes('class="toast"'))html=html.replace('</body>','  <div class="toast" role="status" aria-live="polite"></div>\n</body>');
 html=html.replace(/<video\b[^>]*>[\s\S]*?<\/video>/g,block=>{
  const hero=block.includes('class="hero-bg"');
  const match=block.match(/project-showcase-0[123]/)?.[0];
  if(!hero&&match&&media?.posters[match])block=block.replace(/<video\b[^>]*>/,tag=>attribute(attribute(tag,'data-original-poster',null),'poster',media.posters[match]));
  if(hero&&media&&!block.includes(media.hero))block=block.replace(/(<source\b)/,`<source data-src="${media.hero}" type="video/webm">\n        $1`);
  block=block.replace(/<source\b[^>]*>/g,tag=>{const a=attributes(tag);return a.src?attribute(attribute(tag,'src',null),'data-src',a.src):tag;});
  return block.replace(/<video\b[^>]*>/,tag=>{
    tag=attribute(tag,'preload','none');
    const poster=attributes(tag).poster;
    if(!hero&&poster)tag=attribute(attribute(tag,'poster',null),'data-poster',poster);
    return tag;
  });
 });
 html=html.replace(/\b(?:Sidda\s+Space|Siddha\s+Space)\b/gi,'Siddaspace').replace(/%20Sidda%20Space/g,'%20Siddaspace');
 html=html.replace(/<button\b[^>]*>/g,tag=>(attributes(tag).class||'').split(/\s+/).includes('booking-card')?attribute(tag,'aria-label',null):tag);
 fs.writeFileSync(file,enhanceImages(html,manifest));
}
const urls=pages.map(([slug])=>`  <url><loc>${origin}${slug==='index'?'/':'/'+slug}</loc></url>`).join('\n');
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`Generated SEO for ${pages.length} public pages. Private, error and redirect pages are excluded.`);
