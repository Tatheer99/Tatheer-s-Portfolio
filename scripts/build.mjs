import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The ready-to-open website lives at the top level of the download.
// Vercel receives a separate copy containing only browser-facing files.
const output = root;
const deployment = path.join(root, 'dist');
const projects = JSON.parse(fs.readFileSync(path.join(root, 'content/projects.json'), 'utf8'));
const settings = JSON.parse(fs.readFileSync(path.join(root, 'content/site.json'), 'utf8'));
const originalHome = fs.readFileSync(path.join(root, 'templates/index.html.template'), 'utf8');
const header = originalHome.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
const footer = originalHome.match(/<footer class="footer">[\s\S]*?<\/footer>/)?.[0];
const contact = originalHome.match(/<section class="contact"[\s\S]*?<\/section>/)?.[0];
if (!header || !footer || !contact) throw new Error('The shared header, footer or contact section is missing from templates/index.html.template.');

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const envHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const origin = (settings.siteUrl || (envHost ? `https://${envHost}` : '')).replace(/\/$/, '');
if (origin && !/^https?:\/\//.test(origin)) throw new Error('siteUrl must start with https:// or http://.');
const ids = new Set();
for (const project of projects) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) || ids.has(project.slug)) throw new Error('Each project needs a unique, simple slug.');
  if (!['draft','ready'].includes(project.reviewStatus)) throw new Error(`${project.slug}: reviewStatus must be draft or ready.`);
  ids.add(project.slug);
}
fs.mkdirSync(output, {recursive:true});
fs.cpSync(path.join(root, 'static'), output, {recursive:true});

function metadata(html, filename, cover='assets/L3.png') {
  html = html.replace(/<meta property="og:image"[^>]*>/g, '').replace(/<link rel="canonical"[^>]*>/g, '').replace(/<meta property="og:url"[^>]*>/g, '');
  if (origin) {
    const pathname = filename === 'index.html' ? '/' : '/' + filename;
    const extra = `<link rel="canonical" href="${escape(origin+pathname)}"><meta property="og:url" content="${escape(origin+pathname)}"><meta property="og:image" content="${escape(origin+'/'+cover)}">`;
    html = html.replace('</head>', extra+'</head>');
  }
  return html;
}

function placeholder(project, item) {
  const folder = path.join(output, 'assets/projects', project.slug);
  fs.mkdirSync(folder, {recursive:true});
  const target = path.join(folder, `${item.key}-placeholder.svg`);
  const shortLabel = item.label.length > 42 ? item.label.slice(0,39)+'…' : item.label;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="${escape(item.label)} — image placeholder"><rect width="1280" height="720" rx="20" fill="${escape(project.accent)}"/><rect x="48" y="48" width="1184" height="624" rx="14" fill="none" stroke="#191b20" stroke-opacity=".2" stroke-dasharray="6 9"/><text x="88" y="120" font-family="Arial,sans-serif" font-size="16" letter-spacing="3" fill="#454b51">${escape(project.name.toUpperCase())}</text><g stroke="#191b20" stroke-width="3" stroke-opacity=".4" fill="none"><rect x="607" y="232" width="66" height="52" rx="8"/><circle cx="626" cy="249" r="5"/><path d="m614 273 15-15 12 11 10-9 16 15"/></g><text x="640" y="375" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" letter-spacing="-1.3" fill="#191b20">${escape(shortLabel)}</text><text x="640" y="418" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" fill="#515a60">Project imagery coming soon</text><text x="88" y="615" font-family="Arial,sans-serif" font-size="14" letter-spacing="2" fill="#454b51">SELECTED DESIGN WORK</text><path d="M1153 597h26v26m-26 0 26-26" fill="none" stroke="#191b20" stroke-width="2"/></svg>`;
  fs.writeFileSync(target, svg);
  return `assets/projects/${project.slug}/${item.key}-placeholder.svg`;
}

function resolveImage(project, item) {
  if (!/^[a-z0-9-]+$/.test(item.key)) throw new Error('Invalid image key.');
  const base = `assets/projects/${project.slug}/${item.key}`;
  const extensions = ['webp','png','jpg','jpeg','avif','svg'];
  const source = extensions.map(ext => `${base}.${ext}`).find(file => fs.existsSync(path.join(output,file)));
  return source ? {source, placeholder:false} : {source:placeholder(project,item),placeholder:true};
}

