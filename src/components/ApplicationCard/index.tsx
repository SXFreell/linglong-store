import { Button, message, Typography } from 'antd'
import styles from './index.module.scss'
import { useNavigate } from 'react-router-dom'
import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import DefaultIcon from '@/assets/linyaps.svg'

import { runApp } from '@/apis/invoke'
import { OperateType } from '@/constants/applicationCard'

const { Text, Paragraph, Title } = Typography

// 操作按钮配置（提取为常量）
const OPERATE_LIST: COMP.APPCARD.OperateItem[] = [
  { name: '卸载', id: OperateType.UNINSTALL },
  { name: '安装', id: OperateType.INSTALL },
  { name: '更新', id: OperateType.UPDATE },
  { name: '打开', id: OperateType.OPEN },
]

const ApplicationCard = ({
  operateId = OperateType.INSTALL,
  appInfo = {},
  type = 'default',
  isInstalled = false,
  hasUpdate = false,
  isInstalling = false,
  onInstall,
  onUninstall,
}: COMP.APPCARD.ApplicationCardProps) => {
  const navigate = useNavigate()

  const [buttonLoading, setButtonLoading] = useState(false)
  const cardLoading = !appInfo?.appId || appInfo.appId.startsWith('empty-')

  // 根据 store 中的安装状态和版本对比，决定展示的操作类型
  const resolvedOperateId = useMemo(() => {
    if (!appInfo?.appId) {
      return operateId
    }

    if (!isInstalled) {
      // 应用未安装，显示安装按钮
      return OperateType.INSTALL
    }

    // 应用已安装，检查是否有更新
    if (hasUpdate) {
      return OperateType.UPDATE
    }

    // 应用已安装且无更新，默认显示打开按钮
    // 只有当参数明确指定为卸载时才显示卸载按钮
    if (operateId === OperateType.UNINSTALL) {
      return OperateType.UNINSTALL
    }

    return OperateType.OPEN
  }, [appInfo?.appId, hasUpdate, isInstalled, operateId])

  // 计算当前显示的操作按钮
  const currentOperate = useMemo(() => {
    return OPERATE_LIST[resolvedOperateId] || OPERATE_LIST[OperateType.INSTALL]
  }, [resolvedOperateId])

  // 监听安装队列，保持按钮 loading 与实际安装/更新进度同步
  useEffect(() => {
    if (!appInfo?.appId) {
      return
    }

    setButtonLoading(
      resolvedOperateId === OperateType.INSTALL || resolvedOperateId === OperateType.UPDATE
        ? isInstalling
        : false,
    )
  }, [appInfo?.appId, isInstalling, resolvedOperateId])

  // 获取图标 URL
  const iconUrl = useMemo(() => {
    return appInfo.icon || DefaultIcon
  }, [appInfo.icon])

  // 跳转到应用详情页
  const handleNavigateToDetail = useCallback(() => {
    navigate('/app_detail', {
      state: {
        ...appInfo,
      },
    })
  }, [navigate, appInfo])

  // 处理操作按钮点击
  const handleOperateClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation() // 阻止事件冒泡到卡片点击事件

    setButtonLoading(true)

    if (resolvedOperateId === OperateType.UNINSTALL) {
      if (!appInfo.appId || !appInfo.version) {
        setButtonLoading(false)
        return
      }
      Promise.resolve(onUninstall?.(
        {
          appId: appInfo.appId as string,
          version: appInfo.version as string,
          name: appInfo.name as string,
          zhName: appInfo.zhName as string,
        },
      )).finally(() => {
        setButtonLoading(false)
      })
      return
    }

    // 如果是安装操作，调用安装
    if (resolvedOperateId === OperateType.INSTALL) {
      Promise.resolve(onInstall?.(appInfo as API.APP.AppMainDto)).finally(() => {
        setButtonLoading(false)
      })
    }

    // 更新操作直接复用安装逻辑
    if (resolvedOperateId === OperateType.UPDATE) {
      Promise.resolve(onInstall?.(appInfo as API.APP.AppMainDto)).finally(() => {
        setButtonLoading(false)
      })
    }

    // 打开操作
    if (resolvedOperateId === OperateType.OPEN) {
      if (!appInfo.appId) {
        setButtonLoading(false)
        return
      }

      const handleRunApp = async() => {
        try {
          await runApp(appInfo.appId as string)
          message.success('应用启动成功')
        } catch (error) {
          console.error('[handleRunApp] 启动应用失败:', error)
          message.error(`启动应用失败: ${error}`)
        } finally {
          setButtonLoading(false)
        }
      }

      handleRunApp()
    }
  }, [appInfo, onInstall, onUninstall, resolvedOperateId])

  return (
    <div
      className={`${styles.applicationCard} ${cardLoading ? styles.cardLoading : ''}`}
      onClick={handleNavigateToDetail}
    >
      <div className={styles.icon}>
        <img src={iconUrl} alt={appInfo.name || '应用图标'} />
      </div>
      <div className={`${type === 'recommend' ? styles.containerR : styles.containerD} ${styles.container}`}>
        <div className={styles.content}>
          <div className={styles.title}>
            <Title level={5} ellipsis={{ tooltip: appInfo.zhName || appInfo.name || '应用名称' }}>
              {appInfo.zhName || appInfo.name || '应用名称'}
            </Title>
          </div>

          <div className={styles.description}>
            <Paragraph ellipsis={{ tooltip: appInfo.description || '应用简介', rows: 1, expandable: false }}>
              {appInfo.description || '应用简介'}
            </Paragraph>
          </div>
          {
            type === 'recommend' && (<div className={styles.version}>
              <Paragraph ellipsis={{ tooltip: appInfo.version || '版本', rows: 1, expandable: false }} style={{ fontSize: '12px' }}>
            版本: {appInfo.version || '-'}
              </Paragraph>
              <Text type="secondary" style={{ width: '1.875rem', fontSize: '10px', color: '#cda354' }}>
            TOP
              </Text>
            </div>
            )
          }
        </div>

        <div className={styles.actions}>
          <Button
            type='primary'
            shape='round'
            style={
              resolvedOperateId === OperateType.OPEN
                ? { backgroundColor: '#fff', borderColor: '#d8d8d8', color: '#2c2c2c' } // 白底黑字
                : {}
            }
            className={styles.installButton}
            size="small"
            loading={buttonLoading}
            onClick={handleOperateClick}
          >
            {currentOperate.name}
          </Button>
        </div>

      </div>
    </div>
  )
}

export default memo(ApplicationCard)
