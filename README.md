[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/gamespan88/twin-tides/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/gamespan88/twin-tides/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Twin Tides

An original spot-the-difference game for the make.fun **best-spot-the-difference-game-20261121-0451** ("Make the best spot the difference game") bounty. Every scene, name and picture in Twin Tides is invented for this entry and drawn procedurally on a canvas — no external art, no network, no libraries.

## The game

Two near-identical coastal pictures stand side by side. The right one hides **9 differences** — an object gone, a colour swapped, something bigger, moved, flipped or quietly altered. Click a difference on either picture to ring it on both.

- **6 illustrated scenes, 54 differences in total** — Dawn Harbour, Lighthouse Point, Night Market, Coral Beach, Fishing Village and Lantern Festival, each with its own palette and 40+ hand-placed procedural objects (boats, houses, stalls, lanterns, people, palms, buoys, kites…).
- **One scene graph, two renders** — both panels are drawn from the same deterministic element list, the right panel with exactly the 9 mutations applied, so every difference is fair, findable and spread across the whole picture.
- **Magnifier loupe** — a 2× zoom lens that follows the pointer (toolbar button, **M** key, or hold the right mouse button).
- **Full keyboard play** — arrow keys move the reticle, **Enter/Space** marks, **Tab** switches panel, **H** hint, **P** pause, **1–6** pick a scene.
- **Hints, timer, score, strikes** — 3 hints per scene pulse an unfound difference; wrong clicks cost a strike, points and +5 s on the clock; finishing a scene pays a time bonus and 1–3 stars.
- **Scene-select screen** with per-scene best times, stars and completion, saved in `localStorage`, plus a pause menu and a win overlay with Next Scene.
- **Synthesized sound** (WebAudio, no audio files): found chime, error buzz, hint arpeggio, win jingle — mutable from the toolbar.

## Run it

```sh
node serve.ts            # serves game/ at http://localhost:8080
node main.ts             # builds /output with the dossier for grading
```

Plain static files: open `game/index.html` through the server and play. Screenshots in `screenshots/` are real renders posed by the game's own staging hooks (`game/src/shots.js`).
