<template>
    <div class="common-layout">
        <el-container>
            <el-aside>
                <el-menu :default-active="defaultActive">
                    <el-menu-item index="1" @click="router.push({path: '/welcome_menu'})">
                        <el-icon><Star /></el-icon><span>玲珑推荐</span>
                    </el-menu-item>
                    <el-menu-item index="6" @click="router.push({path: '/ranking_menu'})">
                        <el-icon><Histogram /></el-icon><span>排行榜</span>
                    </el-menu-item>
                    <el-menu-item index="2" @click="router.push({path: '/all_app_menu'})">
                        <el-icon><HomeFilled /></el-icon><span>全部程序</span>
                    </el-menu-item>
                    <el-menu-item index="3" @click="router.push({path: '/installed_menu'})">
                        <el-icon><GobletSquareFull /></el-icon><span>卸载程序</span>
                    </el-menu-item>
                    <el-menu-item index="4" @click="router.push({path: '/update_menu'})">
                        <el-icon><UploadFilled /></el-icon><span>更新程序</span>
                    </el-menu-item>
                    <el-menu-item index="5" @click="router.push({path: '/runtime_menu'})">
                        <el-icon><Odometer /></el-icon><span>玲珑进程</span>
                    </el-menu-item>
                    <el-menu-item index="98" @click="router.push({path: '/config_menu'})">
                        <el-icon><setting /></el-icon><span>基础设置</span>
                    </el-menu-item>
                    <el-menu-item index="99" @click="router.push({path: '/about_menu'})">
                        <el-icon><InfoFilled /></el-icon><span>关于程序</span>
                    </el-menu-item>
                    <el-menu-item index="999" @click="router.push({path: '/'})" style="display: none;">
                        <el-icon><Loading /></el-icon><span>返回首页</span>
                    </el-menu-item>
                </el-menu>
                <!-- 更多菜单项 -->
                <div class="download-queue" @click="showQueueBox = !showQueueBox">
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
            <!-- 下载队列弹框 -->
            <transition name="el-zoom-in-left">
                <div v-show="showQueueBox" class="transition-queue-box">
                    <el-table :data="installingItemsStore.installingItemList" border stripe style="width: 100%;height: 100%;">
                        <el-table-column label="安装进度" header-align="center" align="center" width="120" show-overflow-tooltip>
                            <template #default="scope">
                                <a v-if="compareVersions(systemConfigStore.linglongBinVersion,'1.5.0') >= 0 && scope.row.schedule != '-'">{{ scope.row.schedule }}</a>
                                <a v-else-if="compareVersions(systemConfigStore.linglongBinVersion,'1.5.0') >= 0 && scope.row.schedule == '-'">等待中...</a>
                                <a v-else>-</a>
                            </template>
                        </el-table-column>
                        <el-table-column prop="name" label="名称" header-align="center" align="center" show-overflow-tooltip/>
                        <el-table-column prop="version" label="版本" header-align="center" align="center" width="160" show-overflow-tooltip/>
                        <el-table-column fixed="right" label="操作" header-align="center" align="center" width="120">
                            <template #default="scope">
                                <el-button v-if="!scope.row.isInstalled && scope.row.loading && scope.row.schedule != '-'" loading>安装中...</el-button>
                                <el-button v-else @click="cancelInstall(scope.row)" type="danger" size="small">取消安装</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </transition>
        </el-container>
    </div>
</template>
<script setup lang="ts">
import { ipcRenderer } from 'electron';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { compareVersions } from '@/util/checkVersion';
import { ElNotification } from 'element-plus'
import { CardFace,InstalledEntity } from '@/interface';
// 引入网络组件 获取网络接口信息 获取实时网速
import { useNetworkSpeed } from '@/util/network'; 
const { uploadSpeed, downloadSpeed } = useNetworkSpeed();

import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const updateItemsStore = useUpdateItemsStore();
const systemConfigStore = useSystemConfigStore();
// 路由对象
const router = useRouter();
// 默认菜单页签
const defaultActive = ref('1');
// 基础服务器地址
let baseURL = import.meta.env.VITE_SERVER_URL as string;
// 显示下载队列框
const showQueueBox = ref(false);
// 下载过程中状态标识
const flag = ref(true);
// 下载日志
let downloadLogMsg = "";

