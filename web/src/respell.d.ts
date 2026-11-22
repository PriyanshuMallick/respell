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
  /** Horizontal split between red, green and blue in px: red left, blue right. Default 0. */
  aberration?: number;
}

/** A look at progress `at` (0 → 1) through a phase. */
export interface RespellKeyframe {
  at: number;
  look: RespellLook;
}

/** A function from 0 → 1 to eased progress, or cubic-bezier points. */
export type RespellCurve = ((t: number) => number) | [x1: number, y1: number, x2: number, y2: number];

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
}

export interface RespellOptions extends RespellEffect {
  /** Swap at once under prefers-reduced-motion: reduce. Default true. */
  respectReducedMotion?: boolean;
  /** Called when a morph finishes. Not called when a newer text cuts it short. */
  onComplete?: () => void;
}

export declare const defaultEffect: Readonly<Required<Omit<RespellEffect, 'glow'>> & { glow: Required<Omit<RespellGlow, 'color'>> }>;

/** Letters split into red, green and blue as they blur, with no glow. */
export declare const chromaticEffect: Readonly<RespellEffect>;

/** Text in `el` that changes in one wave across its letters. */
export declare class Respell {
  constructor(el: HTMLElement, text?: string, options?: RespellOptions);
  /** Read on every `set`, so changes apply from the next morph. */
  options: RespellOptions;
  /** Morph to `next`. */
  set(next: string): void;
  /** Ends any morph and shows the current text. */
  stop(): void;
}
