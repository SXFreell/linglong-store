import { defineStore } from 'pinia'
import { ref } from 'vue'
/**
 * 升级状态
 */
export const useUpdateStatusStore = defineStore('updateStatus', {
    state: () => ({
        // 检测更新是否可用按钮状态
        updateBtnStatus: ref(false),
        // 更新窗口显隐状态
        updateWinStatus: ref(false),
        // 下载队列是否进行中
        downloadQueueStatus: ref(false),
    }),
    getters: {
        getUpdateBtnStatus: (state) => state.updateBtnStatus,
        getUpdateWinStatus: (state) => state.updateWinStatus,
        getDownloadQueueStatus: (state) => state.downloadQueueStatus,
    },
    actions: {
        // 检测更新是否可用按钮状态
        changeUpdateBtnStatus(updateBtnStatus: boolean){
            const that = this;
            that.updateBtnStatus = updateBtnStatus;
        },
        // 更新窗口显隐状态
        changeUpdateWinStatus(updateWinStatus: boolean){
            const that = this;
            that.updateWinStatus = updateWinStatus;
        },
        // 下载队列是否进行中
        changeDownloadQueueStatus(downloadQueueStatus: boolean){
            const that = this;
            that.downloadQueueStatus = downloadQueueStatus;
        },
    },
})