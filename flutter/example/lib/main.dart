import 'package:flutter/widgets.dart';
import 'package:respell/respell.dart';

const _words = ['zim', 'Results', 'Apps', 'Settings', 'Blocked'];

const _style = TextStyle(
  color: Color(0xFFFFFFFF),
  fontSize: 48,
  fontWeight: FontWeight.w700,
);

void main() => runApp(
  const Directionality(textDirection: TextDirection.ltr, child: Demo()),
);

class Demo extends StatefulWidget {
  const Demo({super.key});

  @override
  State<Demo> createState() => _DemoState();
}

class _DemoState extends State<Demo> {
  var _i = 0;

  @override
  Widget build(BuildContext context) => GestureDetector(
    behavior: HitTestBehavior.opaque,
    onTap: () => setState(() => _i = (_i + 1) % _words.length),
    child: ColoredBox(
      color: const Color(0xFF0B0B0B),
      child: Padding(
        padding: const EdgeInsets.only(left: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 48,
          children: [
            Respell(_words[_i], style: _style),
            Respell(_words[_i], style: _style, effect: RespellEffect.chromatic),
          ],
        ),
      ),
    ),
  );
}
