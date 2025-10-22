import styles from './index.module.scss'
import { Button } from '@arco-design/web-react'
import { Carousel } from '@arco-design/web-react'
import type { ApplicationCarouselProps } from './types'

const AppCarousel = ({ carouselList }: ApplicationCarouselProps) => {
  return (
    <Carousel
      autoPlay
      animation='fade'
      showArrow='never'
      indicatorType='never'
      className={styles.carouselBox}
    >
      {carouselList.map((item) => (
        <div className={styles.carouselItem} key={item.appId}>
          <img src={item.icon} className={styles.carouselItemIcon} alt="" />
          <div className={styles.carouselItemContent}>
            <p style={{ fontSize: '1.5rem' }}>{item.zhName}</p>
            <p>描述：{item.description}</p>
            <p>版本：{item.version}</p>
            <p>分类：{item.categoryName}</p>
            <Button type='primary' shape='round' className={styles.installButton} size='default'>
              安 装
            </Button>
          </div>
        </div>
      ))}
    </Carousel>
  )
}

export default AppCarousel
