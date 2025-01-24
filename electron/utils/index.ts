import { app } from "electron";
import { join } from "node:path";
import fs from "fs-extra";
import { mainLog } from "../logger";

// 清理升级缓存
export function clearUpdateCache() {
    try {
        const updateCachePath = join(app.getPath('home'), '/.cache/linglong_store-updater');
        mainLog.log('清除更新缓存目录:', updateCachePath);
        // 检测更新日志目录是否存在
        fs.pathExists(updateCachePath, (err, exists) => {
            if (err) {
                mainLog.error('检测文件是否存在时出现错误:', err);
            } else {
                mainLog.log('文件是否存在:', exists);
                if (exists) {
                    fs.rmSync(updateCachePath, { recursive: true });
                }
            }
        });
    } catch (error) {
        mainLog.error('清除文件出现异常:', error);
    }
}

// 处理接收到的自定义协议请求
export function handleCustomProtocol(argv, mainWindow) {
    mainLog.log('自定义协议传入的参数:', argv);
    // 查找命令行中的协议 URL
    const protocolUrl = argv.find(arg => arg.startsWith('linyapsss://'));
    if (protocolUrl) {
        // 截取argv双斜杠后的内容，如果为空则不处理，如果有内容则处理
        const url = protocolUrl.split('//')[1];
        if (url) {
            mainLog.log('处理自定义协议请求:', url);
            // 等待5秒钟，再发送ipc到渲染线程
            setTimeout(() => {
                mainWindow.webContents.send('custom-protocol', url);
            }, 5000);
        }
    }
  }