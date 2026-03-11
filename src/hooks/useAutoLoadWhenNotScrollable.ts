import { useCallback, useEffect, type RefObject } from 'react'
import { useKeepAliveVisibility } from './useKeepAliveVisibility'

interface UseAutoLoadWhenNotScrollableOptions {
  containerRef: RefObject<HTMLDivElement>
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  threshold?: number
  deps?: unknown[]
}

export const useAutoLoadWhenNotScrollable = ({
  containerRef,
  loading,
  hasMore,
  onLoadMore,
  threshold = 100,
  deps = [],
}: UseAutoLoadWhenNotScrollableOptions) => {
  const { isVisible } = useKeepAliveVisibility()

  const tryLoadWhenNotScrollable = useCallback(() => {
    const listElement = containerRef.current
    if (!isVisible || !listElement || loading || !hasMore) {
      return
    }

    if (listElement.clientHeight <= 0) {
      return
    }

    const notScrollable = listElement.scrollHeight <= listElement.clientHeight + 1
    if (notScrollable) {
      onLoadMore()
    }
  }, [containerRef, hasMore, isVisible, loading, onLoadMore])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    const handleScroll = () => {
      if (loading || !hasMore) {
        return
      }

      const listElement = containerRef.current
      if (!listElement) {
        return
      }

      const { scrollTop, scrollHeight, clientHeight } = listElement
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        onLoadMore()
      }
    }

    const listElement = containerRef.current
    if (!listElement) {
      return
    }

    listElement.addEventListener('scroll', handleScroll)

    return () => {
      listElement.removeEventListener('scroll', handleScroll)
    }
  }, [containerRef, hasMore, isVisible, loading, onLoadMore, threshold])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    const rafId = window.requestAnimationFrame(() => {
      tryLoadWhenNotScrollable()
    })

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [isVisible, tryLoadWhenNotScrollable, ...deps])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    const listElement = containerRef.current
    if (!listElement || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      tryLoadWhenNotScrollable()
    })

    observer.observe(listElement)

    return () => {
      observer.disconnect()
    }
  }, [containerRef, isVisible, tryLoadWhenNotScrollable])
}
