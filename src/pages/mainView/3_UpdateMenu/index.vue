<template>
    <div class="apps-container" v-if="isFirstLoad" v-loading="loading" element-loading-text="加载中..."
        element-loading-background="rgba(122, 122, 122, 0.8)">
    </div>
    <div class="apps-container" v-else v-loading="loading" element-loading-text="加载中..."
        element-loading-background="rgba(122, 122, 122, 0.8)">
        <div class="card-items-container" v-if="updateItemsStore.updateItemList && updateItemsStore.updateItemList.length > 0">
            <div class="card-items" v-for="(item, index) in updateItemsStore.updateItemList" :key="index">
                <updateCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :loading="item.loading" :categoryName="item.categoryName"/>
            </div>
        </div>
        <div class="no-data-container" v-else>
            <div style="width: 180px;height: 300px">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>暂无数据</h1>
        </div>
        <transition name="el-zoom-in-bottom">
            <div v-show="updateItemsStore.updateItemList.length > 0 && !loading" class="transition-update-btn">
                <el-button type="primary" @click="updateAll" :disabled="systemConfigStore.updateStatus">一键更新</el-button>
            </div>
        </transition>
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { CardFace,InstalledEntity } from "@/interface";
import updateCard from "@/components/updateCard.vue";
import string2card from "@/util/string2card";
import { compareVersions } from "@/util/checkVersion";
import defaultImage from '@/assets/logo.svg';
import { useInstalledItemsStore } from "@/store/installedItems";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useInstallingItemsStore } from "@/store/installingItems";

const installedItemsStore = useInstalledItemsStore();
const updateItemsStore = useUpdateItemsStore();
const systemConfigStore = useSystemConfigStore();
const installingItemsStore = useInstallingItemsStore();
// 是否是第一次加载(决定是否显示查无数据)
const isFirstLoad = ref(true);
// 页面加载状态
const loading = ref(true);

// 记录循环次数的标记值
let currentIndex = 0;
// 嵌套循环获取所有已安装的玲珑程序是否有更新版本
const searchLingLongHasUpdate = (uniqueInstalledSet: InstalledEntity[]) => {
    if (currentIndex < uniqueInstalledSet.length) {
        const { appId, version, module } = uniqueInstalledSet[currentIndex];
        if (compareVersions(systemConfigStore.llVersion, '1.3.99') > 0) {
            ipcRenderer.send("command", { command: `ll-cli --json search ${appId}`, appId: appId, version: version });
        } else {
            ipcRenderer.send("command", { command: `ll-cli query ${appId}`, appId: appId, version: version });
        }
        ipcRenderer.once('command-result', (_event: any, res: any) => {
            const command: string = res.param.command;
            // 返回异常判定为网络异常
            if ('stdout' != res.code) {
                ElNotification({
                    title: '提示', type: 'error', duration: 5000,
                    message: "系统操作异常...",
                });
                return;
            }
            const appId: string = res.param.appId;
            const result: string = res.result;
            // 用于存放不同版本的玲珑集合
            let searchVersionItemList: InstalledEntity[] = [];
            if (command.startsWith('ll-cli query')) {  // 1.4版本以前的命令
                const apps: string[] = result.split('\n');
                if (apps.length > 2) {
                    for (let index = 2; index < apps.length - 1; index++) {
                        const card: CardFace | null = string2card(apps[index]);
                        if (card && appId == card.appId && module != 'devel') {
                            searchVersionItemList.push(card as InstalledEntity);
                        }
                    }
                }
            } else if (command.startsWith('ll-cli --json search')) {  // 1.4版本以后的命令
                searchVersionItemList = result.trim() ? JSON.parse(result.trim()) : [];
                if (searchVersionItemList.length > 0) {
                    // 过滤不同appId和时devel的数据
                    searchVersionItemList = searchVersionItemList.filter(item => item && item.module != 'devel' && item.id == appId);
                }
            }
            // 当版本数组数量大于2时才进行比较
            if (searchVersionItemList.length > 1) {
                // 版本号从大到小排序
                searchVersionItemList = searchVersionItemList.sort((a, b) => compareVersions(b.version, a.version));
                const entity: InstalledEntity = searchVersionItemList[0];
                if (compareVersions(entity.version, res.param.version) > 0) {
                    updateItemsStore.addItem(entity);
                }
            }
            // 执行下一个循环
            currentIndex++;
            searchLingLongHasUpdate(uniqueInstalledSet);
        });
    } else {
        // 查询结束，标记值归零并且停止加载
        currentIndex = 0;
        loading.value = false;
        isFirstLoad.value = false;
    }
}
// 更新所有
const updateAll = () => {
    // 更改一键更新状态为true
    systemConfigStore.changeUpdateStatus(true);
    // 执行一键更新
    const updateItemList = updateItemsStore.updateItemList;
    updateItemList.forEach((item) => {
        item.loading = true;
        item.command = `ll-cli install ${item.appId}/${item.version}`;
        ipcRenderer.send("command", { ...item });
        // 新增到加载中列表
        installingItemsStore.addItem(item as InstalledEntity);
    })
}
// 页面打开时执行
onMounted(async () => {
    updateItemsStore.clearItems(); // 清空页面列表数据
    // 1.刷新一下已安装列表，根据版本环境获取安装程序列表发送命令
    if (compareVersions(systemConfigStore.llVersion, '1.3.99') < 0) {
        let getInstalledItemsCommand = "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'";
        ipcRenderer.send('command', { command: getInstalledItemsCommand});
    } else if (compareVersions(systemConfigStore.llVersion, '1.3.99') >= 0 && compareVersions(systemConfigStore.llVersion, '1.5.0') < 0) {
        let getInstalledItemsCommand = "ll-cli --json list";
        ipcRenderer.send('command', { command: getInstalledItemsCommand});
    } else if (compareVersions(systemConfigStore.llVersion, '1.5.0') >= 0) {
        if (systemConfigStore.isShowBaseService) {
            let getInstalledItemsCommand = "ll-cli --json list --type=all";
            ipcRenderer.send('command', { command: getInstalledItemsCommand});
        } else {
            let getInstalledItemsCommand = "ll-cli --json list";
            ipcRenderer.send('command', { command: getInstalledItemsCommand});
        }
    }
    // 2.延时1000毫秒进入
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 3.初始化一个数组用于存储去重后当前已安装程序列表
    const uniqueInstalledSet: InstalledEntity[] = [];
    installedItemsStore.installedItemList.forEach(installedItem => {
        const { appId, version, categoryName } = installedItem;
        if (categoryName != '玲珑组件') {
            const item = uniqueInstalledSet.find(item => item.appId == appId);
            if (item) {
                // 当循环的版本号大于去重数组中的检测到的版本号时，剔除去重数组中的元素，并将当前循环的元素添加到去重数组中
                if (compareVersions(version, item.version) > 0) {
                    const index = uniqueInstalledSet.findIndex((item) => item.appId == appId);
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
});
</script>
<style scoped>
.transition-update-btn {
    border-radius: 10px;
    background: radial-gradient(circle at 50% 20%, #6E6E6E, transparent);
    text-align: center;
    color: #fff;
    padding: 16px;
    box-sizing: border-box;
    position: fixed;
    bottom: 12px;
    left: 50%;
    height: 64px;
    width: 120px;
    z-index: 2;
}

@media (prefers-color-scheme: light) {
    .transition-update-btn {
        background: radial-gradient(circle at 50% 50%, transparent, #E2AB5F);
    }
}
</style>