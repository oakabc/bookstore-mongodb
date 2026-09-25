// สร้าง docs/index.html — หน้าเว็บรวมโค้ดทุกไฟล์ของโปรเจกต์ พร้อมปุ่มคัดลอก
// ใช้กับ GitHub Pages (Settings → Pages → Deploy from branch → main /docs)
// รัน: npm run docs   (รันใหม่ทุกครั้งที่แก้โค้ด แล้ว commit docs/index.html ไปด้วย)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const pkg = JSON.parse(read('package.json'));
const REPO = String(pkg.repository?.url ?? '').replace(/\.git$/, '');
const BRANCH = 'main';
const repoIsPlaceholder = !REPO || REPO.includes('<');

// ---------------------------------------------------------------- เนื้อหา
const PARTS = [
  {
    id: 'part1', title: 'Part 1 · MongoDB Basic (Node.js driver)', lead: 'เชื่อมต่อด้วย db.js แล้วรันทีละไฟล์: node 01-connect.js, node 02-insert.js, …',
    files: [
      ['db.js', 'เชื่อมต่อ MongoDB — ทุกไฟล์ใน Part 1 ใช้ร่วมกัน'],
      ['01-connect.js', 'ทดสอบการเชื่อมต่อ (ping)'],
      ['02-insert.js', 'Create: insertOne / insertMany'],
      ['03-find.js', 'Read: find, filter, projection, sort, findOne'],
      ['04-operators.js', 'Query operators: $gte, $in, $regex, $or'],
      ['05-update.js', 'Update: $inc, $set, $push, updateMany'],
      ['06-delete.js', 'Delete: deleteOne / deleteMany'],
      ['part1-mongosh.js', 'ทางเลือก: คำสั่งเดียวกันแบบ mongosh (สำหรับคนที่ทำ offline)'],
    ],
  },
  {
    id: 'part2', title: 'Part 2–3 · app.js', lead: 'Express + Mongoose ในไฟล์เดียว: Schema, CRUD, สั่งซื้อแบบ transaction และจัดการ error',
    files: [['app.js', 'ทั้งแอปอยู่ในไฟล์นี้ (ส่วนที่ 1–6)']],
  },
  {
    id: 'frontend', title: 'Frontend · public/index.html', lead: 'หน้าเว็บ HTML + fetch() เรียก API ของ app.js — npm run dev แล้วเปิด http://localhost:3000',
    files: [['public/index.html', 'ตารางหนังสือ, สั่งซื้อ (เห็น rollback), เพิ่ม / ลบหนังสือ']],
  },
  {
    id: 'config', title: 'ไฟล์ตั้งค่า', lead: 'ไฟล์ที่ต้องมีในโปรเจกต์ก่อนเริ่ม',
    files: [
      ['package.json', 'dependencies และคำสั่ง npm'],
      ['docker-compose.yml', 'Offline: MongoDB 8.0 แบบ replica set 1 node (รองรับ transaction)'],
    ],
  },
];
const HOMEWORK = [['homework.md', 'hw']];

// ---------------------------------------------------------------- utils
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (p) => 'f-' + p.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
const ghLink = (p) => `${REPO}/blob/${BRANCH}/${p}`;

// ---------------------------------------------------------------- highlighter (เล็ก ๆ ไม่ใช้ library)
const JS_KW = new Set(('import export from const let var async await function return if else throw new try catch finally for of in ' +
  'class extends this typeof instanceof default null undefined true false while break continue').split(' '));

