/**
 * 安装服务工具层
 * 提供安装错误判断等辅助功能
 */

/**
 * 检查是否需要 force 安装
 * @param errorMessage - 错误消息
 */
export const isForceRequired = (errorMessage: string): boolean => {
  if (!errorMessage) {
    return false
  }
  const normalized = errorMessage.replace(/\s+/g, ' ')
  return normalized.includes('ll-cli install') && normalized.includes('--force')
}
