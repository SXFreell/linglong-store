import { app } from "electron";
import { join } from "node:path";
import fs from "fs-extra";
import { mainLog } from "./main-logger";

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

/**
 * 处理接收到的自定义协议请求
 * 1.以layer、uab结尾的文件安装(home/Jokul/Downloads/org.tencent.wechat.linyaps_4.0.1.12_x86_64_binary.layer)
 * 2.以自定义协议开头的文件下载(linyapsss://install/org.tencent.wechat.linyaps) 自定义协议://采取的方式/APPID
 * @param args 自定义协议传入的参数
 * @param mainWindow 主窗口
 */
export function handleCustomProtocol(args, mainWindow) {
    mainLog.log('自定义协议传入的参数:', args);
    // 处理结尾是layer、uab的文件安装
    const layerFile = args.find(arg => arg.endsWith('.layer') || arg.endsWith('.uab') || arg.startsWith('linyapsss://'));
    if (layerFile) {
        mainLog.log('处理自定义协议请求:', layerFile);
        // 等待5秒钟，再发送ipc到渲染线程
        setTimeout(() => {
            mainWindow.webContents.send('custom-protocol', layerFile);
        }, 5000);
    }
}