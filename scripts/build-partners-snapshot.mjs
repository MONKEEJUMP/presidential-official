import { readFile, writeFile, mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, '../sources/partners');
await mkdir(resolve(root,'src/content'),{recursive:true});
const ascii = s => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/[^\x00-\x7f]/g, '');
const key = s => ascii(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function csv(text) {
  const rows=[]; let row=[], cell='', quote=false;
  for(let i=0;i<text.length;i++) { const c=text[i]; if(c==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(c===','&&!quote){row.push(cell);cell='';}else if(c==='\n'&&!quote){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c; }
  if(cell||row.length){row.push(cell);rows.push(row);} const head=rows.shift().map(x=>x.replace(/^\uFEFF/,''));return rows.filter(r=>r.length===head.length).map(r=>Object.fromEntries(head.map((k,i)=>[k,r[i]])));
}

async function logoNeedsDark(path) {
  try {
    const {data,info}=await sharp(path).resize({width:32,height:32,fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let opacity=0,luminance=0;
    for(let i=0;i<data.length;i+=4){const a=data[i+3]/255;opacity+=a;luminance+=a*(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255;}
    return opacity>0 && opacity/(info.width*info.height)<.95 && luminance/opacity>.72;
  }catch{return false;}
}
if(process.argv.includes('--logo-contrast-only')){
  const path=resolve(root,'src/content/partners.json');const snapshot=JSON.parse(await readFile(path,'utf8'));
  for(const brand of snapshot.brands)brand.logoOnDark=brand.logo?await logoNeedsDark(resolve(root,'public'+brand.logo)):false;
  await writeFile(path,JSON.stringify(snapshot,null,2)+'\n');console.log('Dark-backed logos:',snapshot.brands.filter(b=>b.logoOnDark).length);process.exit();
}

if(process.argv.includes('--copy-from')) {
  const brief=(await readFile(process.argv[process.argv.indexOf('--copy-from')+1],'utf8')).replaceAll('\r\n','\n');
  const chunks=brief.split(/--- \/partners/).slice(1); const content={};
  for(const chunk of chunks) {
    const code=chunk.startsWith(' HUB')?'hub':chunk.slice(1,3);
    const field=n=>chunk.match(new RegExp('^'+n+': ([\\s\\S]*?)(?=\\n[A-Z][A-Z ]*:|\\n\\n)','m'))?.[1].replace(/\s*\n\s*/g,' ').trim();
    let body=chunk.split('BODY:\n')[1]?.split(/\nRETAILER CALLOUT BLOCK|\n={5,}/)[0].trim();
    if(!body) throw Error('Missing copy '+code);
    if(code==='ca') body=body.replace('Six hundred and four doors. More than every other state combined.','Six hundred and four doors. The largest network in the country.');
    content[code]={h1:field('H1'),title:field('TITLE'),description:field('META'),body:body.split(/\n\s*\n/).map(x=>x.replace(/\s*\n\s*/g,' '))};
  }
  const states=[['ca','California',604,'Pre-rolling High in the Golden State.','#FFD447'],['ok','Oklahoma',194,'The Sooner The Better. A Presidential High.','#C1502E'],['ny','New York',170,'Skyscraper High. Presidential Grade.','#3E6E9E'],['nv','Nevada',102,'From the Strip to Space - Presidential Moon Rocks Rock.','#C8CDD4'],['mi','Michigan',101,'Motor City High. Presidential Octane.','#2E7D8F'],['az','Arizona',53,'From the Canyon to the Cosmos - Presidential','#B5603A'],['wa','Washington',0,'Evergreen State. Presidential High.','#3C6E52']].map(([code,name,headlineDoors,tagline,color])=>({code,name,headlineDoors,tagline,color}));
  const out=`// Owner copy: 0907-PRES-KVRT-0010 and count ruling. ASCII only.\nexport const PARTNERS_LABEL = "Partners";\nexport const PARTNER_STATES = ${JSON.stringify(states,null,2)} as const;\nexport type PartnerStateCode = (typeof PARTNER_STATES)[number]["code"];\nexport const PARTNERS_COPY = ${JSON.stringify(content,null,2)} as const;\nexport const PARTNERS_UI = {home:"Home", eyebrow:"Presidential", chains:"Multi-Location Partners", independents:"Independent Partners", landing:"LANDING SOON", contact:"Contact Presidential", close:"Find your nearest location", visit:"Visit site", callout:"Carry Presidential and want your logo on this page? Send it over. Every partner listed here gets their mark, their name, and a link out."} as const;\nexport const partnersCountLine = (brands:number,doors:number,state:string) => \`\${brands} partners operating \${doors} locations across \${state}.\`;\nexport const partnerLocations = (count:number) => \`\${count} locations\`;\nexport const partnerLogoAlt = (name:string,city:string,state:string) => \`\${name} - licensed Presidential retailer in \${city}, \${state}\`;\nexport const partnerExplore = (name:string) => \`Explore \${name}\`;\n`;
  if(Object.keys(content).length!==8||/[^\x00-\x7f]/.test(out)) throw Error('Copy completeness/ASCII failure');
  await writeFile(resolve(root,'src/content/partners-copy.ts'),out); console.log('Owner copy extracted: 8 routes');process.exit();
}

const env=Object.fromEntries((await readFile(resolve(root,'.env.local'),'utf8')).split(/\r?\n/).filter(x=>/^[A-Z_]+=/.test(x)).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
let doors=[], total; const ranges=[];
do {
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/retailers?select=id,name,address,city,state,zip&order=id.asc&offset=${doors.length}&limit=1000`,{headers:{apikey:env.SUPABASE_SECRET_KEY,Prefer:'count=exact','User-Agent':'presidential-partners-snapshot/1.0'}});
  if(!res.ok) throw Error('Supabase HTTP '+res.status);
  const range=res.headers.get('content-range');ranges.push(range);total=Number(range.split('/')[1]);doors.push(...await res.json());
}while(doors.length<total);
if(total!==1223||doors.length!==total)throw Error('Source total changed');
const ps=spawnSync('pwsh',['-NoProfile','-File',resolve(import.meta.dirname,'partners-brand-identities.ps1'),resolve(source,'0907-PRES-KVRT-0002-partner-brands.ps1')],{input:JSON.stringify(doors),encoding:'utf8',maxBuffer:12e6});
if(ps.status!==0)throw Error(ps.stderr); const identities=JSON.parse(ps.stdout);
const brands=csv(await readFile(resolve(source,'0907-PRES-KVRT-0002-partner-brands.csv'),'utf8'));
const aliases={'Great Lakes Holistics':'GLH Kzoo','Leaf Society Salt n Sea':'Leaf Society','Livwell Meds of Calera':'LivWell Meds','Mr Nice Guy Moreno Valley':'Mr Nice Guy','Top Cannabis Outlet':'Top Cannabis','Tree House Cannabis':'Tree House','Aroma Cannabis':'Aroma','Budd Barn':'Canna Planet','Canna Health & Wellness':'Canna Health','Dank Headquarters':'House of Dank','LEVELS DISTRO':'LEVELS','OHANA Beverly Hills':'Ohana','Ohana Cannabis':'Ohana','SafePort Dispensary':'Safeport Cannabis','Traditional (DTLA)- OLYMPIC':'Traditional','Traditional (Mid-City)':'Traditional','Transcend Crown Heights':'Transcend Wellness'};
const mapping=new Map(brands.map(b=>[key(b.brand_name),b]));for(const [a,b] of Object.entries(aliases))mapping.set(key(a),mapping.get(key(b)));
const grouped=new Map();const unmapped=[];
for(const d of identities){const brand=mapping.get(key(d.brand));if(!brand){unmapped.push(d);continue;}if(!grouped.has(brand.brand_name))grouped.set(brand.brand_name,[]);grouped.get(brand.brand_name).push(d);}
const mismatches=brands.filter(b=>(grouped.get(b.brand_name)||[]).length!==Number(b.door_count)).map(b=>({name:b.brand_name,expected:Number(b.door_count),actual:(grouped.get(b.brand_name)||[]).length}));
if(unmapped.length||mismatches.length){console.log(JSON.stringify({unmapped,mismatches},null,2));throw Error('Brand/source reconciliation requires correction');}
const logoDir=resolve(root,'public/partners/logos');await mkdir(logoDir,{recursive:true});let beforeBytes=0,afterBytes=0;const logoMap=new Map();
for(const file of await readdir(resolve(source,'logos'))){
  const input=resolve(source,'logos',file);beforeBytes+=(await stat(input)).size;
  const output=extname(file).toLowerCase()==='.svg'?file:basename(file,extname(file))+'.webp';const target=resolve(logoDir,output);
  if(output.endsWith('.svg'))await copyFile(input,target);
  else {
    try{await sharp(input).resize({width:400,height:400,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toFile(target);}
    catch{const p=spawnSync('python',['-B','-c','from PIL import Image; import sys; im=Image.open(sys.argv[1]); im=im.ico.getimage(max(im.ico.sizes(),key=lambda s:s[0]*s[1])) if im.format=="ICO" else im; im=im.convert("RGBA"); im.thumbnail((400,400)); im.save(sys.argv[2],"WEBP",quality=85)',input,target],{encoding:'utf8'});if(p.status!==0)throw Error(file+': '+p.stderr);}
  }
  afterBytes+=(await stat(target)).size;logoMap.set(file,'/partners/logos/'+output);
}
const included=brands.filter(b=>b.account_type==='retail'&&!(b.brand_name==='PRESIDENTIAL'&&b.primary_city==='Costa Mesa'&&b.primary_state==='CA'));
const records=included.map(b=>{const members=grouped.get(b.brand_name);const perState={};for(const d of members){const c=d.state.toLowerCase();perState[c]??={count:0,cities:[]};perState[c].count++;if(!perState[c].cities.includes(ascii(d.city)))perState[c].cities.push(ascii(d.city));}for(const v of Object.values(perState))v.cities.sort();return{id:key(b.brand_name).replaceAll(' ','-'),name:ascii(b.brand_name),nationalDoors:Number(b.door_count),website:b.website,logo:logoMap.get(b.logo_file)||null,perState};});
const snapshot={stamp:'0907-PRES-KVRT-0010',sourceRows:total,contentRanges:ranges,sourceStateCounts:Object.fromEntries(['CA','OK','NY','NV','MI','AZ'].map(s=>[s,doors.filter(d=>d.state===s).length])),excludedBrands:brands.length-included.length,excludedDoors:total-records.reduce((s,b)=>s+b.nationalDoors,0),logoBytes:{before:beforeBytes,after:afterBytes,files:logoMap.size},mismatches,brands:records};
for(const brand of records)brand.logoOnDark=brand.logo?await logoNeedsDark(resolve(root,'public'+brand.logo)):false;
await writeFile(resolve(root,'src/content/partners.json'),JSON.stringify(snapshot,null,2)+'\n');
console.log(JSON.stringify({...snapshot,brands:records.length,states:Object.fromEntries(['ca','ok','ny','nv','mi','az','wa'].map(s=>{const a=records.filter(b=>b.perState[s]);return[s,{brands:a.length,doors:a.reduce((n,b)=>n+b.perState[s].count,0),logos:a.filter(b=>b.logo).length}]}))},null,2));
