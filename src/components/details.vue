<template>
    <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item class="first-menu" @click="router.back">{{ query.menuName }}</el-breadcrumb-item>
        <el-breadcrumb-item class="second-menu">{{ defaultName }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="base-container">
        <div class="title">参数信息</div>
        <div class="base-message">
            <el-row style="height: 100%;">
                <el-col :span="4" class="image-icon">
                    <img v-lazy="query.icon" alt="程序图标" width="120px" height="120px" />
                </el-col>
                <el-col :span="20" style="padding-left: 10px;height: 100%;">
                    <el-row style="margin-bottom: 6px;">
                        <el-col :span="3" class="base-message-key">中文名称：</el-col>
                        <el-col :span="5" class="base-message-value" :title="query.zhName">{{ defaultName }}</el-col>
                        <el-col :span="3" class="base-message-key">应用名称：</el-col>
                        <el-col :span="5" class="base-message-value" :title="query.name">{{ query.name }}</el-col>
                        <el-col :span="3" class="base-message-key">架构：</el-col>
                        <el-col :span="5" class="base-message-value" :title="formatArch">{{ formatArch }}</el-col>
                    </el-row>
                    <el-row style="margin-bottom: 6px;">
                        <el-col :span="3" class="base-message-key">appId：</el-col>
                        <el-col :span="5" class="base-message-value" :title="query.appId">{{ query.appId }}</el-col>
                        <el-col :span="3" class="base-message-key">应用分类：</el-col>
                        <el-col :span="5" class="base-message-value" :title="query.appId">{{ query.categoryName }}</el-col>
                    </el-row>
                    <el-row style="height: calc(100% - 70px);">
                        <el-col :span="3" class="base-message-key">应用简述：</el-col>
                        <el-col :span="21" style="height: 100%;overflow: scroll;color: #213547;">{{ query.description }}</el-col>
                    </el-row>
                </el-col>
            </el-row>
        </div>
    </div>
    <div class="choose-version">
        <div class="title">版本选择</div>
        <el-table class="version-table" :data="difVersionItemsStore.difVersionItemList" border stripe v-loading="loading">
            <el-table-column prop="version" label="版本号" header-align="center" width="120" show-overflow-tooltip/>
            <el-table-column prop="kind" label="应用类型" header-align="center" align="center" width="100" show-overflow-tooltip/>
            <el-table-column prop="channel" label="通道" header-align="center" align="center" width="100" show-overflow-tooltip/>
            <el-table-column prop="module" label="模式" header-align="center" align="center" width="100" show-overflow-tooltip/>
            <el-table-column prop="repoName" label="仓库来源" header-align="center" align="center" width="100" show-overflow-tooltip/>
            <el-table-column label="文件大小" header-align="center" align="center" width="120" :formatter="formatSize" show-overflow-tooltip/>
            <el-table-column label="下载量" header-align="center" align="center" width="100" :formatter="formatCount" show-overflow-tooltip/>
            <el-table-column label="上架时间" header-align="center" align="center" width="150" :formatter="formatUploadTime" show-overflow-tooltip/>
            <el-table-column label="运行环境" header-align="center" align="center" min-width="260" :formatter="formatRuntime" show-overflow-tooltip/>
            <el-table-column fixed="right" label="操作" header-align="center" align="center" width="160">
                <template #default="scope">
                    <el-button class="uninstall-btn"
                        v-if="scope.row.isInstalled && !scope.row.loading && scope.row.kind != 'app' && scope.row.kind != '本地安装'"
                        disabled>已安装</el-button>
                    <!-- 卸载按钮 -->
                    <el-button class="uninstall-btn"
                        v-if="scope.row.isInstalled && !scope.row.loading && (scope.row.kind == 'app' || scope.row.kind == '本地安装')"
                        @click="changeStatus(scope.row, 'uninstall')">卸载</el-button>
                    <el-button v-if="scope.row.isInstalled && scope.row.loading" loading>卸载中</el-button>
                    <!-- 运行按钮 -->
                    <el-button class="run-btn"
                        v-if="scope.row.isInstalled && !scope.row.loading && (scope.row.kind == 'app' || scope.row.kind == '本地安装')"
                        @click="handleRunApp(scope.row)">运行</el-button>
                    <!-- 安装按钮 -->
                    <el-button class="install-btn"
                        v-if="!scope.row.isInstalled && !scope.row.loading && scope.row.kind == 'app'"
                        @click="changeStatus(scope.row, 'install')">安装</el-button>
                    <el-button v-if="!scope.row.isInstalled && scope.row.loading" loading>安装中</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ipcRenderer } from 'electron';
