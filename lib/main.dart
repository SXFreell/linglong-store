import 'package:fluent_ui/fluent_ui.dart';
import 'package:bitsdojo_window/bitsdojo_window.dart';
import 'package:linyaps_store/layout/layout.dart';

void main() {
  runApp(const MyApp());
  doWhenWindowReady(() {
    appWindow
      ..minSize = const Size(400, 600)
      ..alignment = Alignment.center
      ..size = const Size(1280, 720)
      ..show();
  });
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        // color: Colors.transparent, // 背景颜色
        border: Border.all(
          color: Colors.black.withAlpha(30), // 边框颜色
          width: 1, // 边框宽度
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: FluentApp(
        theme: FluentThemeData(
          brightness: Brightness.light,
          accentColor: Colors.blue,
        ),
        darkTheme: FluentThemeData(
          brightness: Brightness.dark,
          accentColor: Colors.blue,
        ),
        home: const Layout(),
      )
    );
  }
}