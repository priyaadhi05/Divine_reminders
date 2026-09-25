// node render.js <svg> <out.png> <px>
const { chromium } = require('playwright-core');
const fs = require('fs');
(async () => {
  const [svgPath, out, px] = process.argv.slice(2);
  const size = Number(px);
  const svg = fs.readFileSync(svgPath, 'utf8').replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await p.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await b.close();
})();
