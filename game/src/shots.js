// shots.js — one job: deterministic staged scenes for ?shot=<scene>&seed=N.
// Each scene builds a complete game state with FROZEN timers (no clock runs in
// shot mode), so a screenshot is a real render of the game code in a browser.
// Unknown scene falls back to the title screen — never blank, never a crash.
import { newGameState, startShift } from './kitchen.js';
import { createOrderBoard } from './orders.js';

function order(id, recipeId, timeLeft, timeLimit) {
  return { id, recipeId, timeLeft, timeLimit };
}

function baseState(seed) {
  const s = newGameState(seed);
  s.frozen = true;
  startShift(s);
  return s;
}

function setOrders(s, list) {
  const board = createOrderBoard();
  board.coins = s.board.coins;
  board.combo = s.board.combo;
  board.comboTimer = s.board.comboTimer;
  board.hearts = s.board.hearts;
  board.served = s.board.served;
  board.lost = s.board.lost;
  board.orders = list;
  board.nextId = list.length + 1;
  s.board = board;
}

export function buildShotState(scene, seed = 1) {
  if (scene === 'cover') {
    const s = baseState(seed);
    s.timeLeft = 84; // 1:24 on the shift timer
    s.board.coins = 120;
    s.board.combo = 2;
    s.board.comboTimer = 5;
    setOrders(s, [
      order(1, 'nasi-goreng-senja', 32, 45),
      order(2, 'soto-kilat', 24, 45),
      order(3, 'mie-goreng-senja', 38, 45),
    ]);
    // Dish mid-assembly: sayur half-chopped on the board, nasi mid-fry in the wok.
    s.chopping.item = { ingredient: 'sayur', prep: 'mentah', key: 'sayur__mentah' };
    s.chopping.progress = 60;
    s.wok.item = { ingredient: 'nasi', prep: 'mentah', key: 'nasi__mentah' };
    s.wok.progress = 55;
    s.wok.state = 'cooking';
    // One plate ready to serve: a full Mie Goreng Senja.
    s.plate.items = ['mie__masak', 'telur__masak', 'sayur__cincang'];
    s.player.x = 820;
    s.player.y = 480;
    s.player.carrying = { ingredient: 'telur', prep: 'cincang', key: 'telur__cincang' };
    return s;
  }
  if (scene === 'rush') {
    const s = baseState(seed);
    s.timeLeft = 41; // 0:41 — late shift, pressure on
    s.board.coins = 340;
    s.board.combo = 3;
    s.board.comboTimer = 7;
    setOrders(s, [
      order(1, 'soto-kilat', 6, 45), // almost out — red timer
      order(2, 'nasi-goreng-senja', 18, 45),
      order(3, 'sate-kilat', 29, 45),
      order(4, 'es-teh-manis', 40, 45),
    ]);
    s.wok.item = { ingredient: 'mie', prep: 'mentah', key: 'mie__mentah' };
    s.wok.progress = 80;
    s.wok.state = 'cooking';
    s.pot.item = { ingredient: 'kaldu', prep: 'mentah', key: 'kaldu__mentah' };
    s.pot.progress = 45;
    s.pot.state = 'cooking';
    s.grill.item = { ingredient: 'ayam', prep: 'mentah', key: 'ayam__mentah' };
    s.grill.progress = 95;
    s.grill.state = 'cooking';
    s.chopping.item = { ingredient: 'sayur', prep: 'mentah', key: 'sayur__mentah' };
    s.chopping.progress = 25;
    s.plate.items = ['sayur__cincang'];
    s.player.x = 1060;
    s.player.y = 480;
    return s;
  }
  if (scene === 'serve') {
    const s = baseState(seed);
    s.timeLeft = 102;
    s.board.coins = 210;
    s.board.combo = 1;
    s.board.comboTimer = 4;
    setOrders(s, [
      order(1, 'soto-kilat', 20, 45),
      order(2, 'gado-gado-senja', 33, 45),
    ]);
    // The cook stands at the serve window with a finished Soto Kilat.
    s.plate.items = ['kaldu__rebus', 'ayam__rebus', 'tauge__mentah'];
    s.player.x = 1040;
    s.player.y = 620;
    s.popup = { text: '+45  Soto Kilat', x: 1000, y: 600, ttl: 1.6 };
    return s;
  }
  if (scene === 'end') {
    const s = baseState(seed);
    s.timeLeft = 0;
    s.board.coins = 520;
    s.board.served = 12;
    s.board.lost = 1;
    setOrders(s, []);
    s.phase = 'end';
    s.endStats = { coins: 520, served: 12, lost: 1, stars: 3, shift: 1 };
    s.player.x = 640;
    s.player.y = 500;
    return s;
  }
  // Unknown scene: title screen (safe fallback).
  const s = newGameState(seed);
  s.frozen = true;
  return s;
}
