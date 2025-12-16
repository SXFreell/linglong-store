/**
 * 匿名统计服务模块
 * 负责获取设备标识、发送统计数据
 *
 * 收集的数据仅用于统计分析，不涉及任何个人隐私信息：
 * - 设备指纹（匿名ID）
 * - 系统架构、玲珑版本等环境信息
 * - 安装/卸载的应用名称和版本
 */

import { saveVisitRecord, saveInstalledRecord } from '@/apis/apps'
import { useGlobalStore } from '@/stores/global'

/**
 * 生成简单的设备指纹
 * 基于浏览器/系统特征生成一个相对稳定的匿名ID
 * 不使用任何敏感信息
 */
export const generateVisitorId = async(): Promise<string> => {
  // 使用简单的备用方案生成设备标识
  // 如果将来需要更精确的指纹，可以安装 @fingerprintjs/fingerprintjs
  return generateFallbackId()
}

/**
 * 生成备用的设备标识
 * 当 fingerprintjs 不可用时使用
 */
const generateFallbackId = (): string => {
  // 使用时间戳 + 随机数生成一个唯一ID，并存储到 localStorage
  const storageKey = 'linglong_visitor_id'
  let visitorId = localStorage.getItem(storageKey)

  if (!visitorId) {
    visitorId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(storageKey, visitorId)
  }

  return visitorId
}

/**
 * 获取客户端公网IP地址
 * 使用免费的 IP 查询服务
 */
export const fetchClientIp = async(): Promise<string> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时

    const response = await fetch('http://ip-api.com/json', {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to fetch IP')
    }

    const data = await response.json()
    return data.query || ''
  } catch (error) {
    console.warn('[analytics] Failed to fetch client IP:', error)
    return ''
  }
}

/**
 * 初始化统计服务
 * 获取设备指纹和IP，存入全局 store
 */
export const initAnalytics = async(): Promise<void> => {
  const { setVisitorId, setClientIp } = useGlobalStore.getState()

  try {
    // 并行获取设备指纹和客户端IP
    const [visitorId, clientIp] = await Promise.all([
      generateVisitorId(),
      fetchClientIp(),
    ])

    setVisitorId(visitorId)
    setClientIp(clientIp)

    console.info('[analytics] Initialized:', { visitorId, clientIp: clientIp ? '***' : 'N/A' })
  } catch (error) {
    console.error('[analytics] Failed to initialize:', error)
  }
}

/**
 * 发送启动访问记录
 * 在应用启动并完成环境检测后调用
 */
export const sendVisitRecord = async(): Promise<void> => {
  // 只在生产环境发送（除非显式开启开发模式统计）
  if (!import.meta.env.VITE_ENABLE_ANALYTICS_DEV) {
    console.info('[analytics] Visit record skipped (dev mode, set VITE_ENABLE_ANALYTICS_DEV=true to enable)')
    return
  }

  const globalState = useGlobalStore.getState()

  const data: API.APP.SaveVisitRecordVO = {
    appVersion: globalState.appVersion,
    clientIp: globalState.clientIp,
    arch: globalState.arch,
    llVersion: globalState.llVersion,
    llBinVersion: globalState.llBinVersion,
    detailMsg: globalState.detailMsg,
    osVersion: globalState.osVersion,
    repoName: globalState.repoName,
    visitorId: globalState.visitorId,
  }

  try {
    await saveVisitRecord(data)
    console.info('[analytics] Visit record sent successfully')
  } catch (error) {
    // 统计失败不影响应用正常使用
    console.warn('[analytics] Failed to send visit record:', error)
  }
}

/**
 * 发送安装记录
 * @param appInfo 安装的应用信息
 */
export const sendInstallRecord = async(appInfo: API.APP.InstalledRecordItem): Promise<void> => {
  if (!import.meta.env.VITE_ENABLE_ANALYTICS_DEV) {
    console.info('[analytics] Install record skipped (dev mode, set VITE_ENABLE_ANALYTICS_DEV=true to enable)')
    return
  }

  const { visitorId, clientIp } = useGlobalStore.getState()

  const data: API.APP.SaveInstalledRecordVO = {
    visitorId,
    clientIp,
    addedItems: [appInfo],
    removedItems: [],
  }

  try {
    await saveInstalledRecord(data)
    console.info('[analytics] Install record sent:', appInfo.appId)
  } catch (error) {
    console.warn('[analytics] Failed to send install record:', error)
  }
}

/**
 * 发送卸载记录
 * @param appInfo 卸载的应用信息
 */
export const sendUninstallRecord = async(appInfo: API.APP.InstalledRecordItem): Promise<void> => {
  if (!import.meta.env.VITE_ENABLE_ANALYTICS_DEV) {
    console.info('[analytics] Uninstall record skipped (dev mode, set VITE_ENABLE_ANALYTICS_DEV=true to enable)')
    return
  }

  const { visitorId, clientIp } = useGlobalStore.getState()

  const data: API.APP.SaveInstalledRecordVO = {
    visitorId,
    clientIp,
    addedItems: [],
    removedItems: [appInfo],
  }

  try {
    await saveInstalledRecord(data)
    console.info('[analytics] Uninstall record sent:', appInfo.appId)
  } catch (error) {
    console.warn('[analytics] Failed to send uninstall record:', error)
  }
}
