/**
 * 基于 alova 的简单请求类型定义
 * 注意：业务响应体统一使用 API.Common.BaseResponse<T>（定义在 types/api/common.d.ts）
 */

// HTTP 请求方法
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// 简单请求配置
export interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
  params?: Record<string, unknown>
  cache?: boolean
  cacheTime?: number
}

// 上传配置
export interface UploadConfig extends RequestConfig {
  file: File | Blob
  name?: string
  data?: Record<string, unknown>
}

// 分页参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  [key: string]: unknown
}

// 分页响应
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
