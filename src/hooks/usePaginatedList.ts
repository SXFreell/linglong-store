/**
 * 统一分页列表状态机
 * 封装 pageNo / totalPages / loading / initialLoading / items 以及自动补页逻辑
 * 页面只需提供 fetcher 函数和容器 ref
 */
import { useState, useCallback, useRef, type RefObject } from 'react'
import { useAutoLoadWhenNotScrollable } from './useAutoLoadWhenNotScrollable'

/** fetcher 返回的分页结果 */
export interface PaginatedResult<T> {
  records: T[]
  /** 总页数 */
  pages: number
}

interface UsePaginatedListOptions<T> {
  /** 数据获取函数，由页面提供，接收页码返回分页结果 */
  fetcher: (pageNo: number) => Promise<PaginatedResult<T>>
  /** 滚动容器 ref，传给 useAutoLoadWhenNotScrollable */
  containerRef: RefObject<HTMLDivElement>
  /** 每页大小（仅用于骨架屏 count 等，不影响 fetcher） */
  pageSize?: number
  /** useAutoLoadWhenNotScrollable 的额外依赖 */
  extraDeps?: unknown[]
}

export function usePaginatedList<T>({
  fetcher,
  containerRef,
  pageSize = 10,
  extraDeps = [],
}: UsePaginatedListOptions<T>) {
  const [items, setItems] = useState<T[]>([])
  const [pageNo, setPageNo] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  // 通过 ref 做同步并发保护，避免 loading 状态变化导致 loadPage 引用抖动。
  const loadingRef = useRef(false)
  // 递增请求代次，确保筛选条件切换后只消费最后一次请求结果。
  const requestVersionRef = useRef(0)

  const hasMore = pageNo < totalPages

  /**
   * 加载指定页
   * @param page 页码
   * @param init 是否为首屏（重置列表）
   */
  const loadPage = useCallback(async(page: number, init = false) => {
    // 分页追加保持串行；首屏重载允许抢占旧请求，并在完成后覆盖旧结果。
    if (loadingRef.current && !init) {
      return
    }

    const requestVersion = requestVersionRef.current + 1
    requestVersionRef.current = requestVersion
    loadingRef.current = true
    setLoading(true)
    if (init) {
      setInitialLoading(true)
      setItems([])
    }

    try {
      const result = await fetcher(page)
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      const newRecords = result.records ?? []

      if (init) {
        setItems(newRecords)
      } else {
        setItems(prev => [...prev, ...newRecords])
      }

      setTotalPages(result.pages || 1)
      setPageNo(page)
    } catch (error) {
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      console.error('[usePaginatedList] 加载失败:', error)
      if (init) {
        setItems([])
      }
    } finally {
      // 仅最后一次有效请求可以收尾，避免旧请求在 finally 中反向覆盖新状态。
      if (requestVersion === requestVersionRef.current) {
        if (init) {
          setInitialLoading(false)
        }
        setLoading(false)
        loadingRef.current = false
      }
    }
  }, [fetcher])

  /** 加载下一页 */
  const loadNextPage = useCallback(() => {
    if (loading || !hasMore) {
      return
    }
    loadPage(pageNo + 1)
  }, [loading, hasMore, pageNo, loadPage])

  /** 重置到初始状态（不触发请求） */
  const reset = useCallback(() => {
    // 重置时废弃所有未完成请求，避免旧结果在 reset 后回写列表。
    requestVersionRef.current += 1
    loadingRef.current = false
    setItems([])
    setPageNo(1)
    setTotalPages(1)
    setLoading(false)
    setInitialLoading(true)
  }, [])

  // 自动补页 + 滚动触底加载
  useAutoLoadWhenNotScrollable({
    containerRef,
    loading,
    hasMore,
    onLoadMore: loadNextPage,
    deps: [items, pageNo, totalPages, ...extraDeps],
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
    reset,
    pageSize,
  }
}
