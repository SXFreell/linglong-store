import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useAutoLoadWhenNotScrollable } from './useAutoLoadWhenNotScrollable'
import {
  getBestAppListCache,
  trimSnapshotByPageLimit,
  writeRuntimeAppListCache,
  type AppListCacheDescriptor,
} from '@/services/appListCache'

export interface CachedPaginatedResult<T> {
  records: T[]
  pages: number
}

interface UseCachedPaginatedListOptions<T extends API.APP.AppMainDto> {
  cacheDescriptor: AppListCacheDescriptor
  fetcher: (pageNo: number) => Promise<CachedPaginatedResult<T>>
  containerRef: RefObject<HTMLDivElement>
  pageSize?: number
  maxPersistedPages?: number
  extraDeps?: unknown[]
  enabled?: boolean
}

export function useCachedPaginatedList<T extends API.APP.AppMainDto>({
  cacheDescriptor,
  fetcher,
  containerRef,
  pageSize = 10,
  maxPersistedPages = 3,
  extraDeps = [],
  enabled = true,
}: UseCachedPaginatedListOptions<T>) {
  // 该 hook 负责把 seed、本地缓存和远端刷新统一收口，页面只传 cache key 和 fetcher。
  const [items, setItems] = useState<T[]>([])
  const [pageNo, setPageNo] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const loadingRef = useRef(false)
  const requestVersionRef = useRef(0)
  const itemsRef = useRef<T[]>([])
  const pageNoRef = useRef(1)
  const totalPagesRef = useRef(1)
  const visibilityRef = useRef(false)

  const cacheKey = useMemo(() => JSON.stringify(cacheDescriptor), [cacheDescriptor])
  const hasMore = pageNo < totalPages

  const syncState = useCallback((
    nextItems: T[],
    nextPageNo: number,
    nextTotalPages: number,
    nextInitialLoading: boolean,
  ) => {
    itemsRef.current = nextItems
    pageNoRef.current = nextPageNo
    totalPagesRef.current = nextTotalPages

    setItems(nextItems)
    setPageNo(nextPageNo)
    setTotalPages(nextTotalPages)
    setInitialLoading(nextInitialLoading)
  }, [])

  const persistSnapshot = useCallback((
    nextItems: T[],
    nextPageNo: number,
    nextTotalPages: number,
  ) => {
    const cachedPages = Math.min(Math.max(nextPageNo, 1), Math.max(maxPersistedPages, 1))
    const cachedRecords = trimSnapshotByPageLimit(nextItems, pageSize, cachedPages)

    writeRuntimeAppListCache(cacheDescriptor, {
      updatedAt: new Date().toISOString(),
      pageSize,
      cachedPages,
      totalPages: Math.max(1, nextTotalPages),
      records: cachedRecords,
    })
  }, [cacheDescriptor, maxPersistedPages, pageSize])

  const loadPage = useCallback(async(page: number, init = false) => {
    if (loadingRef.current && !init) {
      return
    }

    const requestVersion = requestVersionRef.current + 1
    requestVersionRef.current = requestVersion
    loadingRef.current = true
    setLoading(true)

    if (init && itemsRef.current.length === 0) {
      setInitialLoading(true)
    }

    try {
      const result = await fetcher(page)
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      const newRecords = (result.records ?? []) as T[]
      const nextItems = init ? newRecords : [...itemsRef.current, ...newRecords]
      const nextPageNo = page
      const nextTotalPages = Math.max(1, result.pages || 1)

      syncState(nextItems, nextPageNo, nextTotalPages, false)
      persistSnapshot(nextItems, nextPageNo, nextTotalPages)
    } catch (error) {
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      console.error('[useCachedPaginatedList] 加载失败:', error)
      if (itemsRef.current.length === 0) {
        syncState([], 1, 1, false)
      } else {
        setInitialLoading(false)
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        loadingRef.current = false
        setLoading(false)
      }
    }
  }, [fetcher, persistSnapshot, syncState])

  const refreshCachedPages = useCallback(async() => {
    if (!enabled || loadingRef.current) {
      return
    }

    const refreshPages = Math.min(
      Math.max(pageNoRef.current, 1),
      Math.max(maxPersistedPages, 1),
    )

    const requestVersion = requestVersionRef.current + 1
    requestVersionRef.current = requestVersion
    loadingRef.current = true
    setLoading(true)

    if (itemsRef.current.length === 0) {
      setInitialLoading(true)
    }

    try {
      const results = await Promise.all(
        Array.from({ length: refreshPages }, (_, index) => fetcher(index + 1)),
      )

      if (requestVersion !== requestVersionRef.current) {
        return
      }

      const refreshedRecords = results.flatMap(result => (result.records ?? []) as T[])
      const latestTotalPages = Math.max(1, results[results.length - 1]?.pages || 1)
      const preservedPageNo = Math.min(pageNoRef.current, latestTotalPages)
      const preservedTail = preservedPageNo > refreshPages
        ? itemsRef.current.slice(refreshPages * pageSize, preservedPageNo * pageSize)
        : []
      const nextItems = [...refreshedRecords, ...preservedTail]
      const nextPageNo = Math.min(
        latestTotalPages,
        Math.max(preservedPageNo, Math.min(refreshPages, latestTotalPages)),
      )

      syncState(nextItems, nextPageNo, latestTotalPages, false)
      persistSnapshot(nextItems, Math.min(Math.max(refreshPages, 1), latestTotalPages), latestTotalPages)
    } catch (error) {
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      console.error('[useCachedPaginatedList] 刷新缓存失败:', error)
      if (itemsRef.current.length === 0) {
        syncState([], 1, 1, false)
      } else {
        setInitialLoading(false)
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        loadingRef.current = false
        setLoading(false)
      }
    }
  }, [enabled, fetcher, maxPersistedPages, pageSize, persistSnapshot, syncState])

  const loadNextPage = useCallback(() => {
    if (loadingRef.current || pageNoRef.current >= totalPagesRef.current) {
      return
    }

    loadPage(pageNoRef.current + 1)
  }, [loadPage])

  const reset = useCallback(() => {
    requestVersionRef.current += 1
    loadingRef.current = false
    syncState([], 1, 1, true)
    setLoading(false)
  }, [syncState])

  useEffect(() => {
    requestVersionRef.current += 1
    loadingRef.current = false

    const cacheHit = getBestAppListCache(cacheDescriptor)
    if (cacheHit) {
      syncState(
        cacheHit.snapshot.records as T[],
        cacheHit.snapshot.cachedPages,
        cacheHit.snapshot.totalPages,
        false,
      )
    } else {
      syncState([], 1, 1, true)
    }

    visibilityRef.current = false
    setLoading(false)
  }, [cacheDescriptor, cacheKey, syncState])

  useEffect(() => {
    if (!enabled) {
      visibilityRef.current = false
      return
    }

    if (visibilityRef.current) {
      return
    }

    visibilityRef.current = true
    refreshCachedPages()
  }, [enabled, refreshCachedPages])

  useAutoLoadWhenNotScrollable({
    containerRef,
    loading: loading || !enabled,
    hasMore,
    onLoadMore: loadNextPage,
    deps: [items, pageNo, totalPages, cacheKey, enabled, ...extraDeps],
  })

  return {
    items,
    pageNo,
    totalPages,
    loading,
    initialLoading,
    hasMore,
    loadPage,
    loadNextPage,
    refreshCachedPages,
    reset,
    pageSize,
  }
}
