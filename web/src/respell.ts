/** How one letter looks at a moment of the morph. Missing fields are sharp. */
export interface RespellLook {
  /** Blur radius in px. Default 0. */
  blur?: number;
  /** 0 is invisible, 1 is opaque. Default 1. */
  opacity?: number;
  /** Shift from the letter's place, in px. Default 0. */
  x?: number;
  y?: number;
  /** Scale around the letter's centre. Default 1. */
  scale?: number;
  /** How strongly the glow shows: 0 none, 1 full. Default 0. */
  glow?: number;
  /** How far the letter splits into the aberration colours: 0 whole, 1 the full distance. Default 0. */
  aberration?: number;
}

/** A look at progress `at` (0 → 1) through a phase. */
export interface RespellKeyframe {
  at: number;
  look: RespellLook;
}

/** A function from 0 → 1 to eased progress, or cubic-bezier points. */
export type RespellCurve = ((t: number) => number) | readonly [x1: number, y1: number, x2: number, y2: number];

/** One part of a letter's morph. */
export interface RespellPhase {
  /** Milliseconds. */
  duration: number;
  /** In order of `at`, the first at 0 and the last at 1. */
  keyframes: RespellKeyframe[];
  /** Defaults to the effect's `curve`. */
  curve?: RespellCurve;
}

/** A shadow in the glow colour, faded by the letter's glow. */
export interface RespellShadow {
  opacity?: number;
  /** px */
  blur?: number;
  x?: number;
  y?: number;
}

export interface RespellGlow {
  /** Any CSS colour. Defaults to `--respell-glow`, then #C0F250. */
  color?: string;
  /** How far the letter's colour moves to the glow colour at full glow. Default 1. */
  tint?: number;
  shadows?: RespellShadow[];
}

/**
 * How letters split while their look has `aberration`. Each copy is the
 * letter multiplied by its colour, added together. Colours that add up to
 * white keep the letter's colour where copies overlap.
 */
export interface RespellAberration {
  /** px each end copy moves at full aberration. Default 14. */
  distance?: number;
  /** Direction in radians; 0 runs the first colour left, the last right. Default 0. */
  angle?: number;
  /** Any CSS colours, from one end of the split to the other. Default red, green, blue. */
  colors?: string[];
}

/** Every field falls back to `defaultEffect`. */
export interface RespellEffect {
  /** A letter both texts have, leaving with the old letter. */
  swapOut?: RespellPhase;
  /** The same letter arriving with the new letter, right after swapOut. */
  swapIn?: RespellPhase;
  /** A letter only the new, longer text has. */
  write?: RespellPhase;
  /** A letter only the old, longer text has. */
  erase?: RespellPhase;
  /** Milliseconds between one letter's start and the next along the wave. Default 45. */
  stagger?: number;
  /** Eases every phase without its own curve. Default [0, 0, 0.2, 1]. */
  curve?: RespellCurve;
  /**
   * auto: left to right when the text grows, right to left when it shrinks.
   * forward / backward: always one way. together: all letters at once.
   */
  wave?: 'auto' | 'forward' | 'backward' | 'together';
  /** Merged over the default glow. */
  glow?: RespellGlow;
  /** Whether the width moves from the old text's to the new one's. Default true. */
  animateSize?: boolean;
  /** Eases the width over the whole morph. Default linear. */
  sizeCurve?: RespellCurve;
  /** Whether letters the texts share at the start stay still. Default false. */
  holdCommonPrefix?: boolean;
  /** Merged over the default split. */
  aberration?: RespellAberration;
}

export interface RespellOptions extends RespellEffect {
  /** Swap at once under prefers-reduced-motion: reduce. Default true. */
  respectReducedMotion?: boolean;
  /** Called when a morph finishes. Not called when a newer text cuts it short. */
  onComplete?: () => void;
}

type Effect = Required<Omit<RespellEffect, 'glow' | 'aberration'>> & {
  glow: RespellGlow & Required<Omit<RespellGlow, 'color'>>;
  aberration: Required<RespellAberration>;
};
type Look = Required<RespellLook>;
type Word = { chars: string[]; xs: number[]; width: number };

const sharp: RespellLook = {};

