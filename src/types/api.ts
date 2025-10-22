/**
 * API 相关的通用类型定义
 */

import type { PaginationResponse } from './common'

// API 错误类型
export interface ApiError {
  code: number
  message: string
  details?: unknown
}

// API 请求拦截器配置
export interface ApiRequestInterceptor {
  beforeRequest?: (config: Record<string, unknown>) => Record<string, unknown>
  afterResponse?: (response: Record<string, unknown>) => Record<string, unknown>
  onError?: (error: ApiError) => void
}

// 应用相关类型
export interface AppCategory {
  id: string
  categoryId: string
  categoryName: string
  icon: string
  createTime: string
  isDelete: string
  count: number | null
}

export type GetCategoryListResponse = PaginationResponse<AppCategory>

export interface AppInfo {
  appId: string
  appName: string
  icon: string
  description: string
  version: string
  rating?: number
  downloads?: number
  [key: string]: unknown
}

export interface SearchAppParams {
  categoryId?: string
  keyword?: string
  repoName: string
  arch: string
  pageNo: number
  pageSize: number
  [key: string]: unknown
}

export type SearchAppResponse = PaginationResponse<AppInfo>

// 模板相关类型
export interface Template {
  id: string
  name: string
  description: string
  [key: string]: unknown
}

export type GetTemplateListResponse = PaginationResponse<Template>
