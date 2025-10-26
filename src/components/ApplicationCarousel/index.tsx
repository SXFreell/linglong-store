import styles from './index.module.scss'
import { Button } from 'antd'
import { Carousel } from 'antd'
import type { ApplicationCarouselProps } from './types'

const AppCarousel = ({ carouselList }: ApplicationCarouselProps) => {
  return (
    <Carousel
      autoplay
      effect='fade'
      className={styles.carouselBox}
      dotPosition='bottom'
    >
      {carouselList.map((item) => (
        <div className={styles.carouselItem} key={item.appId}>
          <img src={item.icon} className={styles.carouselItemIcon} alt="" />
          <div className={styles.carouselItemContent}>
            <p style={{ fontSize: '1.5rem' }}>{item.zhName}</p>
            <p>描述：{item.description}</p>
            <p>版本：{item.version}</p>
            <p>分类：{item.categoryName}</p>
            <Button type='primary' shape='round' className={styles.installButton} >
              安 装
            </Button>
          </div>
        </div>
      ))}
    </Carousel>
  )
}

export default AppCarousel
