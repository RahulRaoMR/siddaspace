// Optional local media preparation. Keeps the full sequence and every original.
// Uses an installed browser's decoder/MediaRecorder rather than adding codecs.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { withBrowser } = require("./browser-session");
const root = path.resolve(__dirname, "..");
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex").slice(0, 10);
withBrowser(async ({ call, evaluate }) => {
  await call("Page.navigate", { url: "http://localhost:3000/404.html" });
  const posters = {};
  for (const n of [1, 2, 3]) {
    const name = `project-showcase-0${n}`;
    const filename = `assets/videos/${name}-${hash(`assets/videos/${name}.mp4`)}-poster.webp`;
    if (!fs.existsSync(path.join(root, filename))) {
      const data = await evaluate(`(async()=>{const v=document.createElement('video');v.muted=true;v.preload='metadata';v.src='/assets/videos/${name}.mp4';await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=j;});v.currentTime=1;await new Promise(r=>v.onseeked=r);const c=document.createElement('canvas');c.width=960;c.height=Math.round(v.videoHeight*960/v.videoWidth);c.getContext('2d').drawImage(v,0,0,c.width,c.height);return c.toDataURL('image/webp',.84).split(',')[1];})()`);
      fs.writeFileSync(path.join(root, filename), Buffer.from(data, "base64"));
    }
    posters[name] = `/${filename}`;
  }
  const source = "assets/videos/hero-background.mp4";
  const filename = `assets/videos/hero-${hash(source)}-720p-v1.webm`;
  const priorManifest = path.join(root, "assets/videos/media-manifest.json");
  const prior = fs.existsSync(priorManifest) ? JSON.parse(fs.readFileSync(priorManifest, "utf8")) : {};
  let metadata = prior.hero === `/${filename}` ? { duration: prior.duration, width: prior.width, height: prior.height } : {};
  if (!fs.existsSync(path.join(root, filename))) {
    console.log("Encoding the full hero video at 1280px / 24fps; original preserved. This runs at playback speed.");
    const result = await evaluate(`(async()=>{
      if(!MediaRecorder.isTypeSupported('video/webm;codecs=vp8'))throw new Error('VP8 recording unavailable');
      const v=document.createElement('video');v.muted=true;v.playsInline=true;v.src='/${source}';document.body.append(v);
      await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=j;});
      const c=document.createElement('canvas');c.width=1280;c.height=Math.round(v.videoHeight*1280/v.videoWidth);document.body.append(c);
      const ctx=c.getContext('2d');const stream=c.captureStream(24);
      const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:1200000});
      const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      const stopped=new Promise((r,j)=>{recorder.onstop=r;recorder.onerror=j;});
      const draw=()=>{ctx.drawImage(v,0,0,c.width,c.height);if(!v.ended)requestAnimationFrame(draw);};
      recorder.start(1000);await v.play();draw();await new Promise(r=>v.onended=r);recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
      const buffer=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());let binary='';
      for(let i=0;i<buffer.length;i+=32768)binary+=String.fromCharCode(...buffer.subarray(i,i+32768));
      return{data:btoa(binary),duration:v.duration,width:c.width,height:c.height};
    })()`, 300000);
    fs.writeFileSync(path.join(root, filename), Buffer.from(result.data, "base64"));
    metadata = { duration: result.duration, width: result.width, height: result.height };
  }
  let finalized = prior.hero === `/${filename}` && prior.containerFinalized;
  if (!finalized) {
    const cache=path.join(process.env.LOCALAPPDATA||root,'ms-playwright');
    const cached=fs.existsSync(cache)?fs.readdirSync(cache).filter(name=>name.startsWith('ffmpeg-')).map(name=>path.join(cache,name,'ffmpeg-win64.exe')):[];
    const ffmpeg=[process.env.SIDDA_FFMPEG_PATH,...cached].find(file=>file&&fs.existsSync(file));
    if(!ffmpeg)throw new Error('Set SIDDA_FFMPEG_PATH to an existing ffmpeg executable to finalise WebM duration/seek information. Original footage is unchanged.');
    const staged=path.join(root,filename.replace('.webm','.mux.webm'));
    const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',path.join(root,filename),'-c','copy',staged],{windowsHide:true,encoding:'utf8'});
    if(result.status!==0)throw new Error(result.stderr||'Unable to finalise WebM container');
    fs.renameSync(staged,path.join(root,filename));finalized=true;
  }
  const report = { source: `/${source}`, hero: `/${filename}`, originalBytes: fs.statSync(path.join(root, source)).size, optimizedBytes: fs.statSync(path.join(root, filename)).size, posters, ...metadata, containerFinalized: finalized };
  fs.writeFileSync(path.join(root, "assets/videos/media-manifest.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
}).catch(error => { console.error(error); process.exitCode = 1; });
