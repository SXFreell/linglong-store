/**
 * Tauri 命令调用模块
 * 负责与 Rust 后端进行交互，通过 ll-cli 执行系统操作
 */
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { InstalledApp, InstallProgress } from './types'

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
 * 获取已安装的玲珑应用列表（不包含基础服务）
 * @returns Promise<InstalledApp[]> 已安装的应用列表
 */
export const getInstalledLinglongApps = async(): Promise<InstalledApp[]> => {
  return await invoke('get_installed_linglong_apps')
}

/**
 * 获取所有已安装的玲珑应用列表（包含基础服务）
 * @returns Promise<InstalledApp[]> 所有已安装的应用列表
 */
export const getAllInstalledLinglongApps = async(): Promise<
  InstalledApp[]
> => {
  return await invoke('get_all_installed_linglong_apps')
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
): Promise<InstalledApp[]> => {
  return await invoke('search_versions', { appId })
}

/**
 * 运行指定版本的应用
 * @param appId - 要运行的应用ID
 * @param version - 要运行的应用版本
 * @returns Promise<string> 运行操作的结果
 */
export const runApp = async(
  appId: string,
  version: string,
): Promise<string> => {
  return await invoke('run_app', { appId, version })
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
  callback: (progress: InstallProgress) => void,
): Promise<UnlistenFn> => {
  return await listen<InstallProgress>('install-progress', (event) => {
    console.log('[onInstallProgress] Received event:', event.payload)
    callback(event.payload)
  })
}
