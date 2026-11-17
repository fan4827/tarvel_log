import {readFile,readdir,mkdir,cp,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fail=message=>{throw new Error(message);};
const text=(value,name)=>typeof value==='string'&&value.trim()||fail(name+' 必須是非空字串');
const files=(await readdir(path.join(root,'content/trips'))).filter(file=>file.endsWith('.json')).sort();
if(!files.length)fail('至少需要一個旅程');
const trips=[];const slugs=new Set();
for(const file of files){
 const trip=JSON.parse(await readFile(path.join(root,'content/trips',file),'utf8'));const at=file+': ';
 for(const key of ['slug','title','city','country'])text(trip[key],at+key);
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trip.slug)||file!==trip.slug+'.json')fail(at+'檔名必須與 kebab-case slug 一致');
 if(slugs.has(trip.slug))fail(at+'slug 重複');slugs.add(trip.slug);
 if(typeof trip.isExample!=='boolean')fail(at+'isExample 必須是布林值');
 if(!Array.isArray(trip.days)||trip.days.length<1||trip.days.length>31)fail(at+'days 必須為 1–31 天');
 const titleDays=trip.title.match(/(\d+)日遊$/);if(!titleDays||Number(titleDays[1])!==trip.days.length)fail(at+'標題須以正確天數的「X日遊」結尾');
 for(const [index,day] of trip.days.entries()){
  if(!Array.isArray(day.entries)||day.entries.length!==3)fail(at+'Day '+(index+1)+' 必須有三個時段');
  for(const [i,entry] of day.entries.entries()){
   if(entry.period!==['上午','下午','晚上'][i])fail(at+'Day '+(index+1)+' 時段須依序為上午、下午、晚上');
   text(entry.place,at+'place');if(entry.place.includes('填入'))fail(at+'請替換範本地點');
   if(typeof entry.note!=='string')fail(at+'note 必須是字串（可空白）');
  }
 }
 if(!Array.isArray(trip.sources)||!trip.sources.length)fail(at+'需要至少一個官方來源');
 for(const source of trip.sources){text(source.name,at+'source.name');try{const url=new URL(source.url);if(url.protocol!=='https:')fail('來源只接受 HTTPS');}catch{fail(at+'來源須為有效 HTTPS URL');}}
 trips.push(trip);
}
if(process.argv.includes('--check')){console.log('內容檢查通過：'+trips.length+' 個旅程、'+trips.reduce((n,t)=>n+t.days.length,0)+' 天、'+trips.reduce((n,t)=>n+t.days.length*3,0)+' 筆行程。');process.exit(0);}
const out=path.join(root,'dist');await mkdir(out,{recursive:true});await cp(path.join(root,'public'),out,{recursive:true});
const data='window.TRAVEL_TRIPS = '+JSON.stringify(trips,null,2).replaceAll('<','\u003c')+';\n';
await writeFile(path.join(out,'trips.js'),data.replace(/;\\n$/,';\n'));
for(const file of ['AGENTS.md','README.md'])await cp(path.join(root,file),path.join(out,file));
await writeFile(path.join(out,'.nojekyll'),'');
let html=await readFile(path.join(root,'public/index.html'),'utf8');
const css=await readFile(path.join(root,'public/styles.css'),'utf8');
const app=await readFile(path.join(root,'public/app.js'),'utf8');
const scriptData=await readFile(path.join(out,'trips.js'),'utf8');
const icon=await readFile(path.join(root,'public/assets/favicon.svg'),'utf8');
html=html.replace('href="assets/favicon.svg"','href="data:image/svg+xml,'+encodeURIComponent(icon)+'"');
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>');
html=html.replace('<script src="trips.js" defer></script><script src="app.js" defer></script>','');
const safeScript=text=>text.replace(/<\/script/gi,'<\\/script');
html=html.replace('</body>','<script>'+safeScript(scriptData)+'</script><script>'+safeScript(app)+'</script></body>');
await writeFile(path.join(root,'START.html'),html);
console.log('已建置 dist/ 與 START.html，包含 '+trips.length+' 個旅程。');
