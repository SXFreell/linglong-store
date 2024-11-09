import { defineStore } from "pinia";
import { ref } from "vue";
import { CardFace } from "@/interface";
import { useSystemConfigStore } from "@/store/systemConfig";
import { getAppDetails } from "@/api/server";

const systemConfigStore = useSystemConfigStore();
/**
 * 可更新的全部应用
 */
export const useUpdateItemsStore = defineStore("updateItems", () => {

    let updateItemList = ref<CardFace[]>([]);
    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = async (item: CardFace) => {
        updateItemList.value.push(item);
        // 格式转化
        updateItemList.value = updateItemList.value.map(item => {
            return {
                ...item,
                // 设定appId
                appId: item.id ? item.id : item.appId,
                // 设定arch架构
                arch: typeof item.arch === 'string' ? item.arch : Array.isArray(item.arch) ? item.arch[0] : '',
                // 设定仓库源
                repoName: systemConfigStore.defaultRepoName,
                // 设定文件大小
                size: item.size ? item.size.toString() : '0'
            };
        });
        let response = await getAppDetails(updateItemList.value);
            if(response.code == 200) {
                const datass: CardFace[] = response.data as unknown as CardFace[];
                if(datass.length > 0) {
                    for(let i = 0; i < updateItemList.value.length; i++) {
                        const item = updateItemList.value[i];
                        const findItem = datass.find(it => it.appId == item.appId && it.name == item.name && it.version == item.version);
                        if (findItem) {
                            // 设定arch架构
                            findItem.arch = typeof findItem.arch === 'string' ? findItem.arch : Array.isArray(findItem.arch) ? findItem.arch[0] : '';
                            // 设定仓库源
                            findItem.repoName = systemConfigStore.defaultRepoName;
                            // 设定文件大小
                            findItem.size = findItem.size ? findItem.size.toString() : '0';
                            updateItemList.value[i] = findItem;
                            continue;
                        }
                        updateItemList.value[i] = item;
                    }
                }
            } else {
                console.log(response.msg);
            }
    };
    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: CardFace) => {
        const index = updateItemList.value.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
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

    return {
        updateItemList,
        addItem,
        removeItem,
        clearItems,
    };

});