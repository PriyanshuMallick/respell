const look = (blur, opacity, dy, glow) => ({ blur, opacity, dy, glow });
const sharp = look(0, 1, 0, 0);
const lit = look(0, 1, 0, 1);
const soft = look(7, 0.7, 0, 1);
const gone = look(11, 0, 4, 1);
const blurredUp = look(7, 0.35, -6, 0);
const blurredDown = look(7, 0.35, 6, 0);

const blurOut = [[0, sharp], [1, blurredUp]];
const blurIn = [[0, blurredDown], [1, sharp]];
const write = [[0, gone], [0.3, soft], [0.7, lit], [1, sharp]];
const backspace = [[0, sharp], [0.3, lit], [0.7, soft], [1, gone]];

// Milliseconds.
const blurOutTime = 150, blurInTime = 250;
const writeTime = 680, backspaceTime = 340, stagger = 45;

// cubic-bezier(0, 0, .2, 1)
function ease(t) {
  const x = (u) => 3 * (1 - u) * u * u * 0.2 + u * u * u;
  const y = (u) => 3 * (1 - u) * (1 - u) * u + 3 * (1 - u) * u * u + u * u * u;
  let lo = 0, hi = 1, u = t;
  for (let i = 0; i < 20; i++) {
    u = (lo + hi) / 2;
    if (x(u) < t) lo = u;
    else hi = u;
  }
  return y(u);
}

const mix = (a, b, t) => a + (b - a) * t;

// The look at p (0 → 1) through keyframes at offsets 0 → 1.
function at(frames, p) {
  const e = ease(Math.min(Math.max(p, 0), 1));
  for (let i = 1; i < frames.length; i++) {
    const [o, l] = frames[i];
    if (e <= o) {
      const [o0, l0] = frames[i - 1];
      const t = (e - o0) / (o - o0);
      return look(mix(l0.blur, l.blur, t), mix(l0.opacity, l.opacity, t), mix(l0.dy, l.dy, t), mix(l0.glow, l.glow, t));
    }
  }
  return frames[frames.length - 1][1];
}

// Start of letter i's part of the wave.
const delayer = (a, b) => (i) => (a.length > b.length ? a.length - 1 - i : i) * stagger;

/** Letters of a and b as they look ms into the morph: [word, index, look][]. */
function letters(a, b, ms) {
  const n = Math.min(a.length, b.length);
  const delay = delayer(a, b);
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = ms - delay(i);
    out.push(t < blurOutTime ? [a, i, at(blurOut, t / blurOutTime)] : [b, i, at(blurIn, (t - blurOutTime) / blurInTime)]);
  }
  for (let i = n; i < a.length; i++) out.push([a, i, at(backspace, (ms - delay(i)) / backspaceTime)]);
  for (let i = n; i < b.length; i++) out.push([b, i, at(write, (ms - delay(i)) / writeTime)]);
  return out;
}

function length(a, b) {
  const n = Math.min(a.length, b.length);
  const delay = delayer(a, b);
  let ms = 0;
  for (let i = 0; i < n; i++) ms = Math.max(ms, delay(i) + blurOutTime + blurInTime);
  for (let i = n; i < a.length; i++) ms = Math.max(ms, delay(i) + backspaceTime);
  for (let i = n; i < b.length; i++) ms = Math.max(ms, delay(i) + writeTime);
  return ms;
}

/**
 * Text in `el` that changes in one wave across its letters. Letters both
 * strings have blur, slide up and swap. Extra letters of a longer string
 * write on with a glow; extra letters of a shorter one backspace from the
 * end. The glow colour is the CSS variable `--respell-glow`.
 */
export class Respell {
  constructor(el, text = '') {
    this.el = el;
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

  /** Morph to `next`. With reduced motion on, swaps at once. */
  set(next) {
    if (next === this.text.textContent) return;
    const from = this.frame ? this.word : this.measure();
    this.stop();
    this.text.textContent = next;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const to = (this.word = this.measure());
    const style = getComputedStyle(this.el);
    const glow = style.getPropertyValue('--respell-glow').trim() || '#C0F250';
    const base = style.color;
    const ms = length(from.chars, to.chars);
    const spans = Array.from({ length: Math.max(from.chars.length, to.chars.length) }, () => {
      const s = document.createElement('span');
      s.style.cssText = 'position:absolute;top:0';
      return s;
    });
    this.layer.replaceChildren(...spans);
    this.text.style.visibility = 'hidden';
    const start = performance.now();
    const tick = (now) => {
      const t = now - start;
      if (t >= ms) return this.stop();
      this.el.style.width = `${mix(from.width, to.width, t / ms)}px`;
      letters(from.chars, to.chars, t).forEach(([word, i, l], k) => {
        const s = spans[k];
        const w = word === from.chars ? from : to;
        s.textContent = w.chars[i];
        s.style.left = `${w.xs[i]}px`;
        s.style.opacity = l.opacity;
        s.style.filter = `blur(${l.blur}px)`;
        s.style.transform = `translateY(${l.dy}px)`;
        s.style.color = `color-mix(in srgb, ${glow} ${l.glow * 100}%, ${base})`;
        s.style.textShadow = `0 0 10px color-mix(in srgb, ${glow} ${l.glow * 75}%, transparent), 0 0 1px color-mix(in srgb, ${glow} ${l.glow * 50}%, transparent)`;
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
