<template>
    <div class="apps-container">
        <div style="margin: 20px;">
            <el-carousel height="260px" type="card" :autoplay="true">
                <el-carousel-item v-for="item in welcomeItemList" :key="item.appId" @click="openDetail(item)">
                    <img :src="item.icon" style="width: 150px; height: 150px;margin: 20px auto 0 auto;">
                    <h1>{{ item.zhName }}</h1>
                </el-carousel-item>
            </el-carousel>
        </div>
        <el-divider />
        <h3 style="text-align: center;margin: 10px;">分类推荐</h3>
        <div class="category-items">
            <el-button v-for="(item, itemIndex) in categoryList" :key="itemIndex" class="category-item"
                @click="categoryClick(item)">
                {{ item.name }}
            </el-button>
        </div>
        <el-divider />
        <h3 style="text-align: center;margin: 10px;">玲珑推荐</h3>
        <div v-for="(group, groupIndex) in result" :key="groupIndex" class="items-container">
            <!-- 每五个一组的项目 -->
            <div v-for="(item, itemIndex) in group" :key="itemIndex" class="card-items">
                <Card :tabName="`玲珑推荐`" :icon="item.icon" :appId="item.appId" :name="item.name" :zhName="item.zhName" :kind="item.kind"
                    :arch="item.arch" :channel="item.channel" :categoryName="item.categoryName" :version="item.version" :base="item.base"
                    :description="item.description" :createTime="item.createTime" :installCount="item.installCount" :module="item.module"
                    :isInstalled="item.isInstalled" :loading="item.loading" :runtime="item.runtime" :devName="item.devName"/>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import Card from "@/components/Card.vue";
import defaultImage from '@/assets/logo.svg';
import { InstalledEntity, pageResult } from "@/interface";
import { getWelcomeAppList, getWelcomeCarouselList } from "@/api";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import router from "@/router";

const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();

const arch = systemConfigStore.arch;
const repoName = systemConfigStore.defaultRepoName;

const welcomeItemList = ref<InstalledEntity[]>([]);
const categoryList = ref<any[]>([]);
const result = ref<InstalledEntity[][]>([]);

// 轮播图推荐程序
const carouselChart = async () => {
    let res = await getWelcomeCarouselList({repoName, arch});
    welcomeItemList.value = res.data as unknown as InstalledEntity[];
}
// 分类推荐程序
const groupedItems = () => {
    categoryList.value.push({ name: '深度制造', categoryId: '88' });
    categoryList.value.push({ name: '游戏竞技', categoryId: '06' });
    categoryList.value.push({ name: '编程开发', categoryId: '03' });
}
// 获取最受欢迎的前十名程序
const getWelcomeApp = async () => {
    let res = await getWelcomeAppList({repoName, arch, pageNo: 1, pageSize: 10});
    if (res.code == 200) {
        const records = (res.data as unknown as pageResult).records;
        records.forEach(item => {
            item.isInstalled = installedItemsStore.installedItemList.find(it => it.appId == item.appId) ? true : false;
            item.icon = item.icon?.includes("application-x-executable.svg") ? defaultImage : item.icon;
        })
        const chunkSize = 5;
        for (let i = 0; i < records.length; i += chunkSize) {
            const items = records.slice(i, i + chunkSize);
            result.value.push(items);
        }
    }
}
// 分类选择点击事件
const categoryClick = (item: any) => {
    router.push({ path: '/search', query: { 
        menuName: '分类推荐', 
        ...Object.fromEntries(
            Object.entries(item).map(([k, v]) => [k, v != null ? String(v) : ''])
        ) 
    }});
}
// 打开明细界面
const openDetail = (item: InstalledEntity) => {
    router.push({ path: '/details', query: { 
        menuName: '玲珑推荐', 
        ...Object.fromEntries(
            Object.entries(item).map(([k, v]) => [k, v != null ? String(v) : ''])
        ) 
    }});
}
// 页面加载时启动
onMounted(async () => {
    carouselChart(); // 轮播图推荐程序
    groupedItems(); // 分类推荐程序
    getWelcomeApp(); // 获取最受欢迎的前十名程序
})
</script>
<style scoped>
.el-carousel__item:nth-child(2n) {
    background: radial-gradient(circle at 50% 50%, transparent, var(--base-color));
    backdrop-filter:blur(10px);
    text-align: center;
    border-radius: 10px;
    /* box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); */
    background-clip: padding-box;
}

.el-carousel__item:nth-child(2n + 1) {
    background: radial-gradient(circle at 50% 50%, transparent, var(--base-color));
    backdrop-filter:blur(10px);
    text-align: center;
    border-radius: 10px;
    /* box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); */
    background-clip: padding-box;
}

.category-items {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin: 10px 20px;
}

.category-item {
    margin: 10px;
    flex: 1;
    min-width: 180px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #6E6E6E;
    color: #FFFFFF;
    font-weight: bold;
    height: 45px;
}

.category-item:hover {
    background-color: #999999;
    color: #FFFFFF;
}

.items-container {
  display: flex;
  grid-gap: 10px;
  justify-content: space-around;
  margin-bottom: 10px;
}

.card-items {
    max-width: none;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
    display: none;
}

</style>