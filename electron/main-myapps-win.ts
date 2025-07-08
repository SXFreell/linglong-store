import { BrowserWindow, shell, Menu } from "electron";
import { join } from "node:path";
import { mainLog } from "./main-logger";

process.env.DIST_ELECTRON = join(__dirname, '../dist-electron');
process.env.DIST = join(__dirname, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST;

const preload = join(__dirname, 'preload.js')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;


export let otherWin: BrowserWindow | null;

// 创建我的应用窗口并初始化相关参数
export function createOtherWindow() {
  otherWin = new BrowserWindow({
    title: '我的应用',
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    maxHeight: 600,
    maxWidth: 800,
    titleBarStyle: 'hidden',
    // frame: false,
    // resizable: false,
    // transparent: true,
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false, // 解决渲染进程中无法使用nodejs/electron函数方法
    },
  });
  // 禁用菜单，一般情况下，不需要禁用
  Menu.setApplicationMenu(null);
  // 根据环境以不同方式加载页面
  if (VITE_DEV_SERVER_URL) {
    mainLog.info("mainWin loadURL ", VITE_DEV_SERVER_URL);
    otherWin.loadURL(VITE_DEV_SERVER_URL + '#/my_apps_menu');
  } else {
    mainLog.info("mainWin loadFile ", join(process.env.DIST, "index.html"));
    otherWin.loadFile(join(process.env.DIST, "index.html"), {hash: '/my_apps_menu'});
  }
  // 设置所有链接通过默认浏览器打开，而非程序内打开
  otherWin.webContents.setWindowOpenHandler(({ url }) => {
    mainLog.info("打开url", url);
    // 如果是http或https协议的链接，则通过默认浏览器打开
    if (url.startsWith("https:") || url.startsWith("http:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // 拦截窗口关闭操作，改为隐藏
  otherWin.on('close', (event) => {
    event.preventDefault()
    otherWin?.hide()
  })
}