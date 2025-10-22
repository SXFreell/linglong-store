import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Typography, Table, Message, Modal, Spin, Space } from '@arco-design/web-react'
import type { TableColumnProps } from '@arco-design/web-react'
import styles from './index.module.scss'
import goBack from '@/assets/icons/go_back.svg'
import DefaultIcon from '@/assets/linyaps.svg'
import type { InstalledApp } from '@/apis/invoke/types'
import { searchVersions, uninstallApp, runApp } from '@/apis/invoke'
import { useInstalledAppsStore } from '@/stores/installedApps'

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
  const removeApp = useInstalledAppsStore((state) => state.removeApp)
  const installedApps = useInstalledAppsStore((state) => state.installedApps)

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
      Message.error(`加载版本列表失败: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVersions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          Message.success('卸载成功')

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
          Message.error(`卸载失败: ${error}`)
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

    try {
      await runApp(currentApp.appId, version)
      // eslint-disable-next-line no-console
      console.log('[handleRun] Command executed successfully:', currentApp.appId)
      Message.success('启动命令已执行')
    } catch { /* empty */ }
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
              status='danger'
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
                  size='default'
                  onClick={() => Message.info('安装功能开发中...')}
                >
                  安装新版本
                </Button>
              </div>
            </div>
            <div className={styles.appDesc}>
              <div className={[styles.modules, styles.separate].join(' ')}>
                <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
                  {currentApp.kind}
                </Typography.Text>
                <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
                  应用类型
                </Typography.Text>
              </div>
              <div className={[styles.modules, styles.separate].join(' ')}>
                <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
                  {currentApp.channel}
                </Typography.Text>
                <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
                  通道
                </Typography.Text>
              </div>
              <div className={[styles.modules, styles.separate].join(' ')}>
                <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
                  {currentApp.version}
                </Typography.Text>
                <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
                  当前版本
                </Typography.Text>
              </div>
              <div className={styles.modules}>
                <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
                  {currentApp.appId}
                </Typography.Text>
                <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
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
          <Spin loading={loading}>
            <Table
              columns={columns}
              data={versions}
              pagination={false}
              hover
              rowKey='version'
              border={{
                wrapper: true,
                headerCell: true,
              }}
            />
          </Spin>
        </div>
      </div>
    </div>
  )
}

export default AppDetail
