import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:respell/respell.dart';
import 'package:respell/src/effect.dart' show RespellPlan;

Widget _morph(String text, {bool reduceMotion = false}) => MediaQuery(
  data: MediaQueryData(disableAnimations: reduceMotion),
  child: Directionality(
    textDirection: TextDirection.ltr,
    child: Respell(text, style: const TextStyle(fontSize: 28)),
  ),
);

void main() {
  testWidgets('morphs to the new text, then rests', (t) async {
    await t.pumpWidget(_morph('zim'));
    await t.pumpWidget(_morph('Results'));
    await t.pump(const Duration(milliseconds: 200));
    expect(t.binding.hasScheduledFrame, isTrue);
    await t.pumpAndSettle();
    expect(t.binding.hasScheduledFrame, isFalse);
  });

  testWidgets('reduce motion swaps the text at once', (t) async {
    await t.pumpWidget(_morph('Results', reduceMotion: true));
    await t.pumpWidget(_morph('zim', reduceMotion: true));
    expect(t.binding.hasScheduledFrame, isFalse);
  });

  testWidgets('labels itself with the text', (t) async {
    final semantics = t.ensureSemantics();
    await t.pumpWidget(_morph('zim'));
    expect(find.bySemanticsLabel('zim'), findsOneWidget);
    semantics.dispose();
  });
  testWidgets('calls onComplete when the morph ends', (t) async {
    var done = 0;
    Widget w(String text) => Directionality(
      textDirection: TextDirection.ltr,
      child: Respell(text, onComplete: () => done++),
    );
    await t.pumpWidget(w('zim'));
    await t.pumpWidget(w('Results'));
    await t.pumpAndSettle();
    expect(done, 1);
  });

  test('a phase eases through its keyframes', () {
    const phase = RespellPhase(
      duration: Duration(milliseconds: 100),
      keyframes: [
        RespellKeyframe(0, RespellLook(blur: 0)),
        RespellKeyframe(.5, RespellLook(blur: 10)),
        RespellKeyframe(1, RespellLook(blur: 0)),
      ],
    );
    expect(phase.lookAt(.25, Curves.linear).blur, 5);
    expect(phase.lookAt(.5, Curves.linear).blur, 10);
    expect(phase.lookAt(2, Curves.linear).blur, 0);
  });

  test('the wave and stagger set the length and order', () {
    const effect = RespellEffect(stagger: Duration(milliseconds: 100));
    final grow = RespellPlan('ab', 'abcd', effect);
    expect(grow.delay(0), 0);
    expect(grow.delay(3), 300);
    expect(grow.length, 300 + 680);
    final shrink = RespellPlan('abcd', 'ab', effect);
    expect(shrink.delay(3), 0);
    expect(shrink.delay(0), 300);
    final together = RespellPlan(
      'abcd',
      'ab',
      effect.copyWith(wave: RespellWave.together),
    );
    expect(together.delay(0), 0);
    expect(together.length, 400);
  });

  test('holdCommonPrefix keeps shared leading letters sharp', () {
    final plan = RespellPlan(
      'Results',
      'Rest',
      const RespellEffect(holdCommonPrefix: true),
    );
    final letters = plan.at(200);
    for (final l in letters.take(3)) {
      expect(l.fromOld, isFalse);
      expect(l.look, RespellEffect.sharp);
    }
    expect(letters[3].look, isNot(RespellEffect.sharp));
  });

  test('chromatic splits letters while they blur and joins them sharp', () {
    final out = RespellEffect.chromatic.swapOut;
    expect(out.lookAt(1, Curves.linear).aberration, 8);
    expect(out.lookAt(.5, Curves.linear).aberration, 4);
    expect(
      RespellEffect.chromatic.swapIn.lookAt(1, Curves.linear).aberration,
      0,
    );
  });
}
