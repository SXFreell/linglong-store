<template>
    <div class="apps-container" v-if="isFirstLoad" v-loading="loading" element-loading-text="加载中..."
        element-loading-background="rgba(122, 122, 122, 0.8)">
    </div>
    <div class="apps-container" v-else v-loading="loading" element-loading-text="加载中..."
        element-loading-background="rgba(122, 122, 122, 0.8)">
        <div class="card-items-container" v-if="displayedItems && displayedItems.length > 0">
            <div class="card-items" v-for="(item, index) in displayedItems" :key="index">
                <Card :tabName="`排行榜(下载量)`" :icon="item.icon" :appId="item.appId" :name="item.name" :zhName="item.zhName" :kind="item.kind"
                    :arch="item.arch" :channel="item.channel" :categoryName="item.categoryName" :version="item.version" :base="item.base"
                    :description="item.description" :createTime="item.createTime" :installCount="item.installCount" :module="item.module"
                    :isInstalled="item.isInstalled" :loading="item.loading" :runtime="item.runtime" :devName="item.devName"/>
            </div>
        </div>
        <NoData v-else />
    </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import Card from "@/components/Card.vue";
import NoData from "@/components/NoData.vue";
import { InstalledEntity, pageResult } from '@/interface';
import { useInstalledItemsStore } from "@/store/installedItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { onBeforeRouteLeave } from 'vue-router';
import { getInstallAppList } from '@/api';
import router from '@/router';

const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();

const arch = systemConfigStore.arch;
const repoName = systemConfigStore.defaultRepoName;

// 是否是第一次加载(决定是否显示查无数据)
const isFirstLoad = ref(true);
// 页面加载状态
const loading = ref(true);

let displayedItems = ref<InstalledEntity[]>([]);

// 页面启动时加载
onMounted(async () => {
    let res = await getInstallAppList({repoName, arch, pageNo: 1, pageSize: 100});
    if (res.code == 200) {
        isFirstLoad.value = false;
        displayedItems.value = (res.data as unknown as pageResult).records;
        displayedItems.value.forEach(item => {
            item.isInstalled = installedItemsStore.installedItemList.find(it => it.appId == item.appId) ? true : false;
        })
    }
    // 等待下一次 DOM 更新
    await nextTick();
    // 恢复保存的滚动位置
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
    loading.value = false;
})
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    to.meta.savedTabName = `downRanking`; // 将搜索内容保存到路由元数据中
    next();
})
</script>