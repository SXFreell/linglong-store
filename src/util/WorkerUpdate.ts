import { ipcRenderer } from 'electron';
import { compareVersions } from '@/util/checkVersion';
import { InstalledEntity } from '@/interface';

import { useInstalledItemsStore } from "@/store/installedItems";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const installedItemsStore = useInstalledItemsStore();
const updateItemsStore = useUpdateItemsStore();
const systemConfigStore = useSystemConfigStore();

// 记录循环次数的标记值
let currentIndex = 0;

// 定时器每10秒检查一次当前系统有哪些需要更新的应用
let updateTimer = setInterval(() => {
    // console.log('定时器执行，检查当前系统有哪些需要更新的应用...');
    reflushUpdateItems();
}, 10000);

updateTimer;

// 检查当前系统有哪些需要更新的应用
export const reflushUpdateItems = () => {
    if (compareVersions(systemConfigStore.llVersion, '1.5.0') < 0) {
        console.log('当前版本不支持获取更新列表，请使用最新版本的玲珑！');
        return;
    } else if (compareVersions(systemConfigStore.llVersion, '1.7.0') < 0) {
        // 1.7.0版本之前要根据已安装的应用列表来查询更新
        const uniqueInstalledSet: InstalledEntity[] = [];
        installedItemsStore.installedItemList.forEach(installedItem => {
            const { appId, version, kind } = installedItem;
            if (kind != 'app') {
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
            }
        })
        // 查找是否含有高级版本
        searchLingLongHasUpdate(uniqueInstalledSet);
    } else {
        ipcRenderer.send('linyaps-update', { command: 'll-cli --json list --upgradable --type=app' });
        ipcRenderer.once('linyaps-update-result', async (_event: any, res: any) => {
            const { error, stdout, stderr } = res;
            if (stdout) {
                updateItemsStore.initUpdateItems(stdout); // 初始化更新列表
                console.log('更新列表 >> ', updateItemsStore.updateItemList);
                return;
            } else {
                ipcRenderer.send('logger', 'error', `ll-cli --json list --upgradable --type=app命令执行异常::${error || stderr}`);
            }
        });
        return;
    }
}

// 嵌套循环获取所有已安装的玲珑程序是否有更新版本
const searchLingLongHasUpdate = (uniqueInstalledSet: InstalledEntity[]) => {
    if (currentIndex < uniqueInstalledSet.length) {
        const { appId, version } = uniqueInstalledSet[currentIndex];
        let command = `ll-cli --json search ${appId}`;
        if (compareVersions(systemConfigStore.llVersion, '1.7.7') >= 0 && compareVersions(systemConfigStore.llVersion, '1.8.3') < 0) {
            command = `ll-cli --json search ${appId} --all`;
        } else if (compareVersions(systemConfigStore.llVersion, '1.8.3') >= 0) {
            command = `ll-cli --json search ${appId} --show-all-version`;
        }
        ipcRenderer.send("linyaps-search", { command });
        ipcRenderer.once('linyaps-search-result', (_event: any, res: any) => {
            const { error, stdout, stderr } = res;
            if (stdout) {
                let searchVersionItemList: InstalledEntity[] = JSON.parse(stdout.trim());
                searchVersionItemList = searchVersionItemList.filter(item => item.module != 'devel' && item.id == appId);
                if (searchVersionItemList.length > 1) {  // 如果有多个版本的玲珑才进行版本对比
                    // 过滤掉当前版本
                    searchVersionItemList = searchVersionItemList.filter(item => compareVersions(item.version, version) > 0);
                    if (searchVersionItemList.length == 0) {
                        // 如果没有比当前版本更高的版本，则直接返回
                        currentIndex++;
                        searchLingLongHasUpdate(uniqueInstalledSet);
                        return;
                    } 
                    const newList = searchVersionItemList.sort((a, b) => compareVersions(a.version, b.version));
                    updateItemsStore.addItem(newList[0]); // 添加到更新列表
                }
                // 执行下一个循环
                currentIndex++;
                searchLingLongHasUpdate(uniqueInstalledSet);
                return;
            } else {
                ipcRenderer.send('logger', 'error', `"${command}"命令执行异常::${error || stderr}`);
                // 执行下一个循环
                currentIndex++;
                searchLingLongHasUpdate(uniqueInstalledSet);
                return;
            }
        });
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