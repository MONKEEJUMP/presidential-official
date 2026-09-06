import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import sharp from 'sharp';

// Reproduce derivatives from the owner-reviewed September 6 source library.
// Originals are read only. Pass the two source roots and the inventory path.
const [modelsRoot, photosRoot, inventoryPath] = process.argv.slice(2);
if (!modelsRoot || !photosRoot || !inventoryPath) throw new Error('Pass model root, photo root, inventory.json');
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));
const target = resolve('public/media/vapes/showroom');
mkdirSync(target, { recursive: true });
const colors = ['Black', 'Silver', 'Teal', 'White'];
const families = ['LD', 'LRE', 'LRO'];
const views = ['home', 'front-left', 'back-right', 'back', 'back-left', 'front-right', 'screen', 'model'];
const receipts = [];
const originals = inventory.filter(row => !row.relativePath.includes(' - Copy'));
for (const color of colors) for (const family of families) {
  const rows = originals.filter(row => row.group === 'photos' && row.relativePath.startsWith(color + ' Battery') && row.relativePath.split(/[\\/]/).at(-1).startsWith(family + ' '));
  for (const row of rows) {
    const name = row.relativePath.split(/[\\/]/).at(-1);
    const view = name.includes('HOME') ? 'home' : name.includes('TEMP') ? 'screen' : name.includes('BACK FACE') ? 'back' : name.includes('BACK LS') ? 'back-left' : name.includes('BACK RS') ? 'back-right' : name.includes('LS') ? 'front-left' : 'front-right';
    const source = join(photosRoot, row.relativePath);
    // Use the photographed product's dark/colored core to frame each file independently.
    // Generous padding retains clear/white mouthpieces and pale body edges.
    const sample = await sharp(source).resize(600,600,{fit:'fill'}).removeAlpha().raw().toBuffer();
    let minX=600,minY=600,maxX=0,maxY=0;
    for(let y=90;y<510;y++) for(let x=100;x<500;x++) {
      const p=(y*600+x)*3, r=sample[p],g=sample[p+1],b=sample[p+2];
      if ((r+g+b)/3<166 || (Math.max(r,g,b)-Math.min(r,g,b)>48 && Math.min(r,g,b)<180)) {
        minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      }
    }
    const cx=(minX+maxX)/1200, cy=(minY+maxY)/1200;
    let cropH=Math.max((maxY-minY)/600*1.48, .49);
    let cropW=Math.max((maxX-minX)/600*1.7,cropH*.8);
    cropH=Math.max(cropH,cropW/0.8);
    const width=Math.min(row.width,Math.round(cropW*row.width));
    const height=Math.min(row.height,Math.round(cropH*row.height));
    const left=Math.max(0,Math.min(row.width-width,Math.round(cx*row.width-width/2)));
    const top=Math.max(0,Math.min(row.height-height,Math.round(cy*row.height-height/2)));
    const filename=`${color.toLowerCase()}-${family.toLowerCase()}-${view}.webp`;
    await sharp(source).extract({left,top,width,height}).resize(1200,1500,{fit:'contain',background:'#f2f4f5'}).webp({quality:87,effort:5}).toFile(join(target,filename));
    receipts.push({sourceId:row.id,source:row.relativePath,color,family,view,src:`/media/vapes/showroom/${filename}`,crop:{left,top,width,height}});
  }
  const row=originals.find(r=>r.group==='models'&&r.relativePath===`${family} ${color}.png`);
  const filename=`${color.toLowerCase()}-${family.toLowerCase()}-model.webp`;
  await sharp(join(modelsRoot,row.relativePath)).webp({quality:88,effort:5}).toFile(join(target,filename));
  receipts.push({sourceId:row.id,source:row.relativePath,color,family,view:'model',src:`/media/vapes/showroom/${filename}`,width:row.width,height:row.height});
}
for(const color of colors)for(const family of families){
  const set=receipts.filter(r=>r.color===color&&r.family===family);
  if(set.length!==8 || views.some(view=>!set.some(r=>r.view===view)))throw new Error(`Incomplete mapping: ${color}/${family}`);
}
// Approved single-device framing from the transparent model sheets.
await sharp(join(modelsRoot,'LD Teal.png')).extract({left:0,top:18,width:395,height:657}).webp({quality:93,effort:5}).toFile(join(target,'hero-teal.webp'));
mkdirSync(resolve('docs/vapes'),{recursive:true});
const aliases=inventory.filter(r=>r.relativePath.includes(' - Copy')).map(r=>({sourceId:r.id,source:r.relativePath,aliasOf:inventory.find(o=>o.relativePath===r.relativePath.replace(' - Copy','')).id}));
writeFileSync(resolve('docs/vapes/0906-001-source-map.json'),JSON.stringify({source:'Owner supplied Product Models and Product Photos, September 6 2026',uniqueAssets:receipts.length,assets:receipts,duplicateAliases:aliases},null,2)+'\n');
console.log(JSON.stringify({uniqueAssets:receipts.length,duplicateAliases:aliases.length,heroDerivatives:1}));
