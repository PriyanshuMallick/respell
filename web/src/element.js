import { Respell } from './respell.js';

/** `<respell-text text="…">`: morphs whenever `text` changes. */
export class RespellElement extends HTMLElement {
  static observedAttributes = ['text'];

  connectedCallback() {
    this.morph ??= new Respell(this, this.getAttribute('text') ?? '');
  }

  attributeChangedCallback(_, __, text) {
    this.morph?.set(text ?? '');
  }

  disconnectedCallback() {
    this.morph?.stop();
  }
}

if (!customElements.get('respell-text')) customElements.define('respell-text', RespellElement);
