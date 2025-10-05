import { Button, Typography } from '@arco-design/web-react'
import styles from './index.module.scss'
import { useNavigate } from 'react-router-dom'
const Card = ({ operateId = 1 }) => {
  const navigate = useNavigate()
  const toAppDetail = ()=>{
    navigate('/app_detail')
  }
  const operateList = [
    {
      name: '卸载',
      id: 0,

    },
    {
      name: '安装',
      id: 1,

    }, {
      name: '更新',
      id: 2,

    }, {
      name: '打开',
      id: 3,

    }]
  const handleOperateBtn = (operateId: number)=>{
    if (operateId !== 3) {
      console.log(operateId, '操作名称')
    }

  }
  return (
    <div className={styles.applicationCard} onClick={toAppDetail}>
      <div className={styles.icon}>
        Icon
      </div>
      <div className={styles.content}>
        <div className={styles.title}>
          <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            应用名称
          </Typography.Text>
        </div>
        <div className={styles.description}>
          <Typography.Text ellipsis={{ rows: 2, expandable: false }}>
            这里是应用的简短描述，介绍应用的主要功能和特点。
          </Typography.Text>
        </div>
      </div>
      <div className={styles.actions}>
        <Button type='primary' className={styles.installButton} size='mini' onClick={(e)=>{
          e.stopPropagation() // 阻止事件冒泡
          handleOperateBtn(operateId)
        }}>{operateList[operateId]?.name || '安装'}</Button>
      </div>
    </div>
  )
}

export default Card
