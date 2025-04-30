import 'package:bitsdojo_window/bitsdojo_window.dart';
import 'package:fluent_ui/fluent_ui.dart';
import 'package:linyaps_store/pages/home.dart';

List<NavigationPaneItem> items = [
  PaneItem(
    icon: const Icon(FluentIcons.medal),
    title: const Text('玲珑推荐'),
    body: Home(),
  ),
  PaneItem(
    icon: const Icon(FluentIcons.power_b_i_logo),
    title: const Text('排行榜'),
    body: const _NavigationBodyItem(
      header: Text('排行榜'),
      content: Text('排行榜的内容'),
    ),
  ),
  PaneItem(
    icon: const Icon(FluentIcons.home),
    title: const Text('全部程序'),
    body: const _NavigationBodyItem(),
  ),
  PaneItem(
    icon: const Icon(FluentIcons.remove_event),
    title: const Text('卸载程序'),
    body: const _NavigationBodyItem(),
  ),
  PaneItem(
    icon: const Icon(FluentIcons.cloud_upload),
    title: const Text('更新程序'),
    body: const _NavigationBodyItem(),
  ),
  PaneItem(
    icon: const Icon(FluentIcons.auto_racing),
    title: const Text('玲珑进程'),
    body: const _NavigationBodyItem(),
  ),
  PaneItem(
    icon: const Icon(FluentIcons.settings),
    title: const Text('基础设置'),
    body: const _NavigationBodyItem(),
  ),
  PaneItem(
    icon: const Icon(FluentIcons.info),
    title: const Text('关于程序'),
    body: const _NavigationBodyItem(),
  ),
];

class Layout extends StatefulWidget {
  const Layout({super.key});

  @override
  State<Layout> createState() => _LayoutState();
}

class _LayoutState extends State<Layout> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return NavigationView(
      appBar: NavigationAppBar(
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Expanded(
              child: MoveWindow(
                child: Row(
                  children: [
                    const Text(
                      '玲珑应用商店',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            IconButton(
              icon: const Icon(FluentIcons.download),
              onPressed: () {
              },
            ),
            const SizedBox(width: 8),
            Row(
              spacing: 4,
              children: [
                IconButton(
                  icon: const Icon(FluentIcons.chrome_minimize),
                  onPressed: () {
                    appWindow.minimize();
                  },
                ),
                IconButton(
                  icon: Icon(FluentIcons.chrome_restore),
                  onPressed: () {
                    appWindow.maximizeOrRestore();
                  },
                ),
                IconButton(
                  icon: const Icon(FluentIcons.chrome_close),
                  onPressed: () {
                    appWindow.close();
                  },
                ),
              ],
            ),
          ],
        ),
      ),
      pane: NavigationPane(
        selected: _currentIndex,
        onChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: items,
      )
    );
  }
}

class _NavigationBodyItem extends StatelessWidget {
  const _NavigationBodyItem({
    this.header,
    this.content,
  });

  final Widget? header;
  final Widget? content;

  @override
  Widget build(BuildContext context) {
    return ScaffoldPage(
      header: header,
      content: content ?? const Text('No content'),
    );
  }
}