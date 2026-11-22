/** `<glyph-morph text="…">`: morphs whenever `text` changes. */
export declare class GlyphMorphElement extends HTMLElement {}

declare global {
  interface HTMLElementTagNameMap {
    'glyph-morph': GlyphMorphElement;
  }
}
