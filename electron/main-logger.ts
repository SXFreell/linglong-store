import fs from "fs-extra";
import log from "electron-log";
import { app } from "electron";
import { join } from "node:path";
import { statSync } from "node:fs";

/**
 * 将数字转换为两位数的字符串，不足两位时前面补零
 * @param num 要转换的数字
 * @returns 转换后的两位数字符串
 */
function padZero(num: number): string {
    return String(num).padStart(2, '0');
}

/**
 * 获取当前时间的时间戳字符串，格式为 YYYY-MM-DD_HH-mm-ss
 * @returns 格式化后的时间戳字符串
 */
function getTimestamp() {
    const now = new Date();
    const [year, month, day, hour, minute, second] = [
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
    ];
    return `${year}-${padZero(month)}-${padZero(day)}_${padZero(hour)}-${padZero(minute)}-${padZero(second)}`;
}

/**
 * 管理日志文件，保留最新的 5 个日志文件
 * @param logPath 日志文件所在目录
 */
function manageLogFiles(logPath: string) {
    fs.ensureDirSync(logPath); // 确保目录存在
    // 获取指定目录下的文件
    const files = fs.readdirSync(logPath);

    // 获取每个文件的修改时间，并按修改时间降序排序
    const filesWithStats = files.map(file => {
        const filePath = join(logPath, file);
        const stats = statSync(filePath);
        return { file, mtime: stats.mtime };
    }).sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // 如果文件数量超过 5 个，删除最旧的文件
    while (filesWithStats.length > 5) {
        const oldestFile = filesWithStats.pop();
        if (oldestFile) {
            const filePath = join(logPath, oldestFile.file);
            fs.removeSync(filePath);
        }
    }
}

/* ******************************** mainLog ******************************** */
export const mainLog = log.create({ logId: 'mainLog' });
const mainPath = join(app.getPath('logs'), 'print-main');
const mainLogFileName = getTimestamp() + '.log';
manageLogFiles(mainPath);
mainLog.transports.file.resolvePathFn = () => join(mainPath, mainLogFileName);
mainLog.transports.file.level = 'info';
mainLog.transports.file.maxSize = 1048576;
mainLog.transports.console.level = 'silly';

/* ******************************** ipcLog ******************************** */
export const ipcLog = log.create({ logId: 'ipcLog' });
const ipcPath = join(app.getPath('logs'), 'print-ipc');
const ipcLogFileName = getTimestamp() + '.log';
manageLogFiles(ipcPath);
ipcLog.transports.file.resolvePathFn = () => join(ipcPath, ipcLogFileName);
ipcLog.transports.file.level = 'info';
ipcLog.transports.file.maxSize = 1048576;
ipcLog.transports.console.level = 'silly';

/* ******************************** updateLog ******************************** */
export const updateLog = log.create({ logId: 'updateLog' });
const updatePath = join(app.getPath('logs'), 'print-update');
const updateLogFileName = getTimestamp() + '.log';
manageLogFiles(updatePath);
updateLog.transports.file.resolvePathFn = () => join(updatePath, updateLogFileName);
updateLog.transports.file.level = 'info';
updateLog.transports.file.maxSize = 1048576;
updateLog.transports.console.level = 'silly';

export default log;