// config.js — one job: every tunable number, colour and layout rect of Kuali Kilat.
// Nothing here touches the DOM; pure data so Node tests can import it too.
export const CANVAS_W = 1280;
export const CANVAS_H = 800;

// Shift / orders
export const SHIFT_SECONDS = 150;
export const ORDER_TIME_LIMIT = 45;
export const MAX_ORDERS = 4;
export const COMBO_WINDOW = 8; // seconds between on-time serves to keep the combo
export const HEARTS_START = 3;

// Chop / cook pacing
export const CHOPS_TO_FINISH = 4; // E presses to fully chop one ingredient
export const COOK_SECONDS = 6; // seconds on a burner until done
export const BURN_SECONDS = 6; // seconds past done until burnt
export const ORDER_SPAWN_EVERY = 12; // seconds between new orders, shift 1

// Player
export const PLAYER_SPEED = 260; // px per second
export const PLAYER_R = 22;

// Kitchen layout (zig-zag: Pantry far left, burners far right, plating bottom).
// Counters sit on the top wall and the bottom wall; the cook walks the middle band.
export const STATIONS = {
  pantry: { id: 'pantry', label: 'PANTRY', x: 24, y: 216, w: 190, h: 96 },
  board: { id: 'board', label: 'TALENAN', x: 250, y: 216, w: 190, h: 96 },
  wok: { id: 'wok', label: 'WAJAN', x: 880, y: 216, w: 170, h: 96 },
  pot: { id: 'pot', label: 'PANCI', x: 1066, y: 216, w: 170, h: 96 },
  grill: { id: 'grill', label: 'PANGGANGAN', x: 700, y: 216, w: 150, h: 96 },
  plating: { id: 'plating', label: 'PLATING', x: 250, y: 668, w: 260, h: 96 },
  serve: { id: 'serve', label: 'JENDELA SAJI', x: 880, y: 668, w: 356, h: 96 },
};

// Colours — warm warung palette, chunky flat shapes, readable at thumbnail size.
export const COLORS = {
  floor: '#c98f4e',
  floorTile: '#bb7f42',
  wall: '#7a4a2b',
  counterTop: '#e8dcc8',
  counterSide: '#8a5a33',
  board: '#e8c88a',
  wok: '#3a3a3a',
  pot: '#4a4a55',
  grill: '#5a3a2a',
  plate: '#f5f0e6',
  orderCard: '#fff6e0',
  orderCardHot: '#ffe0d0',
  hud: '#2b1a10',
  text: '#2b1a10',
  textLight: '#fff6e0',
  accent: '#e0533a',
  gold: '#f2b234',
  green: '#4e9b47',
  red: '#d1342c',
};

// Ingredient catalogue: name shown on screen + draw colour.
export const INGREDIENTS = {
  nasi: { name: 'Nasi', color: '#f2ead8' },
  mie: { name: 'Mie', color: '#f2c14e' },
  telur: { name: 'Telur', color: '#f6e27a' },
  sayur: { name: 'Sayur', color: '#5da24a' },
  ayam: { name: 'Ayam', color: '#e0a080' },
  kaldu: { name: 'Kaldu', color: '#e8c25a' },
  tauge: { name: 'Tauge', color: '#eef2d8' },
  teh: { name: 'Teh', color: '#8a5a2b' },
  es: { name: 'Es', color: '#bfe3f2' },
  gula: { name: 'Gula', color: '#ffffff' },
  bumbu: { name: 'Bumbu', color: '#c25a2b' },
  kecap: { name: 'Kecap', color: '#3a2418' },
  'saus-kacang': { name: 'Saus Kacang', color: '#a06a2c' },
};
