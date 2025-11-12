declare namespace Hooks {
  namespace Launch {
    /** 应用启动钩子返回的类型 */
    interface UseLaunchReturn {
      /** 应用是否初始化完成 */
      isInit: boolean
      /** 初始化进度（0-100） */
      progress: number
      /** 当前初始化步骤描述 */
      currentStep: string
      /** 初始化错误信息 */
      error: string | null
      /** 重新初始化方法 */
      retry: () => Promise<void>
    }
  }
}
