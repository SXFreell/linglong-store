import { app, BrowserWindow, shell, Menu } from "electron";
import { join } from "node:path";
import { mainLog } from "./logger";
import TrayMenu from "./utils/trayHandle";
import IPCHandler from "./utils/ipcHandle";
import { updateHandle } from "./update";
import { clearUpdateCache, handleCustomProtocol } from "./utils";

process.env.DIST_ELECTRON = join(__dirname, '../dist-electron');
process.env.DIST = join(__dirname, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST;

const preload = join(__dirname, 'preload.js')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWin: BrowserWindow | null;

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

// 确保单实例
if (app.requestSingleInstanceLock()) {
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
} else {
  app.quit();
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