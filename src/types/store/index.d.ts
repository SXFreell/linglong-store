/**
 * Zustand Store 类型定义
 * 集中管理所有应用 store 的类型定义
 */

declare namespace Store {
  /**
   * Config Store（应用配置存储）
   * 用于存储应用启动和显示相关的配置选项
   */
  interface Config {
    /** 启动App时是否自动检测商店版本 */
    checkVersion: boolean
    /** 是否显示基础运行服务 */
    showBaseService: boolean
    /** 点击关闭时是直接关闭还是最小化到托盘 */
    closeOrHide: string
    /** 切换版本检查状态 */
    changeCheckVersionStatus: (value: boolean) => void
    /** 切换基础服务显示状态 */
    changeBaseServiceStatus: (value: boolean) => void
    /** 切换点击关闭时记录的状态 */
    changeCloseOrHide: (value: string) => void
  }

  /**
   * Global Store（全局存储）
   * 管理应用初始化状态、系统架构和仓库名称
   */
  interface Global {
    /** 应用是否初始化完成 */
    isInited: boolean
    /** 当前系统架构 */
    arch: string
    /** 当前使用的仓库 */
    repoName: string
    /** 需要更新的应用数量 */
    updateAppNum: number
    /** 初始化完成回调 */
    onInited: () => void
    /** 更改系统架构 */
    setArch: (value: string) => void
    /** 更改仓库 */
    setRepoName: (value: string) => void
    /** 更新需要更新的应用数量 */
    getUpdateAppNum: (num: number) => void
  }

  /**
   * Search Store（搜索存储）
   * 管理搜索关键词状态
   */
  interface Search {
    /** 搜索关键词 */
    keyword: string
    /** 更改搜索关键词 */
    changeKeyword: (value: string) => void
    /** 重置搜索关键词 */
    resetKeyword: () => void
  }

  /**
   * Installed Apps Store（已安装应用存储）
   * 管理系统中已安装的玲珑应用
   */
  interface InstalledApps {
    /** 已安装应用列表 */
    installedApps: API.Invoke.InstalledApp[]
    /** 需要更新的应用列表 */
    needUpdateApps: API.Invoke.InstalledApp[]
    /** 加载状态 */
    loading: boolean
    /** 错误信息 */
    error: string | null

    /**
     * 获取已安装应用列表
     * @param includeBaseService - 是否包含基础服务，默认为 false
     */
    fetchInstalledApps: (includeBaseService?: boolean) => Promise<void>

    /**
     * 更新应用详情（从后端API获取图标、中文名称等）
     */
    updateAppDetails: () => Promise<void>

    /**
     * 更新单个应用的 loading 状态
     * @param appId - 应用ID
     * @param version - 应用版本
     * @param loading - loading状态
     */
    updateAppLoading: (appId: string, version: string, loading: boolean) => void

    /**
     * 移除已卸载的应用
     * @param appId - 应用ID
     * @param version - 应用版本
     */
    removeApp: (appId: string, version: string) => void

    /**
     * 清空应用列表
     */
    clearApps: () => void
  }

  /**
   * Download Config Store（下载配置存储）
   * 管理应用下载列表及其状态
   */
  interface DownloadConfig {
    /** 单个下载项，基于后端 AppMainDto 并附加本地状态字段 */
    downloadList: DownloadApp[]
    /** 追加app到下载列表 */
    addAppToDownloadList: (app: DownloadApp) => void
    /** 改变APP下载状态(已下载和下载中) */
    changeAppDownloadStatus: (appId: string, status: string) => void
    /** 更新APP安装进度 */
    updateAppProgress: (appId: string, percentage: number, status: string) => void
    /** 清空下载列表 */
    clearDownloadList: () => void
    /** 移除下载中的应用 */
    removeDownloadingApp: (appId: string) => void
  }

  /**
   * 本地下载项类型：在后端 AppMainDto 基础上，增加本地标记字段 `flag`（例如："pending", "downloading", "done"）
   */
  interface DownloadApp extends API.APP.AppMainDto {
    flag?: string
    /** 安装进度百分比 (0-100) */
    percentage?: number
    /** 安装状态文本 */
    installStatus?: string
  }
}
