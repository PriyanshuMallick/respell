import { createElement, useEffect, useRef } from 'react';
import { GlyphMorph as Morph } from './glyph-morph.js';

/** A span whose `text` morphs whenever it changes. Other props go to the span. */
export function GlyphMorph({ text, ...props }) {
  const ref = useRef(null);
  const morph = useRef(null);
  useEffect(() => {
    morph.current = new Morph(ref.current, text);
    return () => morph.current.stop();
  }, []);
  useEffect(() => morph.current.set(text), [text]);
  return createElement('span', { ...props, ref });
}
