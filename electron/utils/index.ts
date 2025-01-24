import { app, protocol, net } from "electron";
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
export function handleCustomProtocol(url: string) {
    protocol.handle('linyapsss', (req) => {
        const { host, pathname } = new URL(req.url);
        mainLog.log('处理自定义协议请求:', new URL(req.url));
        if (host === 'bundle') {
            if (pathname === '/') {
                return new Response('<h1>hello, world</h1>', {
                    headers: { 'content-type': 'text/html' }
                })
            }
        } else if (host === 'api') {
            return net.fetch('https://storeapi.linyaps.org.cn' + pathname, {
                method: req.method,
                headers: req.headers,
                body: req.body
            })
        } else {
            return net.fetch('https://store.linyaps.org.cn/');
        }
    })
}