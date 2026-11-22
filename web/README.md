# glyph-morph

Text that changes in one wave across its letters. Letters both strings share blur, slide up and swap. Extra letters of a longer string write on with a glow. Extra letters of a shorter string backspace from the end. No dependencies and no build step. React is optional.

```sh
npm i glyph-morph
```

## React

```jsx
import { GlyphMorph } from 'glyph-morph/react';

<GlyphMorph text={title} className="title" />
```

## Custom element (any framework, or none)

```html
<script type="module">import 'glyph-morph/element';</script>
<glyph-morph text="Results"></glyph-morph>
```

Change the `text` attribute to morph. Vue, Svelte, Angular and Solid can bind to it like any other attribute.

## Vanilla

```js
import { GlyphMorph } from 'glyph-morph';

const morph = new GlyphMorph(document.querySelector('h1'), 'Results');
morph.set('Apps');
```

## Styling

The text takes its font and colour from CSS. Set the glow colour with a CSS variable:

```css
.title { --glyph-morph-glow: #c0f250; }
```

The element becomes `inline-block`. While it morphs, its width moves from the old text's width to the new one's, so centred text drifts into place instead of jumping. With `prefers-reduced-motion: reduce`, the text swaps at once. Supports left-to-right text only.

Run the demo with `python3 -m http.server` in this folder, then open `/demo/`.
