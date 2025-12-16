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
   * 环境信息状态（已合并到 Global Store）
   * 管理玲珑环境检测与安装相关信息
   */
  interface EnvState {
    checking: boolean
    installing: boolean
    checked: boolean
    envReady: boolean
    reason?: string
    osVersion: string
    glibcVersion: string
    kernelInfo: string
    /** 当前系统架构 */
    arch: string
    llVersion: string
    llBinVersion: string
    /** 当前使用的仓库 */
    repoName: string
    detailMsg: string
    repos: API.INVOKE.LinglongRepo[]
    setChecking: (value: boolean) => void
    setInstalling: (value: boolean) => void
    setReason: (value?: string) => void
    setEnvReady: (value: boolean) => void
    setEnvInfo: (value: Partial<Store.EnvState>) => void
  }

  type Env = EnvState

  /**
   * Global Store（全局存储）
   * 管理应用初始化状态、系统架构和仓库名称
   */
  interface Global extends EnvState {
    /** 应用是否初始化完成 */
    isInited: boolean
    /** 需要更新的应用数量 */
    updateAppNum: number
    /** 当前客户端/商店版本（来自 package.json） */
    appVersion: string
    /** 设备指纹ID（匿名统计用） */
    visitorId: string
    /** 客户端IP地址（匿名统计用） */
    clientIp: string
    /** 初始化完成回调 */
    onInited: () => void
    /** 更改系统架构 */
    setArch: (value: string) => void
    /** 更改仓库 */
    setRepoName: (value: string) => void
    /** 更新需要更新的应用数量 */
    getUpdateAppNum: (num: number) => void
    /** 更新 app 版本号 */
    setAppVersion: (value: string) => void
    /** 设置设备指纹ID */
    setVisitorId: (value: string) => void
    /** 设置客户端IP */
    setClientIp: (value: string) => void
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
    installedApps: API.INVOKE.InstalledApp[];

    /**
     * 获取已安装应用列表
     * @param includeBaseService - 是否包含基础服务，默认为 false
     */
    fetchInstalledApps: (includeBaseService?: boolean) => Promise<void>;

    /**
     * 更新应用详情（从后端API获取图标、中文名称等）
     */
    updateAppDetails: () => Promise<void>;

    /**
     * 移除已卸载的应用
     * @param appId - 应用ID
     * @param version - 应用版本
     */
    removeApp: (appId: string, version: string) => void;

    /**
     * 清空应用列表
     */
    clearApps: () => void;
  }

  // ==================== 安装队列 Store ====================

  /**
   * 安装任务状态枚举
   */
  type InstallTaskStatus = 'pending' | 'installing' | 'success' | 'failed'

  /**
   * 安装任务
   * 代表队列中的一个安装/更新任务
   */
  interface InstallTask {
    /** 唯一任务ID */
    id: string
    /** 应用ID */
    appId: string
    /** 应用完整信息（含图标、名称等） */
    appInfo: API.APP.AppMainDto
    /** 指定版本（可选，不指定则安装最新版本） */
    version?: string
    /** 是否强制安装 */
    force: boolean
    /** 任务状态 */
    status: InstallTaskStatus
    /** 安装进度百分比 (0-100) */
    progress: number
    /** 状态消息 */
    message: string
    /** 错误信息（如果失败） */
    error?: string
    /** 入队时间戳 */
    createdAt: number
    /** 开始安装时间戳 */
    startedAt?: number
    /** 结束时间戳 */
    finishedAt?: number
  }

  /**
   * Install Queue Store（安装队列存储）
   * 统一管理应用安装队列，支持串行安装、失败隔离
   */
  interface InstallQueue {
    /** 待安装任务队列 */
    queue: InstallTask[]
    /** 当前正在执行的任务（只持久化这个） */
    currentTask: InstallTask | null
    /** 已完成/失败的任务历史（用于UI显示，不持久化） */
    history: InstallTask[]
    /** 队列是否正在处理中 */
    isProcessing: boolean

    /**
     * 添加安装任务到队列
     * @param appInfo - 应用信息
     * @param options - 安装选项（版本、是否强制）
     * @returns 任务ID
     */
    enqueueInstall: (
      appInfo: API.APP.AppMainDto,
      options?: { version?: string; force?: boolean }
    ) => string

    /**
     * 批量添加安装任务到队列
     * @param tasks - 任务列表
     * @returns 任务ID列表
     */
    enqueueBatch: (
      tasks: Array<{ appInfo: API.APP.AppMainDto; version?: string; force?: boolean }>
    ) => string[]

    /**
     * 开始处理队列（内部自动调用，通常不需要手动调用）
     */
    processQueue: () => Promise<void>

    /**
     * 更新当前任务进度
     * @param appId - 应用ID
     * @param progress - 进度百分比
     * @param message - 状态消息
     */
    updateProgress: (appId: string, progress: number, message: string) => void

    /**
     * 标记当前任务完成
     * @param appId - 应用ID
     */
    markSuccess: (appId: string) => void

    /**
     * 标记当前任务失败
     * @param appId - 应用ID
     * @param error - 错误信息
     */
    markFailed: (appId: string, error: string) => void

    /**
     * 清空历史记录
     */
    clearHistory: () => void

    /**
     * 从队列中移除待安装任务（仅限 pending 状态）
     * @param taskId - 任务ID
     */
    removeFromQueue: (taskId: string) => void

    /**
     * 检查应用是否在队列中或正在安装
     * @param appId - 应用ID
     */
    isAppInQueue: (appId: string) => boolean

    /**
     * 获取应用的安装状态（用于UI显示）
     * @param appId - 应用ID
     */
    getAppInstallStatus: (appId: string) => InstallTask | null

    /**
     * 启动时恢复检查：检查持久化的 currentTask 是否已完成
     * @param installedApps - 当前已安装的应用列表
     */
    checkRecovery: (installedApps: API.INVOKE.InstalledApp[]) => void

    /**
     * 持久化当前任务到本地存储
     */
    persistCurrentTask: () => void

    /**
     * 从本地存储加载持久化的任务
     */
    loadPersistedTask: () => InstallTask | null
  }
}
