<template>
    <div class="apps-container">
        <div class="card-items-container"
            v-if="updateItemsStore.updateItemList && updateItemsStore.updateItemList.length > 0">
            <div class="card-items" v-for="(item, index) in updateItemsStore.updateItemList" :key="index">
                <updateCard :name="item.name" :version="item.version" :description="item.description"
                    :arch="item.arch" :isInstalled="true" :appId="item.appId" :icon="item.icon"
                    :loading="item.loading" :zhName="item.zhName" :size="item.size"
                    :categoryName="item.categoryName" />
            </div>
        </div>
        <div class="no-data-container" v-else>
            <div style="width: 180px;height: 300px">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>暂无数据</h1>
        </div>
        <transition name="el-zoom-in-bottom">
            <div v-show="updateItemsStore.updateItemList.length > 0" class="transition-update-btn">
                <el-button type="primary" @click="updateAll" :disabled="systemConfigStore.updateStatus">一键更新</el-button>
            </div>
        </transition>
    </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { InstalledEntity } from "@/interface";
import updateCard from "@/components/updateCard.vue";
import defaultImage from '@/assets/logo.svg';
import { reflushUpdateItems } from "@/util/WorkerUpdate";

import { useUpdateItemsStore } from "@/store/updateItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useInstallingItemsStore } from "@/store/installingItems";

const updateItemsStore = useUpdateItemsStore();
const systemConfigStore = useSystemConfigStore();
const installingItemsStore = useInstallingItemsStore();

// 更新所有
const updateAll = () => {
    // 更改一键更新状态为true
    systemConfigStore.changeUpdateStatus(true);
    // 执行一键更新
    const updateItemList = updateItemsStore.updateItemList;
    updateItemList.forEach((item) => {
        installingItemsStore.addItem(item as InstalledEntity); // 新增到加载中列表
    })
}
// 页面打开时执行
onMounted(async () => {
    reflushUpdateItems();
});
</script>
<style scoped>
.transition-update-btn {
    border-radius: 10px;
    background: radial-gradient(circle at 50% 20%, #6E6E6E, transparent);
    text-align: center;
    color: #fff;
    padding: 16px;
    box-sizing: border-box;
    position: fixed;
    bottom: 12px;
    left: 50%;
    height: 64px;
    width: 120px;
    z-index: 2;
}

@media (prefers-color-scheme: light) {
    .transition-update-btn {
        background: radial-gradient(circle at 50% 50%, transparent, #E2AB5F);
    }
}
</style>