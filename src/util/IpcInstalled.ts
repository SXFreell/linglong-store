import { ipcRenderer } from 'electron';
import { compareVersions } from '@/util/checkVersion';
import { ElNotification } from 'element-plus'
import { reflushInstalledItems } from '@/util/WorkerInstalled';
import { reflushUpdateItems } from "@/util/WorkerUpdate";

import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useUpdateStatusStore } from "@/store/updateStatus";

const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const updateItemsStore = useUpdateItemsStore();
const systemConfigStore = useSystemConfigStore();
const updateStatusStore = useUpdateStatusStore();

export let installingItems = installingItemsStore.installingItemList; // 安装队列

let downloadLogMsg = ""; // 下载日志

const handleLinyapsInstallResult = (_event: any, res: any) => {
    let { params, code, result } = res;
    if (code == 'stdout') {
        // 安装信息
        downloadLogMsg += result + '<br>';
        // 处理安装进度
        let schedule = result.substring(result.lastIndexOf(':') + 1, result.lastIndexOf('%') + 1);
        if (compareVersions(systemConfigStore.llVersion,'1.7.0') < 0) {
            schedule = result.split(' ')[0];
        }
        console.log(`安装进度: ${schedule}`);
        const index = installingItems.findIndex(it => it.name === params.name && it.version === params.version && it.appId === params.appId);
        if (index !== -1) {
            const aItem = installingItems[index];
            aItem.schedule = schedule;
            installingItems.splice(index, 1, aItem);
        }
    } else if (code == 'stderr') {
        // 错误信息
        downloadLogMsg += `<span style="color: red;">${result}</span><br>`;
    } else if (code == 'close') {
        updateStatusStore.downloadQueueStatus = false; // 标记为未处理
        installingItemsStore.removeItem(params); // 1.从加载列表中移除
        // 2.关闭各个列表中的加载状态
        allAppItemsStore.updateItemLoadingStatus(params, false);
        installedItemsStore.updateItemLoadingStatus(params, false);
        difVersionItemsStore.updateItemLoadingStatus(params, false);
        updateItemsStore.updateItemLoadingStatus(params, false);
        if (result == '0') {
            allAppItemsStore.updateItemInstallStatus(params, true);
            difVersionItemsStore.updateItemInstallStatus(params, true);
            // 刷新已安装的应用列表
            reflushInstalledItems();
            // 刷新更新列表
            reflushUpdateItems();
            // 刷新版本列表
            ipcRenderer.send('reflush-version-list', params.appId);
            // 安装或卸载成功后，弹出通知
            ElNotification({ title: '安装成功!', type: 'success', duration: 500, message: `${params.name}(${params.version})被成功安装'!` });
        } else {
            ElNotification({ title: '操作异常!', message: downloadLogMsg, type: 'error', duration: 5000, dangerouslyUseHTMLString: true });
        }
        downloadLogMsg = ""; // 清除当前程序安装的日志记录
    }
}

const handleLinyapsUninstallResult = (_event: any, res: any) => {
    const { params, result, code } = res;
    if (code != 'stdout') {
        ipcRenderer.send('logger', 'error', `"${params.command}"命令执行异常::${result}`);
        return;
    }
    installingItemsStore.removeItem(params);
    // updateItemsStore.removeItem(params);
    // installedItemsStore.removeItem(params);
    difVersionItemsStore.updateItemInstallStatus(params, false);
    allAppItemsStore.updateItemInstallStatus(params, false);

    allAppItemsStore.updateItemLoadingStatus(params, false);
    installedItemsStore.updateItemLoadingStatus(params, false);
    difVersionItemsStore.updateItemLoadingStatus(params, false);
    updateItemsStore.updateItemLoadingStatus(params, false);
    // 刷新已安装的应用列表
    reflushInstalledItems();
    // 刷新更新列表
    reflushUpdateItems();
    // 刷新版本列表
    ipcRenderer.send('reflush-version-list', params.appId);
    // 安装或卸载成功后，弹出通知
    ElNotification({ title: '卸载成功!', type: 'success', duration: 500, message: `${params.name}(${params.version})被成功卸载!`});
}

export const setupIpcListeners = () => {
    ipcRenderer.on('linyaps-install-result', handleLinyapsInstallResult);
    ipcRenderer.on('linyaps-uninstall-result', handleLinyapsUninstallResult);
}

export const cleanupIpcListeners = () => {
    ipcRenderer.removeListener('linyaps-install-result', handleLinyapsInstallResult);
    ipcRenderer.removeListener('linyaps-uninstall-result', handleLinyapsUninstallResult);
}