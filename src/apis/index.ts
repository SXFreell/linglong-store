/**
 * 基于 alova 的最简单 API 请求模块
 */

// 导出核心请求类和实例
export {
  Request,
  request,
  createRequest,
} from './request'

// 导出便捷方法
export {
  get,
  post,
  put,
  del,
  patch,
  upload,
  paginate,
} from './request'

// 导出所有类型定义
export type {
  HttpMethod,
  BaseResponse,
  RequestConfig,
  UploadConfig,
  PaginationParams,
  PaginationResponse,
} from './types'

// 导出常量
export {
  HTTP_STATUS,
  BUSINESS_CODE,
  DEFAULT_CONFIG,
  ERROR_MESSAGES,
  CONTENT_TYPES,
  HEADERS,
  ENV,
} from './constants'

// 导出类型
export type { InstalledApp } from './types'

// 默认导出请求实例
export { request as default } from './request'
import { invoke } from '@tauri-apps/api/core'
import type { InstalledApp } from './types'

export const getRunningLinglongApps = async() => {
  return await invoke('get_running_linglong_apps')
}

export const killLinglongApp = async(appName: string) => {
  return await invoke('kill_linglong_app', { appName })
}

export const getInstalledLinglongApps = async(): Promise<InstalledApp[]> => {
  return await invoke('get_installed_linglong_apps')
}

export const getAllInstalledLinglongApps = async(): Promise<InstalledApp[]> => {
  return await invoke('get_all_installed_linglong_apps')
}
