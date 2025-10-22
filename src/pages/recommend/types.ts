/**
 * Recommend 页面类型定义
 */

import type { CarouselItem } from '@/components/ApplicationCarousel/types'
import type { AppInfo } from '@/apis/apps/types'

// 页面状态类型
export interface RecommendState {
  carouselList: CarouselItem[]
  recommendList: AppInfo[]
  loading: boolean
  error: string | null
}
