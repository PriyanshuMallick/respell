import 'dart:ui' as ui;

import 'package:flutter/animation.dart';
import 'package:flutter/foundation.dart';

/// How one letter looks at a moment of the morph.
@immutable
class RespellLook {
  const RespellLook({
    this.blur = 0,
    this.opacity = 1,
    this.offset = Offset.zero,
    this.scale = 1,
    this.glow = 0,
  }) : assert(blur >= 0),
       assert(opacity >= 0 && opacity <= 1),
       assert(glow >= 0 && glow <= 1);

  /// Gaussian blur sigma, in logical pixels.
  final double blur;

  /// 0 is invisible, 1 is opaque.
  final double opacity;

  /// Shift from the letter's place in the text, in logical pixels.
  final Offset offset;

  /// Scale around the letter's centre.
  final double scale;

  /// How strongly [RespellGlow] shows: 0 is none, 1 is full.
  final double glow;

  static RespellLook lerp(RespellLook a, RespellLook b, double t) =>
      RespellLook(
        blur: ui.lerpDouble(a.blur, b.blur, t)!.clamp(0, double.infinity),
        opacity: ui.lerpDouble(a.opacity, b.opacity, t)!.clamp(0, 1),
        offset: Offset.lerp(a.offset, b.offset, t)!,
        scale: ui.lerpDouble(a.scale, b.scale, t)!,
        glow: ui.lerpDouble(a.glow, b.glow, t)!.clamp(0, 1),
      );

  RespellLook copyWith({
    double? blur,
    double? opacity,
    Offset? offset,
    double? scale,
    double? glow,
  }) => RespellLook(
    blur: blur ?? this.blur,
    opacity: opacity ?? this.opacity,
    offset: offset ?? this.offset,
    scale: scale ?? this.scale,
    glow: glow ?? this.glow,
  );

  @override
  bool operator ==(Object other) =>
      other is RespellLook &&
      other.blur == blur &&
      other.opacity == opacity &&
      other.offset == offset &&
      other.scale == scale &&
      other.glow == glow;

  @override
  int get hashCode => Object.hash(blur, opacity, offset, scale, glow);
}

/// A [look] at progress [at] (0 → 1) through a [RespellPhase].
@immutable
class RespellKeyframe {
  const RespellKeyframe(this.at, this.look) : assert(at >= 0 && at <= 1);

  final double at;
  final RespellLook look;

  @override
  bool operator ==(Object other) =>
      other is RespellKeyframe && other.at == at && other.look == look;

  @override
  int get hashCode => Object.hash(at, look);
}

/// One part of a letter's morph: how long it takes and how the letter looks
/// along the way.
@immutable
class RespellPhase {
  const RespellPhase({
    required this.duration,
    required this.keyframes,
    this.curve,
  });

  final Duration duration;

  /// In order of [RespellKeyframe.at], the first at 0 and the last at 1.
  final List<RespellKeyframe> keyframes;

  /// Eases progress through [keyframes]. Defaults to [RespellEffect.curve].
  final Curve? curve;

  double get _ms => duration.inMicroseconds / 1000;

  /// The look at progress [p] (0 → 1), eased by [curve] or [fallback].
  RespellLook lookAt(double p, Curve fallback) {
    assert(keyframes.length >= 2);
    final e = (curve ?? fallback).transform(p.clamp(0.0, 1.0));
    for (var i = 1; i < keyframes.length; i++) {
      final k = keyframes[i];
      if (e <= k.at) {
        final k0 = keyframes[i - 1];
        final span = k.at - k0.at;
        return RespellLook.lerp(
          k0.look,
          k.look,
          span == 0 ? 1 : (e - k0.at) / span,
        );
      }
    }
    return keyframes.last.look;
  }

  RespellPhase copyWith({
    Duration? duration,
    List<RespellKeyframe>? keyframes,
    Curve? curve,
  }) => RespellPhase(
    duration: duration ?? this.duration,
    keyframes: keyframes ?? this.keyframes,
    curve: curve ?? this.curve,
  );

  @override
  bool operator ==(Object other) =>
      other is RespellPhase &&
      other.duration == duration &&
      listEquals(other.keyframes, keyframes) &&
      other.curve == curve;

  @override
  int get hashCode => Object.hash(duration, Object.hashAll(keyframes), curve);
}

/// A shadow drawn in [RespellGlow.color], faded by the letter's glow.
@immutable
class RespellShadow {
  const RespellShadow({
    this.opacity = 1,
    this.blurRadius = 0,
    this.offset = Offset.zero,
  });

