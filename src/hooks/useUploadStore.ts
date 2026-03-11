/**
 * 应用商店更新检测钩子
 * 用于检查商店客户端自身的版本更新
 */

import React, { useState, useCallback } from 'react'
import { message, Modal } from 'antd'
import { createAlova } from 'alova'
import adapterFetch from 'alova/fetch'

// Gitee 仓库配置
const GITEE_REPO = 'Shirosu/linglong-store'

// 延迟创建 Gitee API 专用的 alova 实例，避免模块加载时的开销
// 使用工厂函数让 TypeScript 正确推断含 adapterFetch 泛型参数的返回类型
function createGiteeAlova() {
  return createAlova({
    baseURL: 'https://gitee.com/api/v5',
    requestAdapter: adapterFetch(),
    timeout: 10000,
    responded: {
      onSuccess: async(response: Response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      },
      onError: (error: Error) => {
        console.error('Gitee API 请求失败:', error)
        throw error
      },
    },
  })
}

let _giteeAlova: ReturnType<typeof createGiteeAlova> | null = null

function getGiteeAlova() {
  if (!_giteeAlova) {
    _giteeAlova = createGiteeAlova()
  }
  return _giteeAlova
}

/**
 * 更新信息接口
 */
interface UpdateInfo {
  /** 最新版本号 */
  version: string
  /** DEB 包下载链接 (amd64) */
  debUrl: string
  /** RPM 包下载链接 (x86_64) */
  rpmUrl: string
  /** AppImage 包下载链接 (通用) */
  appImageUrl?: string
  /** 更新日志 */
  changelog: string
  /** 发布时间 */
  publishedAt: string
}

/**
 * Gitee Release API 响应结构（返回数组）
 */
interface GiteeRelease {
  id: number
  tag_name: string
  target_commitish: string
  prerelease: boolean
  name: string
  body: string
  author: {
    id: number
    login: string
    name: string
    avatar_url: string
    url: string
    html_url: string
  }
  created_at: string
  assets: Array<{
    browser_download_url: string
    name: string
  }>
}

/**
 * 更新检测状态
 */
interface UpdateCheckState {
  /** 是否正在检查更新 */
  checking: boolean
  /** 是否有可用更新 */
  hasUpdate: boolean
  /** 更新信息 */
  updateInfo: UpdateInfo | null
  /** 错误信息 */
  error: string | null
}

/**
 * 判断是否为 beta 版本
 */
function isBetaVersion(version: string): boolean {
  return /-beta(\.\d+)?$/.test(version)
}

/**
 * 解析版本号，返回主版本号和 beta 版本号
 * @param version 版本号（如 "v2.0.1" 或 "2.0.0"）
 * @returns { major: [2, 0, 0], beta: 1 } 或 { major: [2, 0, 0], beta: null }
 */
function parseVersion(version: string): { major: number[]; beta: number | null } {
  const cleaned = version.replace(/^v/, '')
  const betaMatch = cleaned.match(/^([\d.]+)-beta(?:\.(\d+))?$/)

  if (betaMatch) {
    const major = betaMatch[1].split('.').map(Number)
    const beta = betaMatch[2] ? parseInt(betaMatch[2], 10) : 0
    return { major, beta }
  }

  return {
    major: cleaned.split('.').map(Number),
    beta: null,
  }
}

/**
 * 对比两个语义化版本（x.y.z）
 * @param localVersion 本地版本（如 "2.0.0" 或 "v2.0.1"）
 * @param remoteVersion 远程版本（如 "2.0.1" 或 "v2.0.0-beta.2"）
 * @returns 1: 远程更新；-1: 本地更新；0: 版本一致
 */
