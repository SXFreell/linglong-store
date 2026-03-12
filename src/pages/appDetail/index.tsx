import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Typography, Table, message, Spin, Space, Progress, Image } from 'antd'
import { CopyOutlined, LinkOutlined } from '@ant-design/icons'
import type { TableColumnProps } from 'antd'
import styles from './index.module.scss'
import goBack from '@/assets/icons/go_back.svg'
import DefaultIcon from '@/assets/linyaps.svg'

import { getAppDetail, getSearchAppVersionList } from '@/apis/apps'
import { createDesktopShortcut, runApp } from '@/apis/invoke'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { useInstallQueueStore } from '@/stores/installQueue'
import { useShallow } from 'zustand/react/shallow'
import { useGlobalStore } from '@/stores/global'
import { InstallOptions, useAppInstall } from '@/hooks/useAppInstall'
import { useAppUninstall } from '@/hooks/useAppUninstall'
import { compareVersions } from '@/util/checkVersion'
import { formatFileSize } from '@/util/format'
import { useI18n } from '@/i18n'

interface VersionInfo extends API.APP.AppMainDto {
  version?: string
}

const SCREENSHOT_PLACEHOLDER_COUNT = 3

const AppDetail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const app = location.state as API.INVOKE.EnrichedInstalledApp | undefined

  const [versions, setVersions] = useState<VersionInfo[]>([])

  const [screenshotList, setScreenshotList] = useState<API.APP.AppScreenshot[]>([])
  // 单独维护截图加载态，先渲染固定占位高度，避免图片区延迟插入导致页面跳动。
  const [screenshotLoading, setScreenshotLoading] = useState(() => Boolean(app?.appId))
  const [loading, setLoading] = useState(false)
  const [uninstallingVersion, setUninstallingVersion] = useState<string | null>(null)
  const [creatingShortcut, setCreatingShortcut] = useState(false)

  const installedApps = useInstalledAppsStore((state) => state.installedApps)
  const arch = useGlobalStore((state) => state.arch)
  const repoName = useGlobalStore((state) => state.repoName)
  const { uninstall } = useAppUninstall()

  // 使用安装队列
  const { handleInstall, getInstallStatus, getVersionInstallState } = useAppInstall()
  const { queue, currentTask } = useInstallQueueStore(
    useShallow((state) => ({ queue: state.queue, currentTask: state.currentTask })),
  )

  // 获取当前应用的安装状态（从队列中）
  const appInstallStatus = useMemo(() => {
    if (!app?.appId) {
      return null
    }
    return getInstallStatus(app.appId)
  }, [app?.appId, getInstallStatus, currentTask, queue])

  // 是否正在安装
  const isInstalling = useMemo(() => {
    return appInstallStatus?.status === 'installing' || appInstallStatus?.status === 'pending'
  }, [appInstallStatus])

  // 安装进度
  const installProgress = useMemo(() => {
    if (!appInstallStatus || appInstallStatus.status !== 'installing') {
      return null
    }
    return {
      percentage: appInstallStatus.progress,
      status: appInstallStatus.message,
    }
  }, [appInstallStatus])

  // 从 store 中获取最新的应用信息（包括图标）
  const currentApp = useMemo(() => {
    if (!app?.appId) {
      return app
    }

    // 查找 store 中对应的应用，优先使用 store 中的数据（图标可能已加载）
    const storeApp = installedApps.find(
      item => item.appId === app.appId && item.version === app.version,
    )

    // 如果 store 中有该应用且图标已加载，使用 store 中的数据
    // 否则使用传递过来的数据
    if (storeApp && storeApp.icon && storeApp.icon !== app.icon) {
      return { ...app, ...storeApp }
    }

    return app
  }, [app, installedApps])

  // 已安装版本集合（以 installedApps 为权威来源）
  const installedVersionSet = useMemo(() => {
    if (!currentApp?.appId) {
      return new Set<string>()
    }
    return new Set(
      installedApps
        .filter(item => item.appId === currentApp.appId)
        .map(item => item.version)
        .filter(Boolean) as string[],
    )
  }, [currentApp?.appId, installedApps])

  // 获取最新版本
  const latestVersion = useMemo(() => {
    return versions.length > 0 ? versions[0].version : undefined
  }, [versions])

  // 判断是否安装了最新版本
  const isLatestVersionInstalled = useMemo(() => {
    if (!latestVersion) {
      return false
    }
    return installedVersionSet.has(latestVersion)
  }, [latestVersion, installedVersionSet])

  const hasInstalledVersion = useMemo(() => installedVersionSet.size > 0, [installedVersionSet])
  const shouldShowScreenshotSection = screenshotLoading || screenshotList.length > 0

  // 无版本列表或已装最新时，主按钮走启动
  const shouldRunInstalled = useMemo(() => {
    if (isLatestVersionInstalled) {
      return true
    }
    if (!latestVersion && hasInstalledVersion) {
      return true
    }
    return false
  }, [isLatestVersionInstalled, latestVersion, hasInstalledVersion])

  const loadVersions = async() => {
    if (!currentApp?.appId) {
      console.info('loadVersions: currentApp.appId is empty')
      return
    }
    setLoading(true)
    try {
      const res = await getSearchAppVersionList({
        appId: currentApp.appId,
        repoName,
        arch,
      })
      let list = [...(res.data || [])]
      // 对于同一版本，当存在多个 module 类型时，优先保留 binary 类型
      // 过滤规则：同版本号存在两个及以上记录时，保留 module 为 binary 的记录，删除其他 module（如 runtime）
      const uniqueData = new Map<string, VersionInfo>()
      list.forEach(item => {
        const key = `${item.appId}-${item.name}-${item.version}`
        // 如果该键首次出现，或者当前项是 binary 且已存在的项不是 binary，则保留/替换
        if (!uniqueData.has(key) || (item.module === 'binary' && uniqueData.get(key)?.module !== 'binary')) {
          uniqueData.set(key, item)
        }
      })
      list = Array.from(uniqueData.values())
      list.sort((a, b) => compareVersions(b.version || '', a.version || ''))
      setVersions(list)
    } catch (err) {
      console.error('loadVersions: error', err)
      message.error(t('appDetail.loadVersionsFailed', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setLoading(false)
    }
  }
  const getAppAllInfo = async() => {
    if (!currentApp?.appId) {
      console.info('appAllInfo: currentApp.appId is empty')
      return
    }
    console.info('appAllInfo: getting app detail for', currentApp.appId)
    setScreenshotLoading(true)
    setScreenshotList([])
    try {
      const result = await getAppDetail([{ appId: currentApp.appId, arch }])
      const appDetailList = (result.data[currentApp.appId as keyof typeof result.data] as API.APP.AppMainDto[]) || []
      if (appDetailList.length > 0) {
        setScreenshotList(appDetailList[0].appScreenshotList || [])
      } else {
        setScreenshotList([])
      }
    } catch (err) {
      console.error('appAllInfo: error', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      message.error(t('appDetail.loadDetailFailed', { error: errorMessage }))
    } finally {
      setScreenshotLoading(false)
    }
  }
  useEffect(() => {
    loadVersions()
    getAppAllInfo()
  }, [currentApp?.appId, arch, repoName])

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleUninstall = async(version: string) => {
    if (!currentApp?.appId) {
      return
    }

    setUninstallingVersion(version)
    console.info('[handleUninstall] Starting to uninstall:', currentApp.appId, version)
    try {
      const result = await uninstall(
        { appId: currentApp.appId, version, name: currentApp.name, zhName: currentApp.zhName },
      )
      if (result) {
        console.info('[handleUninstall] Successfully uninstalled:', currentApp.appId, version)
      }
    } catch (error) {
      console.error('[handleUninstall] Error uninstalling:', currentApp.appId, version, error)
      message.error(t('appDetail.uninstallFailed', { error: String(error) }))
    } finally {
      setUninstallingVersion(null)
    }
  }

  const handleRun = async() => {
    if (!currentApp?.appId) {
      console.info('[handleRun] currentApp.appId is empty')
      return
    }

    console.info('[handleRun] Starting app:', currentApp.appId)

    try {
      // 根据 ll-cli 文档，启动应用只需要 appId，不需要版本号
      await runApp(currentApp.appId)
      message.success(t('appDetail.runSuccess'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[handleRun] Failed to run app:', errorMessage)
      message.error(t('appDetail.runFailed', { error: errorMessage }))
    }
  }

  const handleCopyAppId = async(appId?: string) => {
    if (!appId) {
      message.error(t('appDetail.appIdMissing'))
      return
    }

    try {
      await navigator.clipboard.writeText(appId)
      message.success(t('appDetail.appIdCopied'))
    } catch (error) {
      console.error('[handleCopyAppId] Failed to copy:', error)
      message.error(t('appDetail.copyFailed'))
    }
  }

  const handleCreateDesktopShortcut = async() => {
    if (!currentApp?.appId) {
      message.error(t('appDetail.appIdMissing'))
      return
    }

    setCreatingShortcut(true)
    try {
      const resultMessage = await createDesktopShortcut(currentApp.appId)
      message.success(resultMessage || t('appDetail.shortcutCreated'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('已存在') || errorMessage.includes('不会覆盖')) {
        message.warning(errorMessage)
      } else {
        message.error(t('appDetail.shortcutFailed', { error: errorMessage }))
      }
    } finally {
      setCreatingShortcut(false)
    }
  }

  /**
   * 处理版本安装
   * 使用统一的安装队列
   */
  const handleVersionInstall = async(versionInfo?: VersionInfo) => {
    const installParam: InstallOptions = {}

    if (!currentApp?.appId) {
      message.error(t('appDetail.appInfoIncomplete'))
      return
    }

    if (versionInfo && versionInfo.version) {
      installParam.version = versionInfo.version
      console.info(
        `[handleVersionInstall] Preparing to install version: ${versionInfo.version} for app: ${currentApp.appId}`,
      )
    }

    // 构建应用信息
    const appInfo: API.APP.AppMainDto = {
      appId: currentApp.appId,
      name: currentApp.name,
      zhName: currentApp.zhName,
      icon: currentApp.icon,
      description: currentApp.description,
      version: installParam.version,
    }
    // 使用统一的安装逻辑
    await handleInstall(appInfo, installParam)
  }

  const columns: TableColumnProps<VersionInfo>[] = [
    {
      title: t('appDetail.columns.version'),
      dataIndex: 'version',
      align: 'center',
    },
    {
      title: t('appDetail.columns.appType'),
      dataIndex: 'kind',
      align: 'center',
      render: (value: string | undefined) => value || '--',
    },
    {
      title: t('appDetail.columns.channel'),
      dataIndex: 'channel',
      align: 'center',
    },
    {
      title: t('appDetail.columns.module'),
      dataIndex: 'module',
      align: 'center',
    },
    {
      title: t('appDetail.columns.repoSource'),
      dataIndex: 'repoName',
      align: 'center',
      render: (value: string | undefined) => value || '--',
    },
    {
      title: t('appDetail.columns.fileSize'),
      dataIndex: 'size',
      align: 'center',
      render: (value: string | undefined) => formatFileSize(value),
    },
    {
      title: t('appDetail.columns.downloads'),
      dataIndex: 'installCount',
      align: 'center',
      render: (value: number | undefined) => value ?? '--',
    },
    {
      title: t('appDetail.columns.operate'),
      dataIndex: 'operate',
      align: 'center',
      render: (_col, record) => {
        const versionInfo = record as VersionInfo
        const versionValue = versionInfo.version || ''
        const isInstalled = versionValue ? installedVersionSet.has(versionValue) : false
        const isUninstalling = uninstallingVersion === versionValue
        const installState = getVersionInstallState(currentApp?.appId || '', versionValue, latestVersion)
        const isActiveInstalling = installState.isActiveVersion && installState.isInstalling
        const isActivePending = installState.isActiveVersion && installState.isPending
        const isAppInstallBusy = installState.isBusy
        const shouldDisableForBusy = isAppInstallBusy && !installState.isActiveVersion

        if (!versionValue) {
          return '--'
        }

        return (
          <Space>
            {isInstalled ? ([
              <Button
                key={`${versionValue}-run`}
                type='primary'
                size='small'
                shape='round'
                onClick={() => handleRun()}
                disabled={isUninstalling}
              >
                {t('appDetail.actions.run')}
              </Button>,
              <Button
                key={`${versionValue}-uninstall`}
                type='primary'
                danger
                size='small'
                shape='round'
                onClick={() => handleUninstall(versionValue)}
                loading={isUninstalling}
                disabled={isAppInstallBusy}
              >
                {t('common.actions.uninstall')}
              </Button>,
            ]) : (
              <Button
                type='primary'
                size='small'
                shape='round'
                onClick={() => handleVersionInstall(versionInfo)}
                loading={isActiveInstalling}
                disabled={isUninstalling || isActivePending || isActiveInstalling || shouldDisableForBusy}
              >
                {isActiveInstalling ? t('appDetail.actions.installing') : isActivePending ? t('appDetail.actions.queued') : t('common.actions.install')}
              </Button>
            )}
          </Space>
        )
      },
    },
  ]

  if (!currentApp) {
    return (
      <div className={styles.appDetail}>
        <div className={styles.error}>{t('appDetail.status.loadFailed')}</div>
      </div>
    )
  }

  /**
   * 处理主安装按钮点击
   * 使用统一的安装队列
   */
  const handleInstallBtnClick = async() => {
    if (!currentApp?.appId) {
      message.error(t('appDetail.appInfoIncomplete'))
      return
    }

    // 如果已安装最新版本，则启动应用
    if (shouldRunInstalled) {
      console.info('[handleInstallBtnClick] 启动已安装版本')
      handleRun()
      return
    }
    // 否则安装最新版本
    handleVersionInstall()
  }

  return (
    <div className={styles.appDetail}>
      <div className={styles.ability}>
        <div className={styles.goBack} onClick={handleGoBack}>
          <img src={goBack} alt="back" />
        </div>
        <div className={styles.application}>
          <div className={styles.appLeft}>
            <div className={styles.icon}>
              <img src={currentApp.icon || DefaultIcon} alt={currentApp.zhName || currentApp.appId} />
            </div>
          </div>
          <div className={styles.appRight}>
            <div className={styles.appName}>
              <div className={styles.head}>
                <p className={styles.nameId}>{currentApp.zhName || currentApp.appId}</p>
              </div>
              <div className={styles.install}>
                <Button
                  type='primary'
                  shape='round'
                  className={styles.installButton}
                  onClick={handleInstallBtnClick}
                  loading={isInstalling}
                  disabled={isInstalling}
                >
                  {isInstalling ? t('appDetail.actions.installing') : (shouldRunInstalled ? t('appDetail.actions.run') : (hasInstalledVersion ? t('common.actions.update') : t('common.actions.install')))}
                </Button>
                {isInstalling && installProgress && (
                  <div style={{ marginTop: '12px', width: '100%' }}>
                    <Progress
                      percent={installProgress.percentage}
                      status={installProgress.percentage >= 100 ? 'success' : 'active'}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                    <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
                      {installProgress.status} ({installProgress.percentage}%)
                    </div>
                  </div>
                )}
                {hasInstalledVersion && (
                  <Button
                    type='link'
                    icon={<LinkOutlined />}
                    className={styles.shortcutButton}
                    loading={creatingShortcut}
                    disabled={creatingShortcut}
                    onClick={handleCreateDesktopShortcut}
                  >
                    {t('appDetail.actions.createShortcut')}
                  </Button>
                )}
              </div>
            </div>
            <div className={styles.appDesc}>
              <div className={[styles.modules, styles.separate].join(' ')}>
                <Typography.Text ellipsis>
                  {currentApp.kind || '--'}
                </Typography.Text>
                <Typography.Text ellipsis>
                  {t('appDetail.labels.appType')}
                </Typography.Text>
              </div>
              <div className={[styles.modules, styles.separate].join(' ')}>
                <Typography.Text ellipsis>
                  {currentApp.channel || '--'}
                </Typography.Text>
                <Typography.Text ellipsis>
                  {t('appDetail.labels.channel')}
                </Typography.Text>
              </div>
              <div className={[styles.modules, styles.separate].join(' ')}>
                <Typography.Text ellipsis>
                  {currentApp.version || '--'}
                </Typography.Text>
                <Typography.Text ellipsis>
                  {t('appDetail.labels.currentVersion')}
                </Typography.Text>
              </div>
              <div className={styles.modules}>
                <div className={styles.appIdRow}>
                  <Typography.Text ellipsis className={styles.appIdValue}>
                    {currentApp.appId}
                  </Typography.Text>
                  <Button
                    type='text'
                    size='small'
                    icon={<CopyOutlined />}
                    aria-label={t('appDetail.actions.copyAppId')}
                    className={styles.copyButton}
                    onClick={() => handleCopyAppId(currentApp.appId)}
                  />
                </div>
                <Typography.Text ellipsis>
                  {t('appDetail.labels.appId')}
                </Typography.Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.describe}>
        <div className={styles.title}>{t('appDetail.sections.description')}</div>
        <div className={styles.content}>
          {currentApp.description || t('appDetail.sections.noDescription')}
        </div>
      </div>
      {shouldShowScreenshotSection ? <div className={styles.screenshot}>
        <div className={styles.title}>{t('appDetail.sections.screenshot')}</div>
        <div className={styles.imgBox}>
          <div className={styles.imgList}>
            {screenshotLoading
              ? Array.from({ length: SCREENSHOT_PLACEHOLDER_COUNT }, (_, index) => (
                <div
                  key={`screenshot-placeholder-${index}`}
                  className={styles.imgItemPlaceholder}
                  aria-hidden='true'
                />
              ))
              : screenshotList.map((item, index) => {
                const key = item.screenshotKey || `${currentApp.appId}-${index}`
                return (
                  <div key={key} className={styles.imgItem}>
                    <Image
                      className={styles.screenshotImage}
                      src={item.screenshotKey}
                      alt={t('appDetail.sections.screenshotAlt')}
                      fallback={DefaultIcon}
                    />
                  </div>
                )
              })}
          </div>
        </div>
      </div> : null
      }


      <div className={styles.version}>
        <div className={styles.title}>{t('appDetail.sections.versionSelect')}</div>
        <div className={styles.content}>
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={versions}
              pagination={false}
              rowKey={(record) => record.version || record.id || `${record.appId}-${record.version}`}
              scroll={{ x: 'max-content' }}
            />
          </Spin>
        </div>
      </div>
    </div>
  )
}

export default AppDetail
