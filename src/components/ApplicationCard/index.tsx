import { Button, Typography } from '@arco-design/web-react'
import styles from './index.module.scss'
import { useNavigate } from 'react-router-dom'
import { useMemo, useCallback } from 'react'
import DefaultIcon from '@/assets/linyaps.svg'
import type { ApplicationCardProps, OperateItem } from './types'
import { OperateType } from './types'

// 操作按钮配置（提取为常量）
const OPERATE_LIST: OperateItem[] = [
  { name: '卸载', id: OperateType.UNINSTALL },
  { name: '安装', id: OperateType.INSTALL },
  { name: '更新', id: OperateType.UPDATE },
  { name: '打开', id: OperateType.OPEN },
]

const ApplicationCard = ({
  operateId = OperateType.INSTALL,
  options = {},
  loading = false,
  onOperate,
}: ApplicationCardProps) => {
  const navigate = useNavigate()

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
        appId: options.appId,
        name: options.name,
        version: options.version,
        ...options,
      },
    })
  }, [navigate, options])

  // 处理操作按钮点击
  const handleOperateClick = useCallback((e: Event) => {
    e.stopPropagation() // 阻止事件冒泡到卡片点击事件
    onOperate?.(operateId)
  }, [operateId, onOperate])

  return (
    <div className={styles.applicationCard} onClick={handleNavigateToDetail}>
      <div className={styles.icon}>
        <img src={iconUrl} alt={options.name || '应用图标'} />
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
          type="primary"
          className={styles.installButton}
          size="mini"
          loading={loading || options.loading}
          onClick={handleOperateClick}
        >
          {currentOperate.name}
        </Button>
      </div>
    </div>
  )
}

export default ApplicationCard
