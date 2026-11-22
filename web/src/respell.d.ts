/**
 * Text in `el` that changes in one wave across its letters. Letters both
 * strings have blur, slide up and swap. Extra letters of a longer string
 * write on with a glow; extra letters of a shorter one backspace from the
 * end. The glow colour is the CSS variable `--respell-glow`.
 */
export declare class Respell {
  constructor(el: HTMLElement, text?: string);
  /** Morph to `next`. With reduced motion on, swaps at once. */
  set(next: string): void;
  /** Ends any morph and shows the current text. */
  stop(): void;
}
