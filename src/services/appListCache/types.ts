export type AppListCacheScope =
  | 'recommend-main'
  | 'recommend-carousel'
  | 'all-apps-main'
  | 'ranking-install'
  | 'ranking-new'
  | 'custom-category-main'
  | 'custom-category-recommend'

export interface AppListCacheDescriptor {
  scope: AppListCacheScope
  repoName?: string
  arch?: string
  params?: Record<string, unknown>
}

export interface AppListCacheSnapshot {
  updatedAt: string
  pageSize: number
  cachedPages: number
  totalPages: number
  records: API.APP.AppMainDto[]
}

export interface AppListCacheRecord extends AppListCacheSnapshot {
  version: number
}

export interface AppListCacheHit {
  cacheKey: string
  source: 'runtime' | 'seed'
  snapshot: AppListCacheSnapshot
  fallback: boolean
}
