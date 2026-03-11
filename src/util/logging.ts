import { attachConsole, debug as logDebug, error as logError, info as logInfo, trace as logTrace, warn as logWarn } from '@tauri-apps/plugin-log'

let isForwardingConsole = false
let loggingInitialized = false

// 初始化插件日志桥接并将浏览器控制台日志转发到 Rust 日志，仅执行一次。
export async function setupLoggingBridge() {
  if (loggingInitialized) {
    return
  }
  loggingInitialized = true

  try {
    await attachConsole()
  } catch (err) {
    console.error('Failed to attach Tauri log console bridge:', err)
  }

  const forwardConsole = (
    fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
    logger: (message: string) => Promise<void>,
  ) => {
    const browserConsole = globalThis.console as Console
    const original = browserConsole[fnName]
    browserConsole[fnName] = (...args: unknown[]) => {
      original(...args)

      // 检查日志内容是否包含插件标记，或当前正在转发日志，以避免反馈循环。
      const containsPluginMarker = args.some(
        (arg) => typeof arg === 'string' && arg.includes('[webview::'),
      )
      if (containsPluginMarker || isForwardingConsole) {
        return
      }

      isForwardingConsole = true
      const message = args
        .map((arg) => {
          if (typeof arg === 'string') {
            return arg
          }
          try {
            return JSON.stringify(arg)
          } catch {
            return String(arg)
          }
        })
        .join(' ')
      logger(message)
        .catch(() => {
          // ignore
        })
        .finally(() => {
          isForwardingConsole = false
        })
    }
  }

  forwardConsole('log', logTrace)
  forwardConsole('debug', logDebug)
  forwardConsole('info', logInfo)
  forwardConsole('warn', logWarn)
  forwardConsole('error', logError)
}
