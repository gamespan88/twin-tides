// game.js — TWIN TIDES game state, screens and HUD. One 1280x800 canvas draws everything:
// header, status row (big FOUND counter, timer, score, strikes, buttons), the two panels,
// the scene-select menu, pause and win overlays. Panels come from paint.js offscreens.

import { SCENES, SW, SH, diffsFor } from './scenes.js';
import { renderPanels } from './paint.js';
import { drawLoupe } from './loupe.js';
import { sfx, setMuted, isMuted } from './audio.js';

export const W = 1280, H = 800;
export const PANEL_Y = 118;
export const PANEL_X = [16, 664];

const SAVE_KEY = 'twinTidesSaveV1';

export const G = {
  screen: 'menu', // menu | play | won
  paused: false,
  sceneIdx: 0,
  scene: SCENES[0],
  diffs: [],
  panels: null,
  found: new Set(),
  strikes: 0,
  score: 0,
  sceneScore: 0,
  hints: 3,
  time: 0,
  loupeOn: false,
  pointer: { x: -999, y: -999, side: -1, sx: 0, sy: 0, down: false, rdown: false },
  reticle: { side: 1, x: 300, y: 300, show: false },
  pulse: null, // {diff, until}
  flash: null, // {x,y,side,until} canvas coords
  pop: null, // {diff, t0}
  frozen: false, // staging: freeze the clock
  buttons: [],
  progress: loadProgress(),
  winInfo: null,
  msg: '',
};

function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (p && p.scenes) return p;
  } catch { /* fresh */ }
  return { scenes: {}, total: 0 };
}
export function saveProgress() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.progress)); } catch { /* private mode */ }
}

const previewCache = new Map();
export function previewFor(i) {
  if (!previewCache.has(i)) previewCache.set(i, renderPanels(SCENES[i], diffsFor(SCENES[i])).a);
  return previewCache.get(i);
}

export function startScene(i) {
  G.sceneIdx = i;
  G.scene = SCENES[i];
  G.diffs = diffsFor(G.scene);
  G.panels = renderPanels(G.scene, G.diffs);
  G.found = new Set();
  G.strikes = 0;
  G.sceneScore = 0;
  G.hints = 3;
  G.time = 0;
  G.paused = false;
  G.screen = 'play';
  G.winInfo = null;
  G.pulse = null; G.flash = null; G.pop = null;
  G.reticle = { side: 1, x: 300, y: 300, show: false };
}

export function toMenu() { G.screen = 'menu'; G.paused = false; }

export function starsFor(time, strikes) {
  if (time <= 150 && strikes <= 1) return 3;
  if (time <= 280 && strikes <= 4) return 2;
  return 1;
}

function completeScene() {
  const bonus = Math.max(0, 600 - Math.floor(G.time) * 3);
  G.sceneScore += bonus;
  G.score += G.sceneScore;
  const stars = starsFor(G.time, G.strikes);
  const prev = G.progress.scenes[G.sceneIdx];
  G.progress.scenes[G.sceneIdx] = {
    done: true,
    best: prev && prev.best ? Math.min(prev.best, Math.floor(G.time)) : Math.floor(G.time),
    stars: Math.max(stars, prev ? prev.stars || 0 : 0),
  };
  G.progress.total = Math.max(G.progress.total || 0, G.score);
  saveProgress();
  G.winInfo = { time: Math.floor(G.time), bonus, stars, sceneScore: G.sceneScore };
  G.screen = 'won';
  sfx.win();
}

// Mark a guess at scene coords on a side. Returns 'found' | 'miss' | 'already' | null.
export function markAt(side, sx, sy, now) {
  if (G.screen !== 'play' || G.paused) return null;
  for (const d of G.diffs) {
    if (G.found.has(d.id)) continue;
    if (Math.hypot(d.x - sx, d.y - sy) <= d.r) {
      G.found.add(d.id);
      G.sceneScore += 100;
      G.pop = { diff: d, t0: now };
      sfx.found();
      if (G.found.size >= G.diffs.length) completeScene();
      return 'found';
    }
  }
  G.strikes += 1;
  G.sceneScore = Math.max(0, G.sceneScore - 25);
  G.time += 5; // time penalty
  G.flash = { x: PANEL_X[side] + sx, y: PANEL_Y + sy, until: now + 450 };
  sfx.error();
  return 'miss';
}

