import type { Category, AppInfo } from '@/apis/apps/types'

/**
 * 生成空数据应用卡片
 * @param count 生成数量
 * @returns 空应用数据数组
 */
export const generateEmptyCards = (count: number): AppInfo[] => {
  return Array.from({ length: count }, (_, index) => ({
    appId: `empty-${index}`,
    appName: '',
    version: '',
    description: '',
    zhName: '',
    icon: '',
  } as AppInfo))
}

/**
 * 生成空分类列表
 * @param count 生成数量
 * @returns 空分类数据数组
 */
export const generateEmptyCategories = (count: number): Category[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `empty-cat-${index}`,
    categoryId: `empty-cat-id-${index}`,
    categoryName: '',
  } as Category))
}
