/**
 * Tauri 命令调用模块
 * 负责与 Rust 后端进行交互，通过 ll-cli 执行系统操作
 */
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import {
  InstalledAppSchema,
  RunningAppSchema,
  LinglongEnvCheckResultSchema,
  InstallProgressSchema,
  NetworkSpeedSchema,
  safeParseIpc,
} from './schemas'
import { z } from 'zod'

/** IPC 默认超时时间（毫秒） */
const IPC_DEFAULT_TIMEOUT = 15_000

/**
 * 带超时控制的 Tauri invoke 封装
 * 防止后端挂起时前端无限等待
 * @param cmd - Tauri 命令名称
 * @param args - 命令参数
 * @param timeout - 超时时间（毫秒），默认 15s
 */
async function invokeWithTimeout<T>(
  cmd: string,
  args?: Record<string, unknown>,
  timeout = IPC_DEFAULT_TIMEOUT,
): Promise<T> {
  // AbortController 用于在超时后忽略延迟到达的结果
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const result = await Promise.race([
      invoke<T>(cmd, args),
      new Promise<never>((_resolve, reject) => {
        controller.signal.addEventListener('abort', () =>
          reject(new Error(`IPC 调用超时 (${timeout}ms): ${cmd}`)),
        )
      }),
    ])
    return result
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 获取正在运行的玲珑应用列表
 * @returns Promise 包含运行中的应用信息
 */
export const getRunningLinglongApps = async(): Promise<API.INVOKE.RunningApp[]> => {
  const data = await invokeWithTimeout('get_running_linglong_apps')
  return safeParseIpc(z.array(RunningAppSchema), data, 'getRunningLinglongApps')
}

/**
 * 终止指定玲珑应用的运行
 * @param appName - 要终止的应用名称
 * @returns Promise 包含操作结果
 */
export const killLinglongApp = async(appName: string) => {
  // kill 操作可能需要多次重试，给予较长超时
  return await invokeWithTimeout('kill_linglong_app', { appName }, 60_000)
}

/**
 * 获取已安装的玲珑应用列表
 * @param includeBaseService - 是否包含基础服务
 * @returns Promise<API.INVOKE.InstalledApp[]> 已安装的应用列表
 */
export const getInstalledLinglongApps = async(includeBaseService = false): Promise<API.INVOKE.InstalledApp[]> => {
  const data = await invokeWithTimeout('get_installed_linglong_apps', { includeBaseService })
  return safeParseIpc(z.array(InstalledAppSchema), data, 'getInstalledLinglongApps')
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
  // 卸载可能较慢，给予较长超时
  return await invokeWithTimeout('uninstall_app', { appId, version }, 60_000)
}

/**
 * 搜索应用的所有可用版本
 * @param appId - 要搜索的应用ID
 * @returns Promise<InstalledApp[]> 该应用的所有可用版本列表
 */
export const searchVersions = async(
  appId: string,
): Promise<API.INVOKE.InstalledApp[]> => {
  return await invokeWithTimeout('search_versions', { appId })
}

/**
 * 运行指定的玲珑应用
 * @param appId - 要运行的应用ID
 * @returns Promise<string> 运行操作的结果
 */
export const runApp = async(
  appId: string,
): Promise<string> => {
  return await invokeWithTimeout('run_app', { appId })
}

/**
 * 为已安装应用创建桌面快捷方式（用户级目录）
 * @param appId - 应用ID
 * @returns Promise<string> 创建结果消息
 */
export const createDesktopShortcut = async(
  appId: string,
): Promise<string> => {
  return await invokeWithTimeout('create_desktop_shortcut', { appId })
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
  // 安装是长时间操作，进度由事件推送，这里只是发起请求，给 60s 超时
  return await invokeWithTimeout('install_app', { appId, version: version || null, force }, 60_000)
}

/**
 * 取消正在进行的安装
 * @param appId - 要取消安装的应用ID
 * @returns Promise<string> 取消操作的结果
 */
export const cancelInstall = async(
  appId: string,
): Promise<string> => {
  return await invokeWithTimeout('cancel_install', { appId }, 30_000)
}

/**
 * 退出应用
 * @returns Promise<void>
 */
export const quitApp = async(): Promise<void> => {
  return await invokeWithTimeout('quit_app')
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
 *   // 新增: 处理事件类型
 *   if (progress.eventType === 'error') {
 *     console.error(`Error code: ${progress.code}, detail: ${progress.errorDetail}`)
 *   }
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
      // 对事件 payload 做运行时校验（降级策略）
      const validated = safeParseIpc(InstallProgressSchema, event.payload, 'onInstallProgress')
      callback(validated)
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
  return await invokeWithTimeout('search_remote_app_cmd', { appId })
}

/**
 * 获取 ll-cli 版本
 * @returns Promise<string> 例如: "linyaps CLI version 1.9.9"
 */
export const getLlCliVersion = async(): Promise<string> => {
  return await invokeWithTimeout('get_ll_cli_version_cmd')
}

/**
 * 检查玲珑环境状态
 */
export const checkLinglongEnv = async(): Promise<API.INVOKE.LinglongEnvCheckResult> => {
  // 环境检测涉及多次 CLI 调用，给予较长超时
  const data = await invokeWithTimeout('check_linglong_env_cmd', undefined, 60_000)
  return safeParseIpc(LinglongEnvCheckResultSchema, data, 'checkLinglongEnv')
}

/**
 * 执行玲珑环境自动安装
 * @param script 安装脚本字符串
 */
export const installLinglongEnv = async(
  script: string,
): Promise<API.INVOKE.InstallLinglongResult> => {
  // 环境安装需要 pkexec 授权和下载，给予很长超时
  return await invokeWithTimeout('install_linglong_env_cmd', { script }, 300_000)
}

/**
 * 清理废弃的基础服务
 * 调用 ll-cli prune 命令清理不再使用的运行时和基础服务
 * @returns Promise<string> 清理操作的结果消息
 */
export const pruneApps = async(): Promise<string> => {
  return await invokeWithTimeout('prune_apps', undefined, 60_000)
}

/**
 * 网络速度信息
 */
export interface NetworkSpeed {
  upload_speed: number
  download_speed: number
}

/**
 * 获取当前网络速度
 * @returns Promise<NetworkSpeed> 上传/下载速度（字节/秒）
 */
export const getNetworkSpeed = async(): Promise<NetworkSpeed> => {
  const data = await invokeWithTimeout<NetworkSpeed>('get_network_speed', undefined, 5_000)
  return safeParseIpc(NetworkSpeedSchema, data, 'getNetworkSpeed')
}
