<template>
    <!-- 下载队列弹框 -->
    <transition name="el-zoom-in-left">
        <div v-show="show" class="transition-queue-box">
            <el-table :data="installingItems" border stripe style="width: 100%;height: 100%;">
                <el-table-column label="安装进度" header-align="center" align="center" width="120" show-overflow-tooltip>
                    <template #default="scope">
                        <a v-if="showSchedule(scope.row)">{{ scope.row.schedule }}</a>
                        <a v-else-if="waitingSchedule(scope.row)">等待中...</a>
                        <a v-else>-</a>
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="名称" header-align="center" align="center" show-overflow-tooltip/>
                <el-table-column prop="version" label="版本" header-align="center" align="center" width="160" show-overflow-tooltip/>
                <el-table-column fixed="right" label="操作" header-align="center" align="center" width="120">
                    <template #default="scope">
                        <el-button v-if="isInstalling(scope.row)" loading>安装中...</el-button>
                        <el-button v-else @click="cancelInstall(scope.row)" type="danger" size="small">取消安装</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </transition>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { InstalledEntity } from '@/interface'
import { compareVersions } from '@/util/checkVersion';

import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const systemConfigStore = useSystemConfigStore();


defineProps({
    show: {
        type: Boolean,
        default: false
    },
    installingItems: {
        type: Array as PropType<InstalledEntity[]>,
        default: () => []
    }
})
// 队列表格辅助函数
const showSchedule = (row: any) => compareVersions(systemConfigStore.linglongBinVersion, '1.5.0') >= 0 && row.schedule !== '-';
const waitingSchedule = (row: any) => compareVersions(systemConfigStore.linglongBinVersion, '1.5.0') >= 0 && row.schedule === '-';
const isInstalling = (row: any) => !row.isInstalled && row.loading && row.schedule !== '-';

// 终止安装点击事件
const cancelInstall = (row: InstalledEntity) => {
    installingItemsStore.removeItem(row);
    // 关闭各个列表中的加载状态
    installedItemsStore.updateItemLoadingStatus(row, false);
    difVersionItemsStore.updateItemLoadingStatus(row, false);
    allAppItemsStore.updateItemLoadingStatus(row, false);
}

</script>
<style scoped>
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