/** The default effect. Every field of an effect you pass falls back to this. */
export const defaultEffect: Readonly<Effect> = Object.freeze<Effect>({
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
  aberration: { distance: 14, angle: 0, colors: ['#f00', '#0f0', '#00f'] },
});

/**
 * Letters split into the `aberration` colours as they blur, with no glow.
 * Change the split with `{ ...chromaticEffect, aberration: { distance: 20 } }`.
 */
export const chromaticEffect: Readonly<RespellEffect> = Object.freeze<RespellEffect>({
  swapOut: { duration: 150, keyframes: [{ at: 0, look: sharp }, { at: 1, look: { blur: 3, opacity: 0.6, y: -6, aberration: 0.6 } }] },
  swapIn: { duration: 250, keyframes: [{ at: 0, look: { blur: 3, opacity: 0.6, y: 6, aberration: 0.6 } }, { at: 1, look: sharp }] },
  write: {
    duration: 680,
    keyframes: [
      { at: 0, look: { blur: 6, opacity: 0, y: 4, aberration: 1 } },
      { at: 0.4, look: { blur: 2, opacity: 0.8, aberration: 0.6 } },
      { at: 1, look: sharp },
    ],
  },
  erase: {
    duration: 340,
    keyframes: [
      { at: 0, look: sharp },
      { at: 0.6, look: { blur: 2, opacity: 0.8, aberration: 0.6 } },
      { at: 1, look: { blur: 6, opacity: 0, y: 4, aberration: 1 } },
    ],
  },
  glow: { tint: 0, shadows: [] },
});

// [r, g, b] of a CSS colour as the page resolves it.
function rgbOf(el: HTMLElement, color: string): number[] {
  const probe = document.createElement('span');
  probe.style.color = color;
  el.append(probe);
  const [r, g, b] = getComputedStyle(probe).color.match(/[\d.]+/g)!.map(Number);
  probe.remove();
  return [r, g, b];
}

