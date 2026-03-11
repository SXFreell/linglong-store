import { useCallback } from 'react'
import { message } from 'antd'
import { findShellString } from '@/apis/apps'
import { checkLinglongEnv, installLinglongEnv } from '@/apis/invoke'
import { useGlobalStore } from '@/stores/global'

const DEFAULT_REASON = '检测到系统未安装玲珑环境，请先安装'

export const useLinglongEnv = () => {
  // 直接从 store 获取 setter 函数，避免使用 selector 返回对象导致无限循环
  // setter 函数是稳定的，不需要响应式订阅
  const {
    setChecking,
    setInstalling,
    setReason,
    setEnvReady,
    setEnvInfo,
    setArch,
    setRepoName,
  } = useGlobalStore.getState()

  const runCheck = useCallback(async(): Promise<API.INVOKE.LinglongEnvCheckResult> => {
    setChecking(true)
    try {
      const res = await checkLinglongEnv()
      console.info('[useLinglongEnv] checkEnv result', res)
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const versionParts: string[] = []
      if (res.osVersion) {
        versionParts.push(`OS: ${res.osVersion}`)
      }
      if (res.glibcVersion) {
        versionParts.push(`glibc: ${res.glibcVersion}`)
      }
      if (res.kernelInfo) {
        versionParts.push(`kernel: ${res.kernelInfo}`)
      }
      if (userAgent) {
        versionParts.push(`UA: ${userAgent}`)
      }
      const osVersionWithUa = versionParts.join(' | ')
      setEnvInfo({
        arch: res.arch || '',
        osVersion: osVersionWithUa,
        glibcVersion: res.glibcVersion || '',
        kernelInfo: res.kernelInfo || '',
        detailMsg: res.detailMsg || '',
        llVersion: res.llVersion || '',
        llBinVersion: res.llBinVersion || '',
        repoName: res.repoName || 'stable',
        repos: res.repos || [],
        envReady: res.ok,
        reason: res.reason,
        isContainer: res.isContainer || false,
      })
      if (res.arch) {
        setArch(res.arch)
      }
      if (res.repoName) {
        setRepoName(res.repoName)
      }
      setEnvReady(res.ok)
      // 版本过低警告：环境可用但有警告信息时提示用户
      if (res.ok && res.reason) {
        message.warning(res.reason)
      }
      setReason(res.ok ? undefined : (res.reason || DEFAULT_REASON))
      return res
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.warn('[useLinglongEnv] checkEnv error', errMsg)
      setReason(errMsg)
      setEnvInfo({
        envReady: false,
        reason: errMsg,
        repoName: 'stable',
        repos: [],
        llVersion: '',
        llBinVersion: '',
        osVersion: '',
        glibcVersion: '',
        kernelInfo: '',
        arch: '',
      })
      setEnvReady(false)
      throw error
    } finally {
      setChecking(false)
    }
  }, [])

  const runInstall = useCallback(async(): Promise<API.INVOKE.InstallLinglongResult> => {
    setInstalling(true)
    const hide = message.loading({ content: '正在自动安装玲珑环境...', key: 'install-linglong', duration: 0 })
    try {
      const res = await findShellString()
      const shellString = res.data
      if (res.code !== 200 || !shellString) {
        throw new Error('获取安装脚本失败，请稍后重试')
      }
      const output = await installLinglongEnv(shellString)
      hide()
      message.success({ content: '玲珑环境安装完成，正在重新检测...', key: 'install-linglong' })
      console.info('[useLinglongEnv] installEnv success', output)
      return output
    } catch (error) {
      hide()
      const errMsg = error instanceof Error ? error.message : String(error)
      message.error({ content: errMsg, key: 'install-linglong' })
      setReason(errMsg)
      console.warn('[useLinglongEnv] installEnv error', errMsg)
      throw error
    } finally {
      setInstalling(false)
    }
  }, [])

  return {
    checkEnv: runCheck,
    installEnv: runInstall,
  }
}
