import { Respell, type RespellOptions } from './respell.js';

/** `<respell-text text="…">`: morphs whenever `text` changes. Set `options` for the effect. */
export class RespellElement extends HTMLElement {
  static observedAttributes = ['text'];
  #options: RespellOptions = {};
  private morph?: Respell;

  get options(): RespellOptions {
    return this.#options;
  }

  set options(options: RespellOptions) {
    this.#options = options;
    if (this.morph) this.morph.options = options;
  }

  connectedCallback() {
    this.morph ??= new Respell(this, this.getAttribute('text') ?? '', this.#options);
  }

  attributeChangedCallback(_: string, __: string | null, text: string | null) {
    this.morph?.set(text ?? '');
  }

  disconnectedCallback() {
    this.morph?.stop();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'respell-text': RespellElement;
  }
}

if (!customElements.get('respell-text')) customElements.define('respell-text', RespellElement);
