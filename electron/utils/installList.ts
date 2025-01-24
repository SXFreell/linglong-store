import { BrowserWindow, Menu, ipcMain } from "electron";
import { join } from "node:path";

process.env.DIST = join(__dirname, "../dist");
const preload = join(__dirname, 'preload.js');
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let listDialog: BrowserWindow | null; // 悬浮球窗口
let isListDialogShow = false;

function installList() {

    function createFloatingBallWindow() {
        listDialog = new BrowserWindow({
            width: 800,                // 宽度
            height: 600,               // 高度
            alwaysOnTop: true,        // 窗口始终在最上面
            resizable: false,         // 禁止改变窗口大小
            webPreferences: {
                preload,
                contextIsolation: true,
                nodeIntegration: true   // 允许使用Node.js
            }
        });
        // 禁用菜单，一般情况下，不需要禁用
        Menu.setApplicationMenu(null);
        if (VITE_DEV_SERVER_URL) {
            listDialog.loadURL(`${VITE_DEV_SERVER_URL}listDialog/index.html`);
        } else {
            listDialog.loadFile(join(process.env.DIST, "listDialog/index.html"));
        }

        listDialog.on('closed', () => {
            console.log('closed111');
            listDialog = null;
        });
    }

    ipcMain.on('open-list-dialog', (_event, enable) => {
        isListDialogShow = enable;
        if (isListDialogShow) {
            if (!listDialog) {
                createFloatingBallWindow();
            }
            listDialog.show();
        } else {
            if (listDialog) {
                listDialog.hide();
                listDialog = null;
            }
        }
    });
}

export default installList;