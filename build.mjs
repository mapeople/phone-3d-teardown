#!/usr/bin/env node
/* build.mjs — 把 src/ 拼成单文件 dist/index.html（file:// 直开可用） */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, 'src');
const DIST = join(__dir, 'dist');
const VENDOR = join(__dir, 'vendor');

const read = (p) => readFileSync(p, 'utf8');

if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true });

const three = read(join(VENDOR, 'three.min.js'));
const css = read(join(SRC, 'styles.css'));
const lib = read(join(SRC, 'lib.js'));
const tex = read(join(SRC, 'textures.js'));
const model = read(join(SRC, 'model.js'));
const app = read(join(SRC, 'app.js'));

let html = read(join(SRC, 'index.html'));

// 内联 CSS
html = html.replace(
  '<link rel="stylesheet" href="styles.css">',
  '<style>\n' + css + '\n</style>'
);

// 内联 JS（顺序：three → lib → textures → model → app）
const bundle = [three, lib, tex, model, app].join('\n;\n');

const scriptsBlock = [
  '<script src="vendor/three.min.js"></script>',
  '<script src="lib.js"></script>',
  '<script src="textures.js"></script>',
  '<script src="model.js"></script>',
  '<script src="app.js"></script>',
];

// 逐行移除脚本标签与注释，插入内联 bundle
const lines = html.split('\n');
const kept = [];
let inserted = false;
for (const line of lines) {
  const t = line.trim();
  if (scriptsBlock.includes(t)) {
    if (!inserted) {
      kept.push('<script>\n' + bundle + '\n</script>');
      inserted = true;
    }
    continue;
  }
  if (t.startsWith('<!-- ====') && (t.includes('依赖') || t.includes('应用'))) continue;
  kept.push(line);
}
if (!inserted) {
  console.error('✗ 未找到脚本占位块');
  process.exit(1);
}
html = kept.join('\n');

if (html.includes('src="lib.js"')) {
  console.error('✗ 内联失败：仍存在外部脚本引用');
  process.exit(1);
}

const out = join(DIST, 'index.html');
writeFileSync(out, html, 'utf8');

// GitHub Pages 站点根目录（docs/）同步一份，保证在线版与构建产物一致
const PAGES = join(__dir, 'docs');
if (!existsSync(PAGES)) mkdirSync(PAGES, { recursive: true });
writeFileSync(join(PAGES, 'index.html'), html, 'utf8');

// 同时输出一个"外链版"便于调试
const dbg = join(DIST, 'debug.html');
writeFileSync(dbg, read(join(SRC, 'index.html')), 'utf8');
writeFileSync(join(DIST, 'styles.css'), css, 'utf8');
for (const f of ['lib.js', 'textures.js', 'model.js', 'app.js']) {
  writeFileSync(join(DIST, f), read(join(SRC, f)), 'utf8');
}

const kb = (statSync(out).size / 1024).toFixed(1);
console.log(`✓ dist/index.html  ${kb} KB  (单文件，离线可用)`);
console.log(`✓ dist/debug.html  (外链调试版)`);
