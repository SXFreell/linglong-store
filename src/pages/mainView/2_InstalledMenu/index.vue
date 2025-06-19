<template>
    <div class="apps-container" v-loading="loading" element-loading-text="加载中..."
        element-loading-background="rgba(122, 122, 122, 0.8)">
        <div class="card-items-container" v-if="displayedItems.length > 0">
            <div class="card-items" v-for="(item, index) in displayedItems" :key="index">
                <el-badge v-if="item.occurrenceNumber || item.occurrenceNumber as number <= 1" class="item">
                    <InstalledCard :name="item.name" :version="item.version" :description="item.description"
                        :arch="item.arch" :isInstalled="true" :appId="item.appId" :icon="item.icon"
                        :loading="item.loading" :zhName="item.zhName" :size="item.size"
                        :categoryName="item.categoryName" />
                </el-badge>
                <el-badge v-else :value="item.occurrenceNumber" :max="99" class="item">
                    <InstalledCard :name="item.name" :version="item.version" :description="item.description"
                        :arch="item.arch" :isInstalled="true" :appId="item.appId" :icon="item.icon"
                        :loading="item.loading" :zhName="item.zhName" :size="item.size"
                        :categoryName="item.categoryName" />
                </el-badge>
            </div>
        </div>
        <div class="no-data-container" v-else>
            <div style="width: 180px;height: 300px;">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>暂无数据</h1>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from "electron";
import { onMounted, ref, watchEffect } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import InstalledCard from "@/components/installCard.vue";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useInstalledItemsStore } from "@/store/installedItems";
import { compareVersions } from "@/util/checkVersion";
import { InstalledEntity, GroupedItem } from "@/interface";
import defaultImage from '@/assets/logo.svg';

const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();

// 用于显示列表
const displayedItems = ref<InstalledEntity[]>([]);
// 路由对象
const router = useRouter();
// 加载动画
const loading = ref(true);

let llVersion = systemConfigStore.llVersion;
let linglongBinVersion = systemConfigStore.linglongBinVersion;
let isShowBaseService = systemConfigStore.isShowBaseService;

// ipc响应处理
const commandResult = async (_event: any, res: any) => {
    // 返回命令执行入参参数
    const params = res.param;
    const command = params.command;
    // 响应异常，则报错直接返回
    if (res.code != 'stdout') {
        ipcRenderer.send('logger', 'error', `\"${command}\"命令执行异常::${res.result}`);
        loading.value = false; // 关闭loading加载动画
        // 弹出提示框
        ElNotification({ title: '错误', message: res.result, type: 'error', duration: 500 });
        return;
    }
    // 继续处理业务逻辑
    if (params.type && params.type == 'installedPage') {
        if (command == 'll-cli --json list' || command == 'll-cli --json list --type=all' || command == 'll-cli --json list --type=app') {
            await installedItemsStore.initInstalledItems(res.result);
            const datas = installedItemsStore.installedItemList;
            if (systemConfigStore.isShowMergeApp && datas.length > 0) {
                const grouped = datas.reduce<Record<string, GroupedItem>>((acc, item) => {
                    const { appId, version } = item;
                    if (!acc[appId]) {
                        acc[appId] = { highestVersion: version, occurrenceNumber: 0, record: item };
                    }
                    // 获取最高版本的记录
                    if (compareVersions(version, acc[appId].highestVersion) > 0) {
                        acc[appId].highestVersion = version;
                        acc[appId].record = item;
                    }
                    // appId计数
                    acc[appId].occurrenceNumber++;
                    return acc;
                }, {});

                const results: InstalledEntity[] = Object.keys(grouped).map(appid => ({
                    ...grouped[appid].record,
                    occurrenceNumber: grouped[appid].occurrenceNumber,
                }));

                displayedItems.value = results;
            } else {
                displayedItems.value = datas;
            }
        }
        // 恢复保存的滚动位置
        const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
        container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
        loading.value = false; // 关闭loading加载动画
    }
}
watchEffect(() => {
    const datas = installedItemsStore.installedItemList;
    if (systemConfigStore.isShowMergeApp && datas.length > 0) {
        const grouped = datas.reduce<Record<string, GroupedItem>>((acc, item) => {
            const { appId, version } = item;
            if (!acc[appId]) {
                acc[appId] = { highestVersion: version, occurrenceNumber: 0, record: item };
            }
            // 获取最高版本的记录
            if (compareVersions(version, acc[appId].highestVersion) > 0) {
                acc[appId].highestVersion = version;
                acc[appId].record = item;
            }
            // appId计数
            acc[appId].occurrenceNumber++;
            return acc;
        }, {});

        const results: InstalledEntity[] = Object.keys(grouped).map(appid => ({
            ...grouped[appid].record,
            occurrenceNumber: grouped[appid].occurrenceNumber,
        }));

        displayedItems.value = results;
    } else {
        displayedItems.value = datas;
    }
})
// 组件初始化时加载
onMounted(() => {
    // 根据版本环境获取安装程序列表发送命令
    let getInstalledItemsCommand = "ll-cli --json list";
    if (compareVersions(linglongBinVersion, "1.5.0") >= 0 && compareVersions(llVersion, "1.8.3") < 0) {
        if (isShowBaseService) {
            getInstalledItemsCommand = "ll-cli --json list --type=all";
        }
    } else if (compareVersions(llVersion, "1.8.3") >= 0) {
        if (isShowBaseService) {
            getInstalledItemsCommand = "ll-cli --json list --type=all";
        } else {
            getInstalledItemsCommand = "ll-cli --json list --type=app";
        }
    }
    ipcRenderer.send('command', { command: getInstalledItemsCommand, type: 'installedPage' });
    ipcRenderer.once('command-result', commandResult);
});
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    next();
})
</script>
<style scoped>
.item {
    margin-top: 6px;
    width: 96%;
}
</style>