import { InstalledEntity } from '@/interface';
import { onBeforeRouteLeave } from 'vue-router';
import { ElNotification, TableColumnCtx } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { compareVersions } from "@/util/checkVersion";
import { parseRef } from "@/util/refParam";
import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useRouter } from 'vue-router';

const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const systemConfigStore = useSystemConfigStore();

// 路由传递的对象
const router = useRouter();
// 玲珑组件版本
let llVersion = systemConfigStore.llVersion;
// 获取路由参数
const query = router.currentRoute.value.query;
// 加载状态
let loading = ref(true);

// 格式化程序名称
const defaultName = computed(() => query.zhName ? query.zhName : query.name);
// 格式化架构字段
const formatArch = computed(() => {
    if (query.arch && (query.arch as string).startsWith('[')) {
        return JSON.parse(query.arch as string).join(',');
    }
    return query.arch;
})
// 格式化运行时字段
function formatSize(row: any, _column: TableColumnCtx<any>, _cellValue: any, _index: number) {
    let size = row.size;
    if (!size) return '';
    return (size / 1024 / 1024).toFixed(2) + 'MB'; // 做一些格式化处理并返回字符串
}
// 格式化下载量
function formatCount(row: any, _column: TableColumnCtx<any>, _cellValue: any, _index: number) {
    if (row.kind && row.kind != 'app') return '-';
    let installCount = row.installCount ? row.installCount : 0;
    return installCount + "次";
}
// 格式化上架时间
function formatUploadTime(row: any, _column: TableColumnCtx<any>, _cellValue: any, _index: number) {
    let uploadTime = row.createTime;
    if (!uploadTime) return '';
    const date = new Date(uploadTime);
    if (isNaN(date.getTime())) {
        return '';
    }
    return date.toISOString().split('T')[0]; // 做一些格式化处理并返回字符串
}
// 格式化运行环境
function formatRuntime(row: any, _column: TableColumnCtx<any>, _cellValue: any, _index: number) {
    const runtime = row.runtime;
    if (!runtime) return '';
    let packs = parseRef(runtime);
    return `${packs.appId}/${packs.version}`; // 做一些格式化处理并返回字符串
};

/**
 * 操作按钮的点击事件
 * @param item 要操作的对象
 * @param flag 安装/卸载
 */
const changeStatus = async (item: any, flag: string) => {
    // 判断正在安装队列应用数量，大于10条弹出提示框
    if (installingItemsStore.installingItemList.length >= 10) {
        ElNotification({ title: '提示', type: 'warning', duration: 500, message: '当前下载队列超过10条，请稍后操作...' });
        return;
    }
    // 大于等于1.7.0版本后，安装低版本会进行校验
    if (compareVersions(llVersion, "1.7.0") >= 0 && flag == 'install') {
        let tempList = installedItemsStore.installedItemList;
        let theAppIdList = tempList.filter(it => it.appId == item.appId);
        if (theAppIdList.length > 0) {
            for (let index = 0; index < theAppIdList.length; index++) {
                const element = theAppIdList[index];
                if (compareVersions(element.version, item.version) > 0) {
                    ElNotification({ title: '提示', type: 'warning', duration: 3000, message: '当前应用存在更高版本，若想安装低版本，请卸载高版本后操作...' });
                    return;
                }
            }
        }
    }
    // 启用加载框
    allAppItemsStore.updateItemLoadingStatus(item, true); // 全部程序列表(新)
    installedItemsStore.updateItemLoadingStatus(item, true); // 已安装程序列表
    difVersionItemsStore.updateItemLoadingStatus(item, true); // 不同版本列表
    // 根据flag判断是安装还是卸载,发送命令并弹出提示框
    if (flag == 'install') {
        installingItemsStore.addItem(item); // 新增到加载中列表
        ElNotification({ title: '提示', message: `正在安装${item.name}(${item.version})`, type: 'info', duration: 500 });
    } else {
        ipcRenderer.send('command', { ...item, loading: false, command: `ll-cli uninstall ${item.appId}/${item.version}` });
        ElNotification({ title: '提示', message: `正在卸载${item.name}(${item.version})`, type: 'info', duration: 500 });
    }
}

