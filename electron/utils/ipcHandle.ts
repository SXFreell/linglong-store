import { BrowserWindow, ipcMain, shell } from "electron";
import { exec, spawn } from "child_process";
import axios from "axios";
import fs from "fs-extra";
import log, { ipcLog, mainLog } from "../logger";
const path = require('path');

/**
 * 主窗口对象所有涉及的渲染线程和主线程之间的交互
 * @param win 主窗口对象
 */
const IPCHandler = (win: BrowserWindow) => {
    /* ************************************************* ipcMain ********************************************** */
    
    /* **** 启动程序 **** */
    ipcMain.on('run-app', (event, arg) => {
        console.log('Message from run-app:', arg);
        exec(arg, (error, stdout, stderr) => {
            ipcLog.info('error:', error, ' | stdout:', stdout, ' | stderr:', stderr);
        })
    });

    /* ****** 托盘 ***** */
    ipcMain.on('message-from-renderer', (event, arg) => {
        console.log('Message from Renderer:', arg);
        exec(arg, (error, stdout, stderr) => {
            ipcLog.info('error:', error, ' | stdout:', stdout, ' | stderr:', stderr);
            if (stdout) {
                // 发送响应消息回渲染进程
                event.reply('message-from-main', stdout);
            }
        })
    });

    /* ********** 执行自动化安装玲珑环境的脚本文件 ********** */
    ipcMain.on("to_install_linglong", async (_event, url: string) => {
        ipcLog.info('to_install_linglong', url);
        const scriptPath = path.join('/tmp', 'temp_script.sh');
        ipcLog.info('sh文件目录scriptPath：', scriptPath);
        // 1. 发起网络请求获取字符串数据
        await axios.get(url + '/app/findShellString').then(async response => {
            const data = response.data;
            const scriptContent = data.data;
            if (data.code == 200 && scriptContent && scriptContent.length > 0) {
                fs.writeFileSync(scriptPath, scriptContent); // 2. 将内容写入 .sh 文件
                fs.chmodSync(scriptPath, '755'); // 3. 赋予 .sh 文件执行权限
                // 4. 执行 .sh 文件并返回结果(继承父进程的输入输出)
                const result = await runScript(scriptPath);
                ipcLog.info('Script Output:', result);
            } else {
                ipcLog.info('服务暂不可用！', response.data.data);
            }
        }).catch(error => {
            ipcLog.info('error response', error.response);
        }).finally(() => {
            // 可选：执行完毕后删除脚本文件
            fs.unlinkSync(scriptPath);
            // win.reload();  // 重启服务
            win.close();
        });
    })

    function runScript(scriptPath) {
        return new Promise((resolve, reject) => {
            const child = spawn('pkexec', ['bash', scriptPath], { stdio: ['inherit', 'pipe', 'pipe'] });
            let stdoutData = '';
            let stderrData = '';
            // 监听标准输出流
            child.stdout.on('data', (data) => {
                stdoutData += data;
            });
            // 监听标准错误输出流
            child.stderr.on('data', (data) => {
                stderrData += data;
            });
            ipcLog.info('runScript stdoutData', stdoutData);
            ipcLog.info('runScript stderrData', stderrData);
            // 监听子进程关闭事件
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(stdoutData);
                } else {
                    reject(new Error(`Child process exited with code ${code}: ${stderrData}`));
                }
            });
        });
    }

    /* ********** 执行脚本命令 ********** */
    ipcMain.on("command_only_stdout", (_event, code: string) => {
        ipcLog.info('command_only_stdout：', code);
        // 在主进程中执行命令，并将结果返回到渲染进程
        exec(code, (error, stdout, stderr) => {
            ipcLog.info('error:', error, ' | stdout:', stdout, ' | stderr:', stderr);
            win.webContents.send("command_only_stdout_result", { stdout, stderr, error });
        })
    })

    /* ********** 执行脚本命令 ********** */
    ipcMain.on("command", (_event, data) => {
        ipcLog.info('ipc-command：', JSON.stringify(data));
        // 在主进程中执行命令，并将结果返回到渲染进程
        exec(data.command, (error, stdout, stderr) => {
            ipcLog.info('ipc-command：：error:', error, ' | stdout:', stdout, ' | stderr:', stderr);
            if (stderr) {
                win.webContents.send("command-result", { code: 'stderr', param: data, result: stderr });
                return;
            }
            if (error) {
                win.webContents.send("command-result", { code: 'error', param: data, result: error.message });
                return;
            }
            win.webContents.send("command-result", { code: 'stdout', param: data, result: stdout });
        });
    });

    /* ****************** 监听命令动态返回结果 ******************* */
    let isRunning = false;
    let commandQueue = [];
    let currentProcess = null;
    let installingApp = null;

    ipcMain.on('linglong', (_event, params) => {
        ipcLog.info('linglong：', JSON.stringify(params));
        commandQueue.push(params);
        if (!isRunning) {
            executeNextCommand();
        }
    });

    ipcMain.on('stop-linglong', async (_event, params) => {
        if (currentProcess && installingApp.appId === params.appId && installingApp.name == params.name && installingApp.version == params.version) {
            currentProcess.kill();
            executeNextCommand();
        } else {
            const index = commandQueue.findIndex((i) => i.appId === params.appId && i.name === params.name && i.version === params.version);
            if (index !== -1) {
                commandQueue.splice(index, 1);
            }
        }
    });

    function executeNextCommand() {
        if (commandQueue.length === 0) {
            isRunning = false;
            return;
        }

        isRunning = true;
        const params = commandQueue.shift();
        installingApp = params;
        currentProcess = exec(params.command, { encoding: 'utf8' });

        currentProcess.stdout.on('data', (data) => {
            ipcLog.info(`stdout: ${data}`);
            win.webContents.send("linglong-result", { code: 'stdout', params, result: data });
        });

        currentProcess.stderr.on('data', (data) => {
            ipcLog.info(`stderr: ${data}`);
            win.webContents.send("linglong-result", { code: 'stderr', params, result: data });
        });

        currentProcess.on('close', (code) => {
            ipcLog.info(`child process exited with code ${code}`);
            win.webContents.send("linglong-result", { code: 'close', params, result: code });
            isRunning = false;
            currentProcess = null;
            executeNextCommand();
        });

        currentProcess.on('error', (err) => {
            ipcLog.error(`child process encountered an error: ${err}`);
            win.webContents.send("linglong-result", { code: 'error', params, result: err });
            isRunning = false;
            currentProcess = null;
            executeNextCommand();
        });
    }

    /* ****************** 强制退出程序 ******************* */
    ipcMain.on('kill-app', (_event, params) => {
        ipcLog.info('kill-app：', JSON.stringify(params));
        const installProcess = exec(params.command, { encoding: 'utf8' });
        installProcess.stdout.on('data', (data) => {
            ipcLog.info(`stdout: ${data}`);
            win.webContents.send("kill-app-result", { code: 'stdout', param: params, result: data });
        })
        installProcess.stderr.on('data', (data) => {
            ipcLog.info(`stderr: ${data}`);
            win.webContents.send("kill-app-result", { code: 'stderr', param: params, result: data });
        })
        installProcess.on('close', (code) => {
            ipcLog.info(`child process exited with code ${code}`);
            win.webContents.send("kill-app-result", { code: 'close', param: params, result: code });
        })
    })

    ipcMain.on('reflush-version-list', (_event, appId) => {
        ipcLog.info('reflush-version-list：', appId);
        win.webContents.send("reflush-version-list-result", { code: 'close', appId: appId });
    });

    /* ****************** 命令 uname -a ******************* */
    ipcMain.on("uname-a", () => {
        exec("uname -a", (error, stdout, stderr) => {
            ipcLog.info('uname -a >>', { error, stdout, stderr });
            win.webContents.send("uname-a-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 uname -m ******************* */
    ipcMain.on("uname-m", () => {
        exec("uname -m", (error, stdout, stderr) => {
            ipcLog.info('uname -m >>', { error, stdout, stderr });
            win.webContents.send("uname-m-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 dpkg -l | grep linglong ******************* */
    ipcMain.on("dpkg-linyaps", () => {
        exec("dpkg -l | grep linglong", (error, stdout, stderr) => {
            ipcLog.info('dpkg -l | grep linglong >>', { error, stdout, stderr });
            win.webContents.send("dpkg-linyaps-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 apt-cache policy linglong-bin ******************* */
    ipcMain.on("apt-linyaps-bin", () => {
        exec("apt-cache policy linglong-bin", (error, stdout, stderr) => {
            ipcLog.info('apt-cache policy linglong-bin >>', { error, stdout, stderr });
            win.webContents.send("apt-linyaps-bin-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli --help ******************* */
    ipcMain.on("linyaps-exist", () => {
        exec("ll-cli --help", (error, stdout, stderr) => {
            ipcLog.info('ll-cli --help >>', { error, stdout, stderr });
            win.webContents.send("linyaps-exist-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli repo show ******************* */
    ipcMain.on("linyaps-repo", () => {
        exec("ll-cli repo show", (error, stdout, stderr) => {
            ipcLog.info('ll-cli repo show >>', { error, stdout, stderr });
            win.webContents.send("linyaps-repo-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli install xxx ******************* */
    ipcMain.on("linyaps-install", (_event, installApp) => {
        // exec(`ll-cli install ${installApp}`, (error, stdout, stderr) => {
        //     ipcLog.info(`ll-cli install ${installApp} >>`, { error, stdout, stderr });
        //     win.webContents.send(`install-${installApp}-result`, { error, stdout, stderr });
        // });
        // const currentProcess = exec(`ll-cli install ${installApp}`);
        // currentProcess.stdout.on('data', (data) => {
        //     console.log(`标准输出: ${data}`);
        // });
        // currentProcess.stderr.on('data', (data) => {
        //     console.log(`错误输出: ${data}`);
        // });
        // currentProcess.on('error', (data) => {
        //     console.log(`异常输出: ${data}`);
        // });
        // currentProcess.on('close', (data) => {
        //     console.log(`关闭: ${data}`);
        // });
        console.log('installApp', installApp);
        const child = spawn('node');
        // 监听子进程的标准输出
        child.stdout.on('data', (data) => {
            console.log(`子进程输出: ${data}`);

            // 当子进程输出特定结果时，发送下一条指令
            if (data.toString().includes('1')) {
            console.log('收到 1，发送第二次输入');
            child.stdin.write('console.log("第二次交互")\n');
            }

            if (data.toString().includes('第二次交互')) {
            console.log('收到第二次输出，结束交互');
            child.stdin.end(); // 结束输入流，关闭子进程
            }
        });
        // 发送第一次输入
        child.stdin.write('console.log("第一次交互")\n');
    });

    /* ********** 通过网络服务获取客户端ip ********** */
    // 使用 ipify API 获取 IPv4/IPv6 地址
    // const response = await axios.get('https://api64.ipify.org?format=json');
    // const response = await axios.get('http://ip-api.com/json');
    ipcMain.on("fetchClientIP", () => {
        axios.defaults.timeout = 30000;
        axios.get('http://ip-api.com/json').then(response => {
            const code = response.data.code;
            const dataList = response.data;
            const result = { code: code, data: dataList };
            win.webContents.send("fetchClientIP-result", result);
        }).catch(error => {
            const response = error.response;
            const result = { code: response.status, msg: response.data };
            win.webContents.send("fetchClientIP-result", result);
        });
    });

    /* ********** 调用接口获取分类列表 ********** */
    ipcMain.on("ipc-categories", (_event, data) => {
        axios.defaults.timeout = 30000;
        axios.get(`${data.url}/visit/getDisCategoryList`).then(response => {
            const code = response.data.code;
            const dataList = response.data.data;
            const result = { code: code, data: dataList };
            win.webContents.send("categories-result", result);
        }).catch(error => {
            const response = error.response;
            const result = { code: response.status, msg: response.data };
            win.webContents.send("categories-result", result);
        });
    });

    /* ********** 执行网络请求 ********** */
    ipcMain.on("network", (_event, data) => {
        ipcLog.info('ipc-network：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.get(data.url).then(response => {
            const code = response.data.code;
            const dataList = response.data.data.list;
            const result = { code: code, data: dataList, param: data };
            win.webContents.send("network-result", result);
        }).catch(error => {
            const response = error.response;
            const result = { code: response.status, msg: response.data, param: data };
            win.webContents.send("network-result", result);
        });
    });

    /* ********** 执行安装卸载操作时的记录请求 ********** */
    ipcMain.on("visit", (_event, data) => {
        ipcLog.info('ipc-visit：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.post(data.url, JSON.stringify({ ...data })).then(response => {
            ipcLog.info('ipc-visit-success：', JSON.stringify(response.data))
        }).catch(error => {
            ipcLog.info('ipc-visit-error：', error.message)
        });
    });

    /* ********** 执行APP登陆时的记录请求 ********** */
    ipcMain.on("appLogin", (_event, data) => {
        ipcLog.info('ipc-appLogin：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.post(data.url, { ...data }).then(response => {
            ipcLog.info('ipc-appLogin-success：', JSON.stringify(response.data));
        }).catch(error => {
            ipcLog.info('ipc-appLogin-error：', error.message);
        });
    });

    /* ********** 发送意见反馈记录请求 ********** */
    ipcMain.on("suggest", (_event, data) => {
        ipcLog.info('ipc-suggest：', JSON.stringify(data));
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.timeout = 30000;
        axios.post(data.url, { ...data }).then(response => {
            ipcLog.info('ipc-suggest-success：', JSON.stringify(response.data));
        }).catch(error => {
            ipcLog.info('ipc-suggest-error：', error);
        });
    });

    /* ********** 执行渲染进程的操作日志记录请求 ********** */
    ipcMain.on('logger', (_event, level, arg) => {
        if (level === "info") {
            mainLog.info(arg);
        } else if (level === 'warn') {
            mainLog.warn(arg);
        } else if (level === 'error') {
            mainLog.error(arg);
        } else if (level === 'debug') {
            mainLog.debug(arg);
        }
    })
    
    /* ************************************************* ipcMain ********************************************** */
}

export default IPCHandler;
