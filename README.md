# Kuali Kilat — Warung Senja

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/hurulsufi12-art/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/hurulsufi12-art/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A fast solo cooking game for the [make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137): run the fictional street-food stall **Warung Senja** through the dinner rush. 6 recipes, 5 stations, 3 shifts, 4 screenshots, 1 cook, 0 network.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server). No network, no build step.

- **WASD / arrow keys** — walk the cook. **Mouse** — click a station to walk there, click a pantry bowl to grab that ingredient.
- **E** — use the nearest station. **X** — clear the plate.
- Loop: **Pantry** (grab) → **Talenan** (chop, press E 4x) → **Wajan / Panci / Panggangan** (cook — don't let it burn!) → **Plating** (build the dish) → **Jendela Saji** (serve before the order timer runs out).
- Serve fast for tips, serve back-to-back for a combo. An expired order costs a heart; 3 lost hearts end the shift.

## Recipes

Nasi Goreng Senja, Soto Kilat, Es Teh Manis, Mie Goreng Senja, Sate Kilat, Gado-Gado Senja — each with its own steps (some need chopping, some need the wok, pot or grill, one needs no cooking at all).

## Files

- `game/index.html` + `game/src/*.js` — the game (canvas 2D, no libraries, no network)
- `main.ts` — Node 22 stdlib-only entrypoint: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — 4 real renders of the game in a browser
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
