// 操作类型枚举
export enum OperateType {
  UNINSTALL = 0, // 卸载
  INSTALL = 1, // 安装
  UPDATE = 2, // 更新
  OPEN = 3, // 打开
}

// 操作项配置
export interface OperateItem {
  name: string
  id: OperateType
}

// 应用卡片 Props
export interface ApplicationCardProps {
  /** 操作类型 ID，默认为安装 */
  operateId?: OperateType
  /** 应用信息 */
  options?: API.APP.AppMainDto
  /** 加载状态 */
  loading?: boolean
}

// 导出操作类型常量，方便外部使用
export const OPERATE_ACTIONS = {
  UNINSTALL: OperateType.UNINSTALL,
  INSTALL: OperateType.INSTALL,
  UPDATE: OperateType.UPDATE,
  OPEN: OperateType.OPEN,
} as const