function hlJS(src) {
  let out = '', i = 0;
  const n = src.length;
  // token ที่ยาวหลายบรรทัด (เช่น /** ... */) ห่อ span แยกทีละบรรทัด เพื่อให้แบ่งบรรทัดได้ถูก
  const push = (cls, text) => {
    out += cls ? text.split('\n').map((t) => `<span class="${cls}">${esc(t)}</span>`).join('\n') : esc(text);
  };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { const j = src.indexOf('\n', i); const e = j < 0 ? n : j; push('c', src.slice(i, e)); i = e; continue; }
    if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2); const e = j < 0 ? n : j + 2; push('c', src.slice(i, e)); i = e; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; if (c !== '`' && src[j] === '\n') break; j++; }
      push('s', src.slice(i, j + 1)); i = j + 1; continue;
    }
    if (c === '/' && /[=(,:!&|?{};\[]\s*$/.test(src.slice(Math.max(0, i - 20), i).replace(/\n/g, ' '))) {
      // regex literal
      let j = i + 1, inClass = false;
      while (j < n && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') inClass = true; else if (src[j] === ']') inClass = false;
        else if (src[j] === '/' && !inClass) break;
        j++;
      }
      if (src[j] === '/') { j++; while (/[a-z]/.test(src[j] ?? '')) j++; push('s', src.slice(i, j)); i = j; continue; }
    }
    if (/[0-9]/.test(c) && !/[\w$]/.test(src[i - 1] ?? '')) { let j = i; while (/[0-9._]/.test(src[j] ?? '')) j++; push('n', src.slice(i, j)); i = j; continue; }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (/[\w$]/.test(src[j] ?? '')) j++;
      const w = src.slice(i, j);
      const cls = JS_KW.has(w) ? 'k' : (/^\$/.test(w) ? 'o' : (src[j] === '(' ? 'f' : ''));
      push(cls, w); i = j; continue;
    }
    push('', c); i++;
  }
  return out;
}

function hlHash(src) { // yml / env: # comment
  return src.split('\n').map((line) => {
    const m = line.match(/^(\s*)(#.*)$/);
    if (m) return esc(m[1]) + `<span class="c">${esc(m[2])}</span>`;
    const k = line.match(/^(\s*-?\s*)([\w.-]+)(\s*[:=])(.*)$/);
    if (k) return esc(k[1]) + `<span class="f">${esc(k[2])}</span>` + esc(k[3]) + `<span class="s">${esc(k[4])}</span>`;
    return esc(line);
  }).join('\n');
}

function hlJSON(src) {
  return esc(src).replace(/(&quot;|")((?:[^"\\]|\\.)*?)"(\s*:)?/g, (m, q, body, colon) =>
    colon ? `<span class="f">"${body}"</span>${colon}` : `<span class="s">"${body}"</span>`);
}

function hlHTML(src) { // tag เป็นสีฟ้า · โค้ดใน <script> ใช้ hlJS
  const tags = (t) => esc(t).replace(/&lt;\/?[\w-]+|\/?&gt;/g, (m) => `<span class="k">${m}</span>`);
  return src.split(/(<script>[\s\S]*?<\/script>)/).map((part) =>
    part.startsWith('<script>') ? tags('<script>') + hlJS(part.slice(8, -9)) + tags('</script>') : tags(part)).join('');
}

function highlight(p, src) {
  if (/\.html$/.test(p)) return hlHTML(src);
  if (/\.(m?js)$/.test(p)) return hlJS(src);
  if (/\.json$/.test(p)) return hlJSON(src);
  if (/\.(ya?ml)$|\.env/.test(p)) return hlHash(src);
  return esc(src);
}

function codeBlock(p, src) {
  const lines = highlight(p, src.replace(/\n$/, '')).split('\n');
  // แสดงผลแบบมีสีและเลขบรรทัด ส่วนปุ่มคัดลอกใช้ข้อความดิบใน <textarea class="raw"> เพื่อให้ได้โค้ดตรงตัวอักษร
  return '<pre class="code"><code>' + lines.map((l) => `<span class="ln">${l || ' '}</span>`).join('') + '</code></pre>' +
    `<textarea class="raw" hidden readonly>${esc(src)}</textarea>`;
}

// ---------------------------------------------------------------- markdown (เท่าที่ไฟล์ homework ใช้)
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, href) => {
      const hw = HOMEWORK.find(([f]) => f.endsWith('/' + href));
      return `<a href="${hw ? '#' + hw[1] : esc(href)}">${t}</a>`;
    });
}
function markdown(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  let html = '', i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) { const lv = Math.min(h[1].length + 1, 5); html += `<h${lv}>${inline(h[2])}</h${lv}>`; i++; continue; }
    if (l.startsWith('```')) {
      const body = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++; html += `<pre class="code small"><code>${esc(body.join('\n'))}</code></pre>`; continue;
    }
    if (l.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r, k) => k !== 1);
      html += '<div class="tbl"><table>' + body.map((r, k) =>
        '<tr>' + cells(r).map((c) => (k === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join('') + '</tr>').join('') + '</table></div>';
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''));
      const tag = ordered ? 'ol' : 'ul';
      html += `<${tag}>` + items.map((t) => `<li>${inline(t)}</li>`).join('') + `</${tag}>`;
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#|```|\||\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++]);
    html += `<p>${inline(para.join(' '))}</p>`;
  }
  return html;
}

