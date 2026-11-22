import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

/// Text that changes in one wave across its letters.
///
/// Letters both strings have blur, slide up and swap. Extra letters of a
/// longer string write on with a [glow]; extra letters of a shorter one
/// backspace from the end. The wave runs left to right, or right to left
/// when the text gets shorter. With reduce motion on, the text swaps at once.
///
/// Left-to-right text only.
class Respell extends StatefulWidget {
  const Respell(
    this.text, {
    super.key,
    this.style,
    this.glow = const Color(0xFFC0F250),
  });

  final String text;

  /// Merged over the ambient [DefaultTextStyle].
  final TextStyle? style;

  /// Colour of the glow on letters that write on or backspace.
  final Color glow;

  @override
  State<Respell> createState() => _RespellState();
}

class _RespellState extends State<Respell>
    with SingleTickerProviderStateMixin {
  late final _clock = AnimationController(vsync: this, value: 1);
  TextScaler? _scaler;
  TextStyle? _style;
  late TextPainter _from, _to;

  TextPainter _lay(String text) => TextPainter(
    text: TextSpan(text: text, style: _style),
    textDirection: TextDirection.ltr,
    textScaler: _scaler!,
  )..layout();

  void _drop(TextPainter from) {
    if (!identical(from, _to)) from.dispose();
  }

  @override
  void didUpdateWidget(Respell old) {
    super.didUpdateWidget(old);
    if (widget.text == old.text) return;
    _drop(_from);
    _from = _to;
    _to = _lay(widget.text);
    if (MediaQuery.disableAnimationsOf(context)) {
      _clock.value = 1;
      return;
    }
    _clock.duration = Duration(milliseconds: _Morph(_from, _to).length.ceil());
    _clock.forward(from: 0);
  }

  @override
  void dispose() {
    _drop(_from);
    _to.dispose();
    _clock.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scaler = MediaQuery.textScalerOf(context);
    final style = DefaultTextStyle.of(context).style.merge(widget.style);
    if (scaler != _scaler || style != _style) {
      if (_scaler != null) {
        _drop(_from);
        _to.dispose();
      }
      _scaler = scaler;
      _style = style;
      _from = _to = _lay(widget.text);
    }
    return Semantics(
      label: widget.text,
      child: AnimatedBuilder(
        animation: _clock,
        builder: (context, child) => SizedBox(
          width: ui.lerpDouble(_from.width, _to.width, _clock.value),
          height: math.max(_from.height, _to.height),
          child: child,
        ),
        child: CustomPaint(
          painter: _MorphPainter(_from, _to, widget.glow, _clock),
        ),
      ),
    );
  }
}

typedef _Look = ({double blur, double opacity, double dy, double glow});

_Look _mix(_Look a, _Look b, double t) => (
  blur: ui.lerpDouble(a.blur, b.blur, t)!,
  opacity: ui.lerpDouble(a.opacity, b.opacity, t)!,
  dy: ui.lerpDouble(a.dy, b.dy, t)!,
  glow: ui.lerpDouble(a.glow, b.glow, t)!,
);

const _sharp = (blur: 0.0, opacity: 1.0, dy: 0.0, glow: 0.0);
const _lit = (blur: 0.0, opacity: 1.0, dy: 0.0, glow: 1.0);
const _soft = (blur: 7.0, opacity: .7, dy: 0.0, glow: 1.0);
const _gone = (blur: 11.0, opacity: 0.0, dy: 4.0, glow: 1.0);
const _blurredUp = (blur: 7.0, opacity: .35, dy: -6.0, glow: 0.0);
const _blurredDown = (blur: 7.0, opacity: .35, dy: 6.0, glow: 0.0);

const _blurOut = <(double, _Look)>[(0, _sharp), (1, _blurredUp)];
const _blurIn = <(double, _Look)>[(0, _blurredDown), (1, _sharp)];
const _write = <(double, _Look)>[
  (0, _gone),
  (.3, _soft),
  (.7, _lit),
  (1, _sharp),
];
const _backspace = <(double, _Look)>[
  (0, _sharp),
  (.3, _lit),
  (.7, _soft),
  (1, _gone),
];

