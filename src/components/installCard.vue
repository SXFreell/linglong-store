<template>
    <el-card class="card-container">
        <div class="card-icon" :title="desc" @click="openDetails">
            <img style="width: 100px;height: 100px;" v-lazy="icon" alt="Image" />
        </div>
        <span class="card-name" :title="name">{{ name }}</span>
        <div ref="containerRef" class="text-container">
            <span ref="textRef" class="text-content">{{ defaultName }}</span>
        </div>
        <span class="card-version">{{ version }}</span>
        <div class="card-bottom" v-loading="loading" :element-loading-svg="svg"
            element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)">
            <el-button class="uninstall-btn" @click="changeStatus(props)">卸载</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ipcRenderer } from "electron";
import { ElMessageBox } from 'element-plus'
import { CardFace, InstalledEntity, OpenDetailParams } from "@/interface";
import { LocationQueryRaw, useRouter } from 'vue-router';
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";

const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();

const router = useRouter();

const containerRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);

// 接受父组件传递的参数，并设置默认值
// icon: "https://linglong.dev/asset/logo.svg",
const props = withDefaults(defineProps<CardFace>(), {
    appId: "", name: "程序名称", arch: "X86_64", version: "0.0.1", 
    description: "描述说明", icon: "", isInstalled: true, loading: false,
})
// 格式化程序描述
const desc = computed(() => props.description ? props.description.replace(/(.{20})/g, '$1\n') : '');
// 格式化程序名称
const defaultName = computed(() => props.zhName ? props.zhName : props.name);
// 加载的svg动画
const svg = `<path class="path" d="M 30 15 L 28 17 M 25.61 25.61 A 15 15, 0, 0, 1, 15 30 A 15 15, 0, 1, 1, 27.99 7.5 L 15 15" style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>`
// 打开玲珑明细页面
const openDetails = () => {
    let queryParams = { menuName: '卸载程序', ...props } as OpenDetailParams as unknown as LocationQueryRaw;
    router.push({ path: '/details', query: queryParams });
}
// 按钮点击操作事件
const changeStatus = (item: CardFace) => {
    ElMessageBox.confirm('确定要卸载当前程序已安装的最新版本吗？<br> 如若卸载当前应用其他版本，请点击图标查看详情进行操作', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true,  // 允许使用 HTML 标签
        type: 'warning',
        center: true,
    }).then(() => {
        // 启用加载框
        installedItemsStore.updateItemLoadingStatus(item as InstalledEntity, true);
        difVersionItemsStore.updateItemLoadingStatus(item as InstalledEntity, true);
        // 发送操作命令
        ipcRenderer.send('command', {
            appId: item.appId,
            name: item.name,
            arch: item.arch,
            version: item.version,
            description: item.description,
            isInstalled: item.isInstalled,
            icon: item.icon,
            loading: false,
            command: `ll-cli uninstall ${item.appId}/${item.version}`,
        });
    })
};
// 页面加载时执行
onMounted(() => {
    const containerElement = containerRef.value as HTMLElement;
    const textElement = textRef.value as HTMLElement;
    if (textElement && containerElement && textElement.scrollWidth > containerElement.offsetWidth) {
        // textElement.style.animation = 'scroll-text 10s linear infinite';
    } else {
        textElement.style.textAlign = 'center';
        textElement.style.animation = 'none'; // 去除滚动动画
    }
})
</script>

<style scoped>
:deep(.el-card__body) {
    padding-top: 15px;
    padding-bottom: 5px;
}

.card-bottom {
    justify-content: center;
}

.uninstall-btn {
    padding: 6px;
    width: 75%;
}

.text-container {
    width: 100%;
    background-color: var(--base-background-color);
    color: var(--menu-base-font-color);
    border-radius: 5px;
    font-size: 14px;
    font-weight: bold;
    /* 超出部分隐藏 */
    overflow: hidden;
    /* 保持文字在一行显示 */
    white-space: nowrap;
    /* 相对定位，便于定位悬浮框 */
    position: relative;
    /* 默认情况下文字居中显示 */
    text-align: center;
}

.text-content {
    display: inline-block;
}

.text-container:hover .text-content {
    /* 鼠标悬停时暂停滚动 */
    /* animation-play-state: paused; */
    animation: scroll-name 10s linear infinite;
}

@keyframes scroll-name {
    /* 从右侧开始 */
  0% {
    transform: translateX(0);
  }
    /* 向左滚动 */
  100% {
    transform: translateX(-100%);
  }
}
</style>