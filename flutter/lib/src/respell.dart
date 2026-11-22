import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

import 'effect.dart';

/// Text that changes in one wave across its letters.
///
/// By default, letters both texts have blur, slide up and swap. Extra
/// letters of a longer text write on with a glow; extra letters of a shorter
/// one backspace from the end. The wave runs left to right, or right to left
/// when the text gets shorter. [effect] changes any of that.
///
/// Left-to-right text only.
class Respell extends StatefulWidget {
  const Respell(
    this.text, {
    super.key,
    this.style,
    this.effect = const RespellEffect(),
    this.respectReduceMotion = true,
    this.onComplete,
  });

  final String text;

  /// Merged over the ambient [DefaultTextStyle].
  final TextStyle? style;

  final RespellEffect effect;

  /// Whether the text swaps at once when [MediaQueryData.disableAnimations]
  /// is on.
  final bool respectReduceMotion;

  /// Called when a morph finishes. Not called when a newer text cuts it short.
  final VoidCallback? onComplete;

  @override
  State<Respell> createState() => _RespellState();
}

class _RespellState extends State<Respell> with SingleTickerProviderStateMixin {
  late final _clock = AnimationController(vsync: this, value: 1)
    ..addStatusListener((s) {
      if (s == AnimationStatus.completed) widget.onComplete?.call();
    });
  TextScaler? _scaler;
  TextStyle? _style;
  late TextPainter _from, _to;
  late RespellPlan _plan;

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
    _plan = RespellPlan(_from.plainText, _to.plainText, widget.effect);
    if (widget.respectReduceMotion && MediaQuery.disableAnimationsOf(context)) {
      _clock.value = 1;
      return;
    }
    _clock.duration = Duration(microseconds: (_plan.length * 1000).ceil());
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
      _plan = RespellPlan(widget.text, widget.text, widget.effect);
    }
    final effect = widget.effect;
    return Semantics(
      label: widget.text,
      child: AnimatedBuilder(
        animation: _clock,
        builder: (context, child) => SizedBox(
          width: effect.animateSize
              ? ui.lerpDouble(
                  _from.width,
                  _to.width,
                  effect.sizeCurve.transform(_clock.value),
                )
              : _to.width,
          height: math.max(_from.height, _to.height),
          child: child,
        ),
        child: CustomPaint(
          painter: _Painter(_from, _to, _plan, effect.glow, _clock),
        ),
      ),
    );
  }
}

class _Painter extends CustomPainter {
  _Painter(this.from, this.to, this.plan, this.glow, this.clock)
    : super(repaint: clock);

  final TextPainter from, to;
  final RespellPlan plan;
  final RespellGlow glow;
  final AnimationController clock;

  @override
  void paint(Canvas canvas, Size size) {
    if (!clock.isAnimating) {
      to.paint(canvas, Offset.zero);
      return;
    }
    for (final (:fromOld, :index, :look) in plan.at(
      clock.value * plan.length,
    )) {
      if (look.opacity == 0) continue;
      final word = fromOld ? from : to;
      final style = (word.text! as TextSpan).style!;
      final glyph = TextPainter(
        text: TextSpan(
          text: word.plainText[index],
          style: style.copyWith(
            color: Color.lerp(style.color, glow.color, look.glow * glow.tint),
            shadows: [
              for (final s in glow.shadows)
                Shadow(
                  color: glow.color.withValues(
                    alpha: glow.color.a * s.opacity * look.glow,
                  ),
                  blurRadius: s.blurRadius,
                  offset: s.offset,
                ),
            ],
          ),
        ),
        textDirection: TextDirection.ltr,
        textScaler: word.textScaler,
      )..layout();
      final at =
          Offset(
            word.getOffsetForCaret(TextPosition(offset: index), Rect.zero).dx,
            0,
          ) +
          look.offset;
      final box = at & glyph.size;
      canvas.saveLayer(
        box.inflate(40 + look.blur * 3),
        Paint()
          ..color = Color.fromRGBO(0, 0, 0, look.opacity)
          ..imageFilter = ui.ImageFilter.blur(
            sigmaX: look.blur,
            sigmaY: look.blur,
          ),
      );
      if (look.scale != 1) {
        canvas
          ..translate(box.center.dx, box.center.dy)
          ..scale(look.scale)
          ..translate(-box.center.dx, -box.center.dy);
      }
      glyph.paint(canvas, at);
      canvas.restore();
      glyph.dispose();
    }
  }

  @override
  bool shouldRepaint(_Painter old) =>
      old.from != from || old.to != to || old.plan != plan || old.glow != glow;
}
