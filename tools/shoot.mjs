import { chromium } from 'playwright';
import fs from 'node:fs';
const base = 'https://yusufhancerfilm.github.io';
const xml = await (await fetch(base + '/sitemap.xml')).text();
const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
fs.mkdirSync('screenshots', { recursive: true });
const browser = await chromium.launch();
const settle = async (page) => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
    document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-visible'));
    document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager');
    await document.fonts.ready;
  });
  await page.addStyleTag({ content: '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}[data-reveal]{opacity:1!important;transform:none!important}' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);
};
const shots = [
  { tag: 'masaustu', opts: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, list: paths },
  { tag: 'mobil', opts: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, list: paths.slice(0, 6).concat(['/isler/kisa-film/zil/']) },
];
let i = 0;
for (const s of shots) {
  const ctx = await browser.newContext({ ...s.opts, reducedMotion: 'reduce', locale: 'tr-TR' });
  let n = 0;
  for (const p of s.list) {
    const page = await ctx.newPage();
    await page.goto(base + p, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
    await settle(page);
    n++;
    const name = `screenshots/${s.tag}-${String(n).padStart(2, '0')}-${(p.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'anasayfa')}.jpg`;
    await page.screenshot({ path: name, fullPage: true, type: 'jpeg', quality: 88 });
    console.log(name, await page.title());
    await page.close();
  }
  await ctx.close();
}
await browser.close();
