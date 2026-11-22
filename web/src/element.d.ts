import type { RespellOptions } from './respell.js';

/** `<respell-text text="…">`: morphs whenever `text` changes. Set `options` for the effect. */
export declare class RespellElement extends HTMLElement {
  options: RespellOptions;
}

declare global {
  interface HTMLElementTagNameMap {
    'respell-text': RespellElement;
  }
}
