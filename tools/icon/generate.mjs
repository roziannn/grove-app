// Membuat ikon aplikasi dari pohon 3D (three.js) dan menyimpannya ke ../../assets.
//
//   cd tools/icon
//   npm install
//   npx playwright install chromium     # sekali saja, kalau belum punya Chromium
//   npm run generate
//
// Opsional: CHROMIUM_PATH=/path/ke/chromium untuk memakai Chromium yang sudah ada.
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(here, '../../assets');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };

const server = http
  .createServer((req, res) => {
    const file = path.join(here, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(here) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(0);
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  // SwiftShader = WebGL lewat CPU, jadi jalan di mesin tanpa GPU
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
await page.goto(`http://localhost:${port}/scene.html`);
await page.waitForFunction(() => window.__ready === true);
const files = await page.evaluate(() => window.buildAssets());

for (const [name, dataUrl] of Object.entries(files)) {
  let png = Buffer.from(dataUrl.split(',')[1], 'base64');
  if (name === 'icon.png') {
    // Ikon utama harus tanpa kanal alpha (syarat iOS). Tangkapan layar halaman yang opak
    // menghasilkan PNG RGB, sedangkan canvas.toDataURL selalu RGBA.
    await page.setContent(`<body style="margin:0;background:#fff"><img src="${dataUrl}" width="1024" height="1024" style="display:block"></body>`);
    await page.waitForFunction(() => document.images[0]?.complete);
    png = await page.screenshot({ clip: { x: 0, y: 0, width: 1024, height: 1024 }, type: 'png' });
  }
  fs.writeFileSync(path.join(assets, name), png);
  console.log('ditulis', name);
}
await browser.close();
server.close();
