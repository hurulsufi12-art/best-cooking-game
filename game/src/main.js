// main.js — one job: wire input, the game loop and the shot scenes together.
// Keyboard (WASD/arrows + E) and mouse (click a station to walk there, click a
// pantry bowl to grab that ingredient). In ?shot= mode the game renders one
// frozen frame and never starts the loop — that is what screenshots capture.
// No wall-clock calls anywhere in this file.
import { CANVAS_W, CANVAS_H, STATIONS } from './config.js';
import { newGameState, startShift, endShift, movePlayer, nearestStation,
  pickIngredient, placeOnBoard, chop, takeFromBoard, placeOnBurner,
  takeFromBurner, discardBurner, placeOnPlate, clearPlate, servePlate,
  tickShift } from './kitchen.js';
import { buildShotState } from './shots.js';
import { draw } from './render.js';
import { RECIPES } from './recipes.js';
import { ensureAudio, sfxChop, sfxPick, sfxServe, sfxExpire, sfxBurnt } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') || '1', 10);
const seed = Number.isFinite(seedParam) ? seedParam : 1;
const shot = params.get('shot');

// --- shot mode: one frozen render, no loop, no timers ---
if (shot) {
  const state = buildShotState(shot, seed);
  document.title = `shot:${shot}`;
  draw(ctx, state);
} else {
  runGame();
}

function runGame() {
  let s = newGameState(seed);
  const keys = new Set();
  let moveTarget = null;
  let pendingInteract = null;

  const PANTRY_BOWLS = ['nasi', 'mie', 'telur', 'sayur', 'ayam', 'teh', 'es', 'gula'];
  function pantryBowlAt(x, y) {
    const st = STATIONS.pantry;
    const bw = (st.w - 20) / 4;
    for (let i = 0; i < PANTRY_BOWLS.length; i++) {
      const cx = st.x + 14 + (i % 4) * bw + bw / 2;
      const cy = st.y + 16 + Math.floor(i / 4) * 26;
      if (Math.hypot(x - cx, y - cy) < 16) return PANTRY_BOWLS[i];
    }
    return null;
  }

  // Smart pantry pick: first ingredient of the oldest order not yet plated.
  function smartPickIngredient() {
    const order = s.board.orders[0];
    if (!order) return 'nasi';
    const recipe = RECIPES[order.recipeId];
    if (!recipe) return 'nasi';
    for (const c of recipe.components) {
      if (!s.plate.items.includes(c.key) && (!s.player.carrying || s.player.carrying.key !== c.key)) {
        return c.ingredient;
      }
    }
    return recipe.components[0].ingredient;
  }
  function interact(stationId) {
    ensureAudio();
    if (s.phase !== 'play') return;
    if (stationId === 'pantry') {
      const ing = smartPickIngredient();
      const r = pickIngredient(s, ing);
      if (r.ok) sfxPick();
      return;
    }
    if (stationId === 'board') {
      if (s.player.carrying && s.player.carrying.prep === 'mentah') { placeOnBoard(s); sfxPick(); return; }
      if (s.chopping.item && s.chopping.progress < 100) { chop(s); sfxChop(); return; }
      if (s.chopping.item) { takeFromBoard(s); sfxPick(); }
      return;
    }
    if (stationId === 'wok' || stationId === 'pot' || stationId === 'grill') {
      const mode = stationId === 'pot' ? 'rebus' : stationId === 'grill' ? 'panggang' : 'masak';
      const burner = mode === 'rebus' ? s.pot : mode === 'panggang' ? s.grill : s.wok;
      if (s.player.carrying) { placeOnBurner(s, mode); return; }
      if (burner.state === 'done') { takeFromBurner(s, mode); sfxPick(); return; }
      if (burner.state === 'burnt') { discardBurner(s, mode); sfxBurnt(); }
      return;
    }
    if (stationId === 'plating') {
      if (s.player.carrying) placeOnPlate(s);
      return;
    }
    if (stationId === 'serve') {
      const before = s.board.hearts;
      const r = servePlate(s);
      if (r.ok) sfxServe();
      else if (s.board.hearts < before) sfxExpire();
    }
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (CANVAS_W / r.width),
      y: (e.clientY - r.top) * (CANVAS_H / r.height),
    };
  }

  window.addEventListener('keydown', (e) => {
    ensureAudio();
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (s.phase === 'title' && (k === 'enter' || k === ' ')) { startShift(s); return; }
    if (s.phase === 'end' && k === 'r') { s = newGameState(seed); startShift(s); return; }
    if (s.phase !== 'play') return;
    if (k === 'e') {
      const st = nearestStation(s);
      if (st) interact(st.id);
      return;
    }
    if (k === 'x') { clearPlate(s); return; }
    keys.add(k);
    moveTarget = null;
    pendingInteract = null;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  canvas.addEventListener('click', (e) => {
    ensureAudio();
    const p = canvasPos(e);
    if (s.phase === 'title') { startShift(s); return; }
    if (s.phase === 'end') { s = newGameState(seed); startShift(s); return; }
    if (s.phase !== 'play') return;
    const bowl = pantryBowlAt(p.x, p.y);
    if (bowl) { pickIngredient(s, bowl); sfxPick(); return; }
    for (const st of Object.values(STATIONS)) {
      if (p.x >= st.x && p.x <= st.x + st.w && p.y >= st.y && p.y <= st.y + st.h) {
        moveTarget = { x: st.x + st.w / 2, y: st.y + st.h + 60 };
        pendingInteract = st.id;
        return;
      }
    }
    moveTarget = { x: Math.max(60, Math.min(1220, p.x)), y: Math.max(340, Math.min(640, p.y)) };
    pendingInteract = null;
  });

  let last = null;
  function frame(ts) {
    if (last === null) last = ts;
    const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
    last = ts;
    if (s.phase === 'play') {
      let dx = 0;
      let dy = 0;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (dx || dy) {
        movePlayer(s, dx, dy, dt);
      } else if (moveTarget) {
        const ddx = moveTarget.x - s.player.x;
        const ddy = moveTarget.y - s.player.y;
        const dist = Math.hypot(ddx, ddy);
        if (dist < 12) {
          moveTarget = null;
          if (pendingInteract) {
            const st = nearestStation(s);
            if (st && st.id === pendingInteract) interact(st.id);
            pendingInteract = null;
          }
        } else {
          movePlayer(s, ddx, ddy, dt);
        }
      }
      tickShift(s, dt);
    }
    draw(ctx, s);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
