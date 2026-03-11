/**
 * 轻量级 debounce / throttle 工具函数
 * 避免引入外部依赖，满足项目内高频事件节流需求
 */

/**
 * 防抖：在最后一次调用后延迟 delay ms 执行
 * @param fn 要防抖的函数
 * @param delay 延迟毫秒数
 * @returns 带 cancel() 方法的防抖函数
 */
export function debounce<T extends(...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): T & { cancel: () => void } {
  let timerId: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timerId !== null) {
      clearTimeout(timerId)
    }
    timerId = setTimeout(() => {
      timerId = null
      fn(...args)
    }, delay)
  }

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  return debounced as T & { cancel: () => void }
}

/**
 * 节流：在 interval ms 内最多执行一次，尾部调用保证最新参数执行
 * @param fn 要节流的函数
 * @param interval 节流间隔毫秒数
 * @returns 带 cancel() 方法的节流函数
 */
export function throttle<T extends(...args: Parameters<T>) => void>(
  fn: T,
  interval: number,
): T & { cancel: () => void } {
  let lastCallTime = 0
  let trailingTimerId: ReturnType<typeof setTimeout> | null = null

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = interval - (now - lastCallTime)

    // 清除前一个尾部定时器
    if (trailingTimerId !== null) {
      clearTimeout(trailingTimerId)
      trailingTimerId = null
    }

    if (remaining <= 0) {
      // 已超过节流间隔，立即执行
      lastCallTime = now
      fn(...args)
    } else {
      // 未到间隔，设置尾部调用确保最后一次触发不丢失
      trailingTimerId = setTimeout(() => {
        lastCallTime = Date.now()
        trailingTimerId = null
        fn(...args)
      }, remaining)
    }
  }

  throttled.cancel = () => {
    if (trailingTimerId !== null) {
      clearTimeout(trailingTimerId)
      trailingTimerId = null
    }
    lastCallTime = 0
  }

  return throttled as T & { cancel: () => void }
}
