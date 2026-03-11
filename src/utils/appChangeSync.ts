/**
 * 应用集合变更后的统一同步逻辑
 * 安装成功、卸载成功、批量更新完成后统一调用，
 * 负责刷新已安装列表和更新列表，避免各场景各维护一套收尾流程。
 */
import { useUpdatesStore } from '@/stores/updates'
import { useInstalledAppsStore } from '@/stores/installedApps'

interface SyncOptions {
  /** 是否强制检查更新（卸载后通常为 true，因为版本列表已变） */
  forceCheckUpdates?: boolean
  /** 是否刷新已安装列表（卸载使用乐观 removeApp 时可设为 false） */
  refreshInstalledApps?: boolean
}

/**
 * 应用集合发生变化后的统一同步
 * - 刷新更新列表（checkUpdates）
 * - 刷新已安装列表（fetchInstalledApps）
 */
export async function syncAfterAppChange(options: SyncOptions = {}): Promise<void> {
  const { forceCheckUpdates = false, refreshInstalledApps = true } = options

  const { checkUpdates, checking } = useUpdatesStore.getState()
  const { fetchInstalledApps } = useInstalledAppsStore.getState()

  // 刷新更新列表
  if (forceCheckUpdates || !checking) {
    checkUpdates(forceCheckUpdates).catch((err) =>
      console.error('[syncAfterAppChange] checkUpdates failed:', err),
    )
  }

  // 刷新已安装列表（卸载时已做乐观更新，可跳过）
  if (refreshInstalledApps) {
    await fetchInstalledApps().catch((err) =>
      console.error('[syncAfterAppChange] fetchInstalledApps failed:', err),
    )
  }
}
