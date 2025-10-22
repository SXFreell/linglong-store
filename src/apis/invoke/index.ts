import { invoke } from '@tauri-apps/api/core'
import type { InstalledApp } from './types'

export const getRunningLinglongApps = async() => {
  return await invoke('get_running_linglong_apps')
}

export const killLinglongApp = async(appName: string) => {
  return await invoke('kill_linglong_app', { appName })
}

export const getInstalledLinglongApps = async(): Promise<InstalledApp[]> => {
  return await invoke('get_installed_linglong_apps')
}

export const getAllInstalledLinglongApps = async(): Promise<
  InstalledApp[]
> => {
  return await invoke('get_all_installed_linglong_apps')
}

export const uninstallApp = async(
  appId: string,
  version: string,
): Promise<string> => {
  return await invoke('uninstall_app', { appId, version })
}

export const searchVersions = async(
  appId: string,
): Promise<InstalledApp[]> => {
  return await invoke('search_versions', { appId })
}

export const runApp = async(
  appId: string,
  version: string,
): Promise<string> => {
  return await invoke('run_app', { appId, version })
}
