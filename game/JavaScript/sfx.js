/* Sound effects for the demo, synthesised with the Web Audio API: no audio
   files at all. A click when a tile is picked, a small egg-crack when a match
   scores, a chord at the end. Mute toggle bottom-right. */
(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur = 0.09, type = 'sine', gain = 0.05, delay = 0, slideTo = null) {
    if (muted) return;
    const c = ensure();
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  /* short noise burst, used for the click and for the shell breaking */
  function noise(dur, freq, gain, q = 1) {
    if (muted) return;
    const c = ensure();
    const t0 = c.currentTime;
    const frames = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, frames, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 3);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(bp);
    bp.connect(g);
    g.connect(c.destination);
    src.start(t0);
  }

  /* picking a tile: a dry little tick, no pitch, nothing musical */
  function click() {
    noise(0.022, 2600, 0.10, 1.6);
  }

  /* a match: shell cracking (noise) over a woody thump, then a bright ping */
  function eggCrack(size = 1) {
    noise(0.075, 2400, 0.16 * size, 0.9);
    tone(240, 0.085, 'sine', 0.05 * size, 0, 95);
    tone(1568, 0.06, 'triangle', 0.020 * size, 0.03);
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.cell')) click();
  }, true);

  /* score going up means a match just scored */
  const scoreEl = document.getElementById('score');
  const digits = (el) => Number(String(el?.textContent || '').replace(/[^0-9]/g, '') || 0);
  let lastScore = digits(scoreEl);
  if (scoreEl && window.MutationObserver) {
    new MutationObserver(() => {
      const now = digits(scoreEl);
      const delta = now - lastScore;
      if (delta > 0) {
        const size = delta >= 300 ? 1.25 : delta >= 150 ? 1.0 : 0.8;
        eggCrack(size);
      }
      lastScore = now;
    }).observe(scoreEl, { childList: true, characterData: true, subtree: true });
  }

  /* end of game: up if won, down if lost */
  if (window.MutationObserver) {
    new MutationObserver((muts) => {
      for (const m of muts) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.id === 'game-overlay') {
            const won = /ALL SCRAMBLED/.test(node.textContent);
            const notes = won ? [523, 659, 784, 1047] : [392, 311];
            notes.forEach((f, i) => tone(f, 0.16, 'sine', 0.05, i * 0.11));
          }
        }
      }
    }).observe(document.body, { childList: true });
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'sfx-toggle';
  btn.title = 'Sound on / off';
  btn.textContent = '🔊';
  btn.setAttribute('aria-label', 'Toggle sound');
  btn.style.cssText = [
    'position:fixed', 'right:14px', 'bottom:14px', 'z-index:9999',
    'border-radius:999px', 'padding:8px 12px', 'font-size:15px', 'line-height:1',
    'border:1px solid rgba(0,0,0,.25)', 'background:#fff', 'color:#222',
    'cursor:pointer', 'box-shadow:0 2px 10px rgba(0,0,0,.15)'
  ].join(';');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    muted = !muted;
    btn.textContent = muted ? '🔇' : '🔊';
    if (!muted) click();
  });
  document.body.appendChild(btn);
})();