// ---------------------------------------------------------------- page
const clone = `git clone ${repoIsPlaceholder ? 'https://github.com/<account>/bookstore-mongodb' : REPO}.git`;
const quick = [
  ['Clone โปรเจกต์', `${clone}\ncd bookstore-mongodb\nnpm install`],
  ['ใส่ connection string', '# แก้ const uri ใน db.js และ app.js\nconst uri = \'mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/?appName=Cluster0\';'],
  ['Part 1: ทดสอบด้วย Node.js', 'node 01-connect.js\nnode 02-insert.js\nnode 03-find.js'],
  ['Part 2–3: เปิด API + หน้าเว็บ', 'npm run dev          # เปิด http://localhost:3000 แล้วกด "ใส่ข้อมูลตัวอย่าง"\ncurl -X POST http://localhost:3000/seed   # หรือเรียก API ตรง ๆ'],
];

let nav = '', main = '';
nav += `<a class="nav-top" href="#start">เริ่มต้นใช้งาน</a>`;
main += `<section id="start" class="sec"><h2>เริ่มต้นใช้งาน</h2><div class="steps">` +
  quick.map(([t, c], k) => `<div class="step"><div class="num">${k + 1}</div><div class="step-body"><h3>${t}</h3>` +
    `<div class="file mini"><div class="file-bar"><span class="fname">terminal</span><button class="copy" type="button">คัดลอก</button></div>` +
    `<pre class="code"><code>${hlHash(c)}</code></pre><textarea class="raw" hidden readonly>${esc(c)}</textarea></div></div></div>`).join('') + `</div></section>`;

for (const part of PARTS) {
  nav += `<div class="nav-group"><a class="nav-part" href="#${part.id}">${part.title}</a>` +
    part.files.map(([p]) => `<a class="nav-file" href="#${slug(p)}" data-path="${esc(p)}">${esc(p.split('/').pop())}</a>`).join('') + '</div>';
  main += `<section id="${part.id}" class="sec"><h2>${part.title}</h2><p class="lead">${part.lead}</p>`;
  for (const [p, desc] of part.files) {
    const src = read(p);
    const n = src.replace(/\n$/, '').split('\n').length;
    main += `<article class="file" id="${slug(p)}" data-path="${esc(p)}"><div class="file-bar">` +
      `<span class="fname">${esc(p)}</span><span class="meta">${n} บรรทัด</span><span class="grow"></span>` +
      (repoIsPlaceholder ? '' : `<a class="gh" href="${esc(ghLink(p))}" target="_blank" rel="noopener">GitHub</a>`) +
      `<button class="copy" type="button">คัดลอก</button></div>` +
      `<p class="desc">${esc(desc)}</p>${codeBlock(p, src)}</article>`;
  }
  main += '</section>';
}

nav += `<div class="nav-group"><a class="nav-part" href="#homework">การบ้าน · ระบบแล็บ</a></div>`;
main += `<section id="homework" class="sec"><h2>การบ้าน · ระบบจัดการอุปกรณ์ในห้องแล็บ</h2>` +
  HOMEWORK.map(([p, id]) => `<article class="doc" id="${id}">${markdown(read(p))}</article>`).join('') + '</section>';

