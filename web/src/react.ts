import { createElement, useEffect, useRef, type HTMLAttributes, type ReactElement } from 'react';
import { Respell as Morph, type RespellEffect, type RespellOptions } from './respell.js';

export type RespellProps = {
  text: string;
  effect?: RespellEffect;
} & Pick<RespellOptions, 'respectReducedMotion' | 'onComplete'> &
  Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

/** A span whose `text` morphs whenever it changes. Other props go to the span. */
export function Respell({ text, effect, respectReducedMotion, onComplete, ...props }: RespellProps): ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  const morph = useRef<Morph | null>(null);
  const options = { ...effect, respectReducedMotion, onComplete };
  useEffect(() => {
    morph.current = new Morph(ref.current!, text, options);
    return () => morph.current!.stop();
  }, []);
  useEffect(() => {
    morph.current!.options = options;
    morph.current!.set(text);
  });
  return createElement('span', { ...props, ref });
}