// 运行按钮(发送操作命令,并弹出提示框)
const handleRunApp = (item: InstalledEntity) => {
    ipcRenderer.send('command', { ...item, loading: false, command: `ll-cli run ${item.appId}/${item.version}` });
    ElNotification({ title: '提示', type: 'info', duration: 500, message: `${item.name}(${item.version})j即将被启动！` });
}

const searchLinyapsByAppId = (appId: string) => {
    // 2.调用查询方法
    let itemsCommand = `ll-cli --json search ${appId}`;
    if (compareVersions(llVersion, '1.5.0') >= 0 && compareVersions(llVersion, '1.7.7') < 0) {
        itemsCommand = systemConfigStore.isShowBaseService ? `ll-cli --json search ${appId} --type=all` : itemsCommand;
    } else if (compareVersions(llVersion, '1.7.7') >= 0 && compareVersions(llVersion, '1.8.3') < 0) {
        itemsCommand = `ll-cli --json search ${appId} --all`;
    } else if (compareVersions(llVersion, '1.8.3') >= 0) {
        itemsCommand = `ll-cli --json search ${appId} --show-all-version`;
    }
    ipcRenderer.send("linyaps-search", { 'command': itemsCommand });
    ipcRenderer.once('linyaps-search-result', (_event: any, res: any) => {
        const { error, stdout, stderr } = res;
        if (error || stderr) {
            loading.value = false;
            ipcRenderer.send('logger', 'error', `获取版本列表失败: ${error || stderr}`);
            ElNotification({ title: '提示', message: "获取版本列表失败，请稍后重试", type: 'error', duration: 500 });
            return;
        }
        difVersionItemsStore.initDifVersionItems(stdout, query.appId as string);
        loading.value = false;
    });
}

// 监听版本刷新结果
const reflushVersionList = (_event: any, res: any) => {
    searchLinyapsByAppId(res.appId);
}

// 页面启动时加载
onMounted(async () => {
    // 监听安装结果后版本刷新
    ipcRenderer.on('reflush-version-list-result', reflushVersionList);
    // 刷新版本列表
    ipcRenderer.send('reflush-version-list', query.appId as string);
})
// 页面销毁前执行
onBeforeUnmount(() => {
    ipcRenderer.removeListener('reflush-version-list-result', reflushVersionList);
});

// 路由跳转离开前
onBeforeRouteLeave((to: any, from: any, next: any) => {
    const { meta: toMeta } = to;
    const { meta: fromMeta } = from;
    Object.keys(fromMeta).forEach((key) => {
        toMeta[key] = fromMeta[key];
    });
    next();
})
</script>
<style scoped>
.base-container {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    margin-bottom: 3px;
    height: 30%;
    background-color: #6a6d7b;
    padding: 10px;
}

.title {
    color: var(--menu-base-font-color);
    border-radius: 5px;
    padding-bottom: 5px;
    font-weight: bold;
}

.version-table {
    width: 100%;
    border-radius: 5px;
    flex-grow: 1;
    border: 1px solid #DCDCDC;
}

.base-message {
    padding: 12px;
    background-color: white;
    border-radius: 5px;
    height: 75%;
}

.image-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    border-radius: 10px;
    background: radial-gradient(circle at 50% 50%, transparent, var(--base-color));
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    background-clip: padding-box;
    height: 100%;
}

.choose-version {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    height: calc(70% - 70px);
    background-color: #6a6d7b;
    padding: 10px;
}

.install-btn {
    background-color: blue;
    color: white;
    padding: 6px;
    height: 24px;
}

.uninstall-btn {
    background-color: red;
    color: white;
    padding: 6px;
    height: 24px;
}

.run-btn {
    background-color: #5F9EA0;
    color: white;
    padding: 6px;
    height: 24px;
}

.base-message-key {
    color: black;
    text-align: right;
    font-weight: bold;
}

.base-message-value {
    color: #213547;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
    display: none;
}

@media (prefers-color-scheme: light) {
    .base-container {
        background-color: var(--base-color);
    }

    .choose-version {
        background-color: var(--base-color);
    }
}
</style>