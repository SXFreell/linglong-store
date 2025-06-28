import { defineStore } from "pinia";
import { ref } from "vue";
import { InstalledEntity } from "@/interface";
import { useInstalledItemsStore } from "@/store/installedItems";

const installedItemsStore = useInstalledItemsStore();

/**
 * 可更新的全部应用
 */
export const useUpdateItemsStore = defineStore("updateItems", () => {

    let updateItemList = ref<InstalledEntity[]>([]);

    /**
     * 初始化更新列表
     */
    const initUpdateItems = (data: string) => {
        const datas: any[] = data.trim() ? JSON.parse(data.trim()) : [];
        if (datas.length < 1) {
            updateItemList.value.splice(0, updateItemList.value.length); // 清空更新列表
            return;
        }
        let addedItems: InstalledEntity[] = [];
        datas.forEach(item => {
            const { id, old_version, new_version } = item;
            const thisItem = installedItemsStore.installedItemList.find(installedItem => installedItem.appId == id);
            if (thisItem) {
                thisItem.version = old_version; // 设置旧版本号
                thisItem.newVersion = new_version; // 更新版本号
                addedItems.push(thisItem);
            }
        });
        // 如果更新列表为空，则直接赋值
        if (updateItemList.value.length < 1) {
            updateItemList.value = addedItems as InstalledEntity[]; 
            return;
        }
        // 更新列表和新增列表获取交集数据
        const newList = updateItemList.value.filter(aItem => addedItems.some(bItem => bItem.appId === aItem.appId));
        updateItemList.value = newList;
        addedItems.forEach(bItem => {
            if (!newList.some(aItem => bItem.appId === aItem.appId)) {
                updateItemList.value.push(bItem);
            }
        });
    }
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = async (item: InstalledEntity) => {
        updateItemList.value.push(item);
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: InstalledEntity) => {
        const index = updateItemList.value.findIndex((i) => i.appId === item.appId);
        if (index !== -1) {
            updateItemList.value.splice(index, 1);
        }
    };
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        updateItemList.value.splice(0, updateItemList.value.length);
    };
    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: InstalledEntity,flag: boolean) => {
        const index = updateItemList.value.findIndex((it) => it.version === item.version && it.appId === item.appId && it.module === item.module);
        if (index !== -1) {
            const aItem = updateItemList.value[index];
            aItem.loading = flag;
            updateItemList.value.splice(index, 1, aItem);
        }
    }

    return {
        updateItemList,
        initUpdateItems,
        addItem,
        removeItem,
        clearItems,
        updateItemLoadingStatus,
    };

});