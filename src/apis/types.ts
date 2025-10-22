/**
 * 基于 alova 的简单请求类型定义
 */

// HTTP 请求方法
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// 基础响应接口
export interface BaseResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 简单请求配置
export interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
  params?: Record<string, any>
  cache?: boolean
  cacheTime?: number
}

// 上传配置
export interface UploadConfig extends RequestConfig {
  file: File | Blob
  name?: string
  data?: Record<string, any>
}

// 分页参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  [key: string]: any
}

// 分页响应
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 已安装应用信息
export interface InstalledApp {
  appId: string
  name: string
  version: string
  arch: string
  channel: string
  description: string
  icon: string
  kind?: string
  module: string
  runtime: string
  size: string
  repoName: string
  zhName?: string
  categoryName?: string
  loading?: boolean
  occurrenceNumber?: number
}
