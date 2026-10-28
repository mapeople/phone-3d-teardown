const path=require('path'),fs=require('fs');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
const URL='file://'+path.join(ROOT,'dist/index.html');
const CORE=fs.readFileSync(path.join(__dirname,'raster.core.js'),'utf8');
const hide=JSON.parse(process.argv[2]||'[]');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=gl']});
 const p=await b.newPage({viewport:{width:1100,height:900}});
 p.on('pageerror',e=>console.log('ERR>',e.message));
 await p.goto(URL,{waitUntil:'load'});await p.waitForTimeout(1800);
 await p.evaluate(CORE);
 const out=await p.evaluate((h)=>{
  const d=window.__dbg;d.setExplode(1);const o=d.orbit;
  o.autoFit=false;o.autoRotate=false;o.cur.th=0.62;o.des.th=0.62;o.cur.ph=1.2;o.des.ph=1.2;o.cur.r=40;o.des.r=40;
  d.parts.forEach(pt=>{pt.mesh.position.copy(pt.base);});
  d.applyExplode(d.explodeT||0);
  d.parts.forEach(pt=>{ if(h.indexOf(pt.id)>=0) pt.mesh.visible=false; });
  d.syncCamera&&d.syncCamera();
  const r=window.__raster({w:760,h:640});
  const list=d.parts.map(pt=>pt.id+':'+pt.mesh.position.z.toFixed(2)).join(' ');
  return {url:r.url,list};
 },hide);
 fs.writeFileSync(path.join(ROOT,'shots/iso.png'),Buffer.from(out.url.split(',')[1],'base64'));
 console.log(out.list);
 await b.close();
})();
