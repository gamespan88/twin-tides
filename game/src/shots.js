// shots.js — TWIN TIDES screenshot staging. ?shot=<name> poses a deterministic mid-game
// moment so the kit screenshots are real renders of real play states:
//   cover  — Dawn Harbour, 4 of 9 found, loupe open on the right panel
//   market — Night Market, 3 of 9 found
//   beach  — Coral Beach, 7 of 9 found
//   scenes — scene-select with two scenes completed (progress on the cards)

import { G, startScene, PANEL_X, PANEL_Y } from './game.js';

export function applyStage() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return false;

  G.frozen = true; // clock holds the posed time
  if (shot === 'scenes') {
    G.progress = {
      scenes: {
        0: { done: true, best: 96, stars: 3 },
        1: { done: true, best: 148, stars: 2 },
      },
      total: 2140,
    };
    G.score = 2140;
    G.screen = 'menu';
    return true;
  }

  const poses = {
    cover: { scene: 0, found: 4, time: 47, score: 400, hints: 3, strikes: 0 },
    market: { scene: 2, found: 3, time: 83, score: 275, hints: 2, strikes: 1 },
    beach: { scene: 3, found: 7, time: 121, score: 650, hints: 1, strikes: 2 },
  };
  const pose = poses[shot] || poses.cover;
  startScene(pose.scene);
  G.time = pose.time;
  G.sceneScore = pose.score;
  G.hints = pose.hints;
  G.strikes = pose.strikes;
  for (let i = 0; i < pose.found; i++) G.found.add(G.diffs[i].id);

  if (shot === 'cover') {
    // loupe open over a small, rich unfound difference on the right panel
    const unfound = G.diffs.filter((d, i) => i >= pose.found);
    const target = unfound.find((d) => ['buoy', 'sign', 'lantern', 'house', 'tree'].includes(d.kind)) || unfound[1] || unfound[0];
    G.loupeOn = true;
    G.pointer.side = 1;
    G.pointer.sx = target.x; G.pointer.sy = target.y;
    G.pointer.x = PANEL_X[1] + target.x;
    G.pointer.y = PANEL_Y + target.y;
  }
  return true;
}
