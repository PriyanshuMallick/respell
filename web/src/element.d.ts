/** `<respell-text text="…">`: morphs whenever `text` changes. */
export declare class RespellElement extends HTMLElement {}

declare global {
  interface HTMLElementTagNameMap {
    'respell-text': RespellElement;
  }
}
