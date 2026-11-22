import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:respell/respell.dart';

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
}
