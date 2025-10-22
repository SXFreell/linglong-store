import { Button, Typography } from '@arco-design/web-react'
import styles from './index.module.scss'
import { useNavigate } from 'react-router-dom'
import DefaultIcon from '@/assets/linyaps.svg'
import type { InstalledApp } from '@/apis/types'

interface CardProps {
  operateId?: number
  options?: Partial<InstalledApp> & Record<string, unknown>
  loading?: boolean
  onOperate?: (operateId: number) => void
}

const Card = ({ operateId = 1, options = {}, loading = false, onOperate }: CardProps) => {
  const navigate = useNavigate()
  const toAppDetail = ()=>{
    navigate('/app_detail', {
      state: {
        appId: options.appId,
        name: options.name,
        version: options.version,
        ...options,
      },
    })
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
      // TODO: 实现具体操作逻辑
    }
    onOperate?.(operateId)
  }
  return (
    <div className={styles.applicationCard} onClick={toAppDetail}>
      <div className={styles.icon}>
        {
          options.icon ? <img src={options.icon} alt="icon" /> : <img src={DefaultIcon} alt="" />
        }
      </div>
      <div className={styles.content}>
        <div className={styles.title}>
          <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            {options.zhName || options.name || '应用名称'}
          </Typography.Text>
        </div>
        <div className={styles.description}>
          <Typography.Text ellipsis={{ rows: 2, expandable: false }}>
            {options.description || '这里是对应的应用描述'}
          </Typography.Text>
        </div>
        <div className={styles.version}>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            版本: {options.version || '-'}
          </Typography.Text>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          type='primary'
          className={styles.installButton}
          size='mini'
          loading={loading || options.loading}
          onClick={(e)=>{
            e.stopPropagation() // 阻止事件冒泡
            handleOperateBtn(operateId)
          }}
        >
          {operateList[operateId]?.name || '安装'}
        </Button>
      </div>
    </div>
  )
}

export default Card
