// kitchen.js — one job: the cook's state machine. Hands, chopping board, three
// burners (wajan/panci/panggangan), plating counter and the serve window, plus
// the shift clock. Pure functions over a plain state object: no DOM, no clock,
// no randomness of its own (the caller owns the rng).
import {
  SHIFT_SECONDS, CHOPS_TO_FINISH, COOK_SECONDS, BURN_SECONDS,
  ORDER_SPAWN_EVERY, PLAYER_SPEED, STATIONS,
} from './config.js';
import { mulberry32 } from './rng.js';
import { recipeById, validatePlate } from './recipes.js';
import { createOrderBoard, spawnOrder, tickOrders, serveOrder } from './orders.js';

export const BURNER_MODES = { wok: 'masak', pot: 'rebus', grill: 'panggang' };

function newBurner(mode) {
  return { mode, item: null, progress: 0, state: 'empty' }; // state: empty|cooking|done|burnt
}

export function newGameState(seed = 1) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    phase: 'title', // title | play | end
    shift: 1,
    shiftTime: SHIFT_SECONDS,
    timeLeft: SHIFT_SECONDS,
    spawnTimer: ORDER_SPAWN_EVERY,
    player: { x: 640, y: 500, carrying: null, face: 1 },
    moveTarget: null,
    board: createOrderBoard(),
    chopping: { item: null, progress: 0 },
    wok: newBurner('masak'),
    pot: newBurner('rebus'),
    grill: newBurner('panggang'),
    plate: { items: [] },
    popup: null, // {text, x, y, ttl} floating feedback, drawn by render.js
    frozen: false, // shot scenes: timers never advance
    endStats: null,
  };
}

export function startShift(s) {
  s.phase = 'play';
  s.timeLeft = SHIFT_SECONDS;
  s.spawnTimer = 2;
  spawnOrder(s.board, s.rng, s.shift);
  spawnOrder(s.board, s.rng, s.shift);
}

function fail(reason) { return { ok: false, reason }; }

// --- hands ---
export function pickIngredient(s, ingredient) {
  if (s.player.carrying) return fail('hands-full');
  s.player.carrying = { ingredient, prep: 'mentah', key: `${ingredient}__mentah` };
  return { ok: true };
}

// --- chopping board ---
export function placeOnBoard(s) {
  const c = s.player.carrying;
  if (!c || c.prep !== 'mentah') return fail('need-raw');
  if (s.chopping.item) return fail('board-busy');
  s.chopping.item = c;
  s.chopping.progress = 0;
  s.player.carrying = null;
  return { ok: true };
}

export function chop(s) {
  if (!s.chopping.item) return fail('board-empty');
  s.chopping.progress += 100 / CHOPS_TO_FINISH;
  if (s.chopping.progress >= 100) {
    s.chopping.progress = 100;
    s.chopping.item.prep = 'cincang';
    s.chopping.item.key = `${s.chopping.item.ingredient}__cincang`;
  }
  return { ok: true, progress: s.chopping.progress };
}

export function takeFromBoard(s) {
  const item = s.chopping.item;
  if (!item || s.chopping.progress < 100) return fail('not-chopped');
  if (s.player.carrying) return fail('hands-full');
  s.player.carrying = item;
  s.chopping.item = null;
  s.chopping.progress = 0;
  return { ok: true };
}

// --- burners ---
function burnerFor(s, mode) {
  return mode === 'rebus' ? s.pot : mode === 'panggang' ? s.grill : s.wok;
}

export function placeOnBurner(s, mode = 'masak') {
  const c = s.player.carrying;
  if (!c) return fail('hands-empty');
  const b = burnerFor(s, mode);
  if (b.item) return fail('burner-busy');
  // Raw or chopped food goes on the burner; plating-only items (teh/es/gula)
  // never need a burner, so cooking them is a mistake the player can feel.
  b.item = c;
  b.progress = 0;
  b.state = 'cooking';
  s.player.carrying = null;
  return { ok: true };
}

// Back-compat name used by the first tests: the wajan is the 'masak' burner.
export function placeOnWok(s) { return placeOnBurner(s, 'masak'); }

