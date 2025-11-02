/**
 * Zustand Store 类型定义
 * 集中管理所有应用 store 的类型定义
 */

// ============================================================================
// Config Store（应用配置存储）
// ============================================================================

/**
 * 应用配置存储状态
 * 用于存储应用启动和显示相关的配置选项
 */
export interface ConfigStore {
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

// ============================================================================
// Init Store（初始化存储）
// ============================================================================

/**
 * 应用初始化存储状态
 * 软件启动时保存初始化状态，每次打开软件需获取服务
 */
export interface InitStore {
  /** 应用是否初始化完成 */
  loadingInit: boolean
  /** 需要更新的应用总数量 */
  updateAppNum: number
  /** 系统架构 (x86_64, arm64 等) */
  arch: string
  /** 仓库名称 (stable, testing 等) */
  repoName: string
  /** 初始化完成时的回调 */
  onInited: () => void
  /** 获取需要更新的应用数量 */
  getUpdateAppNum: (num: number) => void
  /** 更改系统架构 */
  changeArch: (value: string) => void
  /** 更改仓库名称 */
  changeRepoName: (value: string) => void
}

// ============================================================================
// Search Store（搜索存储）
// ============================================================================

/**
 * 搜索功能存储状态
 * 管理搜索关键词状态
 */
export interface SearchStore {
  /** 搜索关键词 */
  keyword: string
  /** 更改搜索关键词 */
  changeKeyword: (value: string) => void
  /** 重置搜索关键词 */
  resetKeyword: () => void
}

// ============================================================================
// Installed Apps Store（已安装应用存储）
// ============================================================================

/**
 * 已安装应用存储状态
 * 管理系统中已安装的玲珑应用
 */
export interface InstalledAppsStore {
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
