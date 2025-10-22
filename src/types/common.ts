/**
 * 通用类型定义
 */

// HTTP 请求方法
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// 基础响应接口
export interface BaseResponse<T = unknown> {
  code: number
  message: string
  data: T
  success: boolean
}

// 分页参数
export interface PaginationParams {
  pageNo?: number
  pageSize?: number
  [key: string]: unknown
}

// 分页响应数据
export interface PaginationData<T> {
  records: T[]
  total: number
  pageNo?: number
  pageSize?: number
}

// 通用列表响应类型别名
export type ListResponse<T> = BaseResponse<T[]>

// 通用分页响应类型别名
export type PaginationResponse<T> = BaseResponse<PaginationData<T>>

// 请求配置
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

// 操作类型
export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

// 通用状态
export enum Status {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
