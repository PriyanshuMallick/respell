import { createElement, useEffect, useRef } from 'react';
import { Respell as Morph } from './respell.js';

/** A span whose `text` morphs whenever it changes. Other props go to the span. */
export function Respell({ text, effect, respectReducedMotion, onComplete, ...props }) {
  const ref = useRef(null);
  const morph = useRef(null);
  const options = { ...effect, respectReducedMotion, onComplete };
  useEffect(() => {
    morph.current = new Morph(ref.current, text, options);
    return () => morph.current.stop();
  }, []);
  useEffect(() => {
    morph.current.options = options;
    morph.current.set(text);
  });
  return createElement('span', { ...props, ref });
}
