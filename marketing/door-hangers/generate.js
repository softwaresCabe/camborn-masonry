// Cambron Masonry door hanger generator
//
// Builds a 4.25" x 11" door hanger (front + back) with 0.125" bleed and renders:
//   output/door-hanger-print.pdf          2-page print file, vector QR codes, with bleed
//   output/door-hanger-front-300dpi.png   front, with bleed (1350 x 3375 px)
//   output/door-hanger-back-300dpi.png    back,  with bleed (1350 x 3375 px)
//   output/door-hanger-proof.png          both sides trimmed, side by side, with die line
//
// Usage (from this folder):  npm install && node generate.js
// Requires Playwright + Chromium (preinstalled in Claude Code cloud sessions;
// elsewhere: npm i -D playwright && npx playwright install chromium).

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { chromium } = require('playwright');

// ── Content you may want to edit ────────────────────────────────────────────
const BIZ = {
  name: 'Cambron Masonry',
  phoneDisplay: '442-260-5727',
  phoneTel: 'tel:+14422605727',
  // Front QR → guided estimate form. Short UTM tag keeps the code easy to scan and lets you
  // spot door-hanger visits in analytics.
  estimateUrl: 'https://cambron-masonry.com/contact.html?utm_source=door-hanger',
  area: 'Desert Hot Springs & surrounding areas',
  hours: ['Mon – Sat: 7am – 6pm', 'Sun: By appointment'],
  instagram: '@cambron_masonry',
  // The humor bits. Front: handwritten sticky note over the photo. Back: aside next to Instagram.
  joke: "Great at concrete.<br>Terrible at social media.<br><em>So... here's a flyer.</em>",
  instagramAside: "(I'm trying, okay? Give us a follow.)",
  services: ['Concrete Flatwork', 'Paver Installation', 'Stamped Concrete', 'Decorative Overlays', 'Retaining Walls', 'Repair & Restoration'],
};

// ── Print geometry (inches) ─────────────────────────────────────────────────
const TRIM_W = 4.25, TRIM_H = 11, BLEED = 0.125;
const W = TRIM_W + BLEED * 2, H = TRIM_H + BLEED * 2;
const HOLE = { cx: W / 2, cy: BLEED + 1.0, r: 0.625 };   // 1.25" hole, centered 1" below trim top
const DPI = 300;

const here = __dirname;
const outDir = path.join(here, 'output');
const site = path.join(here, '..', '..');
const dataUri = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;

const fontFaces = [400, 600, 700, 800, 900].map((w) =>
  `@font-face{font-family:Inter;font-weight:${w};src:url(${dataUri(path.join(here, 'assets', `inter-latin-${w}-normal.woff2`), 'font/woff2')}) format('woff2')}`
).join('') +
  `@font-face{font-family:Caveat;font-weight:700;src:url(${dataUri(path.join(here, 'assets', 'caveat-latin-700-normal.woff2'), 'font/woff2')}) format('woff2')}`;
const logo  = dataUri(path.join(here, 'assets', 'logo-badge.jpg'), 'image/jpeg');
const photo = (n) => dataUri(path.join(site, 'images', 'portfolio', `photo-${n}.png`), 'image/png');

async function qrSvg(text) {
  // Level Q survives smudges/scuffs on a door; quiet zone is handled by the white card around it.
  return QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'Q', margin: 0, color: { dark: '#0f1628', light: '#ffffff' } });
}

