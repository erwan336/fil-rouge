/* Sons et vibrations du jeu.
   Les sons sont synthétisés à la volée (Web Audio) : aucun fichier audio à charger.
   Le bouton haut-parleur de l'en-tête coupe ou rétablit le son (choix mémorisé). */

ICONS.sound = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9a4 4 0 0 1 0 6M19.5 6a8 8 0 0 1 0 12"/>';
ICONS.mute  = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>';

const SFX = (() => {
  let ctx = null;
  let muted = store.get('fr-mute') === '1';
  /** Contexte audio créé au premier son (les navigateurs l'exigent après un geste) */
  function ac() {
    if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  /** Une note : fréquence (Hz), durée (s), options */
  function tone(freq, dur, { type = 'sine', vol = .16, at = 0, slide = 0 } = {}) {
    if (muted) return;
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + .015);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + .05);
  }
  const arp = (notes, step, opts) => notes.forEach((f, i) => tone(f, opts.dur || .25, { ...opts, at: i * step }));
  /** Vibration (téléphones Android ; ignorée ailleurs) */
  const buzz = pattern => { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} };

  return {
    get muted() { return muted; },
    toggle() { muted = !muted; store.set('fr-mute', muted ? '1' : '0'); if (!muted) this.click(); return muted; },
    click() { tone(660, .06, { type: 'triangle', vol: .07 }); },
    tick()  { tone(880, .05, { type: 'square', vol: .045 }); },
    go()    { tone(523, .12, { type: 'triangle' }); tone(1046, .32, { type: 'triangle', at: .1 }); buzz(40); },
    ok()    { arp([523, 659, 784], .08, { type: 'triangle', dur: .22 }); buzz(25); },
    ko()    { tone(190, .34, { type: 'sawtooth', vol: .1, slide: -100 }); buzz([70, 40, 70]); },
    level() { arp([523, 659, 784, 1046], .1, { type: 'triangle', dur: .26 }); buzz([30, 30, 30]); },
    win()   { arp([523, 659, 784, 1046, 784, 1046], .11, { type: 'triangle', dur: .3 }); buzz([40, 30, 40, 30, 90]); },
    lose()  { arp([392, 330, 262], .16, { type: 'sine', dur: .38 }); },
    peek()  { buzz(12); }
  };
})();

/* Bouton son de l'en-tête */
(() => {
  const b = $('muteBtn');
  const paint = () => {
    b.innerHTML = icon(SFX.muted ? 'mute' : 'sound', 15);
    b.title = SFX.muted ? 'Activer le son' : 'Couper le son';
    b.classList.toggle('off', SFX.muted);
  };
  b.onclick = () => { SFX.toggle(); paint(); };
  paint();
})();
