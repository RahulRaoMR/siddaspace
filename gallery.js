// Progressive enhancement: the gallery is usable as linked images without JS.
const grid=document.querySelector('[data-gallery-grid]');
const lightbox=document.querySelector('[data-gallery-lightbox]');
const preview=document.querySelector('[data-gallery-lightbox-image]');
const closeButton=document.querySelector('[data-gallery-close]');
let lastGalleryLink=null;
grid?.addEventListener('click',event=>{
 const link=event.target.closest('[data-gallery-image]');
 if(!link||!lightbox||!preview||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 event.preventDefault();
 lastGalleryLink=link;
 preview.src=link.href;
 preview.alt=link.querySelector('img').alt;
 preview.width=Number(link.dataset.width);
 preview.height=Number(link.dataset.height);
 lightbox.showModal();
 closeButton?.focus();
});
closeButton?.addEventListener('click',()=>lightbox?.close());
lightbox?.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close();});
lightbox?.addEventListener('close',()=>{preview?.removeAttribute('src');lastGalleryLink?.focus();});
