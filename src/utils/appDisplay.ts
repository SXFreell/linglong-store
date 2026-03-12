type AppDisplayInfo = {
  zhName?: string
  name?: string
  appId?: string
  description?: string
}

/**
 * 统一封装应用展示名称的选择规则。
 * UI 层只关心“当前要展示什么名字”，而不是散落在各处重复写回退逻辑。
 */
export function getAppDisplayName(
  appInfo: AppDisplayInfo | undefined,
  locale = 'zh-CN',
  fallback = '',
): string {
  if (!appInfo) {
    return fallback
  }

  if (locale.startsWith('en')) {
    return appInfo.name || appInfo.zhName || appInfo.appId || fallback
  }

  return appInfo.zhName || appInfo.name || appInfo.appId || fallback
}

/**
 * 描述字段目前只有一套服务端数据，这里先统一做兜底，
 * 后续如果远端按语言返回 description，可继续在这里扩展。
 */
export function getAppDescription(appInfo: AppDisplayInfo | undefined, fallback = ''): string {
  return appInfo?.description || fallback
}
