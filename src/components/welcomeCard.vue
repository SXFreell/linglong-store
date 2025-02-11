<template>
    <el-card class="card-container">
        <div class="card-icon" :title="desc" @click="openDetails">
            <img style="width: 100px;height: 100px;" v-lazy="icon" alt="Image" />
        </div>
        <span class="card-name" :title="name">{{ name }}</span>
        <div ref="containerRef" class="text-container">
            <span ref="textRef" class="text-content">{{ defaultName }}</span>
        </div>
        <!-- <span class="card-version">{{ version }}</span> -->
        <div class="card-bottom" v-loading="loading" :element-loading-svg="svg"
            element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)">
            <el-button class="uninstall-btn" v-if="isInstalled" @click="openDetails">已安装</el-button>
            <el-button class="install-btn" v-else @click="openDetails">安装</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { LocationQueryRaw, useRouter } from 'vue-router';
import { CardFace, OpenDetailParams } from "@/interface";

const router = useRouter();

const containerRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);

// 接受父组件传递的参数，并设置默认值
// icon: "https://linglong.dev/asset/logo.svg",
const props = withDefaults(defineProps<CardFace>(), {
    appId: "", name: "程序名称", arch: "X86_64", version: "0.0.1", description: "描述说明", icon: "",
    isInstalled: true, loading: false, createTime: "2023-04-11 10:00:00", installCount: 0,
    channel: "", zhName: "", size: "",
})
// 格式化程序描述
const desc = computed(() => props.description ? props.description.replace(/(.{20})/g, '$1\n') : '');
// 格式化程序名称
const defaultName = computed(() => props.zhName ? props.zhName : props.name);
// 加载的svg动画
const svg = `<path class="path" d="M 30 15 L 28 17 M 25.61 25.61 A 15 15, 0, 0, 1, 15 30 A 15 15, 0, 1, 1, 27.99 7.5 L 15 15" style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>`
// 打开不同版本页面
const openDetails = () => {
    let queryParams = { menuName: '玲珑推荐', ...props } as OpenDetailParams as unknown as LocationQueryRaw;
    router.push({ path: '/details', query: queryParams });
}
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
    margin-top: 14px;
    justify-content: center;
}

.install-btn {
    padding: 6px;
    width: 75%;
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