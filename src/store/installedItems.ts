import { defineStore } from "pinia";
import { ref } from "vue";
import { CardFace,InstalledEntity } from "@/interface";
import { useSystemConfigStore } from "@/store/systemConfig";
import { getAppDetails } from "@/api";

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
            clearItems(); // 清空已安装列表
            return installedItemList; // 如果没有数据，直接返回空列表
        }
        // 拆解并处理数据
        datas.forEach(item => {
            item.appId = item.id ? item.id : item.appid ? item.appid : item.appId; // 设定appId
            item.arch = typeof item.arch === 'string' ? item.arch : Array.isArray(item.arch) ? item.arch[0] : ''; // 设定arch架构
            item.repoName = systemConfigStore.defaultRepoName; // 设定仓库源
            item.size = item.size ? item.size.toString() : '0'; // 设定文件大小
        });
        if (installedItemList.value.length > 0) {
            const aMap = installedItemList.value;
            installedItemList.value = installedItemList.value.filter(aItem => datas.some(bItem => bItem.appId === aItem.appId && bItem.version === aItem.version));
            datas.forEach(bItem => {
                if (!aMap.some(aItem => bItem.appId === aItem.appId && bItem.version === aItem.version)) {
                    installedItemList.value.push(bItem);
                }
            });
        } else {
            installedItemList.value = datas as InstalledEntity[]; // 如果已安装列表为空，则直接赋值
        }
        let response = await getAppDetails(installedItemList.value);
        if(response.code == 200) {
            const datass: InstalledEntity[] = response.data as unknown as InstalledEntity[];
            if(datass.length > 0) {
                for(let i = 0; i < installedItemList.value.length; i++) {
                    const item = installedItemList.value[i];
                    const findItem = datass.find(it => it.appId == item.appId && it.name == item.name && it.version == item.version);
                    if (findItem) {
                        findItem.arch = typeof findItem.arch === 'string' ? findItem.arch : Array.isArray(findItem.arch) ? findItem.arch[0] : ''; // 设定arch架构
                        findItem.repoName = systemConfigStore.defaultRepoName; // 设定仓库源
                        findItem.size = findItem.size ? findItem.size.toString() : '0'; // 设定文件大小
                        installedItemList.value[i] = findItem;
                    } else {
                        installedItemList.value[i] = item;
                    }
                }
            }
        } else {
            console.log(response.msg);
        }
        return installedItemList;
    }
    /**
     * 更新已安装程序列表的图标
     * @param allItems 所有程序对象数组
     * @returns 处理后的对象列表
     */
    const updateInstalledItemsIcons = (allItems: CardFace[]) => {
        // 从所有程序列表中更新已安装程序的icon
        for (let index = 0; index < installedItemList.value.length; index++) {
            const element = installedItemList.value[index];
            const findItem = allItems.find(item => item.appId == element.appId && item.name == element.name);
            if (findItem && findItem.icon) {
                element.icon = findItem.icon;
            }
        }
        return installedItemList;
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
        const index = installedItemList.value.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
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
        const index = installedItemList.value.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = installedItemList.value[index];
            aItem.loading = flag;
            installedItemList.value.splice(index, 1, aItem);
        }
    }
    
    return {
        installedItemList,
        initInstalledItems,
        updateInstalledItemsIcons,
        addItem,
        removeItem,
        clearItems,
        updateItemLoadingStatus,
    };
});