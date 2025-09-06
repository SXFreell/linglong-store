import { useState } from 'react'
import styles from './index.module.scss'
import { Avatar, Button } from '@arco-design/web-react'

interface CardProps {
  soft_info: any
  btnText?:string
  onCardClick?: (soft_info: any) => void
}

const Card = ({ soft_info, btnText, onCardClick }: CardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    console.log('soft_info=============')
    if (onCardClick) {

      onCardClick(soft_info)
    }
  }

  return (
    <div
      className={styles.box}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{ cursor: onCardClick ? 'pointer' : 'default' }}
    >
      <div className={styles.soft_icon}>
        <Avatar shape='square' style={{ width: '100%', height: '100%' }}>
          Arco
        </Avatar>
      </div>

      <div className={styles.soft_content}>
        <div className={styles.name}>{soft_info?.name || '我的软件我的软件我的软件我的软件我的软件'}</div>
        <div className={styles.description}>{soft_info?.description || '这是一个晴朗的早晨，鸽哨声混合着起床哨音，但是这个世界并不安宁'}</div>
        <div className={styles.version_container}>
          <div className={`${styles.version_text} ${isHovered ? styles.hidden : styles.visible}`}>
            {soft_info?.version || '100.100.100'}
          </div>
          <div className={`${styles.install_button} ${isHovered ? styles.visible : styles.hidden}`}>
            <Button type="primary" size="mini" shape='round' className={styles.btn}>
              {btnText || '安装'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Card
