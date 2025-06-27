<template>
    <el-card class="card-container">
        <el-tag effect="plain" class="tag-diagonal">{{ categoryName }} </el-tag>
        <div class="card-icon" :title="desc" @click="openDetails">
            <img style="width: 100px;height: 100px;" v-lazy="icon" alt="Image" />
        </div>
        <span class="card-name" :title="name">{{ name }}</span>
        <div ref="containerRef" class="text-container">
            <span ref="textRef" class="text-content">{{ displayName }}</span>
        </div>
        <span v-if="tabName == '更新程序'" class="card-version">{{ newVersion }}</span>
        <span v-else class="card-version">{{ version }}</span>
        <div class="card-bottom" v-if="tabName == '玲珑推荐' || tabName == '分类推荐' || tabName == '全部程序'" v-loading="loading" element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)">
            <el-button class="card-btn" v-if="isInstalled" @click="openDetails">已安装</el-button>
            <el-button class="card-btn" v-else @click="openDetails">安装</el-button>
        </div>
        <div class="p-card-bottom" v-if="tabName == '排行榜(最新上架)' || tabName == '排行榜(下载量)'" v-loading="loading" element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)">
            <div class="card-arch" v-if="tabName == '排行榜(下载量)'">下载 {{ installCount }}次</div>
            <div class="card-arch" v-else-if="tabName == '排行榜(最新上架)'">{{ displayTime }}</div>
            <el-button class="p-card-btn" v-if="isInstalled" @click="openDetails">已安装</el-button>
            <el-button class="p-card-btn" v-else @click="openDetails">安装</el-button>
        </div>
        <div class="card-bottom" v-if="tabName == '卸载程序'" v-loading="loading" element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)">
            <el-button class="card-btn" @click="changeStatus(props)">卸载</el-button>
        </div>
        <div class="card-bottom" v-if="tabName == '更新程序'" v-loading="loading" element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)">
            <el-button class="card-btn" @click="openDetails">升级</el-button>
        </div>
        <div class="card-bottom" v-if="tabName == '我的应用'">
            <el-button class="card-btn" @click="handleRunApp(props)">启动</el-button>
        </div>
    </el-card>
</template>
<script lang="ts" setup>
import router from '@/router';
import defaultImage from '@/assets/logo.svg';
import { ipcRenderer } from 'electron';
import { computed, nextTick, onMounted, ref } from 'vue'
import { InstalledEntity } from '@/interface';

import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";

const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();

const containerRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);

// 定义组件的属性
const props = defineProps({
    tabName: { type: String, default: '全部程序' },
    icon: { type: String, default: defaultImage },
    appId: { type: String, required: true },
    name: { type: String, default: '' },
    zhName: { type: String, default: '' },
    arch: { type: String, default: 'x86_64' },
    channel: { type: String, default: '' },
    categoryName: { type: String, default: '其他' },
    version: { type: String, default: '0.0.0.1' },
    newVersion: { type: String, default: '0.0.0.1' },
    module: { type: String, default: '' },
    repoName: { type: String, default: '' },
    runtime: { type: String, default: '' },
    size: { type: String, default: '0.00 MB' },
    description: { type: String, default: '' },
    createTime: { type: String, default: new Date().toISOString().split('T')[0] },
    installCount: { type: Number, default: 0 },
    isInstalled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false }
})

// 格式化描述信息
const desc = computed(() => props.description ? props.description.replace(/(.{20})/g, '$1\n') : '');
// 格式化时间
const displayTime = computed(() => props.createTime ? props.createTime.split(' ')[0] : `2099-01-01`);
// 格式化中文名称
const displayName = computed(() => props.zhName ? props.zhName : props.name);
// 打开玲珑明细页面
const openDetails = () => {
    // 如果程序处于加载中状态，则不允许点击
    if (props.loading || props.tabName === '卸载程序' || props.tabName === '我的应用') return;
    // 跳转到明细页面
    router.push({ path: '/details', query: { 
        menuName: props.tabName,
        ...Object.fromEntries(
            Object.entries(props).map(([k, v]) => [k, v != null ? String(v) : ''])
        ) 
    }});
}
// 按钮点击操作事件
const changeStatus = (item: InstalledEntity) => {
    ElMessageBox.confirm('确定要卸载当前程序已安装的最新版本吗？<br> 如若卸载当前应用其他版本，请点击图标查看详情进行操作', '提示', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning', center: true,
        dangerouslyUseHTMLString: true,  // 允许使用 HTML 标签
    }).then(() => {
        // 启用加载框
        installedItemsStore.updateItemLoadingStatus(item as InstalledEntity, true);
        difVersionItemsStore.updateItemLoadingStatus(item as InstalledEntity, true);
        // 发送操作命令
        ipcRenderer.send('command', {
            icon: item.icon, appId: item.appId, name: item.name, arch: item.arch, version: item.version,
            description: item.description, isInstalled: item.isInstalled, loading: false,
            command: `ll-cli uninstall ${item.appId}/${item.version}`,
        });
    })
};
// 运行按钮(发送操作命令,并弹出提示框)
const handleRunApp = (item: InstalledEntity) => {
    ipcRenderer.send('command', { ...item, loading: false, command: `ll-cli run ${item.appId}/${item.version}` });
    ElNotification({ title: '提示', type: 'info', duration: 500, message: `${item.name}(${item.version})j即将被启动！` });
}
// 滚动动画逻辑
const applyScrollAnimation = () => {
    nextTick(() => {
        const container = containerRef.value;
        const text = textRef.value;
        if (container && text) {
            if (text.scrollWidth > container.offsetWidth) {
                // textElement.style.animation = 'scroll-text 10s linear infinite';
            } else {
                text.style.animation = 'none';
                text.style.textAlign = 'center';
            }
        }
    });
};
onMounted(() => applyScrollAnimation());
</script>
<style scoped>
:deep(.el-card__body) {
    padding-top: 0px;
    padding-bottom: 5px;
}
</style>