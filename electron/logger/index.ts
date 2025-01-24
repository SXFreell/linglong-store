import log from "electron-log";
import { app } from "electron";
import { join } from "node:path";
import fs from "fs-extra";

const logsPath = app.getPath('logs');

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
const mainPath = join(logsPath, 'main');
const mainLogFileName = `mainLog_${getTimestamp()}.log`;
fs.ensureDirSync(mainPath);
manageLogFiles(mainPath, 'mainLog');
mainLog.transports.file.resolvePathFn = () => join(mainPath, mainLogFileName);
mainLog.transports.file.level = 'info';
mainLog.transports.file.maxSize = 1048576;
mainLog.transports.console.level = 'silly';

/* ******************************** ipcLog ******************************** */
export const ipcLog = log.create({ logId: 'ipcLog' });
const ipcPath = join(logsPath, 'print-ipc');
const ipcLogFileName = `ipcLog_${getTimestamp()}.log`;
fs.ensureDirSync(ipcPath);
manageLogFiles(ipcPath, 'ipcLog');
ipcLog.transports.file.resolvePathFn = () => join(ipcPath, ipcLogFileName);
ipcLog.transports.file.level = 'info';
ipcLog.transports.file.maxSize = 1048576;
ipcLog.transports.console.level = 'silly';

/* ******************************** updateLog ******************************** */
export const updateLog = log.create({ logId: 'updateLog' });
const updatePendingPath = join(logsPath, 'print-updater');
const updateLogFileName = `updateLog_${getTimestamp()}.log`;
fs.ensureDirSync(updatePendingPath);
manageLogFiles(updatePendingPath, 'updateLog');
updateLog.transports.file.resolvePathFn = () => join(updatePendingPath, updateLogFileName);
updateLog.transports.file.level = 'info';
updateLog.transports.file.maxSize = 1048576;
updateLog.transports.console.level = 'silly';

export default log;