export function compareVersions(
  localVersion: string,
  remoteVersion: string,
): number {
  const local = parseVersion(localVersion)
  const remote = parseVersion(remoteVersion)

  // 确保版本号格式正确
  if (local.major.some(isNaN) || remote.major.some(isNaN)) {
    console.warn('版本号格式不正确:', { localVersion, remoteVersion })
    return 0
  }

  // 先比较主版本号
  const maxLength = Math.max(local.major.length, remote.major.length)
  for (let i = 0; i < maxLength; i++) {
    const localPart = local.major[i] || 0
    const remotePart = remote.major[i] || 0

    if (remotePart > localPart) {
      return 1
    }
    if (remotePart < localPart) {
      return -1
    }
  }

  // 主版本号相同，比较 beta 版本
  // 正式版 > beta 版
  if (local.beta === null && remote.beta !== null) {
    return -1 // 本地是正式版，远程是 beta，本地更新
  }
  if (local.beta !== null && remote.beta === null) {
    return 1 // 本地是 beta，远程是正式版，远程更新
  }
  if (local.beta !== null && remote.beta !== null) {
    // 都是 beta 版本，比较 beta 序号
    if (remote.beta > local.beta) {
      return 1
    }
    if (remote.beta < local.beta) {
      return -1
    }
  }

  return 0
}

/**
 * 从 Gitee Releases 获取最新更新信息
 * @param currentVersion 当前版本号
 */
export async function fetchLatestUpdate(
  currentVersion: string,
): Promise<UpdateInfo | null> {
  try {
    // 根据当前版本类型决定获取多少条记录
    // beta 版本获取更多记录以便找到最新的正式版或 beta 版
    const perPage = isBetaVersion(currentVersion) ? 20 : 10
    const apiUrl = `https://gitee.com/api/v5/repos/${GITEE_REPO}/releases?page=1&per_page=${perPage}&direction=desc`

    const method = getGiteeAlova().Get<GiteeRelease[]>(apiUrl, {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'User-Agent': `linglong-store/${currentVersion}`,
      },
    })

    const releases = await method.send()

    if (!releases || !Array.isArray(releases) || releases.length === 0) {
      console.error('未找到任何 Release')
      return null
    }

    const currentIsBeta = isBetaVersion(currentVersion)
    let latestRelease: GiteeRelease | null = null

    // 根据当前版本类型筛选合适的 release
    if (currentIsBeta) {
      // beta 版本：接受正式版和 beta 版，选择版本号最高的
      latestRelease = releases[0] // 已按时间降序排列，直接取第一个
    } else {
      // 正式版：只接受正式版
      latestRelease = releases.find(release => !isBetaVersion(release.tag_name)) || null
    }

    if (!latestRelease) {
      console.error('未找到符合条件的 Release')
      return null
    }

    const version = latestRelease.tag_name.replace(/^v/, '')
    const changelog = latestRelease.body || '暂无更新日志'

    // 筛选对应架构的安装包
    const debAsset = latestRelease.assets.find(
      (asset) =>
        asset.name.endsWith('.deb') && asset.name.includes('amd64'),
    )
    const rpmAsset = latestRelease.assets.find(
      (asset) =>
        asset.name.endsWith('.rpm') && asset.name.includes('x86_64'),
    )
    const appImageAsset = latestRelease.assets.find(
      (asset) =>
        asset.name.endsWith('.AppImage'),
    )

    // 至少需要一个安装包
    if (!debAsset && !rpmAsset && !appImageAsset) {
      console.error('未找到对应架构的更新包')
      return null
    }

    return {
      version,
      debUrl: debAsset?.browser_download_url || '',
      rpmUrl: rpmAsset?.browser_download_url || '',
      appImageUrl: appImageAsset?.browser_download_url,
      changelog,
      publishedAt: latestRelease.created_at,
    }
  } catch (error) {
    console.error('获取更新信息失败：', error)
    throw error
  }
}

/**
 * 应用更新检测 Hook
 * 提供版本检测、更新信息获取等功能
 */
