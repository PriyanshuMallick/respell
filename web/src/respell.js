const sharp = {};

/** The default effect. Every field of an effect you pass falls back to this. */
export const defaultEffect = Object.freeze({
  swapOut: { duration: 150, keyframes: [{ at: 0, look: sharp }, { at: 1, look: { blur: 7, opacity: 0.35, y: -6 } }] },
  swapIn: { duration: 250, keyframes: [{ at: 0, look: { blur: 7, opacity: 0.35, y: 6 } }, { at: 1, look: sharp }] },
  write: {
    duration: 680,
    keyframes: [
      { at: 0, look: { blur: 11, opacity: 0, y: 4, glow: 1 } },
      { at: 0.3, look: { blur: 7, opacity: 0.7, glow: 1 } },
      { at: 0.7, look: { glow: 1 } },
      { at: 1, look: sharp },
    ],
  },
  erase: {
    duration: 340,
    keyframes: [
      { at: 0, look: sharp },
      { at: 0.3, look: { glow: 1 } },
      { at: 0.7, look: { blur: 7, opacity: 0.7, glow: 1 } },
      { at: 1, look: { blur: 11, opacity: 0, y: 4, glow: 1 } },
    ],
  },
  stagger: 45,
  curve: [0, 0, 0.2, 1],
  wave: 'auto',
  glow: { tint: 1, shadows: [{ opacity: 0.75, blur: 10 }, { opacity: 0.5, blur: 1 }] },
  animateSize: true,
  sizeCurve: [0, 0, 1, 1],
  holdCommonPrefix: false,
});

// A curve as a function, from a function or cubic-bezier points.
function curveOf(c) {
  if (typeof c === 'function') return c;
  const [x1, y1, x2, y2] = c;
  const b = (p1, p2, u) => 3 * (1 - u) * (1 - u) * u * p1 + 3 * (1 - u) * u * u * p2 + u * u * u;
  return (t) => {
    let lo = 0, hi = 1, u = t;
    for (let i = 0; i < 24; i++) {
      u = (lo + hi) / 2;
      if (b(x1, x2, u) < t) lo = u;
      else hi = u;
    }
    return b(y1, y2, u);
  };
}

const mix = (a, b, t) => a + (b - a) * t;
const full = (l) => ({ blur: 0, opacity: 1, x: 0, y: 0, scale: 1, glow: 0, ...l });

function lerpLook(a, b, t) {
  const out = {};
  for (const k in a) out[k] = mix(a[k], b[k], t);
  out.blur = Math.max(out.blur, 0);
  out.opacity = Math.min(Math.max(out.opacity, 0), 1);
  out.glow = Math.min(Math.max(out.glow, 0), 1);
  return out;
}

// The look at progress p (0 → 1) through a phase's keyframes.
function lookAt(phase, p, curve) {
  const e = (phase.curve ? curveOf(phase.curve) : curve)(Math.min(Math.max(p, 0), 1));
  const k = phase.keyframes;
  for (let i = 1; i < k.length; i++) {
    if (e <= k[i].at) {
      const span = k[i].at - k[i - 1].at;
      return lerpLook(full(k[i - 1].look), full(k[i].look), span ? (e - k[i - 1].at) / span : 1);
    }
  }
  return full(k[k.length - 1].look);
}

/** The morph from letters a to letters b under effect e. */
function plan(a, b, e) {
  const n = Math.min(a.length, b.length);
  let prefix = 0;
  if (e.holdCommonPrefix) while (prefix < n && a[prefix] === b[prefix]) prefix++;
  const backward = e.wave === 'backward' || (e.wave === 'auto' && a.length > b.length);
  const stagger = e.wave === 'together' ? 0 : e.stagger;
  const last = Math.max(a.length, b.length) - 1;
  const delay = (i) => (backward ? last - i : i) * stagger;
  const curve = curveOf(e.curve);
  const look = (phase, ms) => lookAt(phase, phase.duration ? ms / phase.duration : 1, curve);
  let length = 0;
  for (let i = prefix; i < n; i++) length = Math.max(length, delay(i) + e.swapOut.duration + e.swapIn.duration);
  for (let i = n; i < a.length; i++) length = Math.max(length, delay(i) + e.erase.duration);
  for (let i = n; i < b.length; i++) length = Math.max(length, delay(i) + e.write.duration);
  // Letters as they look ms into the morph: [fromOld, index, look][].
  const at = (ms) => {
    const out = [];
    for (let i = 0; i < prefix; i++) out.push([false, i, full(sharp)]);
    for (let i = prefix; i < n; i++) {
      const t = ms - delay(i);
      out.push(t < e.swapOut.duration ? [true, i, look(e.swapOut, t)] : [false, i, look(e.swapIn, t - e.swapOut.duration)]);
    }
    for (let i = n; i < a.length; i++) out.push([true, i, look(e.erase, ms - delay(i))]);
    for (let i = n; i < b.length; i++) out.push([false, i, look(e.write, ms - delay(i))]);
    return out;
  };
  return { length, at };
}

