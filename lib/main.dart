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
    return FluentApp(
      theme: FluentThemeData(
        brightness: Brightness.light,
        accentColor: Colors.blue,
      ),
      darkTheme: FluentThemeData(
        brightness: Brightness.dark,
        accentColor: Colors.blue,
      ),
      home: const Layout(),
    );
  }
}