const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const sel of ['#loading','.bg-noise','.bg-scan','.bg-halo','#guide']){
  const p=await b.newPage({viewport:{width:1200,height:800}});
  await p.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
  await p.waitForTimeout(1800);
  const r=await p.evaluate((s)=>{
    const el=document.querySelector(s);
    if(el) el.style.display='none';
    const c=document.getElementById('scene');
    const gl=c.getContext('webgl2')||c.getContext('webgl');
    // 采样中心像素：用 toDataURL 拿不到，改用 canvas 上的 devicePixel 不可行 → 直接读 CSS
    return {sel:s, exists:!!el, glLost: gl? gl.isContextLost(): null,
      loadingCls: document.getElementById('loading').className};
  }, sel);
  await p.waitForTimeout(300);
  const buf=await p.screenshot({clip:{x:300,y:200,width:600,height:400}});
  fs=require('fs'); fs.writeFileSync(path.join(ROOT,'shots/w_'+sel.replace(/[#.]/g,'')+'.png'),buf);
  console.log(JSON.stringify(r));
  await p.close();
 }
 await b.close();
})();