const built = new Date().toISOString().slice(0, 10);
const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bookstore MongoDB — โค้ดประกอบการสอน</title>
<meta name="description" content="${esc(pkg.description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
:root {
  --bg: #F6F8F4; --panel: #FCFDFB; --ink: #17261F; --body: #3F5249; --muted: #5E7067; --line: #D7E2DA;
  --acc: #1E7A48; --acc-soft: #E3ECE5; --code-bg: #10201A; --code-ink: #E4EFE8;
  --c: #8FA89B; --s: #F2C572; --k: #8DB8E6; --f: #7FD8A6; --n: #F0A87A; --o: #E6A6D8;
  --sans: 'IBM Plex Sans Thai', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'IBM Plex Sans Thai', monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0F1F1A; --panel: #14271F; --ink: #EEF4EF; --body: #B9CCC0; --muted: #8FA89B; --line: #28423A;
    --acc: #6FD39A; --acc-soft: #17302A; --code-bg: #0A1612; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0F1F1A; --panel: #14271F; --ink: #EEF4EF; --body: #B9CCC0; --muted: #8FA89B; --line: #28423A;
  --acc: #6FD39A; --acc-soft: #17302A; --code-bg: #0A1612; color-scheme: dark;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 16px; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.65 var(--sans); }
a { color: var(--acc); }
.layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: 100vh; }
aside.side { position: sticky; top: 0; height: 100vh; overflow: auto; border-right: 1px solid var(--line); padding: 24px 16px; background: var(--panel); }
.brand { font-weight: 700; font-size: 18px; margin: 0 8px 4px; }
.brand small { display: block; font-weight: 400; font-size: 13px; color: var(--muted); }
.search { width: 100%; margin: 16px 0; padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); font: inherit; font-size: 14px; }
.nav-top, .nav-part { display: block; padding: 6px 8px; font-weight: 600; color: var(--ink); text-decoration: none; border-radius: 6px; font-size: 14px; }
.nav-group { margin-top: 12px; }
.nav-file { display: block; padding: 3px 8px 3px 20px; color: var(--body); text-decoration: none; font: 13px/1.6 var(--mono); border-radius: 6px; }
.nav-file:hover, .nav-part:hover, .nav-top:hover { background: var(--acc-soft); }
.nav-file.hide { display: none; }
main { padding: 40px clamp(16px, 4vw, 56px) 80px; max-width: 1100px; }
.hero { padding: 32px; border-radius: 16px; background: var(--code-bg); color: #EEF4EF; margin-bottom: 40px; }
.hero .eyebrow { color: #6FD39A; font-weight: 600; letter-spacing: .08em; font-size: 13px; text-transform: uppercase; }
.hero h1 { font-size: clamp(28px, 4vw, 40px); line-height: 1.2; margin: 8px 0 8px; }
.hero p { color: #B9CCC0; margin: 0 0 20px; }
.hero .file { margin: 0; border-color: #28423A; }
.hero .file-bar { background: #17302A; color: #B9CCC0; border-color: #28423A; }
.hero .fname { color: #DCE8E0; }
.warn { margin-top: 16px; padding: 10px 14px; border-radius: 8px; background: #3A2E14; color: #F2C572; font-size: 14px; }
.sec { margin-bottom: 56px; }
.sec > h2 { font-size: 26px; margin: 0 0 4px; }
.lead { color: var(--body); margin: 0 0 20px; }
.file { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; margin: 0 0 24px; background: var(--code-bg); }
.file-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 8px 12px; background: var(--panel); border-bottom: 1px solid var(--line); }
.fname { font: 600 14px var(--mono); color: var(--ink); word-break: break-all; }
.meta { font-size: 13px; color: var(--muted); }
.grow { flex: 1; }
.desc { margin: 0; padding: 8px 14px; font-size: 14px; color: var(--body); background: var(--panel); border-bottom: 1px solid var(--line); }
.gh { font-size: 13px; text-decoration: none; padding: 4px 10px; border: 1px solid var(--line); border-radius: 6px; }
.copy { font: 600 13px var(--sans); padding: 5px 12px; border-radius: 6px; border: 1px solid var(--acc); background: var(--acc); color: #FCFDFB; cursor: pointer; }
:root[data-theme="dark"] .copy { color: #0F1F1A; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .copy { color: #0F1F1A; } }
.copy.done { background: transparent; color: var(--acc); }
pre.code { margin: 0; padding: 14px 0; overflow-x: auto; background: var(--code-bg); color: var(--code-ink); font: 13.5px/1.6 var(--mono); tab-size: 2; }
pre.code code { display: block; counter-reset: ln; min-width: max-content; }
pre.code .ln { display: block; padding: 0 18px 0 0; white-space: pre; }
pre.code .ln::before { counter-increment: ln; content: counter(ln); display: inline-block; width: 3.2em; padding-right: 1.2em; text-align: right; color: #4E6A5E; user-select: none; }
.file.mini pre.code .ln::before, pre.code.small .ln::before { content: none; }
.file.mini pre.code, pre.code.small { padding-left: 16px; padding-right: 16px; }
.c { color: var(--c); font-style: italic; } .s { color: var(--s); } .k { color: var(--k); } .f { color: var(--f); } .n { color: var(--n); } .o { color: var(--o); }
.steps { display: grid; gap: 16px; }
.step { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 14px; align-items: start; }
.num { width: 36px; height: 36px; border-radius: 50%; background: var(--acc-soft); color: var(--acc); display: grid; place-items: center; font-weight: 700; }
.step h3 { margin: 4px 0 8px; font-size: 17px; }
.step .file { margin: 0; }
.doc { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 8px 28px 20px; margin-bottom: 24px; }
.doc h2 { font-size: 22px; } .doc h3 { font-size: 18px; margin-top: 24px; }
.doc code { font: 13.5px var(--mono); background: var(--acc-soft); padding: 1px 5px; border-radius: 4px; }
.doc pre code { background: none; padding: 0; }
.doc pre.code { border-radius: 8px; }
.tbl { overflow-x: auto; }
.doc table { border-collapse: collapse; margin: 12px 0; min-width: 100%; font-size: 15px; }
.doc th, .doc td { border: 1px solid var(--line); padding: 6px 12px; text-align: left; vertical-align: top; }
.doc th { background: var(--acc-soft); }
.theme { margin: 16px 8px 0; font: 13px var(--sans); background: none; border: 1px solid var(--line); color: var(--body); border-radius: 6px; padding: 4px 10px; cursor: pointer; }
footer { color: var(--muted); font-size: 13px; }
@media (max-width: 860px) {
  .layout { display: block; }
  aside.side { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--line); }
  .nav-file { display: inline-block; padding-left: 8px; }
  main { padding-top: 24px; }
}
</style>
</head>
<body>
<div class="layout">
<aside class="side">
  <div class="brand">Bookstore MongoDB<small>เรียน MongoDB ใน 3 ชั่วโมง</small></div>
  <input class="search" type="search" placeholder="ค้นหาไฟล์…" aria-label="ค้นหาไฟล์">
  <nav>${nav}</nav>
  <button class="theme" type="button">สลับธีม สว่าง / มืด</button>
</aside>
<main>
  <header class="hero">
    <div class="eyebrow">Full-stack with MongoDB</div>
    <h1>ระบบร้านหนังสือ — โค้ดทุกไฟล์</h1>
    <p>${esc(pkg.description)} · กด “คัดลอก” ที่มุมขวาของแต่ละไฟล์ แล้ววางในโปรเจกต์ของตัวเอง</p>
    <div class="file mini"><div class="file-bar"><span class="fname">clone ทั้งโปรเจกต์</span><span class="grow"></span><button class="copy" type="button">คัดลอก</button></div>
    <pre class="code"><code>${esc(clone)}</code></pre><textarea class="raw" hidden readonly>${esc(clone)}</textarea></div>
    ${repoIsPlaceholder ? '<div class="warn">ยังไม่ได้ตั้งค่า repository: แก้ "repository.url" ใน package.json เป็น URL ของ GitHub จริง แล้วรัน npm run docs ใหม่</div>' : ''}
  </header>
  ${main}
  <footer>สร้างจากโค้ดในโปรเจกต์ด้วย <code>npm run docs</code> · อัปเดต ${built}${repoIsPlaceholder ? '' : ` · <a href="${esc(REPO)}">${esc(REPO.replace('https://', ''))}</a>`}</footer>
</main>
</div>
<script>
(() => {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy');
    if (!btn) return;
    const text = btn.closest('.file').querySelector('textarea.raw').value;
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
    btn.textContent = 'คัดลอกแล้ว'; btn.classList.add('done');
    setTimeout(() => { btn.textContent = 'คัดลอก'; btn.classList.remove('done'); }, 1600);
  });
  const search = document.querySelector('.search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    document.querySelectorAll('.nav-file').forEach((a) => {
      a.classList.toggle('hide', q && !(a.dataset.path || a.textContent).toLowerCase().includes(q));
    });
  });
  const root = document.documentElement;
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch {}
  document.querySelector('.theme').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
  });
})();
</script>
</body>
</html>
`;

mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
writeFileSync(path.join(ROOT, 'docs/index.html'), html);
writeFileSync(path.join(ROOT, 'docs/.nojekyll'), '');
console.log(`docs/index.html (${(html.length / 1024).toFixed(0)} KB, ${PARTS.reduce((s, p) => s + p.files.length, 0)} ไฟล์)`);
