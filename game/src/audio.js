// audio.js — one job: tiny synthesized sound effects (WebAudio, no files).
// The context is created lazily on first user input; every call is guarded,
// so the game plays fine with no sound at all. No network, no assets.
let ctx = null;

export function ensureAudio() {
  try {
    if (!ctx && typeof AudioContext !== 'undefined') ctx = new AudioContext();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  } catch (_e) { ctx = null; }
}

function tone(freq, dur, type = 'sine', vol = 0.08) {
  try {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch (_e) { /* sound is optional */ }
}

export function sfxChop() { tone(180, 0.07, 'square', 0.06); }
export function sfxPick() { tone(520, 0.08, 'sine', 0.05); }
export function sfxCook() { tone(90, 0.25, 'sawtooth', 0.04); }
export function sfxServe() { tone(660, 0.1, 'sine', 0.07); setTimeout(() => tone(880, 0.14, 'sine', 0.07), 90); }
export function sfxExpire() { tone(220, 0.3, 'sawtooth', 0.06); }
export function sfxBurnt() { tone(140, 0.4, 'square', 0.05); }
