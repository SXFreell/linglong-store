import log from "electron-log";
import { app } from "electron";
import { join } from "node:path";
import fs from "fs-extra";

function getTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
}

function manageLogFiles(logPath: string, logId: string) {
    const files = fs.readdirSync(logPath).filter(file => file.startsWith(logId)).sort();
    if (files.length > 6) {
        fs.removeSync(join(logPath, files[0]));
    }
}

/* ******************************** mainLog ******************************** */
export const mainLog = log.create({ logId: 'mainLog' });
const mainPath = app.getPath('logs');
const mainLogFileName = `mainLog_${getTimestamp()}.log`;
manageLogFiles(mainPath, 'mainLog');
// fs.pathExists(mainPath, (err, _exists) => {
//     if (!err) {
//         // 重新生成空文件
//         fs.emptyDir(mainPath);
//     }
// });
mainLog.transports.file.resolvePathFn = () => join(mainPath, mainLogFileName);
// mainLog.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s} {level} {text}';
mainLog.transports.file.level = 'info';
// 达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
mainLog.transports.file.maxSize = 1048576;
mainLog.transports.console.level = 'silly';

/* ******************************** ipcLog ******************************** */
// 在app缓存目录，创建目录
export const ipcLog = log.create({ logId: 'ipcLog' });
const ipcPath = join(app.getPath('logs'), 'print-ipc');
const ipcLogFileName = `ipcLog_${getTimestamp()}.log`;
fs.ensureDirSync(ipcPath);
manageLogFiles(ipcPath, 'ipcLog');
// 检测更新日志目录是否存在
// fs.pathExists(ipcPath, (exists) => {
//     if (!exists) {
//         // 打印日志
//         mainLog.info('ipc调用日志文件缓存路径:' + ipcPath);
//         fs.emptyDir(ipcPath);
//     }
// });
ipcLog.transports.file.resolvePathFn = () => join(ipcPath, ipcLogFileName);
// ipcLog.transports.file.format = '{h}:{i}:{s} {level} {text}';
// ipcLog.transports.console.level = false
// ipcLog.transports.file.resolvePathFn = () => join(ipcPath, 'main.log');
ipcLog.transports.file.level = 'info';
// 达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
ipcLog.transports.file.maxSize = 1048576;
ipcLog.transports.console.level = 'silly';

/* ******************************** updateLog ******************************** */
// 在app缓存目录，创建目录
export const updateLog = log.create({ logId: 'updateLog' });
const updatePendingPath = join(app.getPath('logs'), 'print-updater');
const updateLogFileName = `updateLog_${getTimestamp()}.log`;
fs.ensureDirSync(updatePendingPath);
manageLogFiles(updatePendingPath, 'updateLog');
updateLog.transports.file.resolvePathFn = () => join(updatePendingPath, updateLogFileName);
// 检测更新日志目录是否存在
// fs.pathExists(updatePendingPath, (exists) => {
//     if (!exists) {
//         // 打印日志
//         mainLog.info('升级日志文件缓存路径:' + updatePendingPath);
//         fs.emptyDir(updatePendingPath);
//     }
// });
// updateLog.transports.file.format = '{h}:{i}:{s} {level} {text}';
// updateLog.transports.console.level = false
// updateLog.transports.file.resolvePathFn = () => join(updatePendingPath, 'main.log');
updateLog.transports.file.level = 'info';
// 达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
updateLog.transports.file.maxSize = 1048576;
updateLog.transports.console.level = 'silly';

export default log;