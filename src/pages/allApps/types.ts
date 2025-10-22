/**
 * AllApps 页面类型定义
 */

import type { Category, AppInfo } from '@/apis/apps/types'

// 页面状态类型
export interface AllAppsState {
  categoryList: Category[]
  allAppList: AppInfo[]
  activeBtn: string
}

// 页面事件处理类型
export interface AllAppsHandlers {
  handleClickBtn: (categoryId: string) => void
}
