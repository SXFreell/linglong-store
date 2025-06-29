import { defineStore } from "pinia";
import { ref } from "vue";
import { InstalledEntity } from "@/interface";
import { useUpdateStatusStore } from "@/store/updateStatus";

const updateStatusStore = useUpdateStatusStore();

/**
 * 已安装的全部应用
 */
export const useInstallingItemsStore = defineStore("installingItems", () => {

    let installingItemList = ref<InstalledEntity[]>([]);
    
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: InstalledEntity) => {
        item.schedule = "-";
        installingItemList.value.push(item);
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: InstalledEntity) => {
        // 找到应用从下载队列里移除
        const index = installingItemList.value.findIndex((i) => i.appId === item.appId && i.version === item.version);
        if (index !== -1) {
            installingItemList.value.splice(index, 1);
        }
        // 取消队列占用状态
        updateStatusStore.changeDownloadQueueStatus(false);
        // 下载队列是空的情况下，更新页面一键更新按钮禁用状态取消
        if (installingItemList.value.length <= 0) {
            updateStatusStore.changeUpdateStatus(false);
        }
    };

    return {
        installingItemList,
        addItem,
        removeItem,
    };
});