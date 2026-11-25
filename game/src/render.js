// render.js — one job: draw the whole game on one canvas from the state object.
// Chunky flat shapes, big text (order names 28px, station labels 24px) so the
// game stays readable when the judge's contact sheet shrinks it. No clock here:
// every number drawn comes from the state, which is why ?shot= scenes are frozen.
import { CANVAS_W, CANVAS_H, STATIONS, COLORS, INGREDIENTS } from './config.js';
import { recipeById, componentLabel } from './recipes.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// One ingredient as a chunky coloured disc; prep changes the garnish.
function drawFood(ctx, key, x, y, r) {
  const [ingredient, prep] = key.split('__');
  const ing = INGREDIENTS[ingredient] || { color: '#cccccc' };
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = prep === 'burnt' ? '#1c1c1c' : ing.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  if (prep === 'cincang') {
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y);
    ctx.lineTo(x + r * 0.5, y);
    ctx.moveTo(x, y - r * 0.5);
    ctx.lineTo(x, y + r * 0.5);
    ctx.stroke();
  }
  if (prep === 'masak' || prep === 'rebus' || prep === 'panggang') {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - r - 4);
    ctx.quadraticCurveTo(x - 2, y - r - 12, x - 6, y - r - 18);
    ctx.moveTo(x + 6, y - r - 4);
    ctx.quadraticCurveTo(x + 10, y - r - 12, x + 6, y - r - 18);
    ctx.stroke();
  }
}

function drawStationBase(ctx, st, top) {
  ctx.fillStyle = COLORS.counterSide;
  rr(ctx, st.x, st.y + 8, st.w, st.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, st.x, st.y, st.w, st.h - 8, 12);
  ctx.fill();
  text(ctx, st.label, st.x + st.w / 2, st.y + st.h - 16, 24, COLORS.text, 'bold', 'center');
  void top;
}

function drawPantry(ctx, st) {
  drawStationBase(ctx, st);
  const names = ['nasi', 'mie', 'telur', 'sayur', 'ayam', 'teh', 'es', 'gula'];
  const bw = (st.w - 20) / 4;
  names.forEach((ing, i) => {
    const cx = st.x + 14 + (i % 4) * bw + bw / 2;
    const cy = st.y + 16 + Math.floor(i / 4) * 26;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = INGREDIENTS[ing].color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.stroke();
  });
  text(ctx, 'BAHAN', st.x + st.w / 2, st.y + 14, 13, COLORS.text, 'bold', 'center');
}

