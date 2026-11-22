import { Respell } from './respell.js';

/** `<respell-text text="…">`: morphs whenever `text` changes. Set `options` for the effect. */
export class RespellElement extends HTMLElement {
  static observedAttributes = ['text'];
  #options = {};

  get options() {
    return this.#options;
  }

  set options(options) {
    this.#options = options;
    if (this.morph) this.morph.options = options;
  }

  connectedCallback() {
    this.morph ??= new Respell(this, this.getAttribute('text') ?? '', this.#options);
  }

  attributeChangedCallback(_, __, text) {
    this.morph?.set(text ?? '');
  }

  disconnectedCallback() {
    this.morph?.stop();
  }
}

if (!customElements.get('respell-text')) customElements.define('respell-text', RespellElement);
