/**
 * 已连接 Store 的 ApplicationCard
 * 自动从 useApplicationCardModel 获取 isInstalled / hasUpdate / isInstalling 状态
 * 页面层无需再手工调用 getCardState + 解构 + 传 props
 */
import { memo } from 'react'
import ApplicationCard from '@/components/ApplicationCard'
import { useApplicationCardModel } from '@/hooks/useApplicationCardModel'

type ConnectedProps = {
  appInfo: API.APP.AppMainDto
  /** 覆盖默认操作类型（如 myApps 页显示卸载） */
  operateId?: number
  /** 卡片类型：default | recommend */
  type?: string
}

const ConnectedApplicationCard = memo(({ appInfo, operateId, type }: ConnectedProps) => {
  const { getCardState, handleInstall, uninstall } = useApplicationCardModel()
  const cardState = getCardState(appInfo)

  return (
    <ApplicationCard
      appInfo={appInfo}
      operateId={operateId}
      type={type}
      isInstalled={cardState.isInstalled}
      hasUpdate={cardState.hasUpdate}
      isInstalling={cardState.isInstalling}
      onInstall={handleInstall}
      onUninstall={uninstall}
    />
  )
})

ConnectedApplicationCard.displayName = 'ConnectedApplicationCard'

export default ConnectedApplicationCard
