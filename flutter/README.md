# respell

Text that changes in one wave across its letters. By default, letters both texts share blur, slide up and swap. Extra letters of a longer text write on with a glow. Extra letters of a shorter text backspace from the end. Every part of it can be changed.

```dart
Respell(title, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700))
```

Change `title` to morph.

## Parameters

### `Respell`

| Parameter | Type | Default | What it does |
| --- | --- | --- | --- |
| `text` | `String` | required | The text to show. Changing it starts a morph. |
| `style` | `TextStyle?` | `null` | Merged over the ambient `DefaultTextStyle`. |
| `effect` | `RespellEffect` | `RespellEffect()` | How the morph looks and moves. |
| `respectReduceMotion` | `bool` | `true` | Swap at once when `MediaQuery.disableAnimations` is on. |
| `onComplete` | `VoidCallback?` | `null` | Called when a morph finishes. Not called if a newer text cuts it short. |

### `RespellEffect`

| Field | Type | Default | What it does |
| --- | --- | --- | --- |
| `swapOut` | `RespellPhase` | 150 ms, sharp → blurred, up 6 | A letter both texts have, leaving as the old letter. |
| `swapIn` | `RespellPhase` | 250 ms, blurred, down 6 → sharp | The same letter arriving as the new letter, right after `swapOut`. |
| `write` | `RespellPhase` | 680 ms, gone → soft → lit → sharp | A letter only the new, longer text has. |
| `erase` | `RespellPhase` | 340 ms, sharp → lit → soft → gone | A letter only the old, longer text has. |
| `stagger` | `Duration` | 45 ms | Delay between one letter's start and the next one's. |
| `curve` | `Curve` | `Cubic(0, 0, .2, 1)` | Eases every phase that has no curve of its own. |
| `wave` | `RespellWave` | `auto` | `auto` runs left to right as the text grows and right to left as it shrinks. `forward` and `backward` always run one way. `together` moves every letter at once. |
| `glow` | `RespellGlow` | lime, 2 shadows | Colour, tint and shadows of the glow. |
| `animateSize` | `bool` | `true` | Whether the width moves from the old text's width to the new one's. |
| `sizeCurve` | `Curve` | `Curves.linear` | Eases that width over the whole morph. |
| `holdCommonPrefix` | `bool` | `false` | Whether letters the texts share at the start stay still. |

The default phases are `RespellEffect.defaultSwapOut`, `defaultSwapIn`, `defaultWrite` and `defaultErase`. Each class has `copyWith`.

### `RespellPhase`

| Field | Type | What it does |
| --- | --- | --- |
| `duration` | `Duration` | How long the phase takes for one letter. |
| `keyframes` | `List<RespellKeyframe>` | Looks along the phase, ordered by `at`, first at 0 and last at 1. |
| `curve` | `Curve?` | Eases this phase only. Defaults to the effect's `curve`. |

`RespellKeyframe(at, look)` places a `look` at progress `at` (0 → 1).

### `RespellLook`

| Field | Default | What it does |
| --- | --- | --- |
| `blur` | 0 | Blur sigma in logical pixels. |
| `opacity` | 1 | 0 is invisible. |
| `offset` | `Offset.zero` | Shift from the letter's place. |
| `scale` | 1 | Scale around the letter's centre. |
| `glow` | 0 | How strongly the glow shows, 0 to 1. |
| `aberration` | 0 | Split between the red, green and blue channels in logical pixels: red shifts left, blue right. |

`RespellEffect.sharp` is the plain letter.

## Presets

- `RespellEffect()`: the default blur, swap and lime glow.
- `RespellEffect.chromatic`: letters split into red, green and blue as they blur, with no glow.

Both work as a starting point for `copyWith`.

### `RespellGlow`

| Field | Default | What it does |
| --- | --- | --- |
| `color` | `Color(0xFFC0F250)` | Glow colour. |
| `tint` | 1 | How far the letter's own colour moves to `color` at full glow. |
| `shadows` | `[RespellShadow(opacity: .75, blurRadius: 10), RespellShadow(opacity: .5, blurRadius: 1)]` | Shadows in `color`, faded by the letter's glow. |

`RespellGlow.none` turns the glow off.

## Example

```dart
Respell(
  title,
  style: style,
  effect: const RespellEffect().copyWith(
    wave: RespellWave.together,
    glow: const RespellGlow(color: Color(0xFF7CC4FF)),
    swapIn: const RespellPhase(
      duration: Duration(milliseconds: 300),
      keyframes: [
        RespellKeyframe(0, RespellLook(blur: 6, opacity: 0, scale: .6)),
        RespellKeyframe(1, RespellEffect.sharp),
      ],
    ),
  ),
)
```

Supports left-to-right text only. A web version (vanilla JS, a custom element and React) with the same options lives in the same [repository](https://github.com/PriyanshuMallick/respell).
