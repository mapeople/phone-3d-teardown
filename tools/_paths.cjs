/* 统一的浏览器/依赖路径解析：优先环境变量，其次项目 node_modules，最后 DSH 内置。
   换机器 / 换人跑时只需改这里（或设 PW_MODULE / PW_CHROME 环境变量）。 */
const fs = require('fs');
const path = require('path');

const CANDIDATES = [
  process.env.PW_MODULE,
  path.resolve(__dirname, '../node_modules/playwright'),
  '/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/playwright',
  'playwright',
].filter(Boolean);

let pw = null;
for (const c of CANDIDATES) {
  try { pw = require(c); break; } catch (e) { /* next */ }
}
if (!pw) throw new Error('找不到 playwright，请 npm i -D playwright 或设置 PW_MODULE');

const CHROME_CANDIDATES = [
  process.env.PW_CHROME,
  pw.chromium.executablePath && (() => { try { return pw.chromium.executablePath(); } catch (e) { return null; } })(),
  '/root/.cache/ms-playwright/chromium-1148/chrome-linux/chrome',
].filter((p) => p && fs.existsSync(p));

module.exports = {
  chromium: pw.chromium,
  chromePath: CHROME_CANDIDATES[0] || undefined,
};
