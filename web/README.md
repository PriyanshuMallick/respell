# respell

Text that changes in one wave across its letters. By default, letters both texts share blur, slide up and swap. Extra letters of a longer text write on with a glow. Extra letters of a shorter text backspace from the end. Every part of it can be changed. Written in TypeScript and shipped as plain JS with no dependencies. React is optional. Types are included.

```sh
npm i respell
```

## React

```jsx
import { Respell } from 'respell/react';

<Respell text={title} className="title" effect={{ wave: 'together' }} onComplete={() => {}} />
```

Other props go to the `span`.

## Custom element (any framework, or none)

```html
<script type="module">import 'respell/element';</script>
<respell-text text="Results"></respell-text>
```

Change the `text` attribute to morph. Set the effect through the `options` property: `el.options = { wave: 'together' }`.

## Vanilla

```js
import { Respell } from 'respell';

const morph = new Respell(document.querySelector('h1'), 'Results', { stagger: 30 });
morph.set('Apps');
```

## Options

Every field is optional and falls back to `defaultEffect`, which is exported.

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `swapOut` | phase | 240 ms, sharp → blurred and lit, up 6 | A letter both texts have, leaving as the old letter. |
| `swapIn` | phase | 360 ms, blurred and lit, down 6 → sharp | The same letter arriving as the new letter. |
| `write` | phase | 600 ms, gone → soft → lit → sharp | A letter only the new, longer text has. |
| `erase` | phase | 600 ms, sharp → lit → soft → gone | A letter only the old, longer text has. |
| `stagger` | ms | 45 | Delay between one letter's start and the next one's. |
| `curve` | curve | `[0, 0, 0.2, 1]` | Eases every phase that has no curve of its own. |
| `wave` | `'auto' \| 'forward' \| 'backward' \| 'together'` | `'auto'` | `auto` runs left to right as the text grows and right to left as it shrinks. |
| `glow` | `{ color, tint, shadows }` | lime, tint 1, 2 shadows | Merged over the default glow. |
| `animateSize` | boolean | `true` | Whether the width moves from the old text's width to the new one's. |
| `sizeCurve` | curve | linear | Eases that width over the whole morph. |
| `holdCommonPrefix` | boolean | `false` | Whether letters the texts share at the start stay still. |
| `aberration` | `{ distance, angle, colors }` | 14 px, 0, `['#f00', '#0f0', '#00f']` | How letters split while their look has `aberration`. `angle` is in radians. `colors` are any CSS colours, from one end of the split to the other. Merged over the default. |
| `respectReducedMotion` | boolean | `true` | Swap at once under `prefers-reduced-motion: reduce`. |
| `onComplete` | `() => void` | none | Called when a morph finishes. Not called if a newer text cuts it short. |

- **Curve:** a function `t => eased`, or cubic-bezier points `[x1, y1, x2, y2]`.
- **Phase:** `{ duration, keyframes: [{ at, look }], curve? }`. Keyframes are ordered by `at`, first at 0 and last at 1.
- **Look:** `{ blur, opacity, x, y, scale, glow, aberration }`. A missing field means the plain letter: blur 0, opacity 1, no shift, scale 1, glow 0, no aberration. `aberration` runs from 0 (whole) to 1 (split by the full distance).
- **Glow:** `color` is any CSS colour. If unset, it falls back to the `--respell-glow` CSS variable, then `#C0F250`. Each shadow is `{ opacity, blur, x, y }` in the glow colour.

```js
import { defaultEffect } from 'respell';

const effect = {
  wave: 'together',
  glow: { color: '#7cc4ff' },
  swapIn: { duration: 300, keyframes: [{ at: 0, look: { blur: 6, opacity: 0, scale: 0.6 } }, { at: 1, look: {} }] },
  write: { ...defaultEffect.write, duration: 900 },
};
```

## Presets

`defaultEffect` gives the blur, swap and lime glow. `chromaticEffect` splits letters into red, green and blue as they blur, with no glow. Both are exported, so you can spread one and change a field:

```js
import { chromaticEffect } from 'respell';

<Respell text={title} effect={chromaticEffect} />

<Respell
  text={title}
  effect={{ ...chromaticEffect, aberration: { distance: 20, angle: 0.8, colors: ['#f0f', '#0f0'] } }}
/>

// The default effect with a pink glow.
<Respell text={title} effect={{ glow: { color: '#ff4fa3' } }} />
```

The text takes its font and colour from CSS (`style`, `className` or any stylesheet), so any font, size, weight or colour works, and the element becomes `inline-block`. Supports left-to-right text only.

Build with `npm i && npm run build`, which compiles `src/` to `dist/`. Run the demo with `python3 -m http.server` in this folder, then open `/demo/`.
