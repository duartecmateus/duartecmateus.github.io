/* Sound effects for the demo, synthesised with the Web Audio API: no audio
   files, nothing to download. Mute toggle bottom-right. */
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

  /* a soft tick when a tile is picked */
  document.addEventListener('click', (e) => {
    if (e.target.closest('.cell')) tone(700, 0.05, 'sine', 0.035);
  }, true);

  /* a two-note rise whenever the score goes up */
  const scoreEl = document.getElementById('score');
  const digits = (el) => Number(String(el?.textContent || '').replace(/[^0-9]/g, '') || 0);
  let lastScore = digits(scoreEl);
  if (scoreEl && window.MutationObserver) {
    new MutationObserver(() => {
      const now = digits(scoreEl);
      if (now > lastScore) {
        tone(880, 0.075, 'triangle', 0.045);
        tone(1320, 0.095, 'triangle', 0.035, 0.055);
      }
      lastScore = now;
    }).observe(scoreEl, { childList: true, characterData: true, subtree: true });
  }

  /* a chord at the end of the game, up if won and down if lost */
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

  /* mute toggle */
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
    if (!muted) tone(660, 0.06, 'sine', 0.04);
  });
  document.body.appendChild(btn);
})();