/// Milliseconds.
const _blurOutTime = 150.0, _blurInTime = 250.0;
const _writeTime = 680.0, _backspaceTime = 340.0, _stagger = 45.0;

const _ease = Cubic(0, 0, .2, 1);

/// The look at [p] (0 → 1) through keyframes at offsets 0 → 1.
_Look _at(List<(double, _Look)> frames, double p) {
  final e = _ease.transform(p.clamp(0.0, 1.0));
  for (var i = 1; i < frames.length; i++) {
    final (o, look) = frames[i];
    if (e <= o) {
      final (o0, look0) = frames[i - 1];
      return _mix(look0, look, (e - o0) / (o - o0));
    }
  }
  return frames.last.$2;
}

/// One letter in the morph: the word it comes from, its index there and its look.
typedef _Letter = ({TextPainter word, int index, _Look look});

class _Morph {
  _Morph(this.from, this.to);

  final TextPainter from, to;

  String get _a => from.plainText;
  String get _b => to.plainText;
  int get _n => math.min(_a.length, _b.length);
  bool get _shrink => _a.length > _b.length;

  /// Start of letter [i]'s part of the wave.
  double _delay(int i) => (_shrink ? _a.length - 1 - i : i) * _stagger;

  double get length => [
    for (var i = 0; i < _n; i++) _delay(i) + _blurOutTime + _blurInTime,
    for (var i = _n; i < _a.length; i++) _delay(i) + _backspaceTime,
    for (var i = _n; i < _b.length; i++) _delay(i) + _writeTime,
  ].fold(0.0, math.max);

  List<_Letter> at(double ms) => [
    for (var i = 0; i < _n; i++)
      if (ms - _delay(i) < _blurOutTime)
        (
          word: from,
          index: i,
          look: _at(_blurOut, (ms - _delay(i)) / _blurOutTime),
        )
      else
        (
          word: to,
          index: i,
          look: _at(_blurIn, (ms - _delay(i) - _blurOutTime) / _blurInTime),
        ),
    for (var i = _n; i < _a.length; i++)
      (
        word: from,
        index: i,
        look: _at(_backspace, (ms - _delay(i)) / _backspaceTime),
      ),
    for (var i = _n; i < _b.length; i++)
      (word: to, index: i, look: _at(_write, (ms - _delay(i)) / _writeTime)),
  ];
}

class _MorphPainter extends CustomPainter {
  _MorphPainter(this.from, this.to, this.glow, this.clock)
    : super(repaint: clock);

  final TextPainter from, to;
  final Color glow;
  final AnimationController clock;

  @override
  void paint(Canvas canvas, Size size) {
    if (!clock.isAnimating) {
      to.paint(canvas, Offset.zero);
      return;
    }
    final morph = _Morph(from, to);
    for (final (:word, :index, :look) in morph.at(clock.value * morph.length)) {
      if (look.opacity == 0) continue;
      final style = (word.text! as TextSpan).style!;
      final glyph = TextPainter(
        text: TextSpan(
          text: word.plainText[index],
          style: style.copyWith(
            color: Color.lerp(style.color, glow, look.glow),
            shadows: [
              Shadow(
                color: glow.withValues(alpha: .75 * look.glow),
                blurRadius: 10,
              ),
              Shadow(
                color: glow.withValues(alpha: .5 * look.glow),
                blurRadius: 1,
              ),
            ],
          ),
        ),
        textDirection: TextDirection.ltr,
        textScaler: word.textScaler,
      )..layout();
      final at = Offset(
        word.getOffsetForCaret(TextPosition(offset: index), Rect.zero).dx,
        look.dy,
      );
      canvas.saveLayer(
        (at & glyph.size).inflate(40),
        Paint()
          ..color = Color.fromRGBO(0, 0, 0, look.opacity)
          ..imageFilter = ui.ImageFilter.blur(
            sigmaX: look.blur,
            sigmaY: look.blur,
          ),
      );
      glyph.paint(canvas, at);
      canvas.restore();
      glyph.dispose();
    }
  }

  @override
  bool shouldRepaint(_MorphPainter old) =>
      old.from != from || old.to != to || old.glow != glow;
}