/**
 * Text in `el` that changes in one wave across its letters. See
 * `defaultEffect` for what `options` can change. The glow colour falls back
 * to the CSS variable `--respell-glow`, then to #C0F250.
 */
export class Respell {
  constructor(el, text = '', options = {}) {
    this.el = el;
    this.options = options;
    el.style.display = 'inline-block';
    el.style.position = 'relative';
    el.style.whiteSpace = 'pre';
    this.text = document.createElement('span');
    this.layer = document.createElement('span');
    this.layer.setAttribute('aria-hidden', 'true');
    this.layer.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    el.replaceChildren(this.text, this.layer);
    this.text.textContent = text;
  }

  // The shown word's letters, their x offsets and its width.
  measure() {
    const node = this.text.firstChild;
    const left = this.text.getBoundingClientRect().left;
    const chars = Array.from(this.text.textContent);
    const range = document.createRange();
    let offset = 0;
    const xs = chars.map((c) => {
      range.setStart(node, offset);
      range.setEnd(node, (offset += c.length));
      return range.getBoundingClientRect().left - left;
    });
    return { chars, xs, width: this.text.getBoundingClientRect().width };
  }

  /** Morph to `next`. */
  set(next) {
    if (next === this.text.textContent) return;
    const { respectReducedMotion = true, onComplete, ...effect } = this.options;
    const e = { ...defaultEffect, ...effect, glow: { ...defaultEffect.glow, ...effect.glow } };
    const from = this.frame ? this.word : this.measure();
    this.stop();
    this.text.textContent = next;
    if (respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const to = (this.word = this.measure());
    const style = getComputedStyle(this.el);
    const glow = e.glow.color || style.getPropertyValue('--respell-glow').trim() || '#C0F250';
    const base = style.color;
    const sizeCurve = curveOf(e.sizeCurve);
    const { length, at } = plan(from.chars, to.chars, e);
    const spans = Array.from({ length: Math.max(from.chars.length, to.chars.length) }, () => {
      const s = document.createElement('span');
      s.style.cssText = 'position:absolute;top:0;transform-origin:center';
      return s;
    });
    this.layer.replaceChildren(...spans);
    this.text.style.visibility = 'hidden';
    const start = performance.now();
    const tick = (now) => {
      const t = now - start;
      if (t >= length) {
        this.stop();
        return onComplete?.();
      }
      this.el.style.width = `${e.animateSize ? mix(from.width, to.width, sizeCurve(t / length)) : to.width}px`;
      at(t).forEach(([fromOld, i, l], k) => {
        const s = spans[k];
        const w = fromOld ? from : to;
        s.textContent = w.chars[i];
        s.style.left = `${w.xs[i]}px`;
        s.style.opacity = l.opacity;
        s.style.filter = `blur(${l.blur}px)`;
        s.style.transform = `translate(${l.x}px, ${l.y}px) scale(${l.scale})`;
        s.style.color = `color-mix(in srgb, ${glow} ${l.glow * e.glow.tint * 100}%, ${base})`;
        s.style.textShadow =
          e.glow.shadows
            .map((sh) => `${sh.x ?? 0}px ${sh.y ?? 0}px ${sh.blur ?? 0}px color-mix(in srgb, ${glow} ${l.glow * (sh.opacity ?? 1) * 100}%, transparent)`)
            .join(', ') || 'none';
      });
      this.frame = requestAnimationFrame(tick);
    };
    tick(start);
  }

  /** Ends any morph and shows the current text. */
  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.layer.replaceChildren();
    this.text.style.visibility = '';
    this.el.style.width = '';
  }
}
