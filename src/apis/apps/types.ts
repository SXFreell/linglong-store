/**
 * Apps API 相关类型定义
 */

import type { BaseResponse, PaginationData } from '@/types'

// 分类信息
export interface Category {
  id: string
  categoryId: string
  categoryName: string
  icon: string
  createTime: string
  isDelete: string
  count: number | null
}

// 获取分类列表响应
export type GetDisCategoryListRes = BaseResponse<Category[]>

// 应用信息
export interface AppInfo {
  appId: string
  appName: string
  icon: string
  description: string
  version: string
  rating?: number
  downloads?: number
  zhName?: string
  categoryName?: string
  [key: string]: unknown
}

// 轮播图应用信息（目前与 AppInfo 相同）
export type CarouselAppInfo = AppInfo

// 获取轮播图列表响应
export type GetWelcomeCarouselListRes = BaseResponse<CarouselAppInfo[]>

// 获取推荐应用列表响应
export type GetWelcomeAppListRes = BaseResponse<PaginationData<AppInfo>>

// 应用详情信息
export interface AppDetail {
  appId: string
  name: string
  version: string
  icon?: string
  zhName?: string
  categoryName?: string
  description?: string
  [key: string]: unknown
}

// 获取应用详情响应
export type GetAppDetailsRes = BaseResponse<AppDetail[]>

// 搜索应用参数
export interface SearchAppListParams {
  categoryId?: string
  keyword?: string
  repoName: string
  arch: string
  pageNo: number
  pageSize: number
  [key: string]: unknown
}

// 搜索应用响应
export type SearchAppListRes = BaseResponse<PaginationData<AppInfo>>

// 保留旧接口名称以兼容现有代码
export type getDisCategoryListRes = Category