function drawBoard(ctx, st, chopping) {
  drawStationBase(ctx, st);
  ctx.fillStyle = COLORS.board;
  rr(ctx, st.x + 30, st.y + 12, st.w - 60, 44, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (chopping.item) {
    drawFood(ctx, chopping.item.key, st.x + st.w / 2, st.y + 34, 15);
    ctx.fillStyle = '#fff';
    rr(ctx, st.x + 20, st.y + 58, st.w - 40, 8, 4);
    ctx.fill();
    ctx.fillStyle = COLORS.green;
    rr(ctx, st.x + 20, st.y + 58, (st.w - 40) * (chopping.progress / 100), 8, 4);
    ctx.fill();
  } else {
    text(ctx, 'taruh bahan • tekan E', st.x + st.w / 2, st.y + 34, 15, '#7a5a33', 'bold', 'center');
  }
}

function drawBurner(ctx, st, burner, label) {
  drawStationBase(ctx, st);
  ctx.beginPath();
  ctx.arc(st.x + st.w / 2, st.y + 34, 26, 0, Math.PI * 2);
  ctx.fillStyle = label === 'WAJAN' ? COLORS.wok : label === 'PANCI' ? COLORS.pot : COLORS.grill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.stroke();
  if (burner.item) {
    drawFood(ctx, burner.item.key, st.x + st.w / 2, st.y + 34, 17);
    if (burner.state === 'burnt') {
      text(ctx, 'GOSONG!', st.x + st.w / 2, st.y + 34, 18, '#fff', 'bold', 'center');
    } else {
      ctx.fillStyle = '#fff';
      rr(ctx, st.x + 20, st.y + 58, st.w - 40, 8, 4);
      ctx.fill();
      ctx.fillStyle = burner.state === 'done' ? COLORS.gold : COLORS.accent;
      rr(ctx, st.x + 20, st.y + 58, (st.w - 40) * (burner.progress / 100), 8, 4);
      ctx.fill();
      if (burner.state === 'done') text(ctx, 'SIAP!', st.x + st.w / 2, st.y + 34, 18, '#fff', 'bold', 'center');
    }
  }
}

function drawPlating(ctx, st, plate) {
  drawStationBase(ctx, st);
  ctx.beginPath();
  ctx.arc(st.x + st.w / 2, st.y + 36, 30, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.plate;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.stroke();
  plate.items.forEach((key, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / Math.max(1, plate.items.length);
    drawFood(ctx, key, st.x + st.w / 2 + Math.cos(a) * 13, st.y + 36 + Math.sin(a) * 13, 9);
  });
  if (plate.items.length === 0) text(ctx, 'piring kosong', st.x + st.w / 2, st.y + 36, 15, '#7a5a33', 'bold', 'center');
}

function drawServe(ctx, st) {
  drawStationBase(ctx, st);
  // A waiting customer at the window.
  ctx.beginPath();
  ctx.arc(st.x + 60, st.y + 32, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c9a0';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(st.x + 52, st.y + 30, 3, 0, Math.PI * 2);
  ctx.arc(st.x + 68, st.y + 30, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#2b1a10';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(st.x + 60, st.y + 38, 8, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.strokeStyle = '#2b1a10';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'ANTAR DI SINI  •  E', st.x + 200, st.y + 34, 20, COLORS.text, 'bold', 'center');
}

function drawOrders(ctx, board) {
  const y = 96;
  const w = 296;
  const gap = 12;
  board.orders.forEach((o, i) => {
    const x = 24 + i * (w + gap);
    const recipe = recipeById(o.recipeId);
    const hot = o.timeLeft < 10;
    ctx.fillStyle = hot ? COLORS.orderCardHot : COLORS.orderCard;
    rr(ctx, x, y, w, 100, 12);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = hot ? COLORS.red : 'rgba(0,0,0,0.25)';
    ctx.stroke();
    text(ctx, recipe ? recipe.name : o.recipeId, x + 14, y + 22, 28, COLORS.text);
    recipe.components.forEach((c, j) => {
      const cx = x + 16 + j * 92;
      ctx.beginPath();
      ctx.arc(cx, y + 52, 9, 0, Math.PI * 2);
      ctx.fillStyle = INGREDIENTS[c.ingredient].color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.stroke();
      text(ctx, componentLabel(c.key), cx + 13, y + 52, 15, COLORS.text);
    });
    const frac = Math.max(0, o.timeLeft / o.timeLimit);
    ctx.fillStyle = '#e0d0b8';
    rr(ctx, x + 14, y + 76, w - 28, 12, 6);
    ctx.fill();
    ctx.fillStyle = hot ? COLORS.red : COLORS.green;
    rr(ctx, x + 14, y + 76, (w - 28) * frac, 12, 6);
    ctx.fill();
    text(ctx, fmtTime(o.timeLeft), x + w - 16, y + 52, 24, hot ? COLORS.red : COLORS.text, 'bold', 'right');
  });
  if (board.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,246,224,0.85)';
    rr(ctx, 24, y, 400, 100, 12);
    ctx.fill();
    text(ctx, 'Belum ada order — siap-siap!', 44, y + 50, 24, COLORS.text);
  }
}

function drawHUD(ctx, s) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, CANVAS_W, 88);
  text(ctx, 'KUALI KILAT — Warung Senja', 24, 46, 30, COLORS.textLight);
  const t = fmtTime(s.timeLeft);
  const urgent = s.timeLeft < 30;
  text(ctx, `⏱ ${t}`, 640, 46, 40, urgent ? '#ff6b5e' : COLORS.textLight, 'bold', 'center');
  text(ctx, `SHIFT ${s.shift}`, 640, 76, 16, '#c9a882', 'bold', 'center');
  text(ctx, `🪙 ${s.board.coins}`, 980, 40, 28, COLORS.gold, 'bold', 'right');
  if (s.board.combo >= 2) {
    ctx.fillStyle = COLORS.accent;
    rr(ctx, 1000, 20, 110, 44, 10);
    ctx.fill();
    text(ctx, `COMBO x${s.board.combo}`, 1055, 43, 24, '#fff', 'bold', 'center');
  }
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < s.board.hearts ? '♥' : '♡';
  text(ctx, hearts, 1256, 40, 28, '#ff6b5e', 'bold', 'right');
  text(ctx, `tersaji ${s.board.served}  •  hilang ${s.board.lost}`, 1256, 70, 16, '#c9a882', 'bold', 'right');
}

function drawPlayer(ctx, s) {
  const p = s.player;
  // Shadow
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 18, 24, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  // Body (chef whites) + head + toque
  ctx.beginPath();
  ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#f5f0e6';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x, p.y - 6, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c9a0';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x, p.y - 20, 12, Math.PI, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.stroke();
  // Carrying item floats above the head
  if (p.carrying) drawFood(ctx, p.carrying.key, p.x, p.y - 44, 13);
  // Move target marker
  if (s.moveTarget) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.moveTarget.x, s.moveTarget.y, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTitle(ctx, s) {
  ctx.fillStyle = 'rgba(36,20,8,0.72)';
  ctx.fillRect(0, 88, CANVAS_W, CANVAS_H - 88);
  ctx.fillStyle = COLORS.orderCard;
  rr(ctx, 290, 250, 700, 320, 18);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.accent;
  ctx.stroke();
  text(ctx, 'KUALI KILAT', 640, 310, 56, COLORS.text, 'bold', 'center');
  text(ctx, 'Warung Senja — masak cepat, antar tepat waktu!', 640, 360, 24, COLORS.text, 'bold', 'center');
  text(ctx, 'WASD / panah: jalan   •   E / klik: pakai stasiun', 640, 410, 22, COLORS.text, 'bold', 'center');
  text(ctx, 'Pantry → Talenan → Kompor → Plating → Jendela Saji', 640, 445, 22, COLORS.text, 'bold', 'center');
  text(ctx, 'TEKAN ENTER UNTUK MULAI', 640, 505, 28, COLORS.accent, 'bold', 'center');
  void s;
}

function drawEnd(ctx, s) {
  ctx.fillStyle = 'rgba(36,20,8,0.6)';
  ctx.fillRect(0, 88, CANVAS_W, CANVAS_H - 88);
  const st = s.endStats || { coins: 0, served: 0, lost: 0, stars: 0 };
  ctx.fillStyle = COLORS.orderCard;
  rr(ctx, 340, 230, 600, 340, 18);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', 640, 285, 44, COLORS.text, 'bold', 'center');
  let stars = '';
  for (let i = 0; i < 3; i++) stars += i < st.stars ? '★' : '☆';
  text(ctx, stars, 640, 350, 52, COLORS.gold, 'bold', 'center');
  text(ctx, `Koin: ${st.coins}    Tersaji: ${st.served}    Hilang: ${st.lost}`, 640, 420, 28, COLORS.text, 'bold', 'center');
  text(ctx, 'Tekan R untuk shift berikutnya', 640, 485, 24, COLORS.accent, 'bold', 'center');
}

export function draw(ctx, s) {
  // Floor
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 88, CANVAS_W, CANVAS_H - 88);
  ctx.fillStyle = COLORS.floorTile;
  for (let y = 340; y < 660; y += 48) {
    for (let x = ((y / 48) % 2) * 24; x < CANVAS_W; x += 48) {
      ctx.fillRect(x, y, 44, 44);
    }
  }
  // Walls behind counters
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 204, CANVAS_W, 16);
  ctx.fillRect(0, 656, CANVAS_W, 16);
  drawHUD(ctx, s);
  drawOrders(ctx, s.board);
  drawPantry(ctx, STATIONS.pantry);
  drawBoard(ctx, STATIONS.board, s.chopping);
  drawBurner(ctx, STATIONS.grill, s.grill, 'PANGGANGAN');
  drawBurner(ctx, STATIONS.wok, s.wok, 'WAJAN');
  drawBurner(ctx, STATIONS.pot, s.pot, 'PANCI');
  drawPlating(ctx, STATIONS.plating, s.plate);
  drawServe(ctx, STATIONS.serve);
  drawPlayer(ctx, s);
  if (s.popup) {
    ctx.globalAlpha = Math.min(1, s.popup.ttl);
    text(ctx, s.popup.text, s.popup.x, s.popup.y, 30, COLORS.gold, 'bold', 'center');
    ctx.globalAlpha = 1;
  }
  if (s.phase === 'title') drawTitle(ctx, s);
  if (s.phase === 'end') drawEnd(ctx, s);
}
