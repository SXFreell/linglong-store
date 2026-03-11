import { useState, useCallback, useRef } from 'react'
import { App, Alert } from 'antd'
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { LogicalPosition } from '@tauri-apps/api/dpi'
import { useLinglongProcesses } from '@/hooks/useLinglongProcesses'
import ProcessToolbar from './ProcessToolbar'
import ProcessTable from './ProcessTable'
import styles from './index.module.scss'

type RunningApp = API.INVOKE.RunningApp

interface LinglongProcessProps {
  /** 当前是否处于"玲珑进程"标签页（控制是否启动轮询） */
  isTabActive: boolean
}

const LinglongProcess: React.FC<LinglongProcessProps> = ({ isTabActive }) => {
  const { message } = App.useApp()

  const {
    processes,
    isInitialLoading,
    isRefreshing,
    lastRefreshedAt,
    error,
    killLoadingIds,
    refresh,
    killProcess,
  } = useLinglongProcesses({ isTabActive })

  const [contextMenuRowId, setContextMenuRowId] = useState<string | null>(null)

  /** 当前右键菜单的目标行（用 ref 避免闭包问题） */
  const contextRecordRef = useRef<RunningApp | null>(null)

  /** 构建并弹出原生右键菜单
   * @param record 目标行数据
   * @param x 触发时的逻辑 X 坐标（clientX）
   * @param y 触发时的逻辑 Y 坐标（clientY）
   */
  const showContextMenu = useCallback(async(record: RunningApp, x: number, y: number) => {
    const isKilling = killLoadingIds.has(record.id)

    // 安全操作优先（复制类），危险操作（停止）置于底部，防止误触
    const copyEnterCmd = await MenuItem.new({
      text: '复制进入容器命令',
      action: async() => {
        try {
          await navigator.clipboard.writeText(`ll-cli enter ${record.name}`)
          message.success('命令已复制到剪贴板，请粘贴到终端中执行')
        } catch (e) {
          message.error(`复制失败：${e}`)
        }
      },
    })

    const copyAppId = await MenuItem.new({
      text: '复制应用 ID',
      action: async() => {
        await navigator.clipboard.writeText(record.name)
        message.success('已复制')
      },
    })

    const copyPid = await MenuItem.new({
      text: '复制 PID',
      action: async() => {
        await navigator.clipboard.writeText(record.pid)
        message.success('已复制')
      },
    })

    const copyContainerId = await MenuItem.new({
      text: '复制容器 ID',
      action: async() => {
        await navigator.clipboard.writeText(record.containerId)
        message.success('已复制')
      },
    })

    const refreshItem = await MenuItem.new({
      text: '刷新进程列表',
      action: refresh,
    })

    const separator = await PredefinedMenuItem.new({ item: 'Separator' })
    const separator2 = await PredefinedMenuItem.new({ item: 'Separator' })

    // 危险操作置于底部（符合桌面惯例，防止右键松开时误触第一项）
    const stopItem = await MenuItem.new({
      text: '停止进程',
      enabled: !isKilling,
      action: () => killProcess(record),
    })

    const menu = await Menu.new({
      items: [copyEnterCmd, copyAppId, copyPid, copyContainerId, separator, refreshItem, separator2, stopItem],
    })

    // 向右下偏移 4px：避免菜单出现时第一项直接在光标下方被误触
    await menu.popup(new LogicalPosition(x + 4, y + 4))
  }, [killLoadingIds, killProcess, message, refresh])

  const handleContextMenu = useCallback((e: React.MouseEvent, record: RunningApp) => {
    e.preventDefault()
    e.stopPropagation()
    contextRecordRef.current = record
    setContextMenuRowId(record.id)
    showContextMenu(record, e.clientX, e.clientY).finally(() => {
      setContextMenuRowId(null)
    })
  }, [showContextMenu])

  /** "更多"按钮点击：复用右键菜单逻辑 */
  const handleMoreClick = useCallback((e: React.MouseEvent, record: RunningApp) => {
    handleContextMenu(e, record)
  }, [handleContextMenu])

  return (
    <div className={styles.linglongProcess}>
      <ProcessToolbar
        count={processes.length}
        lastRefreshedAt={lastRefreshedAt}
        isRefreshing={isRefreshing}
        error={error}
        onRefresh={refresh}
      />

      {/* 刷新失败但保留旧数据时的轻量提示 */}
      {error !== null && processes.length > 0 && (
        <Alert
          type="warning"
          message="进程列表刷新失败，显示的是上次数据"
          showIcon
          closable
          className={styles.errorBanner}
        />
      )}

      <ProcessTable
        processes={processes}
        isInitialLoading={isInitialLoading}
        killLoadingIds={killLoadingIds}
        contextMenuRowId={contextMenuRowId}
        onContextMenu={handleContextMenu}
        onMoreClick={handleMoreClick}
      />
    </div>
  )
}

export default LinglongProcess