export function useUpdateStore() {
  const [state, setState] = useState<UpdateCheckState>({
    checking: false,
    hasUpdate: false,
    updateInfo: null,
    error: null,
  })

  /**
   * 检查更新
   * @param currentVersion 当前应用版本
   * @param silent 是否静默检查（不显示提示）
   */
  const checkForUpdate = useCallback(async(currentVersion: string, silent = false) => {
    // 开始检查
    setState((prev) => ({
      ...prev,
      checking: true,
      error: null,
    }))

    try {
      const updateInfo = await fetchLatestUpdate(currentVersion)

      if (!updateInfo) {
        setState({
          checking: false,
          hasUpdate: false,
          updateInfo: null,
          error: '未找到更新信息',
        })

        if (!silent) {
          message.info('暂无可用更新')
        }
        return
      }

      // 对比版本
      const comparison = compareVersions(currentVersion, updateInfo.version)

      if (comparison === 1) {
        // 有新版本
        setState({
          checking: false,
          hasUpdate: true,
          updateInfo,
          error: null,
        })

        if (!silent) {
          // 弹窗提示更新，提供下载链接
          const releaseUrl = `https://gitee.com/${GITEE_REPO}/releases`

          console.info('发现更新:', {
            currentVersion: currentVersion,
            latestVersion: updateInfo.version,
            changelog: updateInfo.changelog,
            releaseUrl,
          })

          // 使用 Modal 弹窗显示更新信息
          const contentElements = [
            React.createElement('p', { key: 'current' }, `当前版本: v${currentVersion}`),
            React.createElement('p', { key: 'latest' }, `最新版本: v${updateInfo.version}`),
          ]

          if (updateInfo.changelog) {
            contentElements.push(
              React.createElement(
                'div',
                { key: 'changelog', style: { marginTop: '16px' } },
                React.createElement('p', { style: { fontWeight: 'bold', marginBottom: '8px' } }, '更新内容:'),
                React.createElement(
                  'div',
                  {
                    style: {
                      maxHeight: '300px',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                    },
                  },
                  updateInfo.changelog,
                ),
              ),
            )
          }

          // 添加下载链接显示
          contentElements.push(
            React.createElement(
              'div',
              { key: 'download-link', style: { marginTop: '16px' } },
              React.createElement('p', { style: { fontWeight: 'bold', marginBottom: '8px' } }, '下载地址:'),
              React.createElement(
                'div',
                {
                  style: {
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    wordBreak: 'break-all',
                    userSelect: 'all',
                    fontSize: '13px',
                  },
                },
                releaseUrl,
              ),
            ),
          )

          Modal.confirm({
            title: '发现新版本',
            content: React.createElement('div', null, ...contentElements),
            okText: '复制下载链接',
            okType: 'primary',
            cancelText: '稍后再说',
            width: 600,
            onOk: () => {
              try {
                // 复制链接到剪贴板
                navigator.clipboard
                  .writeText(releaseUrl)
                  .then(() => {
                    message.success('下载链接已复制到剪贴板')
                  })
                  .catch((err) => {
                    console.error('复制失败:', err)
                    message.error('复制失败，请手动复制链接')
                  })
              } catch (err) {
                console.error('复制失败:', err)
                message.error('复制失败，请手动复制链接')
              }
            },
          })
        }
      } else {
        // 已是最新版本
        setState({
          checking: false,
          hasUpdate: false,
          updateInfo: null,
          error: null,
        })

        if (!silent) {
          message.info('当前已是最新版本')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '检查更新失败'

      setState({
        checking: false,
        hasUpdate: false,
        updateInfo: null,
        error: errorMessage,
      })

      if (!silent) {
        message.error(`检查更新失败：${errorMessage}`)
      }

      console.error('检查更新失败：', error)
    }
  }, [])

  /**
   * 重置更新状态
   */
  const resetUpdateState = useCallback(() => {
    setState({
      checking: false,
      hasUpdate: false,
      updateInfo: null,
      error: null,
    })
  }, [])

  /**
   * 获取下载链接（根据系统类型）
   * @param packageType 包类型：'deb' | 'rpm' | 'appimage'
   */
  const getDownloadUrl = useCallback((packageType: 'deb' | 'rpm' | 'appimage'): string | null => {
    if (!state.updateInfo) {
      return null
    }

    switch (packageType) {
    case 'deb':
      return state.updateInfo.debUrl || null
    case 'rpm':
      return state.updateInfo.rpmUrl || null
    case 'appimage':
      return state.updateInfo.appImageUrl || null
    default:
      return null
    }
  }, [state.updateInfo])

  return {
    // 状态
    checking: state.checking,
    hasUpdate: state.hasUpdate,
    updateInfo: state.updateInfo,
    error: state.error,

    // 方法
    checkForUpdate,
    resetUpdateState,
    getDownloadUrl,
  }
}
