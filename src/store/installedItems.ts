import { ref } from "vue";
import { defineStore } from "pinia";
import { InstalledEntity } from "@/interface";
import { useSystemConfigStore } from "@/store/systemConfig";
import { getAppDetails } from "@/api";
import { ipcRenderer } from "electron";

const systemConfigStore = useSystemConfigStore();

/**
 * 已安装的全部应用
 */
export const useInstalledItemsStore = defineStore("installedItems", () => {

    let installedItemList = ref<InstalledEntity[]>([]);

    /**
     * 初始化已安装程序数组(1.4以后的版本)
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initInstalledItems = async (data: string) => {
        const datas: any[] = data.trim() ? JSON.parse(data.trim()) : [];
        if (datas.length < 1) {
            const removedItems = [...installedItemList.value]; // 全部被移除
            clearItems(); // 清空已安装列表
            return { installedItemList, addedItems: [], removedItems };
        }
        // 拆解并处理数据
        datas.forEach(item => {
            item.appId = item.id ? item.id : item.appid ? item.appid : item.appId; // 设定appId
            item.arch = typeof item.arch === 'string' ? item.arch : Array.isArray(item.arch) ? item.arch[0] : ''; // 设定arch架构
            item.size = item.size ? item.size.toString() : '0'; // 设定文件大小
            item.repoName = systemConfigStore.defaultRepoName; // 设定仓库源
            item.categoryName = '其他'; // 设定分类名称
            item.installCount = 0; // 安装次数
            item.uninstallCount = 0; // 卸载次数
            item.isInstalled = true; // 默认已安装
            item.loading = false; // 默认未加载
        });
        // 记录旧列表
        let addedItems: InstalledEntity[] = [];
        let removedItems: InstalledEntity[] = [];
        // 如果已安装列表不为空，则进行对比
        if (installedItemList.value.length > 0) {
            const aMap = installedItemList.value;  // 已安装列表
            const newList = installedItemList.value.filter(aItem => datas.some(bItem => bItem.appId === aItem.appId && bItem.version === aItem.version));
            // 找出被移除的元素
            removedItems = installedItemList.value.filter(aItem => !datas.some(bItem => bItem.appId === aItem.appId && bItem.version === aItem.version));
            installedItemList.value = newList;
            // 找出新增的元素
            datas.forEach(bItem => {
                if (!aMap.some(aItem => bItem.appId === aItem.appId && bItem.version === aItem.version)) {
                    installedItemList.value.push(bItem);
                    addedItems.push(bItem);
                }
            });
        } else {
            installedItemList.value = datas as InstalledEntity[]; // 如果已安装列表为空，则直接赋值
            addedItems = [...installedItemList.value];
        }
        // 只在有新增时才获取新增应用详情
        if (addedItems.length > 0) {
            const response = await getAppDetails(addedItems);
            if (response.code == 200) {
                const details: InstalledEntity[] = response.data as unknown as InstalledEntity[];
                details.forEach((item: InstalledEntity) => {
                    // 更新 installedItemList 中的对应项
                    const idx = installedItemList.value.findIndex(it => it.appId == item.appId && it.version == item.version);
                    if (idx !== -1) {
                        const it = installedItemList.value[idx];
                        for (const key in item) {
                            (it as any)[key] = (item as any)[key];  // 有则覆盖，无则新增
                        }
                        installedItemList.value[idx] = it;
                    }
                });
            } else {
                ipcRenderer.send('logger', 'error', `获取应用详情失败: ${response.msg}`);
            }
        }
        // 返回结果
        return { installedItemList, addedItems, removedItems };
    }
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: InstalledEntity) => {
        installedItemList.value.push(item);
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: InstalledEntity) => {
        const index = installedItemList.value.findIndex((i) => i.appId === item.appId && i.version === item.version && i.module === item.module);
        if (index !== -1) {
            installedItemList.value.splice(index, 1);
        }
    };
    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        installedItemList.value.splice(0, installedItemList.value.length);
    };
    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: InstalledEntity,flag: boolean) => {
        const index = installedItemList.value.findIndex((it) => it.version === item.version && it.appId === item.appId && it.module === item.module);
        if (index !== -1) {
            const aItem = installedItemList.value[index];
            aItem.loading = flag;
            installedItemList.value.splice(index, 1, aItem);
        }
    }
    
    return {
        installedItemList,
        initInstalledItems,
        addItem,
        removeItem,
        clearItems,
        updateItemLoadingStatus,
    };
},{
    persist: {
        key: "installedItems",
        storage: localStorage,
        paths: ["installedItemList"],
    },
});