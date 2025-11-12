import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Typography, Table, message, Modal, Spin, Space, Progress } from 'antd'
import type { TableColumnProps } from 'antd'
import styles from './index.module.scss'
import goBack from '@/assets/icons/go_back.svg'
import DefaultIcon from '@/assets/linyaps.svg'
import type { InstalledApp, InstallProgress } from '@/apis/invoke/types'
import { searchVersions, uninstallApp, runApp, installApp, onInstallProgress } from '@/apis/invoke'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { useDownloadConfigStore } from '@/stores/appConfig'
interface VersionInfo {
  version: string
  channel: string
  module: string
}

const AppDetail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const app = location.state as InstalledApp | undefined

  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [uninstallingVersion, setUninstallingVersion] = useState<string | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installProgress, setInstallProgress] = useState<InstallProgress | null>(null)
  const removeApp = useInstalledAppsStore((state) => state.removeApp)
  const installedApps = useInstalledAppsStore((state) => state.installedApps)
  const { addAppToDownloadList } = useDownloadConfigStore()
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

  // 设置安装进度监听器
  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setupListener = async() => {
      console.log('[useEffect] Setting up install progress listener for appId:', currentApp?.appId)
      unlisten = await onInstallProgress((progress) => {
        console.log('[useEffect] Install progress received:', progress)
        if (progress.appId === currentApp?.appId) {
          console.log('[useEffect] AppId matched! Updating state with:', progress)
          setInstallProgress(prev => {
            console.log('[useEffect] Previous state:', prev)
            console.log('[useEffect] New state:', progress)
            return progress
          })
        } else {
          console.log('[useEffect] AppId not matched. Expected:', currentApp?.appId, 'Got:', progress.appId)
        }
      })
      console.log('[useEffect] Listener setup complete')
    }

    setupListener()

    // 组件卸载时清理监听器
    return () => {
      console.log('[useEffect] Cleaning up listener')
      if (unlisten) {
        unlisten()
      }
    }
  }, [currentApp?.appId])

  const loadVersions = async() => {
    if (!currentApp?.appId) {
      // eslint-disable-next-line no-console
      console.log('loadVersions: currentApp.appId is empty')
      return
    }
    // eslint-disable-next-line no-console
    console.log('loadVersions: searching versions for', currentApp.appId)
    setLoading(true)
    try {
      const result = await searchVersions(currentApp.appId)
      // eslint-disable-next-line no-console
      console.log('loadVersions: search result', result)

      // 将 InstalledApp[] 转换为 VersionInfo[]
      const parsedVersions: VersionInfo[] = result.map(item => ({
        version: item.version,
        channel: item.channel,
        module: item.module || 'unknown',
      }))

      // eslint-disable-next-line no-console
      console.log('loadVersions: parsed versions', parsedVersions)
      setVersions(parsedVersions)
    } catch (err) {
      console.error('loadVersions: error', err)
      message.error(`加载版本列表失败: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVersions()

  }, [currentApp?.appId])

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleUninstall = async(version: string) => {
    if (!currentApp?.appId) {
      return
    }

    Modal.confirm({
      title: '确认卸载',
      content: `确定要卸载 ${currentApp.zhName || currentApp.appId} 的版本 ${version} 吗？`,
      onOk: async() => {
        // eslint-disable-next-line no-console
        console.log('[handleUninstall] Starting to uninstall:', currentApp.appId, version)
        setUninstallingVersion(version)
        try {
          await uninstallApp(currentApp.appId, version)
          // eslint-disable-next-line no-console
          console.log('[handleUninstall] Successfully uninstalled:', currentApp.appId, version)
          message.success('卸载成功')

          // 重新加载版本列表
          await loadVersions()

          // 如果所有版本都卸载完了,从已安装列表移除
          const remainingVersions = versions.filter(v => v.version !== version)
          if (remainingVersions.length === 0) {
            removeApp(currentApp.appId, version)
            navigate('/my-apps')
          }
        } catch (error) {
          console.error('[handleUninstall] Error uninstalling:', currentApp.appId, version, error)
          message.error(`卸载失败: ${error}`)
        } finally {
          setUninstallingVersion(null)
        }
      },
    })
  }

  const handleRun = async(version: string) => {
    if (!currentApp?.appId) {
      // eslint-disable-next-line no-console
      console.log('[handleRun] currentApp.appId is empty')
      return
    }

    // eslint-disable-next-line no-console
    console.log('[handleRun] Starting app:', currentApp.appId, 'version:', version)

    // 启动应用
    runApp(currentApp.appId, version)
  }

  const columns: TableColumnProps[] = [
    {
      title: '版本号',
      dataIndex: 'version',
      align: 'center',
    },
    {
      title: '通道',
      dataIndex: 'channel',
      align: 'center',
    },
    {
      title: '模式',
      dataIndex: 'module',
      align: 'center',
    },
    {
      title: '操作',
      dataIndex: 'operate',
      align: 'center',
      render: (_col, record) => {
        const versionInfo = record as VersionInfo
        const isUninstalling = uninstallingVersion === versionInfo.version

        return (
          <Space>
            <Button
              type='primary'
              size='small'
              onClick={() => handleRun(versionInfo.version)}
              disabled={isUninstalling}
            >
              启动
            </Button>
            <Button
              type='primary'
              danger
              size='small'
              onClick={() => handleUninstall(versionInfo.version)}
              loading={isUninstalling}
            >
              卸载
            </Button>
          </Space>
        )
      },
    },
  ]

  if (!currentApp) {
    return (
      <div className={styles.appDetail}>
        <div className={styles.error}>应用信息加载失败</div>
      </div>
    )
  }
  const handleInstallBtnClick = async() => {
    if (!currentApp?.appId) {
      message.error('应用信息不完整')
      return
    }

    try {
      console.log('[handleInstallBtnClick] Starting installation for:', currentApp.appId)
      setIsInstalling(true)
      const initialProgress = {
        appId: currentApp.appId,
        progress: '0%',
        percentage: 0,
        status: '准备安装...',
      }
      console.log('[handleInstallBtnClick] Setting initial progress:', initialProgress)
      setInstallProgress(initialProgress)

      console.log('[handleInstallBtnClick] Calling installApp...')
      // 开始安装（进度通过 useEffect 中的监听器更新）
      await installApp(currentApp.appId)

      console.log('[handleInstallBtnClick] installApp completed')
      // 安装完成
      message.success({ content: '安装成功！', key: 'install' })
      setIsInstalling(false)
      setInstallProgress(null)

      // 刷新版本列表
      loadVersions()

      // 将应用添加到下载列表用于显示
      addAppToDownloadList(currentApp)
    } catch (error) {
      console.error('[handleInstallBtnClick] 安装失败:', error)
      message.error({
        content: `安装失败: ${error instanceof Error ? error.message : String(error)}`,
        key: 'install',
      })
      setIsInstalling(false)
      setInstallProgress(null)
    }
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
                <p className={styles.appClass}>{currentApp.kind}</p>
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
                  {isInstalling ? '安装中...' : '安装新版本'}
                </Button>
                {(() => {
                  console.log('[Render] isInstalling:', isInstalling, 'installProgress:', installProgress)
                  return null
                })()}
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
              </div>
            </div>
            <div className={styles.appDesc}>
              <div className={[styles.modules, styles.separate].join(' ')}>
                <Typography.Text ellipsis>
                  {currentApp.kind || '--'}
                </Typography.Text>
                <Typography.Text ellipsis>
                  应用类型
                </Typography.Text>
              </div>
              <div className={[styles.modules, styles.separate].join(' ')}>
                <Typography.Text ellipsis>
                  {currentApp.channel || '--'}
                </Typography.Text>
                <Typography.Text ellipsis>
                  通道
                </Typography.Text>
              </div>
              <div className={[styles.modules, styles.separate].join(' ')}>
                <Typography.Text ellipsis>
                  {currentApp.version || '--'}
                </Typography.Text>
                <Typography.Text ellipsis>
                  当前版本
                </Typography.Text>
              </div>
              <div className={styles.modules}>
                <Typography.Text ellipsis>
                  {currentApp.appId}
                </Typography.Text>
                <Typography.Text ellipsis>
                  应用ID
                </Typography.Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.describe}>
        <div className={styles.title}>应用描述</div>
        <div className={styles.content}>
          {currentApp.description || '暂无描述信息'}
        </div>
      </div>

      <div className={styles.version}>
        <div className={styles.title}>已安装版本</div>
        <div className={styles.content}>
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={versions}
              pagination={false}
              rowKey='version'
              scroll={{ x: 'max-content' }}
            />
          </Spin>
        </div>
      </div>
    </div>
  )
}

export default AppDetail
