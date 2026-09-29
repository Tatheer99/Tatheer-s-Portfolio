import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicRoot=process.argv.includes('--deployment') ? path.join(root,'dist') : root;
const projects=JSON.parse(fs.readFileSync(path.join(root,'content/projects.json'),'utf8'));
const files=fs.readdirSync(publicRoot).filter(name=>name.endsWith('.html'));
const documents=new Map(files.map(file=>{
  const html=fs.readFileSync(path.join(publicRoot,file),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  return [file,{html,ids}];
}));
const errors=[];
let refs=0;
for(const [file,{html,ids}] of documents){
  if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)errors.push(`${file}: expected one h1.`);
  if((html.match(/<main(?:\s|>)/g)||[]).length!==1)errors.push(`${file}: expected one main element.`);
  if(ids.length!==new Set(ids).size)errors.push(`${file}: duplicate element IDs.`);
  if(!/<title>[^<]+<\/title>/.test(html))errors.push(`${file}: missing page title.`);
  for(const stylesheet of ['styles.css','layout.css']){
    if(!html.includes(`rel="stylesheet" href="${stylesheet}"`))errors.push(`${file}: missing ${stylesheet} stylesheet link.`);
  }
  if(html.includes('chatgpt.site'))errors.push(`${file}: contains an old hosting-domain reference.`);
  for(const match of html.matchAll(/<(a|img|script|link)\b([^>]*)>/g)){
    const [,tag,attributes]=match;
    if(tag==='img'&&!/\balt="[^"]*"/.test(attributes))errors.push(`${file}: image without alternative text.`);
    const link=attributes.match(/\b(?:href|src)="([^"]*)"/);
    if(!link)continue;
    const ref=link[1].replaceAll('&amp;','&');
    if(!ref||ref==='#'){errors.push(`${file}: empty ${tag} reference.`);continue;}
    if(ref.startsWith('/')&&!ref.startsWith('//'))errors.push(`${file}: root-relative path will fail when opened as a local file: ${ref}.`);
    if(/^[a-z]+:/i.test(ref)||ref.startsWith('//'))continue;
    refs++;
    const parsed=new URL(ref,'https://check.invalid/'+file);
    const relative=decodeURIComponent(parsed.pathname).replace(/^\//,'');
    const localFile=relative||'index.html';
    const target=path.join(publicRoot,localFile);
    if(!fs.existsSync(target)||!fs.statSync(target).isFile())errors.push(`${file}: missing local target ${ref}.`);
    if(parsed.hash&&documents.has(localFile)&&!documents.get(localFile).ids.includes(decodeURIComponent(parsed.hash.slice(1))))errors.push(`${file}: missing anchor ${ref}.`);
  }
}
for(const file of ['styles.css','layout.css','case-studies.css']){
  const css=fs.readFileSync(path.join(publicRoot,file),'utf8');
  for(const match of css.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)){
    const ref=match[1];
    if(ref.startsWith('data:'))continue;
    if(/^(?:https?:)?\/\//.test(ref))errors.push(`${file}: an external style asset prevents offline use: ${ref}.`);
    else if(!fs.existsSync(path.resolve(publicRoot,ref.split(/[?#]/)[0])))errors.push(`${file}: missing style asset ${ref}.`);
  }
}
const styles=fs.readFileSync(path.join(publicRoot,'styles.css'),'utf8');
for(const family of ['DM Sans','Manrope']){
  if(!styles.includes(`font-family: '${family}'`))errors.push(`Missing bundled ${family} font.`);
}
const fontData=[...styles.matchAll(/data:font\/woff2;base64,([A-Za-z0-9+/=]+)/g)];
if(fontData.length!==2||fontData.some(match=>Buffer.from(match[1],'base64').subarray(0,4).toString()!=='wOF2'))errors.push('Expected two valid bundled WOFF2 fonts.');
for(const p of projects){
  const doc=documents.get(p.slug+'.html');
  if(!doc){errors.push(`${p.slug}: missing project page.`);continue;}
  for(const id of ['overview','role','approach','decisions','challenges','reflection']){
    if(!doc.ids.includes(id))errors.push(`${p.slug}: missing ${id} section.`);
  }
  if(p.reviewStatus==='draft'&&!doc.html.includes('name="robots" content="noindex,follow"'))errors.push(`${p.slug}: draft has no noindex marker.`);
  if(!documents.get('index.html').html.includes(`href="${p.slug}.html"`))errors.push(`${p.slug}: missing homepage link.`);
}
const hosting=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
if(hosting.outputDirectory!=='dist'||hosting.buildCommand!=='node scripts/build.mjs')errors.push('Unexpected Vercel build configuration.');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`Checked ${files.length} pages, ${refs} local references, connected stylesheets, both offline fonts, all six new case-study sections and Vercel configuration (${publicRoot===root?'download root':'deployment output'}). No errors.`);
