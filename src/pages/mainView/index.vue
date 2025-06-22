<template>
    <div class="common-layout">
        <el-container>
            <el-aside>
                <el-menu :default-active="`1`">
                    <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index" @click="item.action" :style="item.style">
                        <el-icon><component :is="item.icon" /></el-icon>
                        <span>{{ item.label }}</span>
                    </el-menu-item>
                </el-menu>
                <!-- 更多菜单项 -->
                <div class="download-queue" @click="show = !show">
                    <div class="download-btn">下载队列</div>
                </div>
                <div class="network-info">
                    <div class="network-info-title">当前实时网速</div>
                    <el-icon><Top /></el-icon>上传速度: {{ uploadSpeed }}<br>
                    <el-icon><Bottom /></el-icon>下载速度: {{ downloadSpeed }}
                </div>
            </el-aside>
            <!-- 这里将动态显示不同的功能页面 -->
            <el-main class="views">
                <router-view></router-view>
            </el-main>
            <DownloadQueue :show="show" :installingItems="installingItems"/>
        </el-container>
    </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron';
import { onUnmounted, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import DownloadQueue from '@/components/DownloadQueue.vue'
import { compareVersions } from '@/util/checkVersion';
import { ElNotification } from 'element-plus'
import { InstalledEntity } from '@/interface';
// 引入网络组件 获取网络接口信息 获取实时网速
import { useNetworkSpeed } from '@/util/network'; 

import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const { uploadSpeed, downloadSpeed } = useNetworkSpeed();
const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const updateItemsStore = useUpdateItemsStore();
const systemConfigStore = useSystemConfigStore();

const router = useRouter();
let show = ref(false); // 显示下载队列框
let installingItems = installingItemsStore.installingItemList; // 安装队列
let downloadLogMsg = ""; // 下载日志
let isProcessing = false; // 是否正在处理安装队列

// 菜单项配置
const menuItems = [
  { index: "1", label: "玲珑推荐", icon: "Star", action: () => router.push({ path: '/welcome_menu' }) },
  { index: "6", label: "排行榜", icon: "Histogram", action: () => router.push({ path: '/ranking_menu' }) },
  { index: "2", label: "全部程序", icon: "HomeFilled", action: () => router.push({ path: '/all_app_menu' }) },
  { index: "3", label: "卸载程序", icon: "GobletSquareFull", action: () => router.push({ path: '/installed_menu' }) },
  { index: "4", label: "更新程序", icon: "UploadFilled", action: () => router.push({ path: '/update_menu' }) },
  { index: "5", label: "玲珑进程", icon: "Odometer", action: () => router.push({ path: '/runtime_menu' }) },
  { index: "98", label: "基础设置", icon: "setting", action: () => router.push({ path: '/config_menu' }) },
  { index: "99", label: "关于程序", icon: "InfoFilled", action: () => router.push({ path: '/about_menu' }) },
//   { index: "998", label: "终端页面", icon: "InfoFilled", action: () => router.push({ path: '/terminalOutput' }) },
  { index: "999", label: "返回首页", icon: "Loading", action: () => router.push({ path: '/' }), style: "display: none;" }
];

// 命令执行响应函数
const handleCommandResult = (_event: any, res: any) => {
    const { param: params, result, code } = res;
    const command: string = params.command;  // 返回执行的命令
    if (code != 'stdout') {
        ipcRenderer.send('logger', 'error', `"${command}"命令执行异常::${result}`);
        return;
    }
    // 监听卸载命令
    if (command.startsWith('ll-cli uninstall')) {
        installingItemsStore.removeItem(params);
        difVersionItemsStore.updateItemLoadingStatus(params, false);
        difVersionItemsStore.updateItemInstallStatus(params);
        allAppItemsStore.updateItemLoadingStatus(params, false);
        // 全部应用列表(判断当前应用安装版本个数小于两个，才进行状态更新)
        let installedItems = installedItemsStore.installedItemList;
        let filteredItems = installedItems.filter((item: InstalledEntity) => item.appId === params.appId);
        if (filteredItems.length < 2) {
            allAppItemsStore.updateItemInstallStatus(params);
        }
        // 移除需要更新的应用
        updateItemsStore.removeItem(params);
        // 刷新已安装的应用列表
        reflushInstalledItems();
        // 刷新版本列表
        ipcRenderer.send('reflush-version-list', params.appId);
        // 安装或卸载成功后，弹出通知
        ElNotification({ title: '卸载成功!', type: 'success', duration: 500, message: `${params.name}(${params.version})被成功卸载!`});
    }
}

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
        isProcessing = false; // 标记为未处理
        installingItemsStore.removeItem(params); // 1.从加载列表中移除
        // 2.关闭各个列表中的加载状态
        allAppItemsStore.updateItemLoadingStatus(params, false);
        installedItemsStore.updateItemLoadingStatus(params, false);
        difVersionItemsStore.updateItemLoadingStatus(params, false);
        if (result == '0') {
            // 全部应用列表(判断当前应用安装版本个数小于两个，才进行状态更新)
            let installedItems = installedItemsStore.installedItemList;
            let filteredItems = installedItems.filter((item: InstalledEntity) => item.appId === params.appId);
            if (filteredItems.length < 2) {
                allAppItemsStore.updateItemInstallStatus(params);
            }
            difVersionItemsStore.updateItemInstallStatus(params);
            // 刷新已安装的应用列表
            reflushInstalledItems();
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

const reflushInstalledItems = () => {
    if (compareVersions(systemConfigStore.llVersion, '1.5.0') >= 0) {
        ipcRenderer.send('command', { command: 'll-cli --json list --type=all' });
        ipcRenderer.once('command-result', async (_event: any, res: any) => {
            const { param: params, result, code } = res;
            if (code == 'stdout') {
                let { addedItems, removedItems} = await installedItemsStore.initInstalledItems(result);
                console.log('当前系统新增的应用', addedItems);
                console.log('当前系统移除的应用', removedItems);
                // 非开发环境发送发送操作命令！
                if (import.meta.env.MODE != "development") {
                    if (addedItems.length > 0) {
                        let addList = {
                            url: `${import.meta.env.VITE_SERVER_URL}/visit/save11`,
                            visitorId: systemConfigStore.visitorId,
                            clientIp: systemConfigStore.clientIP,
                            items: addedItems
                        };
                        ipcRenderer.send('visit', addList);
                    }
                }
            } else {
                ipcRenderer.send('logger', 'error', `"ll-cli --json list --type=all"命令执行异常::${result}`);
            }
        });
    } else {
        console.log('当前版本不支持获取应用列表，请使用最新版本的玲珑！');
    }
}

// 定时器每8秒检查一次当前系统有哪些应用
let timer = setInterval(() => {
    console.log('定时器执行，检查当前系统有哪些应用...');
    reflushInstalledItems();
}, 5000);

// 监听安装队列
watch(() => installingItemsStore.installingItemList, 
    async (newQueue) => {
        if (isProcessing) return; // 如果正在处理，则不再处理新的队列变化
        if (newQueue.length > 0) {
            const item = newQueue[0];
            isProcessing = true; // 设置为正在处理状态
            let password = localStorage.getItem('linyaps-password'); // 获取密码
            ipcRenderer.send('linyaps-install', { password, ...item });
        }
    },
    { deep: true, immediate: true }
);

// 页面初始化时执行
onMounted(() => {
    // 监听命令执行结果
    ipcRenderer.on('command-result', handleCommandResult);
    ipcRenderer.on(`linyaps-install-result`, handleLinyapsInstallResult);
    // 监听自定义协议
    ipcRenderer.on('custom-protocol', (_event: any, res: any) => {
        ipcRenderer.send('logger', 'info', `接收到了自定义协议的消息：${res}`);
        // 在应用中间弹出通知，接收到了自定义协议的消息
        ElNotification({ title: '自定义协议消息', message: `接收到了自定义协议的消息：${res}`, type: 'success', duration: 5000 });
    });
    reflushInstalledItems();
});
// 页面销毁前执行
onUnmounted(() => {
    ipcRenderer.removeListener('command-result', handleCommandResult);
    ipcRenderer.removeListener(`linyaps-install-result`, handleLinyapsInstallResult);
    clearInterval(timer);
});
</script>
<style>
.common-layout {
    height: 100%;
    width: 100%;
}

.el-container {
    height: 100%;
}

.el-aside {
    width: 150px;
    margin: 12px 0 12px 12px;
    border-radius: 15px;
    position: relative;
}

.el-menu {
    height: 100%;
    border-right-style: none;
    overflow-y: hidden;
    background-color: var(--base-background-color);
}

.el-menu-item {
    height: 45px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 10px;
    text-align: center;
    margin: 5px;
    color: var(--menu-base-font-color);
    background-color: var(--menu-base-color);
}

.download-queue {
    position: fixed;
    bottom: 99px;
    margin: 5px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    text-align: center;
    width: 140px;
    height: 30px;
    background-color: var(--menu-base-color);
}

.download-queue:hover {
    background-color: #999999;
    cursor: pointer;
}

.download-btn {
    font-size: 14px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    flex-direction: column;
    color: var(--menu-base-font-color);
}

.network-info {
    position: fixed;
    border-radius: 15px;
    text-align: center;
    margin: 5px;
    bottom: 12px;
    font-size: 12px;
    height: 75px;
    width: 140px;
    color: var(--menu-base-font-color);
    background-color: var(--menu-base-color);
}

.network-info-title {
    font-size: 14px;
    font-weight: bold;
    margin: 3px;
    color: var(--menu-base-font-color);
}

.views {
    overflow: hidden;
    border-radius: 15px;
    margin: 12px;
    padding: 12px;
    position: relative;
    background-color: var(--base-background-color);
}

</style>