import { APP_LIST_SEEDS } from './seeds/appListSeeds'
import type {
  AppListCacheDescriptor,
  AppListCacheHit,
  AppListCacheRecord,
  AppListCacheSnapshot,
} from './types'

// 列表运行时缓存统一走 localStorage，避免为只读列表再引入额外 store 依赖。
const RUNTIME_CACHE_PREFIX = 'linglong:app-list-cache:v1:'
const RUNTIME_CACHE_VERSION = 1
const DEFAULT_SEED_REPO = 'stable'
const DEFAULT_SEED_ARCH = 'x86_64'

const canUseStorage = () => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

// 统一归一化架构字符串，避免 aarch64 与 arm64 命中不同 cache key。
const normalizeArch = (arch?: string) => {
  if (!arch) {
    return DEFAULT_SEED_ARCH
  }

  if (arch === 'aarch64') {
    return 'arm64'
  }

  return arch
}

const normalizeRecords = (records: API.APP.AppMainDto[] | undefined) => {
  return Array.isArray(records) ? records : []
}

const sanitizeParams = (params?: Record<string, unknown>) => {
  if (!params) {
    return {}
  }

  return Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const value = params[key]
      if (value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {})
}

const normalizeSnapshot = (snapshot?: Partial<AppListCacheSnapshot> | null): AppListCacheSnapshot | null => {
  if (!snapshot) {
    return null
  }

  const records = normalizeRecords(snapshot.records)
  const pageSize = Number(snapshot.pageSize) || 1
  const totalPages = Math.max(1, Number(snapshot.totalPages) || 1)
  const cachedPages = Math.min(
    Math.max(1, Number(snapshot.cachedPages) || 1),
    totalPages,
  )

  return {
    updatedAt: snapshot.updatedAt || new Date(0).toISOString(),
    pageSize,
    cachedPages,
    totalPages,
    records: records.slice(0, pageSize * cachedPages),
  }
}

export const buildAppListCacheKey = ({
  scope,
  repoName = DEFAULT_SEED_REPO,
  arch = DEFAULT_SEED_ARCH,
  params,
}: AppListCacheDescriptor) => {
  const serializedParams = JSON.stringify(sanitizeParams(params))
  return `${scope}|repo=${repoName}|arch=${normalizeArch(arch)}|params=${serializedParams}`
}

export const buildAppListSeedKey = (descriptor: AppListCacheDescriptor) => {
  return buildAppListCacheKey(descriptor)
}

export const readRuntimeAppListCache = (descriptor: AppListCacheDescriptor): AppListCacheHit | null => {
  if (!canUseStorage()) {
    return null
  }

  const cacheKey = buildAppListCacheKey(descriptor)
  const storageKey = `${RUNTIME_CACHE_PREFIX}${cacheKey}`

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    if (!rawValue) {
      return null
    }

    const parsedValue = JSON.parse(rawValue) as AppListCacheRecord
    if (parsedValue.version !== RUNTIME_CACHE_VERSION) {
      window.localStorage.removeItem(storageKey)
      return null
    }

    const snapshot = normalizeSnapshot(parsedValue)
    if (!snapshot || snapshot.records.length === 0) {
      return null
    }

    return {
      cacheKey,
      source: 'runtime',
      snapshot,
      fallback: false,
    }
  } catch (error) {
    console.warn('[appListCache] Failed to read runtime cache:', error)
    return null
  }
}

export const writeRuntimeAppListCache = (
  descriptor: AppListCacheDescriptor,
  snapshot: AppListCacheSnapshot,
) => {
  if (!canUseStorage()) {
    return
  }

  const normalizedSnapshot = normalizeSnapshot(snapshot)
  if (!normalizedSnapshot || normalizedSnapshot.records.length === 0) {
    return
  }

  const cacheKey = buildAppListCacheKey(descriptor)
  const storageKey = `${RUNTIME_CACHE_PREFIX}${cacheKey}`

  const payload: AppListCacheRecord = {
    version: RUNTIME_CACHE_VERSION,
    ...normalizedSnapshot,
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch (error) {
    console.warn('[appListCache] Failed to write runtime cache:', error)
  }
}

export const readSeedAppListCache = (descriptor: AppListCacheDescriptor): AppListCacheHit | null => {
  const exactKey = buildAppListSeedKey(descriptor)
  const fallbackKey = buildAppListSeedKey({
    ...descriptor,
    repoName: DEFAULT_SEED_REPO,
    arch: DEFAULT_SEED_ARCH,
  })

  const exactSnapshot = normalizeSnapshot(APP_LIST_SEEDS[exactKey])
  if (exactSnapshot && exactSnapshot.records.length > 0) {
    return {
      cacheKey: exactKey,
      source: 'seed',
      snapshot: exactSnapshot,
      fallback: false,
    }
  }

  if (fallbackKey === exactKey) {
    return null
  }

  const fallbackSnapshot = normalizeSnapshot(APP_LIST_SEEDS[fallbackKey])
  if (!fallbackSnapshot || fallbackSnapshot.records.length === 0) {
    return null
  }

  return {
    cacheKey: fallbackKey,
    source: 'seed',
    snapshot: fallbackSnapshot,
    fallback: true,
  }
}

export const getBestAppListCache = (descriptor: AppListCacheDescriptor): AppListCacheHit | null => {
  return readRuntimeAppListCache(descriptor) ?? readSeedAppListCache(descriptor)
}

export const trimSnapshotByPageLimit = (
  records: API.APP.AppMainDto[],
  pageSize: number,
  cachedPages: number,
) => {
  const normalizedPageSize = Math.max(1, pageSize)
  const normalizedCachedPages = Math.max(1, cachedPages)
  return records.slice(0, normalizedPageSize * normalizedCachedPages)
}

export type { AppListCacheDescriptor, AppListCacheHit, AppListCacheScope, AppListCacheSnapshot } from './types'
