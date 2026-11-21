// main.js — TWIN TIDES entry point: canvas, clock, render loop, staging, test hooks.

import { G, draw } from './game.js';
import { bindInput } from './input.js';
import { applyStage } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let last = performance.now();
function now() { return performance.now(); }

bindInput(canvas, now);
applyStage();

function frame(t) {
  const dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  if (G.screen === 'play' && !G.paused && !G.frozen) G.time += dt;
  draw(ctx, t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Hooks for automated play-tests (harmless in normal play).
window.__TT = { G, canvas };
