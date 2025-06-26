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
import { ElNotification } from 'element-plus'
// 引入网络组件 获取网络接口信息 获取实时网速
import { useNetworkSpeed } from '@/util/network'; 
import { reflushInstalledItems, cancelInstalledTimer } from '@/util/WorkerInstalled';
import { reflushUpdateItems, cancelUpdateTimer } from "@/util/WorkerUpdate";
import { installingItems,onLinyapsInstallResult,offLinyapsInstallResult,onCommandResult,offCommandResult } from "@/util/IpcInstalled";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useUpdateStatusStore } from "@/store/updateStatus";

const { uploadSpeed, downloadSpeed } = useNetworkSpeed();
const installingItemsStore = useInstallingItemsStore();
const systemConfigStore = useSystemConfigStore();
const updateStatusStore = useUpdateStatusStore();

const router = useRouter();
let show = ref(false); // 显示下载队列框

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


// 监听安装队列
watch(() => installingItemsStore.installingItemList, 
    async (newQueue) => {
        // console.log('安装队列变化:', newQueue);
        if (updateStatusStore.downloadQueueStatus) return; // 如果正在处理，则不再处理新的队列变化
        if (newQueue.length > 0) {
            const item = newQueue[0];
            updateStatusStore.downloadQueueStatus = true; // 设置为正在处理状态
            let password = localStorage.getItem('linyaps-password'); // 获取密码
            ipcRenderer.send('linyaps-install', { password, ...item });
        } else {
            systemConfigStore.changeUpdateStatus(false); // 如果队列为空，设置安装状态为false
        }
    },
    { deep: true, immediate: true }
);

// 页面初始化时执行
onMounted(() => {
    // 监听命令执行结果
    onLinyapsInstallResult();
    onCommandResult();
    // 监听自定义协议
    ipcRenderer.on('custom-protocol', (_event: any, res: any) => {
        ipcRenderer.send('logger', 'info', `接收到了自定义协议的消息：${res}`);
        // 在应用中间弹出通知，接收到了自定义协议的消息
        ElNotification({ title: '自定义协议消息', message: `接收到了自定义协议的消息：${res}`, type: 'success', duration: 5000 });
    });
    reflushInstalledItems();
    reflushUpdateItems();
});
// 页面销毁前执行
onUnmounted(() => {
    offLinyapsInstallResult();
    offCommandResult();
    cancelInstalledTimer(); // 取消安装队列的定时器
    cancelUpdateTimer(); // 取消更新队列的定时器
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