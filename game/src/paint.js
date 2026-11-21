// paint.js — TWIN TIDES scene painter. Draws a scene's background bands and every element
// by kind onto any 2D context. Panels are rendered once into offscreen canvases (left =
// original, right = mutated) so the main loop, the loupe and the menu previews all reuse them.

import { SW, SH, mutated } from './scenes.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function paintBackground(ctx, scene) {
  const p = scene.pal;
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, p.skyTop);
  sky.addColorStop(1, p.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SW, 300);

  if (scene.bg === 'market' || scene.bg === 'festival') {
    // night street / festival ground fills most of the frame; a band of water at the bottom for festival
    ctx.fillStyle = p.ground;
    ctx.fillRect(0, 236, SW, SH - 236);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = 300; y < SH; y += 46) ctx.fillRect(0, y, SW, 3);
    if (scene.bg === 'festival') {
      ctx.fillStyle = p.sea;
      ctx.fillRect(0, 300, SW, 150);
      ctx.fillStyle = p.seaDark;
      for (let y = 316; y < 450; y += 22) ctx.fillRect(0, y, SW, 4);
    }
    return;
  }

  // water band
  ctx.fillStyle = p.sea;
  ctx.fillRect(0, 236, SW, 190);
  ctx.fillStyle = p.seaDark;
  for (let y = 252; y < 426; y += 24) {
    ctx.beginPath();
    for (let x = 0; x <= SW; x += 24) ctx.arc(x + ((y / 24) % 2) * 12, y, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.fill();
  }
  // shore / ground band
  ctx.fillStyle = p.ground;
  ctx.fillRect(0, 426, SW, SH - 426);
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  for (let i = 0; i < 26; i++) {
    const x = (i * 173) % SW, y = 440 + ((i * 97) % 170);
    ctx.beginPath(); ctx.ellipse(x, y, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  }
  // pier planks for harbour / village
  if (scene.bg === 'harbour' || scene.bg === 'village') {
    ctx.fillStyle = '#8a6642';
    ctx.fillRect(0, 414, SW, 16);
    ctx.fillStyle = '#6f4f30';
    for (let x = 8; x < SW; x += 34) ctx.fillRect(x, 414, 4, 16);
  }
}

const PAINTERS = {
  sun(ctx, e) {
    const g = ctx.createRadialGradient(e.x, e.y, 4, e.x, e.y, 52 * e.s);
    g.addColorStop(0, e.c2); g.addColorStop(1, 'rgba(255,210,63,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, 52 * e.s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.c; ctx.beginPath(); ctx.arc(e.x, e.y, 26 * e.s, 0, Math.PI * 2); ctx.fill();
  },
  moon(ctx, e) {
    ctx.fillStyle = e.c; ctx.beginPath(); ctx.arc(e.x, e.y, 22 * e.s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.arc(e.x + 16 * e.s, e.y - 6 * e.s, 18 * e.s, 0, Math.PI * 2); ctx.fill();
  },
  cloud(ctx, e) {
    ctx.fillStyle = e.c;
    for (const [dx, dy, r] of [[-26, 4, 16], [0, -6, 22], [26, 4, 16], [0, 8, 19]]) {
      ctx.beginPath(); ctx.arc(e.x + dx * e.s, e.y + dy * e.s, r * e.s, 0, Math.PI * 2); ctx.fill();
    }
  },
  star(ctx, e) {
    ctx.fillStyle = e.c;
    const r = 5 * e.s;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, rad = i % 2 ? r * 0.4 : r;
      ctx[i ? 'lineTo' : 'moveTo'](e.x + Math.cos(a) * rad, e.y + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
  },
  bird(ctx, e) {
    ctx.strokeStyle = e.c; ctx.lineWidth = 2.4 * e.s; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(e.x - 8 * e.s, e.y, 8 * e.s, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(e.x + 8 * e.s, e.y, 8 * e.s, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  },
  boat(ctx, e) {
    const d = e.flip ? -1 : 1, s = e.s;
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(d * s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0, 16, 36, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.c; ctx.beginPath();
    ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.lineTo(24, 14); ctx.lineTo(-24, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5b3a1e'; ctx.fillRect(-2, -34, 4, 34);
    ctx.fillStyle = e.c2; ctx.beginPath();
    ctx.moveTo(3, -32); ctx.lineTo(3, -4); ctx.lineTo(26, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath();
    ctx.moveTo(-3, -26); ctx.lineTo(-3, -4); ctx.lineTo(-20, -4); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  buoy(ctx, e) {
    ctx.fillStyle = e.c; rr(ctx, e.x - 8 * e.s, e.y - 6 * e.s, 16 * e.s, 16 * e.s, 4); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(e.x - 8 * e.s, e.y - 1 * e.s, 16 * e.s, 4 * e.s);
    ctx.fillStyle = '#33404f'; ctx.fillRect(e.x - 2 * e.s, e.y - 13 * e.s, 4 * e.s, 7 * e.s);
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(e.x, e.y - 15 * e.s, 3.4 * e.s, 0, Math.PI * 2); ctx.fill();
  },
  fish(ctx, e) {
    const d = e.flip ? -1 : 1;
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(d * e.s, e.s);
    ctx.fillStyle = e.c; ctx.beginPath(); ctx.ellipse(0, 0, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-22, -7); ctx.lineTo(-22, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(8, -1.5, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#14213d'; ctx.beginPath(); ctx.arc(8.6, -1.5, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  house(ctx, e) {
    const s = e.s, w = 62 * s, h = 48 * s;
    ctx.fillStyle = e.c; rr(ctx, e.x - w / 2, e.y - h, w, h, 3); ctx.fill();
    ctx.fillStyle = e.c2; ctx.beginPath();
    ctx.moveTo(e.x - w / 2 - 7 * s, e.y - h); ctx.lineTo(e.x, e.y - h - 24 * s); ctx.lineTo(e.x + w / 2 + 7 * s, e.y - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5b3a1e'; rr(ctx, e.x - 8 * s, e.y - 22 * s, 16 * s, 22 * s, 3); ctx.fill();
    ctx.fillStyle = '#ffe66d';
    for (let i = 0; i < e.n; i++) {
      const wx = e.x - w / 2 + 10 * s + i * ((w - 20 * s) / Math.max(1, e.n - 1 || 1));
      ctx.fillRect(wx - 5 * s, e.y - h + 12 * s, 10 * s, 10 * s);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(e.x - w / 2, e.y - 3 * s, w, 3 * s);
  },
  lighthouse(ctx, e) {
    const s = e.s;
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(s, s);
    // beam
    ctx.fillStyle = 'rgba(255,230,109,0.20)';
    ctx.beginPath(); ctx.moveTo(0, -118); ctx.lineTo(-120, -96); ctx.lineTo(-120, -66); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -118); ctx.lineTo(120, -96); ctx.lineTo(120, -66); ctx.closePath(); ctx.fill();
    // tower with stripes (n = stripe count, changed by 'detail')
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? e.c2 : e.c;
      const wTop = 15 - i * 1.1, wBot = 15 - (i + 1) * 1.1 + 2.2;
      ctx.beginPath();
      ctx.moveTo(-wBot - 2, -i * 20); ctx.lineTo(wBot + 2, -i * 20); ctx.lineTo(wTop, -(i + 1) * 20); ctx.lineTo(-wTop, -(i + 1) * 20);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#33404f'; rr(ctx, -13, -128, 26, 12, 3); ctx.fill();
    ctx.fillStyle = '#ffe66d'; ctx.beginPath(); ctx.arc(0, -110, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#33404f'; ctx.beginPath(); ctx.moveTo(-16, -128); ctx.lineTo(0, -140); ctx.lineTo(16, -128); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  tree(ctx, e) {
    ctx.fillStyle = '#6f4f30'; ctx.fillRect(e.x - 4 * e.s, e.y - 20 * e.s, 8 * e.s, 20 * e.s);
    ctx.fillStyle = e.c;
    for (const [dx, dy, r] of [[0, -38, 20], [-15, -26, 14], [15, -26, 14]]) {
      ctx.beginPath(); ctx.arc(e.x + dx * e.s, e.y + dy * e.s, r * e.s, 0, Math.PI * 2); ctx.fill();
    }
  },
  palm(ctx, e) {
    ctx.strokeStyle = '#8a6642'; ctx.lineWidth = 6 * e.s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.quadraticCurveTo(e.x + 6 * e.s, e.y - 26 * e.s, e.x + 14 * e.s, e.y - 46 * e.s); ctx.stroke();
    ctx.strokeStyle = e.c; ctx.lineWidth = 4.4 * e.s;
    for (const a of [-0.4, 0.35, 1.1, 1.9, 2.6]) {
      ctx.beginPath(); ctx.moveTo(e.x + 14 * e.s, e.y - 46 * e.s);
      ctx.quadraticCurveTo(e.x + 14 * e.s + Math.cos(a) * 18 * e.s, e.y - 46 * e.s + Math.sin(a) * 10 * e.s - 6, e.x + 14 * e.s + Math.cos(a) * 30 * e.s, e.y - 46 * e.s + Math.sin(a) * 16 * e.s + 6);
      ctx.stroke();
    }
    ctx.fillStyle = '#7f5539';
    ctx.beginPath(); ctx.arc(e.x + 10 * e.s, e.y - 42 * e.s, 4.6 * e.s, 0, Math.PI * 2); ctx.arc(e.x + 18 * e.s, e.y - 41 * e.s, 4.2 * e.s, 0, Math.PI * 2); ctx.fill();
  },
  person(ctx, e) {
    const s = e.s;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, 10 * s, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#33404f'; ctx.fillRect(e.x - 7 * s, e.y - 14 * s, 5.4 * s, 14 * s); ctx.fillRect(e.x + 1.6 * s, e.y - 14 * s, 5.4 * s, 14 * s);
    ctx.fillStyle = e.c; rr(ctx, e.x - 8 * s, e.y - 32 * s, 16 * s, 19 * s, 5); ctx.fill();
    ctx.fillStyle = '#f2c094'; ctx.beginPath(); ctx.arc(e.x, e.y - 39 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.c2; ctx.beginPath(); ctx.arc(e.x, e.y - 42 * s, 7.6 * s, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(e.x - 8 * s, e.y - 43 * s, 16 * s, 2.6 * s);
  },
  stall(ctx, e) {
    const s = e.s, w = 74 * s;
    ctx.fillStyle = '#6f4f30'; ctx.fillRect(e.x - w / 2, e.y - 34 * s, 5 * s, 34 * s); ctx.fillRect(e.x + w / 2 - 5 * s, e.y - 34 * s, 5 * s, 34 * s);
    ctx.fillStyle = '#8a6642'; rr(ctx, e.x - w / 2, e.y - 34 * s, w, 12 * s, 3); ctx.fill();
    // awning stripes in c / white, n stripes of goods below
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : e.c; ctx.fillRect(e.x - w / 2 + i * (w / 6), e.y - 52 * s, w / 6, 13 * s); }
    ctx.fillStyle = e.c; ctx.beginPath(); ctx.moveTo(e.x - w / 2 - 4, e.y - 52 * s); ctx.lineTo(e.x, e.y - 64 * s); ctx.lineTo(e.x + w / 2 + 4, e.y - 52 * s); ctx.closePath(); ctx.fill();
    for (let i = 0; i < e.n; i++) {
      ctx.fillStyle = ['#ff9f1c', '#e63946', '#2a9d8f', '#ffd23f'][i % 4];
      ctx.beginPath(); ctx.arc(e.x - w / 4 + i * (w / 2 / Math.max(1, e.n - 1 || 1)), e.y - 27 * s, 5.4 * s, 0, Math.PI * 2); ctx.fill();
    }
  },
  lantern(ctx, e) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(e.x, e.y - 26 * e.s); ctx.lineTo(e.x, e.y - 12 * e.s); ctx.stroke();
    const g = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, 26 * e.s);
    g.addColorStop(0, e.c2); g.addColorStop(1, 'rgba(255,210,63,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, 26 * e.s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.c; ctx.beginPath(); ctx.ellipse(e.x, e.y, 11 * e.s, 14 * e.s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d3a'; ctx.fillRect(e.x - 6 * e.s, e.y - 16 * e.s, 12 * e.s, 3 * e.s); ctx.fillRect(e.x - 6 * e.s, e.y + 13 * e.s, 12 * e.s, 3 * e.s);
    ctx.strokeStyle = e.c2; ctx.beginPath(); ctx.moveTo(e.x, e.y + 16 * e.s); ctx.lineTo(e.x, e.y + 24 * e.s); ctx.stroke();
  },
  umbrella(ctx, e) {
    ctx.strokeStyle = '#8a6642'; ctx.lineWidth = 3.4 * e.s;
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + 4 * e.s, e.y - 34 * e.s); ctx.stroke();
    ctx.fillStyle = e.c; ctx.beginPath(); ctx.arc(e.x + 4 * e.s, e.y - 34 * e.s, 30 * e.s, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = e.c2; ctx.beginPath();
    ctx.moveTo(e.x + 4 * e.s, e.y - 64 * e.s); ctx.lineTo(e.x - 12 * e.s, e.y - 34 * e.s); ctx.lineTo(e.x + 20 * e.s, e.y - 34 * e.s); ctx.closePath(); ctx.fill();
  },
  ball(ctx, e) {
    ctx.fillStyle = e.c; ctx.beginPath(); ctx.arc(e.x, e.y, 13 * e.s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.c2; ctx.beginPath(); ctx.arc(e.x, e.y, 13 * e.s, -0.5, 0.9); ctx.lineTo(e.x, e.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(e.x - 4 * e.s, e.y - 5 * e.s, 3.4 * e.s, 0, Math.PI * 2); ctx.fill();
  },
  crab(ctx, e) {
    ctx.fillStyle = e.c;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, 11 * e.s, 7 * e.s, 0, 0, Math.PI * 2); ctx.fill();
    for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.arc(e.x + d * 14 * e.s, e.y - 5 * e.s, 4.6 * e.s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = e.c; ctx.lineWidth = 2 * e.s;
      ctx.beginPath(); ctx.moveTo(e.x + d * 8 * e.s, e.y + 3 * e.s); ctx.lineTo(e.x + d * 16 * e.s, e.y + 8 * e.s); ctx.stroke();
    }
    ctx.fillStyle = '#14213d';
    ctx.beginPath(); ctx.arc(e.x - 4 * e.s, e.y - 6 * e.s, 1.7, 0, Math.PI * 2); ctx.arc(e.x + 4 * e.s, e.y - 6 * e.s, 1.7, 0, Math.PI * 2); ctx.fill();
  },
  sign(ctx, e) {
    ctx.fillStyle = '#6f4f30'; ctx.fillRect(e.x - 3, e.y - 6, 6, 26);
    ctx.fillStyle = e.c; rr(ctx, e.x - 26 * e.s, e.y - 30 * e.s, 52 * e.s, 24 * e.s, 5); ctx.fill();
    ctx.fillStyle = e.c2; ctx.beginPath();
    ctx.moveTo(e.x + 12 * e.s, e.y - 18 * e.s); ctx.lineTo(e.x + 2 * e.s, e.y - 24 * e.s); ctx.lineTo(e.x + 2 * e.s, e.y - 12 * e.s); ctx.closePath(); ctx.fill();
    ctx.fillRect(e.x - 18 * e.s, e.y - 20.5 * e.s, 18 * e.s, 5 * e.s);
  },
  flag(ctx, e) {
    ctx.fillStyle = '#d9d9d9'; ctx.fillRect(e.x - 2, e.y - 44 * e.s, 4, 44 * e.s);
    ctx.fillStyle = e.c; ctx.beginPath();
    const d = e.flip ? -1 : 1;
    ctx.moveTo(e.x + 2, e.y - 44 * e.s); ctx.lineTo(e.x + 2 + d * 26 * e.s, e.y - 36 * e.s); ctx.lineTo(e.x + 2, e.y - 28 * e.s); ctx.closePath(); ctx.fill();
  },
  rock(ctx, e) {
    ctx.fillStyle = e.c; ctx.beginPath();
    ctx.moveTo(e.x - 22 * e.s, e.y); ctx.lineTo(e.x - 10 * e.s, e.y - 16 * e.s); ctx.lineTo(e.x + 6 * e.s, e.y - 20 * e.s); ctx.lineTo(e.x + 22 * e.s, e.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath();
    ctx.moveTo(e.x - 10 * e.s, e.y - 16 * e.s); ctx.lineTo(e.x + 6 * e.s, e.y - 20 * e.s); ctx.lineTo(e.x + 2 * e.s, e.y); ctx.lineTo(e.x - 8 * e.s, e.y); ctx.closePath(); ctx.fill();
  },
  kite(ctx, e) {
    const d = e.flip ? -1 : 1;
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(d * e.s, e.s);
    ctx.fillStyle = e.c; ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(14, 0); ctx.lineTo(0, 18); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = e.c2; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 18); ctx.quadraticCurveTo(6, 34, -2, 48); ctx.stroke();
    ctx.restore();
  },
};

export function paintElement(ctx, e) {
  const fn = PAINTERS[e.kind];
  if (fn) fn(ctx, e);
}

// Render both panels for a scene into fresh offscreen canvases.
export function renderPanels(scene, diffs) {
  const mk = () => { const c = document.createElement('canvas'); c.width = SW; c.height = SH; return c; };
  const a = mk(), b = mk();
  const ca = a.getContext('2d'), cb = b.getContext('2d');
  paintBackground(ca, scene);
  paintBackground(cb, scene);
  const byId = new Map(diffs.map((d) => [d.obj, d]));
  for (const e of scene.elements) paintElement(ca, e);
  for (const e of scene.elements) {
    const d = byId.get(e.id);
    if (!d) { paintElement(cb, e); continue; }
    const m = mutated(e, d);
    if (m) paintElement(cb, m);
  }
  return { a, b };
}
