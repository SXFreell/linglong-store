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