export function useHint(now) {
  if (G.screen !== 'play' || G.paused || G.hints <= 0) return;
  const left = G.diffs.filter((d) => !G.found.has(d.id));
  if (!left.length) return;
  G.hints -= 1;
  G.pulse = { diff: left[0], until: now + 1600 };
  sfx.hint();
}

export function fmtTime(t) {
  const s = Math.floor(t);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// ------------------------------------------------------------------ drawing
function txt(ctx, str, x, y, size, color, align = 'left', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px system-ui, "Segoe UI", sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function button(ctx, id, x, y, w, h, label, opts = {}) {
  G.buttons.push({ id, x, y, w, h });
  ctx.fillStyle = opts.bg || '#22314f';
  rr(ctx, x, y, w, h, 9); ctx.fill();
  ctx.strokeStyle = opts.hot ? '#ffd23f' : 'rgba(255,255,255,0.25)';
  ctx.lineWidth = opts.hot ? 2.4 : 1.2; ctx.stroke();
  txt(ctx, label, x + w / 2, y + h / 2 + 1, opts.size || 16, opts.fg || '#eaf2ff', 'center', 800);
}

function drawHeader(ctx) {
  ctx.fillStyle = '#101c33'; ctx.fillRect(0, 0, W, 58);
  ctx.strokeStyle = '#3ec1d3'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for (const dy of [0, 7]) {
    ctx.beginPath();
    for (let x = 0; x <= 34; x += 2) ctx.lineTo(22 + x, 26 + dy + Math.sin(x / 5.4) * 3.4);
    ctx.stroke();
  }
  txt(ctx, 'TWIN TIDES', 66, 30, 27, '#ffffff', 'left', 900);
  txt(ctx, 'spot the difference', 250, 31, 14, '#8fd8e8', 'left', 600);
  const done = Object.values(G.progress.scenes).filter((s) => s.done).length;
  const total = G.score + (G.screen === 'play' ? G.sceneScore : 0);
  txt(ctx, 'SCENES ' + done + '/6', 1010, 30, 16, '#ffd23f', 'right', 800);
  txt(ctx, 'TOTAL ' + total, 1252, 30, 16, '#ffffff', 'right', 800);
}

function drawStatus(ctx, now) {
  ctx.fillStyle = '#16263f'; ctx.fillRect(0, 58, W, 52);
  const left = G.diffs.length - G.found.size;
  txt(ctx, G.scene.name.toUpperCase(), 16, 84, 17, '#8fd8e8', 'left', 800);
  txt(ctx, 'FOUND ' + G.found.size + '/' + G.diffs.length + ' · ' + left + ' TO FIND', 300, 84, 25, '#ffffff', 'left', 900);
  txt(ctx, '⏱ ' + fmtTime(G.time), 668, 84, 19, '#ffd23f', 'left', 800);
  txt(ctx, 'SCORE ' + G.sceneScore, 790, 84, 17, '#eaf2ff', 'left', 800);
  txt(ctx, '✕'.repeat(Math.min(5, G.strikes)) || '—', 916, 84, 16, G.strikes ? '#ff5964' : '#5b7290', 'left', 900);
  button(ctx, 'hint', 968, 66, 86, 36, 'HINT ' + G.hints, { hot: G.hints > 0 });
  button(ctx, 'loupe', 1062, 66, 86, 36, G.loupeOn ? '🔍 ON' : '🔍 LOUPE', { hot: G.loupeOn, size: 14 });
  button(ctx, 'pause', 1156, 66, 52, 36, G.paused ? '▶' : '❚❚', { size: 14 });
  button(ctx, 'mute', 1216, 66, 48, 36, isMuted() ? '🔇' : '🔊', { size: 14 });
}

function drawPanels(ctx, now) {
  for (let side = 0; side < 2; side++) {
    const x = PANEL_X[side];
    ctx.fillStyle = '#0b1526'; rr(ctx, x - 4, PANEL_Y - 4, SW + 8, SH + 8, 10); ctx.fill();
    ctx.drawImage(side ? G.panels.b : G.panels.a, x, PANEL_Y);
    // panel label chip inside the top-left corner
    ctx.fillStyle = 'rgba(8,16,30,0.78)'; rr(ctx, x + 10, PANEL_Y + 10, side ? 218 : 142, 26, 13); ctx.fill();
    txt(ctx, side ? 'RIGHT — SPOT THE CHANGES' : 'LEFT — ORIGINAL', x + (side ? 119 : 81), PANEL_Y + 24, 12.5, '#ffd23f', 'center', 800);
    // found rings on both panels
    for (const d of G.diffs) {
      if (!G.found.has(d.id)) continue;
      const cx = x + d.x, cy = PANEL_Y + d.y;
      let rad = d.r * 0.62;
      if (G.pop && G.pop.diff.id === d.id) rad *= 1 + 0.25 * Math.max(0, 1 - (now - G.pop.t0) / 260);
      ctx.strokeStyle = '#2ee66b'; ctx.lineWidth = 4.4;
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, rad + 3.4, 0, Math.PI * 2); ctx.stroke();
    }
    // hint pulse
    if (G.pulse && now < G.pulse.until) {
      const d = G.pulse.diff, k = (now % 400) / 400;
      const cx = x + d.x, cy = PANEL_Y + d.y;
      ctx.strokeStyle = 'rgba(255,210,63,' + (1 - k) + ')'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, d.r * (0.5 + k * 0.8), 0, Math.PI * 2); ctx.stroke();
    }
  }
  if (G.flash && now < G.flash.until) {
    const { x, y } = G.flash;
    ctx.strokeStyle = '#ff3348'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 13, y - 13); ctx.lineTo(x + 13, y + 13);
    ctx.moveTo(x + 13, y - 13); ctx.lineTo(x - 13, y + 13);
    ctx.stroke();
  }
  // keyboard reticle
  if (G.reticle.show && G.screen === 'play' && !G.paused) {
    const cx = PANEL_X[G.reticle.side] + G.reticle.x, cy = PANEL_Y + G.reticle.y;
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy); ctx.lineTo(cx - 9, cy); ctx.moveTo(cx + 9, cy); ctx.lineTo(cx + 24, cy);
    ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy - 9); ctx.moveTo(cx, cy + 9); ctx.lineTo(cx, cy + 24);
    ctx.stroke();
  }
  txt(ctx, 'Click a difference on either picture · H hint · M magnifier · arrows + Enter play by keyboard', W / 2, 770, 14.5, '#7d93b2', 'center', 600);
}

