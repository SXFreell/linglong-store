/**
 * 应用配置状态管理模块
 * 使用 Zustand 管理全局配置，并通过 @tauri-store/zustand 实现配置持久化
 */
import { create } from 'zustand'
import { createTauriStore } from '@tauri-store/zustand'
import type { ConfigStore } from '@/types/store'

/**
 * 创建应用配置状态管理store
 * 管理更新检查和基础服务显示等全局配置
 */
export const useConfigStore = create<ConfigStore>((set) => ({
  /** 是否启用版本检查功能的标志 */
  checkVersion: false,
  /** 是否显示基础服务应用的标志 */
  showBaseService: false,

  /** 点击关闭时是直接关闭还是最小化到托盘 */
  closeOrHide: 'hide',
  /**
   * 更改版本检查功能的状态
   * @param value - 新的版本检查状态
   */
  changeCheckVersionStatus: (value: boolean) => set((_state) => ({
    checkVersion: value,
  })),

  /**
   * 更改基础服务显示状态
   * @param value - 新的基础服务显示状态
   */
  changeBaseServiceStatus: (value: boolean) => set((_state) => ({
    showBaseService: value,
  })),
  /** 更改点击关闭时记录的状态 */

  changeCloseOrHide: (value: string) => set((_state) => ({
    closeOrHide: value,
  })),
}))

/**
 * 全局应用配置的持久化存储实例
 * 使用 @tauri-store/zustand 将配置保存到本地磁盘
 * @param saveOnChange - 配置变更时自动保存
 * @param autoStart - 应用启动时自动初始化
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tauriAppConfigHandler = createTauriStore('ConfigStore', useConfigStore as any, {
  saveOnChange: true, // 配置变更时自动保存到磁盘
  autoStart: true, // 应用启动时自动从磁盘加载配置
})
