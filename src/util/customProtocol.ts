import { ipcRenderer } from "electron";
import { compareVersions } from "./checkVersion";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useInstallingItemsStore } from "@/store/installingItems";
import { StartLoading } from "./ReflushLoading";

const systemConfigStore = useSystemConfigStore();
const installingItemsStore = useInstallingItemsStore();
// 玲珑组件版本
let llVersion = systemConfigStore.llVersion;

const customProtocolResult = (_event: any, res: any) => {
    ipcRenderer.send('logger', 'info', `接收到了自定义协议的消息：${res}`);
    // 玲珑本地包安装
    if (res.endsWith('.layer') || res.endsWith('.uab')) {
        ipcRenderer.once('linyapss-package-result', (_event: any, res: any) => {
            ipcRenderer.send('logger', 'info', `安装结果：${res}`);
            const {code, params, result} = res;
            if (code === 'close' && result === 0) {
                const temp = params.command.split('/');
                const fileName = temp[temp.length - 1];
                ElNotification({ title: '恭喜', message: `${fileName}本地包安装成功！`, type: 'success', duration: 5000 });
            }
        })
        ipcRenderer.send('linyapss-package', { command: `ll-cli install ${res}` });
    }
    if (res.startsWith('linyaps://')) {
        const temp = res.split('://');
        if (temp.length !== 2) {
            ipcRenderer.send('logger', 'error', `自定义协议格式错误：${res}`);
            return;
        }
        const path = temp[1].split('/');
        if (path[0] === 'install' && path.length > 1) {
            const appId = path[1];
            ipcRenderer.once('linyaps-search-result', (_event: any, res: any) => {
                const { error, stdout, stderr } = res;
                if (stdout) {
                    // 创建一个数组集合
                    let searchVersionItemList: any[] = [];
                    // 版本小于1.9.0时
                    if (compareVersions(llVersion, '1.9.0') < 0) {
                        searchVersionItemList = stdout.trim() ? JSON.parse(stdout.trim()) : [];
                    } else {
                        // 版本大于等于1.9.0时,取stable版本 TODO
                        const items = stdout ? JSON.parse(stdout) : null;
                        searchVersionItemList = Object.keys(items).length > 0 ? items.stable : [];
                    }
                    if (searchVersionItemList.length > 0) {
                        const arr = searchVersionItemList.sort((a, b) => compareVersions(b.version, a.version));
                        const item = arr[0];
                         StartLoading(item); // 启动按钮的加载状态
                        // 新增到加载中列表
                        installingItemsStore.addItem(item); 
                        ElNotification({ title: '提示', message: `正在安装${item.name}(${item.version})`, type: 'info', duration: 500 });
                    }
                }
            });
            let command = `ll-cli --json search ${appId}`;
            if (compareVersions(llVersion, '1.5.0') >= 0 && compareVersions(llVersion, '1.7.7') < 0) {
                command += ` --type=all`;
            } else if (compareVersions(llVersion, '1.7.7') >= 0 && compareVersions(llVersion, '1.8.3') < 0) {
                command += ` --all`;
            } else if (compareVersions(llVersion, '1.8.3') >= 0) {
                command += ` --show-all-version`;
            }
            ipcRenderer.send("linyaps-search", { command });
        }
    }
}

export function setupCustomProtocol() {
    ipcRenderer.on('custom-protocol', customProtocolResult);
}

export function removeCustomProtocol() {
    ipcRenderer.removeListener('custom-protocol', customProtocolResult);
}