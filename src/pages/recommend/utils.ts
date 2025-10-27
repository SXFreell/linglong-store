import type { AppInfo } from '@/apis/apps/types'

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