function imageBlock(project, item, hero=false) {
  const found = resolveImage(project,item);
  const image = `<img src="${escape(found.source)}" alt="${escape(found.placeholder ? item.label+' — image placeholder' : item.alt)}" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
  const content = found.placeholder ? `<div class="image-placeholder">${image}</div>` : `<button class="image-button" data-zoom aria-label="Expand image: ${escape(item.alt)}">${image}</button>`;
  const caption = project.reviewStatus === 'draft' || !found.placeholder ? `<figcaption>${escape(item.caption)}${!found.placeholder ? '<span>Click to expand ↗</span>' : ''}</figcaption>` : '';
  return `<figure class="project-image ${hero ? 'project-image-hero' : ''}">${content}${caption}</figure>`;
}

function page(project, next) {
  const isDraft = project.reviewStatus === 'draft';
  const tags = project.scope.map(item=>`<span class="tag">${escape(item)}</span>`).join('');
  const roleScope = project.scope.map(item=>`<li>${escape(item)}</li>`).join('');
  const steps = project.approach.map((step,i)=>`<li><span class="step-number">0${i+1}</span><div><h3>${escape(step.title)}</h3><p>${escape(step.body)}</p></div></li>`).join('');
  const decisions = project.decisions.map((decision,i)=>`<div class="decision"><small>${isDraft ? 'Working note' : 'Design decision'} ${String(i+1).padStart(2,'0')}</small><h3>${escape(decision.title)}</h3><p>${escape(decision.rationale)}</p><p class="tradeoff"><strong>The trade-off:</strong> ${escape(decision.tradeoff)}</p></div>`).join('');
  const challenges = project.challenges.map(item=>`<article class="challenge-item"><h3>${escape(item.title)}</h3><p>${escape(item.body)}</p></article>`).join('');
  const review = isDraft ? `<details class="author-note"><summary>Details to complete before publishing</summary><p>Use your actual project experience to confirm or replace the proposed process below.</p><ul>${project.questions.map(q=>`<li>${escape(q)}</li>`).join('')}</ul></details>` : '';
  const draftNotice = isDraft ? '<div class="draft-notice"><span class="draft-label">Case study draft</span><p>The project scope comes from my work description. The approach, decisions and trade-offs below are proposed copy awaiting confirmation; project images are being added.</p></div>' : '';
  const body = `<main id="main"><div class="wrap"><section class="case-hero"><a class="back" href="index.html#more-work">← More selected work</a><p class="eyebrow">${escape(project.name)} / ${escape(project.category)}</p><h1>${escape(project.title)}</h1><p class="case-intro">${escape(project.summary)}</p><div class="tags">${tags}</div><dl class="case-meta"><div><dt>Project</dt><dd>${escape(project.name)}</dd></div><div><dt>Focus</dt><dd>${escape(project.category)}</dd></div><div><dt>Stage</dt><dd>${escape(project.projectStage)}</dd></div><div><dt>Design file</dt><dd><a class="text-link" href="${escape(project.figmaUrl)}" target="_blank" rel="noopener noreferrer">Open in Figma ↗</a></dd></div></dl></section>${draftNotice}${imageBlock(project,project.images[0],true)}<div class="case-layout"><aside class="case-toc" aria-label="On this page"><p>Inside the project</p><a href="#overview">01 / The problem</a><a href="#role">02 / My role</a><a href="#approach">03 / Approach</a><a href="#decisions">04 / Key decisions</a><a href="#challenges">05 / Challenges</a><a href="#reflection">06 / Reflection</a></aside><article class="case-content"><section id="overview"><p class="eyebrow section-kicker">01 / Context & problem</p><h2>The question behind the design.</h2><p>${escape(project.context)}</p><div class="design-question"><small>Design question</small><p>${escape(project.challenge)}</p></div></section><section id="role"><p class="eyebrow section-kicker">02 / Contribution</p><h2>My role & scope.</h2><p class="role-statement">${escape(project.role)}</p><ul class="deliverables">${roleScope}</ul></section><section id="approach"><p class="eyebrow section-kicker">03 / Approach</p><h2>${isDraft ? 'How I’d work through it.' : 'How I worked through it.'}</h2><ol class="approach-steps">${steps}</ol>${imageBlock(project,project.images[1])}</section><section id="decisions"><p class="eyebrow section-kicker">04 / Decisions & rationale</p><h2>${isDraft ? 'A few things I’d want to verify.' : 'A few decisions that shaped the work.'}</h2>${decisions}${imageBlock(project,project.images[2])}</section><section id="challenges"><p class="eyebrow section-kicker">05 / Challenges & limitations</p><h2>${isDraft ? 'What still needs to be checked.' : 'What made the work difficult.'}</h2><div class="challenge-list">${challenges}</div></section><section id="reflection"><p class="eyebrow section-kicker">06 / Reflection</p><h2>What I took from it.</h2><div class="learning"><p>${escape(project.reflection)}</p></div><h3>What I would evaluate next</h3><p>${escape(project.validation)}</p><p class="evidence-note">No measured business or usability outcome is claimed in this case study.</p>${review}<div class="actions"><a class="button secondary" href="${escape(project.figmaUrl)}" target="_blank" rel="noopener noreferrer">Explore the design file ↗</a></div></section></article></div><a class="next-project" href="${escape(next.slug)}.html"><div><p class="eyebrow">Next project</p><h3>${escape(next.name)}</h3></div><span class="arrow" aria-hidden="true">↗</span></a></div>${contact}</main>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(project.name)} — Tatheer Ul Hassan</title><meta name="description" content="${escape(project.summary)}"><meta property="og:title" content="${escape(project.name)} — Tatheer Ul Hassan"><meta property="og:description" content="${escape(project.summary)}"><meta property="og:type" content="website"><meta name="theme-color" content="#191b20">${isDraft ? '<meta name="robots" content="noindex,follow">' : ''}<link rel="icon" type="image/svg+xml" href="favicon.svg"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="layout.css"><link rel="stylesheet" href="case-studies.css"><script src="app.js" defer></script></head><body><a class="skip-link" href="#main">Skip to content</a>${header}${body}${footer}<dialog class="image-dialog" id="image-viewer" aria-label="Expanded project image"><button class="dialog-close" data-close>Close ×</button><img alt=""></dialog></body></html>`;
  return metadata(html, project.slug+'.html', resolveImage(project,project.images[0]).source);
}

const extraWork = [{slug:'lillup',name:'Lillup',category:'Learning platform · Research & user flows',reviewStatus:'ready'},...projects];
const rows = extraWork.map((p,i)=>`<a class="work-row" href="${escape(p.slug)}.html"><span class="index">${String(i+1).padStart(2,'0')}</span><h3>${escape(p.name)}</h3><div class="description">${escape(p.category)}<span>${p.reviewStatus === 'draft' ? 'Read project · Draft' : 'Read project'}</span></div><span class="arrow" aria-hidden="true">↗</span></a>`).join('');

const templates = fs.readdirSync(path.join(root,'templates')).filter(name=>name.endsWith('.html.template'));
for (const template of templates) {
  const filename = template.replace(/\.template$/, '');
  let html = fs.readFileSync(path.join(root,'templates',template),'utf8');
  if (filename === 'index.html') {
    html = html.replace(/<div class="work-list">[\s\S]*?<\/div><p class="gallery-note">[\s\S]*?<\/p>/, `<div class="work-list">${rows}</div><p class="gallery-note">Each project has its own story, with design files available inside.</p>`);
    html = html.replace('Websites, apps and product explorations. Browse the design files for a closer look.','Websites, apps and product explorations. Explore the role, approach and decisions behind each project.');
    html = html.replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(settings.description)}">`);
  }
  fs.writeFileSync(path.join(output,filename), metadata(html,filename));
}
projects.forEach((project,i)=>fs.writeFileSync(path.join(output,project.slug+'.html'),page(project,projects[i+1] || {slug:'veritas',name:'Veritas / GP Flow'})));

// Publish only the finished website; keep editable templates and notes private.
fs.rmSync(deployment, {recursive:true, force:true});
fs.mkdirSync(deployment, {recursive:true});
fs.cpSync(path.join(root,'static'), deployment, {recursive:true});
fs.cpSync(path.join(root,'assets'), path.join(deployment,'assets'), {recursive:true});
for (const filename of [...templates.map(name=>name.replace(/\.template$/, '')), ...projects.map(p=>p.slug+'.html')]) {
  fs.copyFileSync(path.join(root,filename), path.join(deployment,filename));
}

console.log(`Built ${templates.length+projects.length} pages. ${projects.filter(p=>p.reviewStatus==='draft').length} new case studies are marked as drafts.`);
console.log('Open index.html to view the website. Vercel publishes dist/.');
console.log('Images: add cover, approach and decisions files to assets/projects/<project-slug>/; rebuild to use them.');