  final double opacity;
  final double blurRadius;
  final Offset offset;

  @override
  bool operator ==(Object other) =>
      other is RespellShadow &&
      other.opacity == opacity &&
      other.blurRadius == blurRadius &&
      other.offset == offset;

  @override
  int get hashCode => Object.hash(opacity, blurRadius, offset);
}

/// The glow on letters while [RespellLook.glow] is above 0.
@immutable
class RespellGlow {
  const RespellGlow({
    this.color = const Color(0xFFC0F250),
    this.tint = 1,
    this.shadows = const [
      RespellShadow(opacity: .75, blurRadius: 10),
      RespellShadow(opacity: .5, blurRadius: 1),
    ],
  }) : assert(tint >= 0 && tint <= 1);

  /// No glow at all.
  static const none = RespellGlow(tint: 0, shadows: []);

  final Color color;

  /// How far the letter's own colour moves to [color] at full glow.
  final double tint;

  final List<RespellShadow> shadows;

  RespellGlow copyWith({
    Color? color,
    double? tint,
    List<RespellShadow>? shadows,
  }) => RespellGlow(
    color: color ?? this.color,
    tint: tint ?? this.tint,
    shadows: shadows ?? this.shadows,
  );

  @override
  bool operator ==(Object other) =>
      other is RespellGlow &&
      other.color == color &&
      other.tint == tint &&
      listEquals(other.shadows, shadows);

  @override
  int get hashCode => Object.hash(color, tint, Object.hashAll(shadows));
}

/// Which way the wave runs across the letters.
enum RespellWave {
  /// Left to right when the text grows or keeps its length, right to left
  /// when it shrinks.
  auto,

  /// Always left to right.
  forward,

  /// Always right to left.
  backward,

  /// All letters at once.
  together,
}

/// Everything about how [Respell] morphs. Every field has a default, so
/// change only what you need, or start from [RespellEffect.new] and use
/// [copyWith].
@immutable
class RespellEffect {
  const RespellEffect({
    this.swapOut = defaultSwapOut,
    this.swapIn = defaultSwapIn,
    this.write = defaultWrite,
    this.erase = defaultErase,
    this.stagger = const Duration(milliseconds: 45),
    this.curve = const Cubic(0, 0, .2, 1),
    this.wave = RespellWave.auto,
    this.glow = const RespellGlow(),
    this.animateSize = true,
    this.sizeCurve = Curves.linear,
    this.holdCommonPrefix = false,
  });

  /// A letter both texts have, leaving with the old letter.
  final RespellPhase swapOut;

  /// The same letter arriving with the new letter, right after [swapOut].
  final RespellPhase swapIn;

  /// A letter only the new, longer text has.
  final RespellPhase write;

  /// A letter only the old, longer text has.
  final RespellPhase erase;

  /// Delay between one letter's start and the next one's along the wave.
  final Duration stagger;

  /// Eases every phase that has no curve of its own.
  final Curve curve;

  final RespellWave wave;
  final RespellGlow glow;

  /// Whether the width moves from the old text's to the new one's. Off, it
  /// takes the new width at once.
  final bool animateSize;

  /// Eases the width over the whole morph.
  final Curve sizeCurve;

  /// Whether letters the two texts share at the start stay still.
  final bool holdCommonPrefix;

  static const sharp = RespellLook();

  static const defaultSwapOut = RespellPhase(
    duration: Duration(milliseconds: 150),
    keyframes: [
      RespellKeyframe(0, sharp),
      RespellKeyframe(
        1,
        RespellLook(blur: 7, opacity: .35, offset: Offset(0, -6)),
      ),
    ],
  );

  static const defaultSwapIn = RespellPhase(
    duration: Duration(milliseconds: 250),
    keyframes: [
      RespellKeyframe(
        0,
        RespellLook(blur: 7, opacity: .35, offset: Offset(0, 6)),
      ),
      RespellKeyframe(1, sharp),
    ],
  );

  static const defaultWrite = RespellPhase(
    duration: Duration(milliseconds: 680),
    keyframes: [
      RespellKeyframe(
        0,
        RespellLook(blur: 11, opacity: 0, offset: Offset(0, 4), glow: 1),
      ),
      RespellKeyframe(.3, RespellLook(blur: 7, opacity: .7, glow: 1)),
      RespellKeyframe(.7, RespellLook(glow: 1)),
      RespellKeyframe(1, sharp),
    ],
  );