function drawMenu(ctx) {
  txt(ctx, 'CHOOSE A SCENE — 6 SCENES · 54 DIFFERENCES', W / 2, 92, 21, '#ffffff', 'center', 900);
  const cw = 400, ch = 262, gx = 20, gy = 18, x0 = 20, y0 = 116;
  SCENES.forEach((sc, i) => {
    const x = x0 + (i % 3) * (cw + gx), y = y0 + Math.floor(i / 3) * (ch + gy);
    G.buttons.push({ id: 'scene' + i, x, y, w: cw, h: ch });
    ctx.fillStyle = '#16263f'; rr(ctx, x, y, cw, ch, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.4; ctx.stroke();
    const pv = previewFor(i);
    ctx.save(); rr(ctx, x + 10, y + 10, cw - 20, 158, 8); ctx.clip();
    ctx.drawImage(pv, 0, sc.pvY || 30, SW, 250, x + 10, y + 10, cw - 20, 158);
    ctx.restore();
    const pr = G.progress.scenes[i];
    txt(ctx, (i + 1) + '. ' + sc.name, x + 16, y + 190, 20, '#ffffff', 'left', 900);
    txt(ctx, sc.sub, x + 16, y + 214, 13.5, '#8fd8e8', 'left', 600);
    txt(ctx, '9 differences', x + 16, y + 240, 14, '#ffd23f', 'left', 800);
    if (pr && pr.done) {
      txt(ctx, '★'.repeat(pr.stars) + '  BEST ' + fmtTime(pr.best), x + cw - 16, y + 240, 14.5, '#2ee66b', 'right', 800);
      ctx.fillStyle = '#2ee66b'; rr(ctx, x + cw - 92, y + 16, 76, 26, 13); ctx.fill();
      txt(ctx, 'DONE ✓', x + cw - 54, y + 30, 13.5, '#0b1526', 'center', 900);
    } else {
      txt(ctx, 'press ' + (i + 1), x + cw - 16, y + 240, 13.5, '#7d93b2', 'right', 700);
    }
  });
  txt(ctx, 'Find all 9 differences in each scene · hints, magnifier and keyboard play included', W / 2, 764, 14.5, '#7d93b2', 'center', 600);
}

function drawOverlay(ctx, title, lines, btns) {
  ctx.fillStyle = 'rgba(5,10,20,0.72)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#16263f'; rr(ctx, W / 2 - 300, 218, 600, 330, 16); ctx.fill();
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.stroke();
  txt(ctx, title, W / 2, 268, 32, '#ffffff', 'center', 900);
  lines.forEach((ln, i) => txt(ctx, ln, W / 2, 316 + i * 34, 19, '#cfe3ff', 'center', 700));
  btns.forEach((b, i) => button(ctx, b.id, W / 2 - 250 + i * 170, 462, 156, 48, b.label, { hot: i === 0, size: 15 }));
}

export function draw(ctx, now) {
  G.buttons = [];
  ctx.fillStyle = '#0d1930'; ctx.fillRect(0, 0, W, H);
  drawHeader(ctx);
  if (G.screen === 'menu') { drawMenu(ctx); return; }
  drawStatus(ctx, now);
  drawPanels(ctx, now);
  // loupe
  const p = G.pointer;
  const loupeActive = (G.loupeOn || p.rdown) && p.side >= 0 && G.screen === 'play' && !G.paused;
  if (loupeActive) drawLoupe(ctx, p.side ? G.panels.b : G.panels.a, G.found, G.diffs, p.x, p.y, p.sx, p.sy);
  if (G.paused) {
    drawOverlay(ctx, 'PAUSED', [G.scene.name + ' — ' + G.found.size + '/9 found', 'The clock is stopped.'], [
      { id: 'resume', label: 'RESUME' }, { id: 'restart', label: 'RESTART' }, { id: 'menu', label: 'SCENES' },
    ]);
  } else if (G.screen === 'won' && G.winInfo) {
    const wi = G.winInfo;
    drawOverlay(ctx, 'SCENE COMPLETE!', [
      '★'.repeat(wi.stars) + '☆'.repeat(3 - wi.stars),
      'Time ' + fmtTime(wi.time) + ' · Strikes ' + G.strikes + ' · Time bonus +' + wi.bonus,
      'Scene score ' + wi.sceneScore + ' · Total ' + G.score,
    ], [
      { id: 'next', label: G.sceneIdx < 5 ? 'NEXT SCENE' : 'SCENES' },
      { id: 'replay', label: 'REPLAY' },
      { id: 'menu', label: 'SCENES' },
    ]);
  }
}

// ------------------------------------------------------------------ clicks
export function handleButton(id, now) {
  switch (id) {
    case 'hint': useHint(now); break;
    case 'loupe': G.loupeOn = !G.loupeOn; sfx.tick(); break;
    case 'pause': if (G.screen === 'play') { G.paused = true; sfx.tick(); } break;
    case 'resume': G.paused = false; sfx.tick(); break;
    case 'restart': startScene(G.sceneIdx); sfx.select(); break;
    case 'replay': startScene(G.sceneIdx); sfx.select(); break;
    case 'menu': toMenu(); sfx.select(); break;
    case 'mute': setMuted(!isMuted()); break;
    case 'next': if (G.sceneIdx < 5) startScene(G.sceneIdx + 1); else toMenu(); sfx.select(); break;
    default:
      if (id.startsWith('scene')) { startScene(Number(id.slice(5))); sfx.select(); }
  }
}

export function panelAt(x, y) {
  if (y < PANEL_Y || y > PANEL_Y + SH) return null;
  for (let side = 0; side < 2; side++) {
    if (x >= PANEL_X[side] && x <= PANEL_X[side] + SW) return { side, sx: x - PANEL_X[side], sy: y - PANEL_Y };
  }
  return null;
}
