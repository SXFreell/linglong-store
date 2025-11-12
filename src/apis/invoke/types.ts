// 已安装应用信息
export interface InstalledApp {
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
  zhName?: string;
  categoryName?: string;
  loading?: boolean;
  occurrenceNumber?: number;
}

// 安装进度信息
export interface InstallProgress {
  appId: string; // 应用ID
  progress: string; // 原始进度文本
  percentage: number; // 百分比数值 (0-100)
  status: string; // 状态描述
}