const css = `
${fontFaces}
@page { size: ${W}in ${H}in; margin: 0; }
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}in;height:${H}in}
body{font-family:Inter,sans-serif;color:#0f1628;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.side{position:relative;width:${W}in;height:${H}in;overflow:hidden;background:#f4f2ee;page-break-after:always}
.side:last-child{page-break-after:auto}
/* content stays 0.25in inside the trim (0.375in from the bleed edge) */
.safe{position:absolute;left:.375in;right:.375in}
.top{position:absolute;left:0;right:0;top:0;background:#1d1f2c;color:#fff}
.top::after{content:"";position:absolute;left:0;right:0;bottom:0;height:.06in;background:linear-gradient(90deg,#2a3f7a 0 60%,#b4bbd4 60%)}
.hole-note{position:absolute;top:${HOLE.cy + HOLE.r + 0.12}in;left:0;right:0;text-align:center;font-size:8.5pt;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#b4bbd4}
.logo{display:block;margin:0 auto;mix-blend-mode:lighten}
.eyebrow{font-size:7.5pt;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#2a3f7a}
h1{font-weight:900;letter-spacing:-.02em;line-height:1.02}
.photo{width:100%;object-fit:cover;border-radius:.09in;display:block}
.qr-card{background:#fff;border-radius:.14in;box-shadow:0 .02in .08in rgba(15,22,40,.18);display:flex;align-items:center;gap:.16in;padding:.16in}
.qr{flex:0 0 auto;background:#fff;padding:.08in;border:2px solid #0f1628;border-radius:.08in}
.qr svg{display:block;width:100%;height:100%}
.qr-copy h2{font-size:15pt;font-weight:900;line-height:1.05;letter-spacing:-.01em}
.qr-copy p{font-size:8.5pt;color:#444;margin-top:.05in;line-height:1.35}
.scan-tag{display:inline-block;margin-bottom:.06in;background:#2a3f7a;color:#fff;font-size:7pt;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:.03in .08in;border-radius:.04in}
.sticky{position:absolute;width:2.05in;padding:.12in .14in .1in;background:#fff6b8;color:#1d1f2c;font-family:Caveat,cursive;font-weight:700;font-size:15.5pt;line-height:1.02;transform:rotate(-4deg);box-shadow:0 .04in .1in rgba(0,0,0,.3);z-index:2}
.sticky::before{content:"";position:absolute;top:-.09in;left:50%;width:.7in;height:.18in;margin-left:-.35in;background:rgba(180,187,212,.85);transform:rotate(3deg)}
.sticky em{font-style:normal;color:#2a3f7a}
.services{display:grid;grid-template-columns:1fr 1fr;gap:.05in .12in;font-size:9pt;font-weight:600}
.services li{list-style:none;display:flex;gap:.06in;align-items:center}
.services li::before{content:"";flex:0 0 .11in;height:.11in;border-radius:50%;background:#2a3f7a;box-shadow:inset 0 0 0 .025in #b4bbd4}
.phone-bar{position:absolute;left:0;right:0;bottom:0;background:#2a3f7a;color:#fff;text-align:center}
.phone-bar small{display:block;font-size:7.5pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#cfd4e6}
.phone-bar strong{display:block;font-size:24pt;font-weight:900;letter-spacing:.01em}
`;

function front(qr) {
  return `
  <section class="side">
    <div class="top" style="height:4.15in">
      <div class="hole-note">Hi neighbor!</div>
      <img class="logo" src="${logo}" style="width:2.7in;margin-top:2.0in">
    </div>
    <div class="safe" style="top:4.4in">
      <p class="eyebrow">We're working in your neighborhood</p>
      <h1 style="font-size:24pt;margin:.05in 0 .08in">Masonry &amp; Concrete<br>Built to Last</h1>
      <p style="font-size:9pt;color:#444;line-height:1.4">Driveways, patios, pavers and walls built to handle the desert heat — by a local Desert Hot Springs crew.</p>
    </div>
    <div class="safe" style="top:5.75in"><img class="photo" src="${photo(1)}" style="height:1.55in;object-position:50% 12%"></div>
    <div class="sticky" style="top:6.4in;right:.42in">${BIZ.joke}</div>
    <div class="safe" style="top:7.48in"><ul class="services">${BIZ.services.map((s) => `<li>${s.replace('&', '&amp;')}</li>`).join('')}</ul></div>
    <div class="safe" style="top:8.32in">
      <div class="qr-card">
        <div class="qr" style="width:1.3in;height:1.3in">${qr}</div>
        <div class="qr-copy">
          <span class="scan-tag">Scan me</span>
          <h2>Get your FREE estimate</h2>
          <p>Point your phone camera here to tell us about your project — takes about a minute.</p>
        </div>
      </div>
    </div>
    <div class="phone-bar" style="height:1.0in;padding-top:.2in"><small>Call or text</small><strong>${BIZ.phoneDisplay}</strong></div>
  </section>`;
}

