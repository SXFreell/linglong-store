/**
 * KeepAlive 路由出口组件
 *
 * 对指定的应用列表页面进行缓存，避免从详情页返回时重新加载。
 * 缓存页面通过 display:none 隐藏而非卸载，完整保留 DOM 状态和滚动位置。
 *
 * 缓存白名单：
 *   - / (推荐页)
 *   - /allapps (全部应用)
 *   - /search_list (搜索列表)
 *   - /ranking (排行榜)
 *   - /custom_category/* (自定义分类)
 */

import { Suspense, useMemo, useRef, type ReactNode } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import Loading from '@/components/Loading'
import { KeepAliveVisibilityContext } from '@/hooks/useKeepAliveVisibility'

/** 需要缓存的精确路径 */
const CACHED_PATHS: ReadonlySet<string> = new Set([
  '/',
  '/allapps',
  '/search_list',
  '/ranking',
])

/** 需要缓存的路径前缀 */
const CACHED_PREFIXES: readonly string[] = ['/custom_category/']

/** 最大缓存数量，防止内存泄漏 */
const MAX_CACHE_SIZE = 10

/** 判断路径是否需要缓存 */
function isCacheable(pathname: string): boolean {
  return (
    CACHED_PATHS.has(pathname) ||
    CACHED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  )
}

/**
 * KeepAlive 路由出口
 *
 * 工作原理：
 * 1. 首次访问可缓存路由时，将 useOutlet() 返回的 ReactElement 存入 Map 缓存
 * 2. 导航到其他页面时，缓存页面通过 display:none 隐藏但不卸载（保留状态和滚动位置）
 * 3. 返回缓存页面时，直接切换 display 为 block，无需重新加载
 * 4. 非缓存路由（如 app_detail）正常渲染，导航离开后卸载
 */
const KeepAliveOutlet = () => {
  const location = useLocation()
  const outlet = useOutlet()
  const cacheRef = useRef(new Map<string, ReactNode>())

  const currentPath = location.pathname
  const shouldCache = isCacheable(currentPath)
  const activeRouteContextValue = useMemo(() => ({
    isVisible: true,
    pathname: currentPath,
  }), [currentPath])

  if (shouldCache && outlet && !cacheRef.current.has(currentPath)) {
    // 缓存满时淘汰最久未访问的页面（LRU：Map 尾部是最近访问的）
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      const oldestPath = cacheRef.current.keys().next().value
      if (oldestPath) {
        cacheRef.current.delete(oldestPath)
      }
    }
    cacheRef.current.set(currentPath, outlet)
  } else if (shouldCache && cacheRef.current.has(currentPath)) {
    // LRU 更新：命中缓存时将其移到 Map 尾部（最近访问）
    const cached = cacheRef.current.get(currentPath)
    if (cached) {
      cacheRef.current.delete(currentPath)
      cacheRef.current.set(currentPath, cached)
    }
  }

  return (
    <>
      {/* 渲染所有已缓存的路由页面，通过 display 切换可见性 */}
      {Array.from(cacheRef.current.entries()).map(([path, element]) => (
        <KeepAliveVisibilityContext.Provider
          key={path}
          value={{
            isVisible: currentPath === path,
            pathname: path,
          }}
        >
          <div
            style={{
              display: currentPath === path ? 'block' : 'none',
              height: '100%',
            }}
          >
            <Suspense fallback={<Loading />}>
              {element}
            </Suspense>
          </div>
        </KeepAliveVisibilityContext.Provider>
      ))}

      {/* 非缓存路由正常渲染（导航离开后卸载） */}
      {!shouldCache && (
        <KeepAliveVisibilityContext.Provider value={activeRouteContextValue}>
          <div style={{ height: '100%' }}>
            <Suspense fallback={<Loading />}>
              {outlet}
            </Suspense>
          </div>
        </KeepAliveVisibilityContext.Provider>
      )}
    </>
  )
}

export default KeepAliveOutlet
