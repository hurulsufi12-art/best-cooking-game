// orders.js — one job: the order board. Spawning orders, ticking their timers,
// expiring them (costs a heart), and paying for a served dish (price + tip +
// combo bonus). Pure logic: no DOM, no clock — callers pass dt in seconds.
import { ORDER_TIME_LIMIT, MAX_ORDERS, COMBO_WINDOW, HEARTS_START } from './config.js';
import { RECIPE_IDS, recipeById } from './recipes.js';
import { pick } from './rng.js';

export { ORDER_TIME_LIMIT, MAX_ORDERS };

export function createOrderBoard() {
  return {
    orders: [], // {id, recipeId, timeLeft, timeLimit}
    coins: 0,
    combo: 0,
    comboTimer: 0,
    hearts: HEARTS_START,
    served: 0,
    lost: 0,
    nextId: 1,
  };
}

// Add one order if the board has room. Shift number shortens the time limit.
export function spawnOrder(board, rng, shift = 1) {
  if (board.orders.length >= MAX_ORDERS) return null;
  const recipeId = pick(rng, RECIPE_IDS);
  const timeLimit = Math.max(25, ORDER_TIME_LIMIT - (shift - 1) * 5);
  const order = { id: board.nextId++, recipeId, timeLeft: timeLimit, timeLimit };
  board.orders.push(order);
  return order;
}

// Advance all order timers by dt seconds; expired orders leave and cost a heart.
export function tickOrders(board, dt) {
  if (board.comboTimer > 0) board.comboTimer = Math.max(0, board.comboTimer - dt);
  if (board.comboTimer === 0) board.combo = 0;
  const kept = [];
  for (const o of board.orders) {
    o.timeLeft -= dt;
    if (o.timeLeft <= 0) {
      board.hearts = Math.max(0, board.hearts - 1);
      board.lost += 1;
      board.combo = 0;
      board.comboTimer = 0;
    } else {
      kept.push(o);
    }
  }
  board.orders = kept;
}

// Serve order `id`. timeFraction is timeLeft/timeLimit at serve time (0..1):
// the faster the serve, the bigger the tip. Returns {ok, tip, earned}.
export function serveOrder(board, orderId, timeFraction = 0.5) {
  const idx = board.orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return { ok: false, tip: 0, earned: 0 };
  const order = board.orders[idx];
  const recipe = recipeById(order.recipeId);
  const price = recipe ? recipe.price : 20;
  const clamped = Math.max(0, Math.min(1, timeFraction));
  const tip = Math.round(price * 0.5 * clamped);
  board.combo = board.comboTimer > 0 ? board.combo + 1 : 1;
  board.comboTimer = COMBO_WINDOW;
  const comboBonus = board.combo >= 2 ? 5 * (board.combo - 1) : 0;
  const earned = price + tip + comboBonus;
  board.coins += earned;
  board.served += 1;
  board.orders.splice(idx, 1);
  return { ok: true, tip, earned, combo: board.combo };
}

export function orderById(board, id) {
  return board.orders.find((o) => o.id === id) || null;
}