function back(qr) {
  return `
  <section class="side">
    <div class="top" style="height:3.0in">
      <div class="hole-note">Sorry we missed you</div>
      <p style="position:absolute;left:.375in;right:.375in;top:2.08in;text-align:center;font-size:16pt;font-weight:900;line-height:1.1">Call or text for a<br>free estimate</p>
    </div>
    <div class="safe" style="top:3.25in;text-align:center">
      <div class="qr-card" style="flex-direction:column;gap:.1in;padding:.2in .2in .18in">
        <span class="scan-tag" style="margin:0">Scan to call</span>
        <div class="qr" style="width:1.85in;height:1.85in">${qr}</div>
        <p style="font-size:8.5pt;color:#444">Opens your phone's dialer with our number</p>
        <p style="font-size:22pt;font-weight:900;letter-spacing:.01em;color:#2a3f7a;line-height:1">${BIZ.phoneDisplay}</p>
      </div>
    </div>
    <div class="safe" style="top:6.8in">
      <p class="eyebrow" style="margin-bottom:.06in">Notes from our visit</p>
      <div style="border-top:1px solid #9aa0b5;height:.3in"></div>
      <div style="border-top:1px solid #9aa0b5;height:.3in"></div>
      <div style="border-top:1px solid #9aa0b5"></div>
    </div>
    <div class="safe" style="top:7.72in">
      <p class="eyebrow" style="margin-bottom:.06in">Recent work</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.06in">
        <img class="photo" src="${photo(2)}" style="height:1.15in">
        <img class="photo" src="${photo(3)}" style="height:1.15in">
        <img class="photo" src="${photo(8)}" style="height:1.15in;object-position:50% 30%">
      </div>
    </div>
    <div class="phone-bar" style="height:1.9in;padding:.2in .375in 0;text-align:left;background:#1d1f2c">
      <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:.14in;font-size:8.5pt;line-height:1.45;color:#dfe2ee">
        <div><small style="text-align:left">Service area</small>${BIZ.area}</div>
        <div><small style="text-align:left">Hours</small>${BIZ.hours.join('<br>')}</div>
      </div>
      <p style="margin-top:.14in;font-size:8.5pt;color:#dfe2ee"><small style="display:inline;text-align:left">Instagram&nbsp;</small> <b style="color:#fff">${BIZ.instagram}</b></p>
      <p style="margin-top:.01in;font-family:Caveat,cursive;font-weight:700;font-size:13pt;line-height:1.1;color:#fff6b8;transform:rotate(-1.5deg);transform-origin:left">${BIZ.instagramAside}</p>
      <p style="margin-top:.04in;font-size:8.5pt;color:#dfe2ee"><small style="display:inline;text-align:left">Web&nbsp;</small> <b style="color:#fff">cambron-masonry.com</b></p>
    </div>
  </section>`;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const [qrEstimate, qrCall] = await Promise.all([qrSvg(BIZ.estimateUrl), qrSvg(BIZ.phoneTel)]);
  const sides = { front: front(qrEstimate), back: back(qrCall) };
  const doc = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;

  // Keep the HTML source next to the outputs for easy tweaking/previewing
  fs.writeFileSync(path.join(outDir, 'door-hanger.html'), doc(sides.front + sides.back));

  const browser = await chromium.launch();
  const pxW = Math.round(W * 96), pxH = Math.round(H * 96);

  // 1) Print PDF (both sides, vector QR + text)
  const pdfPage = await browser.newPage();
  await pdfPage.setContent(doc(sides.front + sides.back), { waitUntil: 'load' });
  await pdfPage.evaluate(() => document.fonts.ready);
  await pdfPage.pdf({ path: path.join(outDir, 'door-hanger-print.pdf'), width: `${W}in`, height: `${H}in`, printBackground: true });

  // 2) 300 DPI PNGs with bleed
  const png = await browser.newPage({ viewport: { width: pxW, height: pxH }, deviceScaleFactor: DPI / 96 });
  for (const [name, html] of Object.entries(sides)) {
    await png.setContent(doc(html), { waitUntil: 'load' });
    await png.evaluate(() => document.fonts.ready);
    await png.screenshot({ path: path.join(outDir, `door-hanger-${name}-300dpi.png`) });
  }

  // 3) Proof sheet: trimmed sides with hole + slit die line, for viewing/approval
  const b = BLEED * 96, tw = TRIM_W * 96, th = TRIM_H * 96;
  const hx = HOLE.cx * 96 - b, hy = HOLE.cy * 96 - b, hr = HOLE.r * 96;
  const die = `<svg width="${tw}" height="${th}" style="position:absolute;inset:0;pointer-events:none">
      <circle cx="${hx}" cy="${hy}" r="${hr}" fill="#d9d9d9" stroke="#e6007e" stroke-width="1.2" stroke-dasharray="5 3"/>
      <line x1="${hx}" y1="0" x2="${hx}" y2="${hy - hr}" stroke="#e6007e" stroke-width="1.2" stroke-dasharray="5 3"/>
      <rect x="0.5" y="0.5" width="${tw - 1}" height="${th - 1}" fill="none" stroke="#bbb"/></svg>`;
  const panel = (label, html) => `
    <figure style="margin:0">
      <figcaption style="font:700 13px Inter;letter-spacing:.14em;text-transform:uppercase;color:#555;margin-bottom:10px">${label}</figcaption>
      <div style="position:relative;width:${tw}px;height:${th}px;overflow:hidden;border-radius:4px;box-shadow:0 10px 30px rgba(0,0,0,.25)">
        <div style="position:absolute;left:${-b}px;top:${-b}px">${html}</div>${die}
      </div>
    </figure>`;
  const proof = doc(`<div style="width:auto;height:auto;display:flex;gap:56px;padding:44px 56px 36px;background:#d9d9d9">
      ${panel('Front', sides.front)}${panel('Back', sides.back)}</div>
      <p style="background:#d9d9d9;padding:0 56px 36px;font:500 12px Inter;color:#555">4.25" × 11" trimmed · 0.125" bleed in print files · magenta dashed line = die cut (not printed)</p>`)
    .replace('html,body{width:' + W + 'in;height:' + H + 'in}', 'html,body{width:auto;height:auto;background:#d9d9d9}');
  const pp = await browser.newPage({ viewport: { width: Math.round(tw * 2 + 56 * 3), height: 800 }, deviceScaleFactor: 2 });
  await pp.setContent(proof, { waitUntil: 'load' });
  await pp.evaluate(() => document.fonts.ready);
  await pp.screenshot({ path: path.join(outDir, 'door-hanger-proof.png'), fullPage: true });

  await browser.close();
  console.log('Wrote:', fs.readdirSync(outDir).join(', '));
})();
