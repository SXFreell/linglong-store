import { ipcRenderer } from 'electron';
import { compareVersions } from '@/util/checkVersion';

import { useInstalledItemsStore } from "@/store/installedItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();

// 定时器每5秒检查一次当前系统有哪些应用
let installedTimer = setInterval(() => reflushInstalledItems(), 5000);
// 启动定时器函数
installedTimer;
// 刷新当前系统有哪些已安装的应用
export const reflushInstalledItems = () => {
    if (compareVersions(systemConfigStore.llVersion, '1.5.0') >= 0) {
        ipcRenderer.once('linyaps-list-result', async (_event: any, res: any) => {
            const { error, stdout, stderr } = res;
            if (stdout) {
                let { addedItems, removedItems} = await installedItemsStore.initInstalledItems(stdout);
                // 非开发环境发送发送操作命令！
                if (process.env.NODE_ENV != "development") {
                    if (addedItems.length > 0 || removedItems.length > 0) {
                        // 转换为普通对象数组
                        const plainAddedItems = addedItems.map(item => ({ ...item }));
                        const plainRemovedItems = removedItems.map(item => ({ ...item }));
                        let addList = {
                            url: `${import.meta.env.VITE_SERVER_URL}/app/saveInstalledRecord`,
                            visitorId: systemConfigStore.visitorId,
                            clientIp: systemConfigStore.clientIP,
                            addedItems: plainAddedItems, 
                            removedItems: plainRemovedItems
                        };
                        ipcRenderer.send('visit', addList);
                    }
                }
            } else {
                ipcRenderer.send('logger', 'error', `"ll-cli --json list --type=all"命令执行异常::${error || stderr}`);
                return;
            }
        });
        ipcRenderer.send('linyaps-list', { command: 'll-cli --json list --type=all' });
    } else {
        console.log('当前版本不支持获取应用列表，请使用最新版本的玲珑！');
    }
}

export const cancelInstalledTimer = () => {
    if (installedTimer) {
        clearInterval(installedTimer);
    }
}