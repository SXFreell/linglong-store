import { Button, message, Typography } from 'antd'
import styles from './index.module.scss'
import { useNavigate } from 'react-router-dom'
import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import DefaultIcon from '@/assets/linyaps.svg'

import { runApp } from '@/apis/invoke'
import { OperateType } from '@/constants/applicationCard'
import { useI18n } from '@/i18n'
import { getAppDescription, getAppDisplayName } from '@/utils/appDisplay'

const { Text, Paragraph, Title } = Typography

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
  const { t, locale } = useI18n()
  const navigate = useNavigate()

  const [buttonLoading, setButtonLoading] = useState(false)
  const cardLoading = !appInfo?.appId || appInfo.appId.startsWith('empty-')
  const appDisplayName = getAppDisplayName(appInfo, locale, t('common.fallback.appName'))
  const appDescription = getAppDescription(appInfo, t('common.fallback.appDescription'))

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
    const operateMap: Record<number, COMP.APPCARD.OperateItem> = {
      [OperateType.UNINSTALL]: { name: t('common.actions.uninstall'), id: OperateType.UNINSTALL },
      [OperateType.INSTALL]: { name: t('common.actions.install'), id: OperateType.INSTALL },
      [OperateType.UPDATE]: { name: t('common.actions.update'), id: OperateType.UPDATE },
      [OperateType.OPEN]: { name: t('common.actions.open'), id: OperateType.OPEN },
    }

    return operateMap[resolvedOperateId] || operateMap[OperateType.INSTALL]
  }, [resolvedOperateId, t])

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
          message.success(t('components.applicationCard.runSuccess'))
        } catch (error) {
          console.error('[handleRunApp] 启动应用失败:', error)
          message.error(t('components.applicationCard.runFailed', { error: String(error) }))
        } finally {
          setButtonLoading(false)
        }
      }

      handleRunApp()
    }
  }, [appInfo, onInstall, onUninstall, resolvedOperateId, t])

  return (
    <div
      className={`${styles.applicationCard} ${cardLoading ? styles.cardLoading : ''}`}
      onClick={handleNavigateToDetail}
    >
      <div className={styles.icon}>
        <img src={iconUrl} alt={appInfo.name || t('common.fallback.appIcon')} />
      </div>
      <div className={`${type === 'recommend' ? styles.containerR : styles.containerD} ${styles.container}`}>
        <div className={styles.content}>
          <div className={styles.title}>
            <Title level={5} ellipsis={{ tooltip: appDisplayName }}>
              {appDisplayName}
            </Title>
          </div>

          <div className={styles.description}>
            <Paragraph ellipsis={{ tooltip: appDescription, rows: 1, expandable: false }}>
              {appDescription}
            </Paragraph>
          </div>
          {
            type === 'recommend' && (<div className={styles.version}>
              <Paragraph ellipsis={{ tooltip: appInfo.version || t('common.fallback.version'), rows: 1, expandable: false }} style={{ fontSize: '12px' }}>
                {t('components.applicationCard.versionLabel', { version: appInfo.version || '-' })}
              </Paragraph>
              <Text type="secondary" style={{ width: '1.875rem', fontSize: '10px', color: '#cda354' }}>
                {t('components.applicationCard.topLabel')}
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
