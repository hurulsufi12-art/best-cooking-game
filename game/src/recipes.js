// recipes.js — one job: the six dishes of Warung Senja, their components and
// the rule that decides whether a plated dish matches an order.
// A component key is "<ingredient>__<prep>"; prep is mentah | cincang | masak
// | rebus | panggang. A plate matches when its set of keys equals the recipe's.
// Pure data + pure validation: no DOM, importable from Node tests.
import { INGREDIENTS } from './config.js';

function component(ingredient, prep) {
  return { key: `${ingredient}__${prep}`, ingredient, prep };
}

export const RECIPES = {
  'nasi-goreng-senja': {
    id: 'nasi-goreng-senja',
    name: 'Nasi Goreng Senja',
    price: 30,
    components: [component('nasi', 'masak'), component('telur', 'masak'), component('sayur', 'cincang')],
    steps: ['Cincang sayur di talenan', 'Goreng nasi + telur di wajan', 'Susun di piring'],
  },
  'soto-kilat': {
    id: 'soto-kilat',
    name: 'Soto Kilat',
    price: 35,
    components: [component('kaldu', 'rebus'), component('ayam', 'rebus'), component('tauge', 'mentah')],
    steps: ['Rebus kaldu + ayam di panci', 'Ambil tauge segar dari pantry', 'Susun di piring'],
  },
  'es-teh-manis': {
    id: 'es-teh-manis',
    name: 'Es Teh Manis',
    price: 15,
    components: [component('teh', 'mentah'), component('es', 'mentah'), component('gula', 'mentah')],
    steps: ['Tanpa masak — ambil semua dari pantry', 'Susun di piring'],
  },
  'mie-goreng-senja': {
    id: 'mie-goreng-senja',
    name: 'Mie Goreng Senja',
    price: 30,
    components: [component('mie', 'masak'), component('telur', 'masak'), component('sayur', 'cincang')],
    steps: ['Cincang sayur di talenan', 'Goreng mie + telur di wajan', 'Susun di piring'],
  },
  'sate-kilat': {
    id: 'sate-kilat',
    name: 'Sate Kilat',
    price: 40,
    components: [component('ayam', 'panggang'), component('bumbu', 'mentah'), component('kecap', 'mentah')],
    steps: ['Panggang ayam di panggangan', 'Olesi bumbu + kecap', 'Susun di piring'],
  },
  'gado-gado-senja': {
    id: 'gado-gado-senja',
    name: 'Gado-Gado Senja',
    price: 25,
    components: [component('sayur', 'cincang'), component('telur', 'masak'), component('saus-kacang', 'mentah')],
    steps: ['Cincang sayur di talenan', 'Goreng telur di wajan', 'Siram saus kacang, susun di piring'],
  },
};

export const RECIPE_IDS = Object.keys(RECIPES);

export function recipeById(id) {
  return RECIPES[id] || null;
}

// True when the plate's component keys are exactly the recipe's (order-free).
export function validatePlate(recipeId, plateKeys) {
  const recipe = recipeById(recipeId);
  if (!recipe || plateKeys.length !== recipe.components.length) return false;
  const want = new Set(recipe.components.map((c) => c.key));
  return plateKeys.every((k) => want.has(k));
}

// Short label for one component key, e.g. "sayur__cincang" -> "Sayur cincang".
export function componentLabel(key) {
  const [ingredient, prep] = key.split('__');
  const ing = INGREDIENTS[ingredient];
  const prepWord = { mentah: 'mentah', cincang: 'cincang', masak: 'goreng', rebus: 'rebus', panggang: 'panggang' }[prep] || prep;
  return `${ing ? ing.name : ingredient} ${prepWord}`;
}
