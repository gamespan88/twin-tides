// input.js — TWIN TIDES pointer + keyboard input. Mouse/touch mark differences on either
// panel; the right button (or M / toolbar) drives the magnifier loupe; arrow keys move a
// reticle for full keyboard play (Enter/Space marks, H hint, P pause, 1-6 scene select).

import { G, panelAt, markAt, useHint, handleButton, startScene, toMenu } from './game.js';
import { SW, SH } from './scenes.js';
import { sfx } from './audio.js';

export function bindInput(canvas, nowFn) {
  const toGame = (ev) => {
    const r = canvas.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * (canvas.width / r.width), y: (ev.clientY - r.top) * (canvas.height / r.height) };
  };

  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  canvas.addEventListener('pointermove', (ev) => {
    const { x, y } = toGame(ev);
    G.pointer.x = x; G.pointer.y = y;
    const p = panelAt(x, y);
    G.pointer.side = p ? p.side : -1;
    if (p) { G.pointer.sx = p.sx; G.pointer.sy = p.sy; }
  });

  canvas.addEventListener('pointerdown', (ev) => {
    const { x, y } = toGame(ev);
    if (ev.button === 2) { G.pointer.rdown = true; return; }
    if (ev.button !== 0) return;
    const now = nowFn();
    // buttons first (topmost registered last)
    for (let i = G.buttons.length - 1; i >= 0; i--) {
      const b = G.buttons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { handleButton(b.id, now); return; }
    }
    const p = panelAt(x, y);
    if (p && G.screen === 'play' && !G.paused) markAt(p.side, p.sx, p.sy, now);
  });

  window.addEventListener('pointerup', (ev) => { if (ev.button === 2) G.pointer.rdown = false; });
  canvas.addEventListener('pointerleave', () => { G.pointer.side = -1; });

  window.addEventListener('keydown', (ev) => {
    const now = nowFn();
    const k = ev.key;
    if (G.screen === 'menu') {
      const n = Number(k);
      if (n >= 1 && n <= 6) { startScene(n - 1); sfx.select(); }
      return;
    }
    if (G.screen === 'won') {
      if (k === 'Enter' || k === ' ') { ev.preventDefault(); handleButton('next', now); }
      if (k === 'Escape') toMenu();
      return;
    }
    // playing
    const R = G.reticle;
    const step = ev.shiftKey ? 26 : 10;
    switch (k) {
      case 'ArrowLeft': R.x = Math.max(8, R.x - step); R.show = true; ev.preventDefault(); break;
      case 'ArrowRight': R.x = Math.min(SW - 8, R.x + step); R.show = true; ev.preventDefault(); break;
      case 'ArrowUp': R.y = Math.max(8, R.y - step); R.show = true; ev.preventDefault(); break;
      case 'ArrowDown': R.y = Math.min(SH - 8, R.y + step); R.show = true; ev.preventDefault(); break;
      case 'Tab': R.side = R.side ? 0 : 1; R.show = true; ev.preventDefault(); break;
      case 'Enter': case ' ':
        ev.preventDefault();
        if (!G.paused) markAt(R.side, R.x, R.y, now);
        break;
      case 'h': case 'H': useHint(now); break;
      case 'm': case 'M': G.loupeOn = !G.loupeOn; sfx.tick(); break;
      case 'p': case 'P': G.paused = !G.paused; sfx.tick(); break;
      case 'Escape': toMenu(); break;
    }
  });
}
