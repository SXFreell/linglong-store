import { useCallback } from 'react'
import { Button, Modal, Space, Typography } from 'antd'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useLinglongEnv } from '@/hooks/useLinglongEnv'
import { useGlobalStore } from '@/stores/global'
import { useI18n } from '@/i18n'

const MANUAL_INSTALL_URL = 'https://www.linglong.space/guide/start/install.html'

interface Props {
  open: boolean
  reason?: string
  onEnvReady?: () => Promise<void> | void
}

const LinglongEnvDialog = ({
  open: modalOpen,
  reason,
  onEnvReady,
}: Props) => {
  const { t } = useI18n()
  const { installEnv, checkEnv } = useLinglongEnv()
  // 分开订阅 store 状态，避免 selector 返回对象导致无限循环
  const checking = useGlobalStore((state) => state.checking)
  const installing = useGlobalStore((state) => state.installing)

  const closeApp = useCallback(async() => {
    const win = getCurrentWindow()
    await win.close()
  }, [])

  const handleExit = useCallback(async() => {
    await closeApp()
  }, [closeApp])

  const handleManualInstall = useCallback(async() => {
    await openUrl(MANUAL_INSTALL_URL)
  }, [closeApp])

  const handleAutoInstall = useCallback(async() => {
    try {
      await installEnv()
      const envResult = await checkEnv()
      if (envResult.ok && onEnvReady) {
        await onEnvReady()
      }
    } catch {
      // 错误提示在 hook 中已处理
    }
  }, [installEnv, checkEnv, onEnvReady])

  const handleRetry = useCallback(async() => {
    await checkEnv()
    if (onEnvReady) {
      await onEnvReady()
    }
  }, [checkEnv, onEnvReady])

  return (
    <Modal
      open={modalOpen}
      centered
      closable={false}
      maskClosable={false}
      title={t('layout.envDialog.title')}
      footer={
        <Space>
          <Button onClick={handleExit}>{t('layout.envDialog.exitStore')}</Button>
          <Button onClick={handleManualInstall}>{t('layout.envDialog.manualInstall')}</Button>
          <Button
            type="primary"
            loading={installing}
            disabled={checking}
            onClick={handleAutoInstall}>
            {t('layout.envDialog.autoInstall')}
          </Button>
          <Button
            type="link"
            disabled={checking}
            onClick={handleRetry}>
            {t('layout.envDialog.recheck')}
          </Button>
        </Space>
      }>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Typography.Paragraph type="danger" strong style={{ marginBottom: 0 }}>
          {t('layout.envDialog.missingEnvTip')}
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {reason || t('layout.envDialog.reasonFallback')}
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {t('layout.envDialog.supportedDistros')}
        </Typography.Paragraph>
        <Typography.Text type="secondary">
          {t('layout.envDialog.noRestartNeeded')}
        </Typography.Text>
      </Space>
    </Modal>
  )
}

export default LinglongEnvDialog
