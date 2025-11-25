/**
 * Tauri 命令调用模块
 * 负责与 Rust 后端进行交互，通过 ll-cli 执行系统操作
 */
import { invoke } from '@tauri-apps/api/tauri'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

/**
 * 获取正在运行的玲珑应用列表
 * @returns Promise 包含运行中的应用信息
 */
export const getRunningLinglongApps = async() => {
  return await invoke('get_running_linglong_apps')
}

/**
 * 终止指定玲珑应用的运行
 * @param appName - 要终止的应用名称
 * @returns Promise 包含操作结果
 */
export const killLinglongApp = async(appName: string) => {
  return await invoke('kill_linglong_app', { appName })
}

/**
 * 获取已安装的玲珑应用列表
 * @param includeBaseService - 是否包含基础服务
 * @returns Promise<API.INVOKE.InstalledApp[]> 已安装的应用列表
 */
export const getInstalledLinglongApps = async(includeBaseService = false): Promise<API.INVOKE.InstalledApp[]> => {
  return await invoke('get_installed_linglong_apps', { includeBaseService })
}

/**
 * 卸载指定版本的应用
 * @param appId - 要卸载的应用ID
 * @param version - 要卸载的应用版本
 * @returns Promise<string> 卸载操作的结果
 */
export const uninstallApp = async(
  appId: string,
  version: string,
): Promise<string> => {
  return await invoke('uninstall_app', { appId, version })
}

/**
 * 搜索应用的所有可用版本
 * @param appId - 要搜索的应用ID
 * @returns Promise<InstalledApp[]> 该应用的所有可用版本列表
 */
export const searchVersions = async(
  appId: string,
): Promise<API.INVOKE.InstalledApp[]> => {
  return await invoke('search_versions', { appId })
}

/**
 * 运行指定的玲珑应用
 * @param appId - 要运行的应用ID
 * @returns Promise<string> 运行操作的结果
 */
export const runApp = async(
  appId: string,
): Promise<string> => {
  return await invoke('run_app', { appId })
}

/**
 * 安装指定的玲珑应用
 * @param appId - 要安装的应用ID（例如：org.deepin.calculator）
 * @param version - 可选的版本号，如果不指定则安装最新版本
 * @param force - 是否强制安装（默认为 false）
 * @returns Promise<string> 安装操作的结果
 */
export const installApp = async(
  appId: string,
  version?: string,
  force = false,
): Promise<string> => {
  return await invoke('install_app', { appId, version: version || null, force })
}

/**
 * 取消正在进行的应用安装
 * @param appId - 要取消安装的应用ID
 * @returns Promise<string> 取消操作的结果
 */
export const cancelInstallApp = async(appId: string): Promise<string> => {
  try {
    const result = await invoke('cancel_install', { appId })
    return result as string
  } catch (error) {
    console.error('[cancelInstallApp] API error:', error)
    throw error
  }
}

/**
 * 监听安装进度事件
 * @param callback - 进度更新回调函数
 * @returns Promise<UnlistenFn> 取消监听的函数
 *
 * @example
 * ```typescript
 * // 开始监听
 * const unlisten = await onInstallProgress((progress) => {
 *   console.log(`${progress.appId}: ${progress.percentage}% - ${progress.status}`)
 * })
 *
 * // 取消监听
 * unlisten()
 * ```
 */
export const onInstallProgress = async(
  callback: (progress: API.INVOKE.InstallProgress) => void,
): Promise<UnlistenFn> => {
  return await listen<API.INVOKE.InstallProgress>(
    'install-progress',
    (event) => {
      callback(event.payload)
    },
  )
}

/**
 * 监听安装取消事件
 * @param callback - 取消回调函数
 * @returns Promise<UnlistenFn> 取消监听的函数
 *
 * @example
 * ```typescript
 * // 开始监听
 * const unlisten = await onInstallCancelled((event) => {
 *   console.log(`Installation cancelled for: ${event.appId}`)
 * })
 *
 * // 取消监听
 * unlisten()
 * ```
 */
export const onInstallCancelled = async(
  callback: (event: { appId: string; cancelled: boolean; message: string }) => void,
): Promise<UnlistenFn> => {
  return await listen<{ appId: string; cancelled: boolean; message: string }>(
    'install-cancelled',
    (event) => {
      callback(event.payload)
    },
  )
}

/**
 * 搜索远程应用
 * @param appId - 应用ID
 * @returns Promise<SearchResultItem[]> 搜索结果
 */
export const searchRemoteApp = async(
  appId: string,
): Promise<API.INVOKE.SearchResultItem[]> => {
  return await invoke('search_remote_app_cmd', { appId })
}

/**
 * 获取 ll-cli 版本
 * @returns Promise<string> 例如: "linyaps CLI version 1.9.9"
 */
export const getLlCliVersion = async(): Promise<string> => {
  return await invoke('get_ll_cli_version_cmd')
}