export function tickCooking(s, dt) {
  for (const b of [s.wok, s.pot, s.grill]) {
    if (!b.item) continue;
    if (b.state === 'cooking') {
      b.progress += (dt / COOK_SECONDS) * 100;
      if (b.progress >= 100) {
        b.progress = 100;
        b.state = 'done';
        b.item.prep = b.mode;
        b.item.key = `${b.item.ingredient}__${b.mode}`;
        b.burnIn = BURN_SECONDS;
      }
    } else if (b.state === 'done') {
      b.burnIn -= dt;
      if (b.burnIn <= 0) b.state = 'burnt';
    }
  }
}

export function takeFromBurner(s, mode = 'masak') {
  const b = burnerFor(s, mode);
  if (!b.item || b.state !== 'done') return fail(b.state === 'burnt' ? 'burnt' : 'not-ready');
  if (s.player.carrying) return fail('hands-full');
  s.player.carrying = b.item;
  b.item = null;
  b.progress = 0;
  b.state = 'empty';
  return { ok: true };
}

export function takeFromWok(s) { return takeFromBurner(s, 'masak'); }

export function discardBurner(s, mode = 'masak') {
  const b = burnerFor(s, mode);
  b.item = null;
  b.progress = 0;
  b.state = 'empty';
  return { ok: true };
}

export function discardWok(s) { return discardBurner(s, 'masak'); }

// --- plating & serving ---
export function placeOnPlate(s) {
  const c = s.player.carrying;
  if (!c) return fail('hands-empty');
  s.plate.items.push(c.key);
  s.player.carrying = null;
  return { ok: true };
}

export function clearPlate(s) {
  s.plate.items = [];
  return { ok: true };
}

export function servePlate(s) {
  if (s.plate.items.length === 0) return fail('plate-empty');
  const match = s.board.orders.find((o) => validatePlate(o.recipeId, s.plate.items));
  if (!match) return fail('no-match');
  const res = serveOrder(s.board, match.id, match.timeLeft / match.timeLimit);
  if (!res.ok) return fail('serve-failed');
  s.plate.items = [];
  const recipe = recipeById(match.recipeId);
  s.popup = { text: `+${res.earned}  ${recipe ? recipe.name : ''}`, x: 1058, y: 640, ttl: 1.6 };
  return { ok: true, ...res, recipeId: match.recipeId };
}

// --- shift clock ---
export function tickShift(s, dt) {
  if (s.phase !== 'play' || s.frozen) return;
  s.timeLeft = Math.max(0, s.timeLeft - dt);
  tickOrders(s.board, dt);
  tickCooking(s, dt);
  s.spawnTimer -= dt;
  if (s.spawnTimer <= 0 && s.board.orders.length < 4) {
    spawnOrder(s.board, s.rng, s.shift);
    s.spawnTimer = ORDER_SPAWN_EVERY - Math.min(4, s.shift - 1) * 1.5;
  }
  if (s.popup) {
    s.popup.ttl -= dt;
    if (s.popup.ttl <= 0) s.popup = null;
  }
  if (s.timeLeft <= 0 || s.board.hearts <= 0) endShift(s);
}

export function endShift(s) {
  s.phase = 'end';
  const stars = s.board.served >= 12 ? 3 : s.board.served >= 8 ? 2 : s.board.served >= 4 ? 1 : 0;
  s.endStats = { coins: s.board.coins, served: s.board.served, lost: s.board.lost, stars, shift: s.shift };
}

// --- movement (pure: caller supplies input direction; render reads player.x/y) ---
export function movePlayer(s, dx, dy, dt) {
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const nx = dx / len;
  const ny = dy / len;
  s.player.x = Math.max(60, Math.min(1220, s.player.x + nx * PLAYER_SPEED * dt));
  s.player.y = Math.max(340, Math.min(640, s.player.y + ny * PLAYER_SPEED * dt));
  if (nx !== 0) s.player.face = nx > 0 ? 1 : -1;
}

// Nearest station whose rect is within reach of the player (for E / click).
export function nearestStation(s) {
  let best = null;
  let bestD = 130;
  for (const st of Object.values(STATIONS)) {
    const cx = st.x + st.w / 2;
    const cy = st.y + st.h / 2;
    const d = Math.hypot(s.player.x - cx, s.player.y - cy);
    if (d < bestD) { bestD = d; best = st; }
  }
  return best;
}