  static const defaultErase = RespellPhase(
    duration: Duration(milliseconds: 340),
    keyframes: [
      RespellKeyframe(0, sharp),
      RespellKeyframe(.3, RespellLook(glow: 1)),
      RespellKeyframe(.7, RespellLook(blur: 7, opacity: .7, glow: 1)),
      RespellKeyframe(
        1,
        RespellLook(blur: 11, opacity: 0, offset: Offset(0, 4), glow: 1),
      ),
    ],
  );

  RespellEffect copyWith({
    RespellPhase? swapOut,
    RespellPhase? swapIn,
    RespellPhase? write,
    RespellPhase? erase,
    Duration? stagger,
    Curve? curve,
    RespellWave? wave,
    RespellGlow? glow,
    bool? animateSize,
    Curve? sizeCurve,
    bool? holdCommonPrefix,
  }) => RespellEffect(
    swapOut: swapOut ?? this.swapOut,
    swapIn: swapIn ?? this.swapIn,
    write: write ?? this.write,
    erase: erase ?? this.erase,
    stagger: stagger ?? this.stagger,
    curve: curve ?? this.curve,
    wave: wave ?? this.wave,
    glow: glow ?? this.glow,
    animateSize: animateSize ?? this.animateSize,
    sizeCurve: sizeCurve ?? this.sizeCurve,
    holdCommonPrefix: holdCommonPrefix ?? this.holdCommonPrefix,
  );

  @override
  bool operator ==(Object other) =>
      other is RespellEffect &&
      other.swapOut == swapOut &&
      other.swapIn == swapIn &&
      other.write == write &&
      other.erase == erase &&
      other.stagger == stagger &&
      other.curve == curve &&
      other.wave == wave &&
      other.glow == glow &&
      other.animateSize == animateSize &&
      other.sizeCurve == sizeCurve &&
      other.holdCommonPrefix == holdCommonPrefix;

  @override
  int get hashCode => Object.hash(
    swapOut,
    swapIn,
    write,
    erase,
    stagger,
    curve,
    wave,
    glow,
    animateSize,
    sizeCurve,
    holdCommonPrefix,
  );
}

/// One letter in a morph: whether it comes from the old text, its index
/// there and its look.
typedef RespellLetter = ({bool fromOld, int index, RespellLook look});

/// The plan for morphing [a] into [b] under [effect].
class RespellPlan {
  RespellPlan(this.a, this.b, this.effect);

  final String a, b;
  final RespellEffect effect;

  int get _n => a.length < b.length ? a.length : b.length;

  late final int _prefix = () {
    if (!effect.holdCommonPrefix) return 0;
    var i = 0;
    while (i < _n && a.codeUnitAt(i) == b.codeUnitAt(i)) {
      i++;
    }
    return i;
  }();

  bool get _backward => switch (effect.wave) {
    RespellWave.auto => a.length > b.length,
    RespellWave.forward => false,
    RespellWave.backward => true,
    RespellWave.together => false,
  };

  double get _stagger => effect.wave == RespellWave.together
      ? 0
      : effect.stagger.inMicroseconds / 1000;

  int get _last => (a.length > b.length ? a.length : b.length) - 1;

  /// Start of letter [i]'s part of the wave, in milliseconds.
  double delay(int i) => (_backward ? _last - i : i) * _stagger;

  late final double length = [
    0.0,
    for (var i = _prefix; i < _n; i++)
      delay(i) + effect.swapOut._ms + effect.swapIn._ms,
    for (var i = _n; i < a.length; i++) delay(i) + effect.erase._ms,
    for (var i = _n; i < b.length; i++) delay(i) + effect.write._ms,
  ].reduce((x, y) => x > y ? x : y);

  RespellLook _look(RespellPhase phase, double ms) =>
      phase.lookAt(phase._ms == 0 ? 1 : ms / phase._ms, effect.curve);

  List<RespellLetter> at(double ms) {
    final out = effect;
    return [
      for (var i = 0; i < _prefix; i++)
        (fromOld: false, index: i, look: RespellEffect.sharp),
      for (var i = _prefix; i < _n; i++)
        if (ms - delay(i) < out.swapOut._ms)
          (fromOld: true, index: i, look: _look(out.swapOut, ms - delay(i)))
        else
          (
            fromOld: false,
            index: i,
            look: _look(out.swapIn, ms - delay(i) - out.swapOut._ms),
          ),
      for (var i = _n; i < a.length; i++)
        (fromOld: true, index: i, look: _look(out.erase, ms - delay(i))),
      for (var i = _n; i < b.length; i++)
        (fromOld: false, index: i, look: _look(out.write, ms - delay(i))),
    ];
  }
}