// 命令执行响应函数
const commandResult = (_event: any, res: any) => {
    const params = res.param;  // 返回命令执行入参参数
    const result = res.result;  // 返回命令执行结果
    const command: string = params.command;  // 返回执行的命令
    if (res.code != 'stdout') {
        ipcRenderer.send('logger', 'error', `\"${command}\"命令执行异常::${result}`);
        return;
    }
    // 监听获取玲珑列表的命令
    if (params.type && params.type == 'refreshInstalledApps') {
        if (command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
          installedItemsStore.initInstalledItemsOld(result);
        }
        if (command == 'll-cli --json list') {
          installedItemsStore.initInstalledItems(result);
        }
    }
    if (command.startsWith('ll-cli install') || command.startsWith('ll-cli uninstall')) {
        const installedEntity: InstalledEntity = params;
        // 移除加载中列表
        installingItemsStore.removeItem(installedEntity);
        // 获取安装/卸载状态
        installedEntity.isInstalled = command.startsWith('ll-cli install');
        if (command.startsWith('ll-cli install')) {
            installedItemsStore.addItem(installedEntity);
        } else {
            installedItemsStore.removeItem(installedEntity);
        }
        difVersionItemsStore.updateItemLoadingStatus(installedEntity, false);
        difVersionItemsStore.updateItemInstallStatus(installedEntity);
        // 更新全部应用列表
        const item: CardFace = params;
        item.isInstalled = command.startsWith('ll-cli install');
        allAppItemsStore.updateItemLoadingStatus(item, false); // 全部程序列表(新)-加载状态停止
        // 全部应用列表(判断当前应用安装版本个数小于两个，才进行状态更新)
        let installedItems = installedItemsStore.installedItemList;
        let filteredItems: InstalledEntity[] = installedItems.filter(item => item.appId === params.appId);
        if (filteredItems.length < 2) {
            allAppItemsStore.updateItemInstallStatus(item);
        }
        // 移除需要更新的应用
        updateItemsStore.removeItem(item);
        // 非开发环境发送发送操作命令！
        if (import.meta.env.MODE as string != "development") {
            params.url = `${baseURL}/visit/save`;
            params.visitorId = systemConfigStore.visitorId;
            params.clientIp = systemConfigStore.clientIP;
            ipcRenderer.send('visit', params);
        }
        // 安装或卸载成功后，弹出通知
        if (command.startsWith('ll-cli install')) {
            ElNotification({
                title: '安装成功!', type: 'success', duration: 500,
                message: `${params.name}(${params.version})被成功安装!`
            });
        } else {
            ElNotification({
                title: '卸载成功!', type: 'success', duration: 500,
                message: `${params.name}(${params.version})被成功卸载!`
            });
        }
        // 1.刷新一下已安装列表，根据版本环境获取安装程序列表发送命令
        let getInstalledItemsCommand = "ll-cli --json list";
        if (compareVersions(systemConfigStore.llVersion, "1.3.99") < 0) {
            getInstalledItemsCommand = "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'";
        } else if (compareVersions(systemConfigStore.linglongBinVersion, "1.5.0") >= 0 && systemConfigStore.isShowBaseService) {
            getInstalledItemsCommand = "ll-cli --json list --type=all";
        }
        ipcRenderer.send('command', { command: getInstalledItemsCommand, type: 'refreshInstalledApps' });
    }
}
const linglongResult = (_event: any, res: any) => {
    const params = res.param;                   // 要执行的命令的入参对象
    const code: string = res.code;              // 执行命令返回的状态码
    const command: string = params.command;     // 执行的命令
    const result: string = res.result;          // 执行命令返回的结果
    downloadLogMsg += result + '<br>';
    if ('close' == code) {
        const installedEntity: InstalledEntity = params;
        // 1.从加载列表中移除
        installingItemsStore.removeItem(installedEntity);
        // 2.关闭各个列表中的加载状态
        allAppItemsStore.updateItemLoadingStatus(installedEntity, false);
        installedItemsStore.updateItemLoadingStatus(installedEntity, false);
        difVersionItemsStore.updateItemLoadingStatus(installedEntity, false);
        if (flag.value) {
            // 3.获取安装/卸载状态
            installedEntity.isInstalled = command.startsWith('ll-cli install');
            // 4.更新各个列表中的安装状态
            if (command.startsWith('ll-cli install')) {
                installedItemsStore.addItem(installedEntity);
            } else {
                installedItemsStore.removeItem(installedEntity);
            }
            // 全部应用列表(判断当前应用安装版本个数小于两个，才进行状态更新)
            let installedItems = installedItemsStore.installedItemList;
            let filteredItems: InstalledEntity[] = installedItems.filter(item => item.appId === params.appId);
            if (filteredItems.length < 2) {
                allAppItemsStore.updateItemInstallStatus(installedEntity);
            }
            difVersionItemsStore.updateItemInstallStatus(installedEntity);
            // 非开发环境发送发送操作命令！
            if (import.meta.env.MODE as string != "development") {
                params.url = `${baseURL}/visit/save`;
                params.visitorId = systemConfigStore.visitorId;
                params.clientIp = systemConfigStore.clientIP;
                ipcRenderer.send('visit', params);
            }
            // 安装或卸载成功后，弹出通知
            if (command.startsWith('ll-cli install')) {
                ElNotification({
                    title: '安装成功!', type: 'success', duration: 500,
                    message: `${params.name}(${params.version})被成功安装!`
                });
            } else {
                ElNotification({
                    title: '卸载成功!', type: 'success', duration: 500,
                    message: `${params.name}(${params.version})被成功卸载!`
                });
            }
            // 1.刷新一下已安装列表，根据版本环境获取安装程序列表发送命令
            let getInstalledItemsCommand = "ll-cli --json list";
            if (compareVersions(systemConfigStore.llVersion, "1.3.99") < 0) {
                getInstalledItemsCommand = "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'";
            } else if (compareVersions(systemConfigStore.linglongBinVersion, "1.5.0") >= 0 && systemConfigStore.isShowBaseService) {
                getInstalledItemsCommand = "ll-cli --json list --type=all";
            }
            ipcRenderer.send('command', { command: getInstalledItemsCommand, type: 'refreshInstalledApps' });
        } else {
            ElNotification({ title: '操作异常!', message: downloadLogMsg, type: 'error', duration: 5000, dangerouslyUseHTMLString: true });
            flag.value = true;
        }
        downloadLogMsg = ""; // 清除当前程序安装的日志记录
    }
    if ('stdout' == code) {
        // "[K[?25l0% prepare installing main:app.web.baidu.map/0.9.1.2/x86_64[?25h"
        if (result.toLowerCase().includes('error')) {
            flag.value = false;
        }
        if (compareVersions(systemConfigStore.llVersion,'1.7.0') >= 0) {
            let maohao = result.lastIndexOf(':');
            let baifenhao = result.lastIndexOf('%');
            const schedule = result.substring(maohao + 1, baifenhao + 1);
            installingItemsStore.updateItemSchedule(params as InstalledEntity, schedule);
        } else {
            const schedule = result.replace('[K[?25l','').replace('[?25h','').split(' ')[0];
            installingItemsStore.updateItemSchedule(params as InstalledEntity, schedule);
        }
    }
}
// 终止安装点击事件
const cancelInstall = (row: any) => {
    ipcRenderer.send('stop-linglong',{ ...row });
    installingItemsStore.removeItem(row);
    // 关闭各个列表中的加载状态
    installedItemsStore.updateItemLoadingStatus(row, false);
    difVersionItemsStore.updateItemLoadingStatus(row, false);
    allAppItemsStore.updateItemLoadingStatus(row, false);
}

// 页面初始化时执行
onMounted(() => {
    // 监听命令执行结果
    ipcRenderer.on('command-result', commandResult);
    ipcRenderer.on('linglong-result', linglongResult);
    // 监听自定义协议
    ipcRenderer.on('custom-protocol', (_event: any, res: any) => {
        ipcRenderer.send('logger', 'info', `接收到了自定义协议的消息：${res}`);
        // 在应用中间弹出通知，接收到了自定义协议的消息
        ElNotification({ title: '自定义协议消息', message: `接收到了自定义协议的消息：${res}`, type: 'success', duration: 5000 });
    });
});
// 页面销毁前执行
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
    ipcRenderer.removeListener('linglong-result', linglongResult);
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

.transition-queue-box {
    z-index: 3;
    position: fixed;
    bottom: 12px;
    left: 175px;
    padding: 6px;
    box-sizing: border-box;
    text-align: center;
    height: 28%;
    width: 38%;
    border-radius: 12px;
    background: radial-gradient(circle at 50% 50%, transparent, var(--base-color));
}

</style>