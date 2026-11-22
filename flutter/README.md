# glyph_morph

Text that changes in one wave across its letters. Letters both strings share blur, slide up and swap. Extra letters of a longer string write on with a glow. Extra letters of a shorter string backspace from the end.

```dart
GlyphMorph(
  title,
  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
  glow: const Color(0xFFC0F250),
)
```

Change `title` to morph. `style` merges over the ambient `DefaultTextStyle`. While the text morphs, the widget's width moves from the old text's width to the new one's. With reduce motion on (`MediaQuery.disableAnimations`), the text swaps at once. Supports left-to-right text only.

A web version (vanilla JS, a custom element and React) lives in the same [repository](https://github.com/PriyanshuMallick/glyph-morph).
