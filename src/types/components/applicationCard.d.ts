declare namespace COMP {
  namespace APPCARD {
    // 操作项配置
    interface OperateItem {
      name: string;
      id: number;
    }

    // 应用卡片 Props
    interface ApplicationCardProps {
      /** 操作类型 ID，默认为安装 */
      operateId?: number;
      /** 应用信息 */
      appInfo?: API.APP.AppMainDto;
      /** 应用卡片类型，可选值有：default, recommend */
      type?: string;
      /** 是否已安装 */
      isInstalled?: boolean;
      /** 是否有更新 */
      hasUpdate?: boolean;
      /** 是否正在安装或排队 */
      isInstalling?: boolean;
      /** 安装/更新动作 */
      onInstall?: (appInfo: API.APP.AppMainDto) => Promise<unknown> | unknown;
      /** 卸载动作 */
      onUninstall?: (appInfo: API.APP.AppMainDto) => Promise<unknown> | unknown;
    }
  }
}
