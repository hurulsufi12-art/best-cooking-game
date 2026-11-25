// rng.js — one job: a tiny seeded PRNG (mulberry32) so order spawns and
// screenshot scenes are reproducible from a seed. Pure, no DOM, no clock.
export function mulberry32(seed) {
  let a = (typeof seed === 'number' ? seed : 0) >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one element of arr with rng; returns null for an empty array.
export function pick(rng, arr) {
  if (!arr.length) return null;
  return arr[Math.floor(rng() * arr.length)];
}

// Integer in [min, max] inclusive.
export function intIn(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
