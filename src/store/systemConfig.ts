import { defineStore } from 'pinia'
import { ref } from 'vue'
/**
 * 系统基本参数配置
 */
export const useSystemConfigStore = defineStore('systemConfig', {
    state: () => ({
        // 系统架构
        arch: ref('x86_64'),
        // 玲珑版本
        llVersion: ref('1.3.8'),
        // 玲珑源地址 'https://mirror-repo-linglong.deepin.com'
        sourceUrl: ref<Record<string, any>>(),
        // 是否显示非当前架构程序
        isShowDisArch: ref(true),
        // 是否显示基础运行服务
        isShowBaseService: ref(false),
        // 自动检测更新
        autoCheckUpdate: ref(true),
        // 网络运行状态
        networkRunStatus: ref(true),
        // 当前收录玲珑程序数量
        linglongCount: ref(0),
        // linglong-bin的包版本号
        linglongBinVersion: ref(''),
        // 默认仓库名称
        defaultRepoName: ref(''),
        // 指纹码
        visitorId: ref(''),
        // 玲珑基本信息
        detailMsg: ref(''),
        // 系统版本
        osVersion: ref(''),
        // 客户端ip地址
        clientIP: ref(''),
        // 一键更新状态
        updateStatus: ref(false),
    }),
    getters: {
        getSystemConfigInfo: (state) => {
            return 'arch:' + state.arch 
            + ',llVersion:' + state.llVersion 
            + ',sourceUrl:' + state.sourceUrl 
            + ',isShowDisArch:' + state.isShowDisArch 
            + ',isShowBaseService:' + state.isShowBaseService 
            + ',autoCheckUpdate:' + state.autoCheckUpdate
            + ',networkRunStatus:' + state.networkRunStatus
            + ',linglongCount:' + state.linglongCount
            + ',linglongBinVersion:' + state.linglongBinVersion
            + ',defaultRepoName:' + state.defaultRepoName
            + ',visitorId:' + state.visitorId
            + ',detailMsg:' + state.detailMsg
            + ',osVersion:' + state.osVersion
            + ',clientIP:' + state.clientIP
            + ',updateStatus:' + state.updateStatus
        },
        getIsShowDisArch: (state) => state.isShowDisArch,
    },
    actions: {
        // 修改系统架构信息
        changeArch(inArch: string){
            const that = this;
            that.arch = inArch;
        },
        // 修改玲珑版本信息
        changeLlVersion(llVersion: string){
            const that = this;
            that.llVersion = llVersion;
        },
        // 修改玲珑源地址
        changeSourceUrl(inSourceUrl: Record<string, any>){
            const that = this;
            that.sourceUrl = inSourceUrl;
        },
        // 修改是否显示非当前架构程序
        changeIsShowDisArch(isShowDisArch: boolean){
            const that = this;
            that.isShowDisArch = isShowDisArch;
        },
        // 修改是否显示基础运行服务
        changeIsShowBaseService(isShowBaseService: boolean){
            const that = this;
            that.isShowBaseService = isShowBaseService;
        },
        // 修改是否自动检测更新
        changeAutoCheckUpdate(autoCheckUpdate: boolean){
            const that = this;
            that.autoCheckUpdate = autoCheckUpdate;
        },
        // 修改网络运行状态
        changeNetworkRunStatus(networkRunStatus: boolean){
            const that = this;
            that.networkRunStatus = networkRunStatus;
        },
        // 修改网络运行状态
        changeLinglongCount(linglongCount: number){
            const that = this;
            that.linglongCount = linglongCount;
        },
        // 修改linglong-bin的包版本号
        changeLinglongBinVersion(linglongBinVersion: string){
            const that = this;
            that.linglongBinVersion = linglongBinVersion;
        },
        // 修改默认仓库名称
        changeDefaultRepoName(defaultRepoName: string){
            const that = this;
            that.defaultRepoName = defaultRepoName;
        },
        // 修改指纹码
        changeVisitorId(visitorId: string){
            const that = this;
            that.visitorId = visitorId;
        },
        // 修改组件基础信息
        changeDetailMsg(detailMsg: string){
            const that = this;
            that.detailMsg = detailMsg;
        },
        // 修改系统版本信息
        changeOsVersion(osVersion: string){
            const that = this;
            that.osVersion = osVersion;
        },
        // 修改客户端ip
        changeClientIP(clientIP: string){
            const that = this;
            that.clientIP = clientIP;
        },
        // 修改一键更新状态
        changeUpdateStatus(updateStatus: boolean){
            const that = this;
            that.updateStatus = updateStatus;
        },
    },
    persist: true
})