// A curve as a function, from a function or cubic-bezier points.
function curveOf(c: RespellCurve): (t: number) => number {
  if (typeof c === 'function') return c;
  const [x1, y1, x2, y2] = c;
  const b = (p1: number, p2: number, u: number) => 3 * (1 - u) * (1 - u) * u * p1 + 3 * (1 - u) * u * u * p2 + u * u * u;
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

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
const full = (l: RespellLook): Look => ({ blur: 0, opacity: 1, x: 0, y: 0, scale: 1, glow: 0, aberration: 0, ...l });

function lerpLook(a: Look, b: Look, t: number): Look {
  const out = {} as Look;
  for (const k in a) out[k as keyof Look] = mix(a[k as keyof Look], b[k as keyof Look], t);
  out.blur = Math.max(out.blur, 0);
  out.opacity = clamp(out.opacity);
  out.glow = clamp(out.glow);
  out.aberration = clamp(out.aberration);
  return out;
}

// The look at progress p (0 → 1) through a phase's keyframes.
function lookAt(phase: RespellPhase, p: number, curve: (t: number) => number): Look {
  const e = (phase.curve ? curveOf(phase.curve) : curve)(clamp(p));
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
function plan(a: string[], b: string[], e: Effect) {
  const n = Math.min(a.length, b.length);
  let prefix = 0;
  if (e.holdCommonPrefix) while (prefix < n && a[prefix] === b[prefix]) prefix++;
  const backward = e.wave === 'backward' || (e.wave === 'auto' && a.length > b.length);
  const stagger = e.wave === 'together' ? 0 : e.stagger;
  const last = Math.max(a.length, b.length) - 1;
  const delay = (i: number) => (backward ? last - i : i) * stagger;
  const curve = curveOf(e.curve);
  const look = (phase: RespellPhase, ms: number) => lookAt(phase, phase.duration ? ms / phase.duration : 1, curve);
  let length = 0;
  for (let i = prefix; i < n; i++) length = Math.max(length, delay(i) + e.swapOut.duration + e.swapIn.duration);
  for (let i = n; i < a.length; i++) length = Math.max(length, delay(i) + e.erase.duration);
  for (let i = n; i < b.length; i++) length = Math.max(length, delay(i) + e.write.duration);
  // Letters as they look ms into the morph: [fromOld, index, look][].
  const at = (ms: number) => {
    const out: [boolean, number, Look][] = [];
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
  /** Read on every `set`, so changes apply from the next morph. */
  options: RespellOptions;
  private el: HTMLElement;
  private text: HTMLSpanElement;
  private layer: HTMLSpanElement;
  private frame = 0;
  private word?: Word;

  constructor(el: HTMLElement, text = '', options: RespellOptions = {}) {
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
  private measure(): Word {
    const node = this.text.firstChild!;
    const left = this.text.getBoundingClientRect().left;
    const chars = Array.from(this.text.textContent!);
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
  set(next: string): void {
    if (next === this.text.textContent) return;
    const { respectReducedMotion = true, onComplete, ...effect } = this.options;
    const e: Effect = {
      ...defaultEffect,
      ...effect,
      glow: { ...defaultEffect.glow, ...effect.glow },
      aberration: { ...defaultEffect.aberration, ...effect.aberration },
    };
    const from = this.frame ? this.word! : this.measure();
    this.stop();
    this.text.textContent = next;
    if (respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const to = (this.word = this.measure());
    const style = getComputedStyle(this.el);
    const glowColor = e.glow.color || style.getPropertyValue('--respell-glow').trim() || '#C0F250';
    const glow = rgbOf(this.el, glowColor);
    const base = rgbOf(this.el, style.color);
    const tints = e.aberration.colors.map((c) => rgbOf(this.el, c).map((v) => v / 255));
    const reach = [Math.cos(e.aberration.angle), Math.sin(e.aberration.angle)].map((v) => v * e.aberration.distance);
    const sizeCurve = curveOf(e.sizeCurve);
    const { length, at } = plan(from.chars, to.chars, e);
    const spans = Array.from({ length: Math.max(from.chars.length, to.chars.length) }, () => {
      // One copy per aberration colour; the first alone draws the letter until it splits.
      const s = document.createElement('span');
      s.style.cssText = 'position:absolute;top:0;transform-origin:center;isolation:isolate';
      s.append(...tints.map(() => document.createElement('span')));
      for (const c of [...s.children].slice(1)) (c as HTMLElement).style.cssText = 'position:absolute;left:0;top:0';
      for (const c of s.children) (c as HTMLElement).style.mixBlendMode = 'plus-lighter';
      return s;
    });
    this.layer.replaceChildren(...spans);
    this.text.style.visibility = 'hidden';
    const start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      if (t >= length) {
        this.stop();
        return onComplete?.();
      }
      this.el.style.width = `${e.animateSize ? mix(from.width, to.width, sizeCurve(t / length)) : to.width}px`;
      at(t).forEach(([fromOld, i, l], k) => {
        const s = spans[k];
        const w = fromOld ? from : to;
        const [r, g, b] = [0, 1, 2].map((c) => mix(base[c], glow[c], l.glow * e.glow.tint));
        const split = l.aberration > 0.01;
        const shadow =
          e.glow.shadows
            .map((sh) => `${sh.x ?? 0}px ${sh.y ?? 0}px ${sh.blur ?? 0}px rgb(${glow.join(' ')} / ${l.glow * (sh.opacity ?? 1)})`)
            .join(', ') || 'none';
        s.style.left = `${w.xs[i]}px`;
        s.style.opacity = `${l.opacity}`;
        s.style.filter = `blur(${l.blur}px)`;
        s.style.transform = `translate(${l.x}px, ${l.y}px) scale(${l.scale})`;
        const n = tints.length;
        [...s.children].forEach((child, k) => {
          const c = child as HTMLElement;
          c.textContent = w.chars[i];
          c.style.display = split || k === 0 ? '' : 'none';
          c.style.textShadow = k === 0 ? shadow : 'none';
          const at = split && n > 1 ? (k / (n - 1)) * 2 - 1 : 0;
          c.style.transform = `translate(${reach[0] * l.aberration * at}px, ${reach[1] * l.aberration * at}px)`;
          c.style.color = split ? `rgb(${r * tints[k][0]} ${g * tints[k][1]} ${b * tints[k][2]})` : `rgb(${r} ${g} ${b})`;
        });
      });
      this.frame = requestAnimationFrame(tick);
    };
    tick(start);
  }

  /** Ends any morph and shows the current text. */
  stop(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.layer.replaceChildren();
    this.text.style.visibility = '';
    this.el.style.width = '';
  }
}
