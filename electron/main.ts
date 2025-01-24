import { app, BrowserWindow, shell, Menu, screen, ipcMain } from "electron";
import { join } from "node:path";
import { mainLog } from "./logger";
import TrayMenu from "./trayMenu";
import IPCHandler from "./ipcHandler";
import { updateHandle } from "./update";
import { clearUpdateCache, handleCustomProtocol } from "./utils";
import installList from "./utils/installList";

process.env.DIST_ELECTRON = join(__dirname, '../dist-electron');
process.env.DIST = join(__dirname, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST;

const preload = join(__dirname, 'preload.js')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWin: BrowserWindow | null;
let floatingWin: BrowserWindow | null; // 悬浮球窗口
let floatingEnabled = false;

// 创建窗口并初始化相关参数
function createWindow() {
  mainWin = new BrowserWindow({
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
  // 禁用菜单，一般情况下，不需要禁用
  Menu.setApplicationMenu(null);
  // 根据环境以不同方式加载页面
  if (VITE_DEV_SERVER_URL) {
    mainWin.webContents.openDevTools({ mode: "detach" });
    mainLog.info("mainWin loadURL ", VITE_DEV_SERVER_URL);
    mainWin.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainLog.info("mainWin loadFile ", join(process.env.DIST, "index.html"));
    mainWin.loadFile(join(process.env.DIST, "index.html"));
  }
  // 测试程序加载完毕，打印当前时间
  mainWin.webContents.on("did-finish-load", () => {
    mainWin?.webContents.send("main-process-message", new Date().toLocaleString());
  });
  // 设置所有链接通过默认浏览器打开，而非程序内打开
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
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
      preload,
      contextIsolation: false,
      nodeIntegration: true   // 允许使用Node.js
    }
  });
  // 禁用菜单，一般情况下，不需要禁用
  Menu.setApplicationMenu(null);
  // 根据环境以不同方式加载页面
  if (VITE_DEV_SERVER_URL) {
    floatingWin.webContents.openDevTools({ mode: "detach" });
    mainLog.info("floatingWin dev loadURL ", `${VITE_DEV_SERVER_URL}floatingBall/index.html`);
    floatingWin.loadURL(`${VITE_DEV_SERVER_URL}floatingBall/index.html`);
  } else {
    mainLog.info("floatingWin loadFile ", join(process.env.DIST, "floatingBall/index.html"));
    floatingWin.loadFile(join(process.env.DIST, "floatingBall/index.html"));
  }
  // 检测窗口关闭事件
  floatingWin.on('closed', () => {
    console.log('Floating closed');
    floatingWin = null;
  });
}

// 确保单实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // 应用监听开启第二个窗口事件
  app.on('second-instance', (_event, argv) => {
    // Linux 会通过 argv 传递 URL
    mainLog.info('应用监听开启第二个窗口事件:', argv);
    handleCustomProtocol(argv, mainWin);
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.focus();
    }
  });
  app.whenReady().then(() => {
    createWindow(); // 创建商店主窗口
    // floatingBall();  // 创建悬浮按钮
    // installList();      // 加载弹出层
    TrayMenu(mainWin); // 加载托盘
    IPCHandler(mainWin); // 加载IPC服务
    updateHandle(mainWin); // 自动更新
    // 处理首次启动时的协议调用
    mainLog.info('处理首次启动时的协议调用:', process.argv);
    handleCustomProtocol(process.argv, mainWin);
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
    console.log('Protocol URL:', url);
    handleCustomProtocol([url], mainWin);
  });
}

// 应用监听所有关闭事件，退出程序
app.on("window-all-closed", () => {
  mainWin = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 处理应用程序关闭事件（在这里进行必要的清理操作，如果有未完成的更新，取消它）
app.on('before-quit', () => clearUpdateCache());

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