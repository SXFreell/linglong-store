import { ipcRenderer } from 'electron';
import { compareVersions } from '@/util/checkVersion';
import { InstalledEntity } from '@/interface';

import { useInstalledItemsStore } from "@/store/installedItems";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const installedItemsStore = useInstalledItemsStore();
const updateItemsStore = useUpdateItemsStore();
const systemConfigStore = useSystemConfigStore();

let llVersion = systemConfigStore.llVersion; // 玲珑版本

// 记录循环次数的标记值
let currentIndex = 0;

// 定时器每10秒检查一次当前系统有哪些需要更新的应用
let updateTimer = setInterval(() => reflushUpdateItems(), 3000);
// 启动定时器函数
updateTimer;
// 检查当前系统有哪些需要更新的应用
export const reflushUpdateItems = () => {
    if (compareVersions(llVersion, '1.5.0') < 0) {
        ipcRenderer.send('logger', 'error', `当前玲珑版本(${llVersion})不支持获取更新列表，请使用最新版本的玲珑！`);
        return;
    } else if (compareVersions(llVersion, '1.7.0') < 0) {
        // 1.7.0版本之前要根据已安装的应用列表来查询更新
        const installedItems = installedItemsStore.installedItemList.filter(item => item.kind != 'app');
        const uniqueInstalledSet: InstalledEntity[] = [];
        installedItems.forEach(installedItem => {
            const { appId, version } = installedItem;
            const item = uniqueInstalledSet.find(item => item.appId == appId);
            if (item) {
                // 当循环的版本号大于去重数组中的检测到的版本号时，剔除去重数组中的元素，并将当前循环的元素添加到去重数组中
                if (compareVersions(version, item.version) > 0) {
                    const index = uniqueInstalledSet.findIndex(item => item.appId == appId);
                    uniqueInstalledSet.splice(index, 1);
                    uniqueInstalledSet.push(installedItem);
                }
            } else {
                uniqueInstalledSet.push(installedItem);
            }
        })
        // 查找是否含有高级版本
        searchLingLongHasUpdate(uniqueInstalledSet);
    } else {
        ipcRenderer.send('linyaps-update', { command: 'll-cli --json list --upgradable --type=app' });
        ipcRenderer.once('linyaps-update-result', async (_event: any, res: any) => {
            const { error, stdout, stderr } = res;
            if (error || stderr) {
                ipcRenderer.send('logger', 'error', `ll-cli --json list --upgradable --type=app命令执行异常::${error || stderr}`);
            }
            updateItemsStore.initUpdateItems(stdout); // 初始化更新列表
        });
    }
}

// 嵌套循环获取所有已安装的玲珑程序是否有更新版本
const searchLingLongHasUpdate = (uniqueInstalledSet: InstalledEntity[]) => {
    if (currentIndex < uniqueInstalledSet.length) {
        const { appId, version } = uniqueInstalledSet[currentIndex];
        // 监听search命令的结果
        ipcRenderer.once('linyaps-search-result', (_event: any, res: any) => {
            const { error, stdout, stderr } = res;
            if (stdout) {
                let searchVersionItemList: InstalledEntity[] = JSON.parse(stdout.trim());
                searchVersionItemList = searchVersionItemList.filter(item => item.id == appId && (item.module == 'binary' || item.module == 'runtime'));
                if (searchVersionItemList.length > 1) {  // 如果有多个版本的玲珑才进行版本对比
                    const newList = searchVersionItemList.sort((a, b) => compareVersions(a.version, b.version));
                    // 取出最新版本的玲珑
                    const latestVersionItem = newList[newList.length - 1];
                    latestVersionItem.appId = latestVersionItem.id ? latestVersionItem.id : latestVersionItem.appid ? latestVersionItem.appid : latestVersionItem.appId; // 设定appId
                    latestVersionItem.arch = typeof latestVersionItem.arch === 'string' ? latestVersionItem.arch : Array.isArray(latestVersionItem.arch) ? latestVersionItem.arch[0] : ''; // 设定arch架构
                    latestVersionItem.size = latestVersionItem.size ? latestVersionItem.size.toString() : '0'; // 设定文件大小
                    latestVersionItem.repoName = systemConfigStore.defaultRepoName; // 设定仓库源
                    latestVersionItem.version = version; // 设定当前版本号
                    latestVersionItem.oldVersion = version; // 设定旧版本号
                    latestVersionItem.newVersion = latestVersionItem.version; // 设定最新版本号
                    latestVersionItem.isInstalled = false; // 标记为未安装
                    latestVersionItem.loading = false; // 标记为未加载
                    // 已经存在则更新，否则新增
                    const idx = updateItemsStore.updateItemList.findIndex(it => it.appId = latestVersionItem.appId);
                    if (idx !== -1) {
                        updateItemsStore.updateItemList.splice(idx, 1, latestVersionItem);
                    } else {
                        updateItemsStore.addItem(latestVersionItem); // 添加到更新列表
                    }
                }
                // 执行下一个循环
                currentIndex++;
                searchLingLongHasUpdate(uniqueInstalledSet);
                return;
            }
            // 如果没有查询到结果，则记录错误日志
            ipcRenderer.send('logger', 'error', `"${command}"命令执行异常::${error || stderr}`);
            // 执行下一个循环
            currentIndex++;
            searchLingLongHasUpdate(uniqueInstalledSet);
            return;
        });
        // 执行查询命令
        let command = `ll-cli --json search ${appId}`;
        if (compareVersions(llVersion, '1.7.7') >= 0 && compareVersions(llVersion, '1.8.3') < 0) {
            command += ` --all`;
        } else if (compareVersions(llVersion, '1.8.3') >= 0) {
            command += ` --show-all-version`;
        }
        ipcRenderer.send("linyaps-search", { command });
    } else {
        // 查询结束，标记值归零并且停止加载
        currentIndex = 0;
    }
}

export const cancelUpdateTimer = () => {
    if (updateTimer) {
        clearInterval(updateTimer);
    }
}