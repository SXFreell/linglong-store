import styles from './index.module.scss'
import { Button } from 'antd'
import { Carousel } from 'antd'
import DefaultIcon from '@/assets/linyaps.svg'
import type { ApplicationCarouselProps, CarouselItem } from './types'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'


const AppCarousel = ({ carouselList }: ApplicationCarouselProps) => {
  const navigate = useNavigate()
  // 跳转到应用详情页
  const handleNavigateToDetail = useCallback((item:CarouselItem) => {
    navigate('/app_detail', {
      state: {
        ...item,
      },
    })
  }, [navigate])

  return (
    <Carousel
      autoplay
      effect='fade'
      className={styles.carouselBox}
      dotPosition='bottom'
    >
      {carouselList.map((item) => (
        <div className={styles.carouselItem} key={item.appId} onClick={()=>handleNavigateToDetail(item)}>
          <img src={item.icon || DefaultIcon} className={styles.carouselItemIcon} alt={item.name || '应用图标'} />
          <div className={styles.carouselItemContent}>
            <p style={{ fontSize: '1.5rem' }}>{item.zhName || item.name || '应用名称'}</p>
            <p>描述：{item.description || '应用描述'}</p>
            <p>版本：{item.version || '-'}</p>
            <p>分类：{item.categoryName || '分类名称'}</p>
            <Button type='primary' shape='round' className={styles.installButton}>
              安 装
            </Button>
          </div>
        </div>
      ))}
    </Carousel>
  )
}

export default AppCarousel
