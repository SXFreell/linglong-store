import { app, protocol, net } from "electron";
import { join } from "node:path";
const url = require('url');
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
// export function handleCustomProtocol(url: string) {
//     protocol.handle('linyapsss', (req) => {
//         const { host, pathname } = new URL(req.url);
//         mainLog.log('处理自定义协议请求:', new URL(req.url));
//         if (host === 'bundle') {
//             if (pathname === '/') {
//                 return new Response('<h1>hello, world</h1>', {
//                     headers: { 'content-type': 'text/html' }
//                 })
//             }
//         } else if (host === 'api') {
//             return net.fetch('https://storeapi.linyaps.org.cn' + pathname, {
//                 method: req.method,
//                 headers: req.headers,
//                 body: req.body
//             })
//         } else {
//             return net.fetch('https://store.linyaps.org.cn/');
//         }
//     })
// }

export function handleCustomProtocol(argv) {
    mainLog.log('自定义协议传入的参数:', argv);
    // 查找命令行中的协议 URL
    const protocolUrl = argv.find(arg => arg.startsWith('linyapsss://'));
    mainLog.log('protocolUrl：', protocolUrl);
    if (protocolUrl) {
      const parsedUrl = url.parse(protocolUrl, true); // 解析 URL
      const { path, query, pathname } = parsedUrl;
      mainLog.log('path:', path);
      mainLog.log('自定义协议路径:', pathname);
      mainLog.log('参数:', query);
      // 根据路径和参数执行逻辑
      if (pathname === '/action' && query.param1 === 'value1') {
        mainLog.log('执行特定逻辑', query);
      } else {
        mainLog.log('执行默认逻辑', query);
      }
    }
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
  }