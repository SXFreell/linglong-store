import { Button, Typography } from 'antd'
import styles from './index.module.scss'
import { useNavigate } from 'react-router-dom'
import { useMemo, useCallback, useState, useEffect } from 'react'
import DefaultIcon from '@/assets/linyaps.svg'
import type { ApplicationCardProps, OperateItem } from './types'
import { OperateType } from './types'

const { Text, Paragraph, Title } = Typography

type AppMainDto = API.APP.AppMainDto

// 操作按钮配置（提取为常量）
const OPERATE_LIST: OperateItem[] = [
  { name: '卸载', id: OperateType.UNINSTALL },
  { name: '安装', id: OperateType.INSTALL },
  { name: '更新', id: OperateType.UPDATE },
  { name: '打开', id: OperateType.OPEN },
]

const ApplicationCard = ({
  operateId = OperateType.INSTALL,
  options = {} as AppMainDto,
  loading = false,
}: ApplicationCardProps) => {
  const navigate = useNavigate()

  const [cardLoading, setCardLoading] = useState(false)

  useEffect(() => {
    if (options && options.appId && !options.appId.startsWith('empty-')) {
      setCardLoading(false)
    } else {
      setCardLoading(true)
    }
  }, [options])

  // 缓存当前操作按钮配置
  const currentOperate = useMemo(() => {
    return OPERATE_LIST[operateId] || OPERATE_LIST[OperateType.INSTALL]
  }, [operateId])

  // 获取图标 URL
  const iconUrl = useMemo(() => {
    return options.icon || DefaultIcon
  }, [options.icon])

  // 跳转到应用详情页
  const handleNavigateToDetail = useCallback(() => {
    navigate('/app_detail', {
      state: {
        ...options,
      },
    })
  }, [navigate, options])

  // 处理操作按钮点击
  const handleOperateClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation() // 阻止事件冒泡到卡片点击事件
  }, [operateId])

  return (
    <div
      className={`${styles.applicationCard} ${cardLoading ? styles.cardLoading : ''}`}
      onClick={handleNavigateToDetail}
    >
      <div className={styles.icon}>
        <img src={iconUrl} alt={options.name || '应用图标'} />
      </div>

      <div className={styles.content}>
        <div className={styles.title}>
          <Title level={5} ellipsis={{ tooltip: options.zhName || options.name || '应用名称' }}>
            {options.zhName || options.name || '应用名称'}
          </Title>
        </div>

        <div className={styles.description}>
          <Paragraph ellipsis={{ tooltip: options.description || '应用描述', rows: 2, expandable: false }}>
            {options.description || '应用描述'}
          </Paragraph>
        </div>

        <div className={styles.version}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            版本: {options.version || '-'}
          </Text>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          type="primary"
          className={styles.installButton}
          size="small"
          loading={loading}
          onClick={handleOperateClick}
        >
          {currentOperate.name}
        </Button>
      </div>
    </div>
  )
}

export default ApplicationCard
