import type { HTMLAttributes, JSX } from 'react';
import type { RespellEffect, RespellOptions } from './respell.js';

export type RespellProps = {
  text: string;
  effect?: RespellEffect;
} & Pick<RespellOptions, 'respectReducedMotion' | 'onComplete'> &
  Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

/** A span whose `text` morphs whenever it changes. Other props go to the span. */
export declare function Respell(props: RespellProps): JSX.Element;
