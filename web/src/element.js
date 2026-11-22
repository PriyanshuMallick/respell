import { GlyphMorph } from './glyph-morph.js';

/** `<glyph-morph text="…">`: morphs whenever `text` changes. */
export class GlyphMorphElement extends HTMLElement {
  static observedAttributes = ['text'];

  connectedCallback() {
    this.morph ??= new GlyphMorph(this, this.getAttribute('text') ?? '');
  }

  attributeChangedCallback(_, __, text) {
    this.morph?.set(text ?? '');
  }

  disconnectedCallback() {
    this.morph?.stop();
  }
}

if (!customElements.get('glyph-morph')) customElements.define('glyph-morph', GlyphMorphElement);
