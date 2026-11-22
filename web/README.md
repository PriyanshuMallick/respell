# respell

Text that changes in one wave across its letters. Letters both strings share blur, slide up and swap. Extra letters of a longer string write on with a glow. Extra letters of a shorter string backspace from the end. No dependencies and no build step. React is optional.

```sh
npm i respell
```

## React

```jsx
import { Respell } from 'respell/react';

<Respell text={title} className="title" />
```

## Custom element (any framework, or none)

```html
<script type="module">import 'respell/element';</script>
<respell-text text="Results"></respell-text>
```

Change the `text` attribute to morph. Vue, Svelte, Angular and Solid can bind to it like any other attribute.

## Vanilla

```js
import { Respell } from 'respell';

const morph = new Respell(document.querySelector('h1'), 'Results');
morph.set('Apps');
```

## Styling

The text takes its font and colour from CSS. Set the glow colour with a CSS variable:

```css
.title { --respell-glow: #c0f250; }
```

The element becomes `inline-block`. While it morphs, its width moves from the old text's width to the new one's, so centred text drifts into place instead of jumping. With `prefers-reduced-motion: reduce`, the text swaps at once. Supports left-to-right text only.

Run the demo with `python3 -m http.server` in this folder, then open `/demo/`.
