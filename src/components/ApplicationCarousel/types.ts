/**
 * ApplicationCarousel 组件类型定义
 */

export interface CarouselItem {
  appId: string
  zhName?: string
  name?: string
  description: string
  version: string
  categoryName?: string
  icon: string
  [key: string]: unknown
}

export interface ApplicationCarouselProps {
  carouselList: CarouselItem[]
}
