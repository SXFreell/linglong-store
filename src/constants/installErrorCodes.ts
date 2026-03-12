/**
 * 安装错误码映射表
 *
 * 基于 linglong::utils::error::ErrorCode 定义
 * 来源：libs/utils/src/linglong/utils/error/error.h
 *
 * 用于将后端返回的错误码映射为用户友好的中文提示
 */

/**
 * 错误码枚举
 * 与后端 ErrorCode 保持一致
 */
export enum InstallErrorCode {
  // 通用错误
  Failed = -1,
  Success = 0,
  Cancelled = 1,
  Unknown = 1000,
  AppNotFoundFromRemote = 1001,
  AppNotFoundFromLocal = 1002,

  // 安装相关错误 (2001-2011)
  AppInstallFailed = 2001,
  AppInstallNotFoundFromRemote = 2002,
  AppInstallAlreadyInstalled = 2003,
  AppInstallNeedDowngrade = 2004,
  AppInstallModuleNoVersion = 2005,
  AppInstallModuleRequireAppFirst = 2006,
  AppInstallModuleAlreadyExists = 2007,
  AppInstallArchNotMatch = 2008,
  AppInstallModuleNotFound = 2009,
  AppInstallErofsNotFound = 2010,
  AppInstallUnsupportedFileFormat = 2011,

  // 卸载相关错误 (2101-2106)
  AppUninstallFailed = 2101,
  AppUninstallNotFoundFromLocal = 2102,
  AppUninstallAppIsRunning = 2103,
  LayerCompatibilityError = 2104,
  AppUninstallMultipleVersions = 2105,
  AppUninstallBaseOrRuntime = 2106,

  // 升级相关错误 (2201-2202)
  AppUpgradeFailed = 2201,
  AppUpgradeLocalNotFound = 2202,

  // 网络错误 (3001)
  NetworkError = 3001,

  // 解析/平台错误 (4001-4002)
  InvalidFuzzyReference = 4001,
  UnknownArchitecture = 4002,

  // 自定义错误码（前端/GUI 专用）
  ProgressTimeout = -2, // 进度超时
}

import type { TranslationKey } from '@/i18n'

/**
 * 错误码到 i18n key 的映射
 */
export const installErrorCodeKeys: Record<number, TranslationKey> = {
  // 通用
  [InstallErrorCode.Failed]: 'installError.failed',
  [InstallErrorCode.Success]: 'installError.success',
  [InstallErrorCode.Cancelled]: 'installError.cancelled',
  [InstallErrorCode.Unknown]: 'installError.unknown',
  [InstallErrorCode.AppNotFoundFromRemote]: 'installError.appNotFoundFromRemote',
  [InstallErrorCode.AppNotFoundFromLocal]: 'installError.appNotFoundFromLocal',

  // 安装
  [InstallErrorCode.AppInstallFailed]: 'installError.appInstallFailed',
  [InstallErrorCode.AppInstallNotFoundFromRemote]: 'installError.appInstallNotFoundFromRemote',
  [InstallErrorCode.AppInstallAlreadyInstalled]: 'installError.appInstallAlreadyInstalled',
  [InstallErrorCode.AppInstallNeedDowngrade]: 'installError.appInstallNeedDowngrade',
  [InstallErrorCode.AppInstallModuleNoVersion]: 'installError.appInstallModuleNoVersion',
  [InstallErrorCode.AppInstallModuleRequireAppFirst]: 'installError.appInstallModuleRequireAppFirst',
  [InstallErrorCode.AppInstallModuleAlreadyExists]: 'installError.appInstallModuleAlreadyExists',
  [InstallErrorCode.AppInstallArchNotMatch]: 'installError.appInstallArchNotMatch',
  [InstallErrorCode.AppInstallModuleNotFound]: 'installError.appInstallModuleNotFound',
  [InstallErrorCode.AppInstallErofsNotFound]: 'installError.appInstallErofsNotFound',
  [InstallErrorCode.AppInstallUnsupportedFileFormat]: 'installError.appInstallUnsupportedFileFormat',

  // 卸载
  [InstallErrorCode.AppUninstallFailed]: 'installError.appUninstallFailed',
  [InstallErrorCode.AppUninstallNotFoundFromLocal]: 'installError.appUninstallNotFoundFromLocal',
  [InstallErrorCode.AppUninstallAppIsRunning]: 'installError.appUninstallAppIsRunning',
  [InstallErrorCode.LayerCompatibilityError]: 'installError.layerCompatibilityError',
  [InstallErrorCode.AppUninstallMultipleVersions]: 'installError.appUninstallMultipleVersions',
  [InstallErrorCode.AppUninstallBaseOrRuntime]: 'installError.appUninstallBaseOrRuntime',

  // 升级
  [InstallErrorCode.AppUpgradeFailed]: 'installError.appUpgradeFailed',
  [InstallErrorCode.AppUpgradeLocalNotFound]: 'installError.appUpgradeLocalNotFound',

  // 网络
  [InstallErrorCode.NetworkError]: 'installError.networkError',

  // 解析/平台
  [InstallErrorCode.InvalidFuzzyReference]: 'installError.invalidFuzzyReference',
  [InstallErrorCode.UnknownArchitecture]: 'installError.unknownArchitecture',

  // 自定义
  [InstallErrorCode.ProgressTimeout]: 'installError.progressTimeout',
}

/**
 * 根据错误码获取用户友好的错误消息
 * @param code 错误码
 * @param t 翻译函数
 * @param fallbackMessage 兜底消息（当错误码未映射时使用）
 * @returns 用户友好的错误消息
 */
export function getInstallErrorMessage(
  code: number | undefined,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
  fallbackMessage?: string,
): string {
  if (code === undefined || code === null) {
    return fallbackMessage || t('installError.fallbackUnknown')
  }

  const mappedKey = installErrorCodeKeys[code]
  if (mappedKey) {
    return t(mappedKey)
  }

  // 未映射的错误码，使用兜底消息或显示错误码
  return fallbackMessage || t('installError.errorCodeFallback', { code })
}

/**
 * 判断错误码是否表示需要用户操作的错误
 * @param code 错误码
 * @returns 是否需要用户操作
 */
export function isUserActionRequired(code: number | undefined): boolean {
  if (code === undefined || code === null) {
    return false
  }

  // 需要用户操作的错误码
  const userActionCodes = [
    InstallErrorCode.AppInstallNeedDowngrade, // 需要降级
    InstallErrorCode.AppInstallAlreadyInstalled, // 已安装，可能需要强制安装
    InstallErrorCode.AppUninstallAppIsRunning, // 需要先停止应用
    InstallErrorCode.AppInstallArchNotMatch, // 架构不匹配，需要选择其他版本
    InstallErrorCode.NetworkError, // 网络错误，可重试
  ]

  return userActionCodes.includes(code)
}

/**
 * 判断错误是否可重试
 * @param code 错误码
 * @returns 是否可重试
 */
export function isRetryableError(code: number | undefined): boolean {
  if (code === undefined || code === null) {
    return false
  }

  // 可重试的错误码
  const retryableCodes = [
    InstallErrorCode.NetworkError,
    InstallErrorCode.ProgressTimeout,
    InstallErrorCode.Unknown,
  ]

  return retryableCodes.includes(code)
}
