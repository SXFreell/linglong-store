/**
 * IPC 返回值的 Zod 运行时校验 Schema
 * 覆盖高频 / 高影响接口，在边界层尽早发现契约漂移
 */
import { z } from 'zod'

// ==================== InstalledApp ====================

export const InstalledAppSchema = z.object({
  appId: z.string(),
  name: z.string(),
  version: z.string(),
  arch: z.string(),
  channel: z.string(),
  description: z.string(),
  icon: z.string(),
  kind: z.string().optional(),
  module: z.string(),
  runtime: z.string(),
  size: z.string(),
  repoName: z.string(),
})

// ==================== RunningApp ====================

export const RunningAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  arch: z.string(),
  channel: z.string(),
  source: z.string(),
  pid: z.string(),
  containerId: z.string(),
})

// ==================== LinglongEnvCheckResult ====================

const LinglongRepoSchema = z.object({
  name: z.string(),
  url: z.string(),
  alias: z.string().optional(),
  priority: z.string().optional(),
})

export const LinglongEnvCheckResultSchema = z.object({
  ok: z.boolean(),
  reason: z.string().optional(),
  arch: z.string().optional(),
  osVersion: z.string().optional(),
  glibcVersion: z.string().optional(),
  kernelInfo: z.string().optional(),
  detailMsg: z.string().optional(),
  llVersion: z.string().optional(),
  llBinVersion: z.string().optional(),
  repoName: z.string().optional(),
  repos: z.array(LinglongRepoSchema).optional(),
  isContainer: z.boolean().optional(),
})

// ==================== InstallProgress ====================

export const InstallProgressSchema = z.object({
  appId: z.string(),
  eventType: z.enum(['progress', 'error', 'message']),
  message: z.string(),
  percentage: z.number(),
  status: z.string(),
  code: z.number().optional(),
  errorDetail: z.string().optional(),
})

// ==================== NetworkSpeed ====================

export const NetworkSpeedSchema = z.object({
  upload_speed: z.number(),
  download_speed: z.number(),
})

// ==================== 校验工具 ====================

/**
 * 安全解析 IPC 返回数据
 * 校验失败时打印警告并返回原始数据（降级策略，避免校验失败导致功能不可用）
 * @param schema - Zod Schema
 * @param data - 待校验数据
 * @param label - 数据来源标签，用于日志定位
 */
export function safeParseIpc<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.warn(`[IPC Schema] ${label} 契约校验失败，降级使用原始数据:`, result.error.issues)
    return data as T
  }
  return result.data
}
