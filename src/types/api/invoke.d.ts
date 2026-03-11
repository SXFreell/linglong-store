declare namespace API {
  namespace INVOKE {
    /**
     * IPC DTO — 仅包含 Rust 端 `InstalledApp` 传输字段
     * 不要在此混入前端增强字段（zhName / categoryName 等由 API 注入）
     */
    interface InstalledApp {
      appId: string;
      name: string;
      version: string;
      arch: string;
      channel: string;
      description: string;
      icon: string;
      kind?: string;
      module: string;
      runtime: string;
      size: string;
      repoName: string;
    }

    /**
     * 经 API 接口丰富后的已安装应用（Store 层使用）
     * zhName / categoryName 来自后端 getAppDetails 接口
     */
    interface EnrichedInstalledApp extends InstalledApp {
      zhName?: string;
      categoryName?: string;
    }

    /**
     * 安装进度事件类型
     * - "progress": 进度更新事件
     * - "error": 错误事件
     * - "message": 消息事件
     */
    type InstallEventType = 'progress' | 'error' | 'message';

    /**
     * 安装进度事件（统一的 install-progress 事件结构）
     * 根据 eventType 区分不同类型的事件
     */
    interface InstallProgress {
      /** 应用ID */
      appId: string;
      /** 事件类型: "progress" | "error" | "message" */
      eventType: InstallEventType;
      /** 原始消息文本 */
      message: string;
      /** 百分比数值 (0-100)，仅 progress 事件有效 */
      percentage: number;
      /** 状态描述（用户友好的状态文本） */
      status: string;
      /** 错误码，仅 error 事件有效 */
      code?: number;
      /** 错误详情（后端原始消息），用于折叠展示 */
      errorDetail?: string;
    }

    // 应用更新信息
    interface UpdateInfo {
      appId: string;
      name: string;
      version: string; // 新版本
      currentVersion: string; // 当前版本
      description: string;
      icon: string;
      arch: string;
      categoryName?: string;
    }

    // 搜索结果项
    interface SearchResultItem {
      appId?: string;
      name: string;
      version: string;
      arch?: string | string[];
      description?: string;
      module?: string;
      icon?: string;
    }

    interface LinglongRepo {
      name: string;
      url: string;
      alias?: string;
      priority?: string;
    }

    interface LinglongEnvCheckResult {
      ok: boolean;
      reason?: string;
      arch?: string;
      osVersion?: string;
      glibcVersion?: string;
      kernelInfo?: string;
      detailMsg?: string;
      llVersion?: string;
      llBinVersion?: string;
      repoName?: string;
      repos?: LinglongRepo[];
      isContainer?: boolean;
    }

    interface InstallLinglongResult {
      stdout: string;
      stderr: string;
    }

    /**
     * 正在运行的玲珑应用信息
     * id 等于 containerId，作为列表稳定唯一键
     */
    interface RunningApp {
      /** 稳定唯一键（等于 containerId） */
      id: string;
      /** 应用 ID，如 org.deepin.calculator */
      name: string;
      version: string;
      arch: string;
      channel: string;
      source: string;
      pid: string;
      containerId: string;
    }
  }
}
