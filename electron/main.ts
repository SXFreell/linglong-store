import { app, BrowserWindow, shell, Menu, screen, ipcMain, protocol } from "electron";
import { join } from "node:path";
import { mainLog } from "./logger";
import TrayMenu from "./trayMenu";
import IPCHandler from "./ipcHandler";
import { updateHandle } from "./update";
import { clearUpdateCache } from "./utils";
import installList from "./utils/installList";

process.env.DIST_ELECTRON = join(__dirname, '../dist-electron');
process.env.DIST = join(__dirname, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST;

const preload = join(__dirname, 'preload.js')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

let win: BrowserWindow | null;
let floatingWin: BrowserWindow | null; // 悬浮球窗口
let floatingEnabled = false;

// 创建窗口并初始化相关参数
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    icon: join(process.env.PUBLIC, "logo.png"),
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false, // 解决渲染进程中无法使用nodejs/electron函数方法
      // webSecurity: false, // 禁用 Web 安全策略
    },
  });
  mainLog.info("dev环境的配置地址", VITE_DEV_SERVER_URL);
  mainLog.info("pro环境的配置地址", indexHtml);
  // 禁用菜单，一般情况下，不需要禁用
  Menu.setApplicationMenu(null);
  // 根据是否存在开发服务地址判断加载模式
  if (process.env.VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools({ mode: "detach" });
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(indexHtml);
  }
  // 测试程序加载完毕，打印当前时间
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });
  // 设置所有链接通过默认浏览器打开，而非程序内打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    mainLog.info("打开url", url);
    // 如果是http或https协议的链接，则通过默认浏览器打开
    if (url.startsWith("https:") || url.startsWith("http:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

// 创建悬浮球
function floatingBall() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  floatingWin = new BrowserWindow({
    width: 50,                // 宽度
    height: 80,               // 高度
    frame: false,             // 无边框窗口
    transparent: true,        // 背景透明
    alwaysOnTop: true,        // 窗口始终在最上面
    resizable: false,         // 禁止改变窗口大小
    hasShadow: false,         // 不需要窗口阴影
    x: width - 100,           // 默认定位-宽度减100 在右边
    y: height - 150,          // 默认定位-高度减100 在下边
    webPreferences: {
      // preload: join(__dirname, 'preloadBall.js'),
      preload,
      contextIsolation: false,
      nodeIntegration: true   // 允许使用Node.js
    }
  });
  // 禁用菜单，一般情况下，不需要禁用
  Menu.setApplicationMenu(null);
  // 根据是否存在开发服务地址判断加载模式
  // if (process.env.VITE_DEV_SERVER_URL) {
  //     // floatingBallWindow.webContents.openDevTools({ mode: "detach" });
  //     floatingBallWindow.loadFile(join(process.env.PUBLIC, '../floatingBall/index.html'));
  // } else {
  //     floatingBallWindow.loadFile(floatingBallHtml);
  // }
  floatingWin.webContents.openDevTools({ mode: "detach" });
  mainLog.info("createFloatingBallWindow", VITE_DEV_SERVER_URL + "floating");
  
  if (process.env.VITE_DEV_SERVER_URL) {
    floatingWin.loadURL(VITE_DEV_SERVER_URL + "floating")
  } else {
    floatingWin.loadFile(indexHtml);
  }

  floatingWin.on('closed', () => {
    console.log('Floating closed');
    floatingWin = null;
  });

}

// 应用准备就绪创建窗口
app.whenReady().then(() => {

  protocol.registerHttpProtocol('linyapsss', (request, callback) => {
    // 这里处理 URL，例如：linyapsSs://action
    // 检查请求的 URL 是否正确
    mainLog.info('request自定义协议打开的地址：', request.url);
    // 启动应用程序的相关操作
  });

  // 注册协议并关联
  app.setAsDefaultProtocolClient('linyapsss');

  // 注册自定义协议
  // app.setAsDefaultProtocolClient('linglong_store');
  createWindow(); // 创建商店主窗口
  // floatingBall();  // 创建悬浮按钮
  // installList();      // 加载弹出层
  // TrayMenu(win); // 加载托盘
  IPCHandler(win); // 加载IPC服务
  updateHandle(win); // 自动更新

  // macOS事件(应用被激活时触发)
  app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows();
    mainLog.info('活跃窗口个数：', allWindows.length);
    if (allWindows.length) {
      allWindows[0].focus()
    } else {
      createWindow()
    }
  })
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  mainLog.info('自定义协议打开的地址：', url);
  // const parsedUrl = new URL(url);
  // const fileUrl = parsedUrl.searchParams.get('url');
  // const fileName = 'downloaded_file.zip';

  // 执行下载
  // https.get(fileUrl, (response) => {
  //     const fileStream = fs.createWriteStream(fileName);
  //     response.pipe(fileStream);
  //     fileStream.on('finish', () => {
  //         fileStream.close();
  //         dialog.showMessageBox({
  //             type: 'info',
  //             title: '下载完成',
  //             message: `文件已下载到: ${fileName}`
  //         });
  //     });
  // });
});

// 应用监听所有关闭事件，退出程序
app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用监听开启第二个窗口
// app.on('second-instance', () => {
//   if (win) {
//     if (win.isMinimized()) {
//       win.restore()
//     }
//     win.focus()
//   }
// })

// 处理应用程序关闭事件
app.on('before-quit', () => {
  // 在这里进行必要的清理操作，如果有未完成的更新，取消它
  clearUpdateCache();
});

/* ********** 监听显示隐藏悬浮球 ********** */
ipcMain.on('toggle-floating', (_event, enable) => {
  floatingEnabled = enable;
  if (floatingEnabled) {
    if (!floatingWin) {
      floatingBall();
    }
    floatingWin.show();
  } else {
    if (floatingWin) {
      floatingWin.hide();
      floatingWin = null;
    }
  }
});