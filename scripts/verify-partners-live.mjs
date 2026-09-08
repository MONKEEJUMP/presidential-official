// Requested production receipts only: route heads, sitemap and two mobile Lighthouse runs.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { PARTNER_STATES, PARTNERS_COPY } from '../src/content/partners-copy.ts';
const root=resolve(import.meta.dirname,'..');
const report=resolve(root,'../docs/0907-PRES-KVRT-0010-PARTNERS-BUILD.md');
const snapshot=JSON.parse(await readFile(resolve(root,'src/content/partners.json'),'utf8'));
const origin=process.env.PARTNERS_VERIFY_ORIGIN||'https://presidentialmoonrocks.com';
if(process.argv.includes('--only-ok')){await runLighthouse(['ok'],(await readFile(report,'utf8')).trimEnd().split('\n'));process.exit();}
const routes=['hub',...PARTNER_STATES.map(s=>s.code)];
const lines=['# 0907-PRES-KVRT-0010 Partners Build','','| Release | Value |','|---|---|'];
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const changed=execFileSync('git',['diff','--name-only','70748cf','HEAD'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
const sourceFiles=changed.filter(x=>!x.startsWith('public/partners/logos/')&&x!=='src/content/partners.json');
lines.push(`| Commit | ${sha} |`,`| Deployment | ${process.argv[2]||'pending'} |`,'| Rollback | vercel rollback dpl_4uFdLtUgZLSbFmSgUeVqvqpKESXD --scope paulie-pauliewoods-projects |',`| Source files touched | ${sourceFiles.length} / 22 |`,`| Logo files | ${snapshot.logoBytes.files} |`,`| Logo bytes before | ${snapshot.logoBytes.before} |`,`| Logo bytes after | ${snapshot.logoBytes.after} |`,`| Source rows | ${snapshot.sourceRows} |`,`| Content-Range receipts | ${snapshot.contentRanges.join('; ')} |`,`| Brand/state count mismatches | ${snapshot.mismatches.length} |`);
lines.push('','| Source file |','|---|',...sourceFiles.map(x=>`| ${x} |`));
lines.push('','| State | Brands | Logo tiles | Fallback tiles | Tile locations | Published locations |','|---|---:|---:|---:|---:|---:|');
for(const s of PARTNER_STATES){const b=snapshot.brands.filter(b=>b.perState[s.code]);const logos=b.filter(b=>b.logo).length;lines.push(`| ${s.name} | ${b.length} | ${logos} | ${b.length-logos} | ${b.reduce((n,b)=>n+b.perState[s.code].count,0)} | ${s.headlineDoors} |`);}
lines.push('','| Route | HTTP | Title | H1 | Canonical | JSON-LD types | Robots | Smart characters |','|---|---:|---|---|---|---|---|---:|');
const failures=[];let smart=0;
const esc=x=>String(x).replaceAll('|','\\|');
for(const code of routes){const path=code==='hub'?'/partners':`/partners/${code}`;const res=await fetch(origin+path,{redirect:'manual'});const html=await res.text();const get=re=>html.match(re)?.[1]||'';const title=get(/<title>([\s\S]*?)<\/title>/);const h1=get(/<h1[^>]*>([\s\S]*?)<\/h1>/).replace(/<[^>]+>/g,'');const canonical=get(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);const robots=get(/<meta[^>]*name="robots"[^>]*content="([^"]+)"/);const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));const types=schemas.map(s=>s['@type']);const chars=(html.match(/[\u2018\u2019\u201c\u201d\u2013\u2014]/g)||[]).length;smart+=chars;const item=schemas.find(s=>s['@type']==='ItemList');const count=code==='hub'?0:snapshot.brands.filter(b=>b.perState[code]).length;if(res.status!==200||h1!==PARTNERS_COPY[code].h1||canonical!==origin+path||!robots.includes('index, follow')||!types.includes('Organization')||!types.includes('BreadcrumbList')||!types.includes('WebPage')||(code!=='hub'&&item?.itemListElement?.length!==count))failures.push(path);lines.push(`| ${path} | ${res.status} | ${esc(title)} | ${esc(h1)} | ${canonical} | ${types.join(', ')} | ${robots} | ${chars} |`);console.log('LIVE',path,res.status,'items',item?.itemListElement?.length??0,'smart',chars);}
const sitemap=await (await fetch(origin+'/sitemap.xml')).text();const after=(sitemap.match(/<loc>/g)||[]).length;
lines.push('','| Check | Result |','|---|---|','| Sitemap before | 81 |',`| Sitemap after | ${after} |`,`| Requested smart-character grep, eight rendered pages | ${smart} |`,`| Live route failures | ${failures.length ? failures.join(', '):'0'} |`);
lines.push('','| Correction / qualification | Disposition |','|---|---|','| California source 603 vs published 604 | Preserved 604 per owner ruling; discrepancy remains for separate owner decision. |','| California example 394 partners | Actual reconciled count is 398 partners and 594 tile locations. |','| National headline vs public tiles | Preserved 1,223 headline; excluded 18 locations across 14 non-retail accounts and Presidential mailbox; 1,205 tiled locations. |','| Navigation source already contains dropdown groups | Partners added as a standalone direct link; existing groups preserved. |','| State-page font/tagline smart characters | Existing taglines reproduced with ASCII hyphens in the partners-only copy module. |','| Snapshot geography | Source IDs replay original clustering and documented URL merges; all 847 national totals reconciled before exclusions. |','| UI scope | Existing StatePageShell hero structure ported; no find-us route or homepage title/H1/canonical changed. |','| Logo approval | Owner authorized promotion of the staged set; harvest fallbacks are not independently re-adjudicated in this stamp. |');
await writeFile(report,lines.join('\n')+'\n');
if(failures.length||after!==89||smart)throw Error('Live response discrepancy; see report');
lines.push('','| Mobile Lighthouse | Performance | Accessibility | Best practices | SEO | CLS | LCP ms |','|---|---:|---:|---:|---:|---:|---:|');
async function runLighthouse(codes,lines){for(const code of codes){
 const chrome=await launch({chromePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',chromeFlags:['--headless=new','--disable-gpu','--no-first-run']});
 try {const result=await lighthouse(origin+'/partners/'+code,{port:chrome.port,output:'json',logLevel:'error',formFactor:'mobile',onlyCategories:['performance','accessibility','best-practices','seo']});const lhr=result.lhr;const scores=['performance','accessibility','best-practices','seo'].map(k=>Math.round(lhr.categories[k].score*100));const cls=lhr.audits['cumulative-layout-shift'].numericValue;const lcp=lhr.audits['largest-contentful-paint'].numericValue;lines.push(`| /partners/${code} | ${scores.join(' | ')} | ${cls} | ${Math.round(lcp)} |`);console.log('LIGHTHOUSE',code,JSON.stringify({scores,cls,lcp:Math.round(lcp)}));await writeFile(report,lines.join('\n')+'\n');}
 finally {await chrome.kill().catch(error=>console.warn('Browser cleanup only:',error.message));}
}}
await runLighthouse(['ca','ok'],lines);
console.log('REPORT',report);
