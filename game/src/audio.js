// audio.js — TWIN TIDES WebAudio synth: tiny oscillator blips, no audio files.

let ac = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function ctx() {
  if (muted) return null;
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(freq, t0, dur, type = 'sine', vol = 0.16, slide = 0) {
  const a = ctx(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  const t = a.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

export const sfx = {
  tick() { tone(660, 0, 0.05, 'triangle', 0.07); },
  found() { tone(784, 0, 0.12, 'sine', 0.16); tone(1175, 0.07, 0.18, 'sine', 0.16); },
  error() { tone(160, 0, 0.16, 'sawtooth', 0.10, -60); },
  hint() { tone(523, 0, 0.1, 'triangle', 0.12); tone(659, 0.09, 0.1, 'triangle', 0.12); tone(784, 0.18, 0.16, 'triangle', 0.12); },
  win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.22, 'triangle', 0.15)); },
  select() { tone(440, 0, 0.07, 'triangle', 0.09); tone(587, 0.06, 0.09, 'triangle', 0.09); },
};
