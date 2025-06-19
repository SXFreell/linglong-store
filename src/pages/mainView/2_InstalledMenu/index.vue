<template>
    <div class="apps-container" ref="installContainer">
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
import { onMounted, ref, watchEffect } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { InstalledEntity, GroupedItem } from "@/interface";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useInstalledItemsStore } from "@/store/installedItems";
import { compareVersions } from "@/util/checkVersion";
import InstalledCard from "@/components/installCard.vue";
import defaultImage from '@/assets/logo.svg';

const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();

// 用于显示列表
const displayedItems = ref<InstalledEntity[]>([]);
// 路由对象
const router = useRouter();
// 用于保存滚动位置的容器
const installContainer = ref<HTMLDivElement | null>(null);

const displayedItemss = () => {
    let datas = installedItemsStore.installedItemList;
    // 根据是否显示基础服务进行过滤
    if (!systemConfigStore.isShowBaseService) {
        datas = datas.filter(item => item.kind == 'app');
    }
    // 根据是否合并应用进行处理
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
    // 恢复保存的滚动位置
    if (installContainer.value) {
        installContainer.value.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
    }
}
// 监听安装项列表的变化
watchEffect(() => displayedItemss());
// 组件初始化时加载
onMounted(() => displayedItemss());
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    if (installContainer.value) {
        to.meta.savedPosition = installContainer.value.scrollTop; // 将滚动位置保存到路由元数据中
    }
    next();
})
</script>
<style scoped>
.item {
    margin-top: 6px;
    width: 96%;
}
</style>