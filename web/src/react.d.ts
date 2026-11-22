import type { HTMLAttributes, JSX } from 'react';

/** A span whose `text` morphs whenever it changes. Other props go to the span. */
export declare function Respell(
  props: { text: string } & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
): JSX.Element;
