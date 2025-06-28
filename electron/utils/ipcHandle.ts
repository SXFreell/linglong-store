import { BrowserWindow, ipcMain } from "electron";
import { ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import stripAnsi from 'strip-ansi';
import os from 'os'
import axios from "axios";
import fs from "fs-extra";
import { ipcLog, mainLog } from "../logger";
import path from "path";

/**
 * 主窗口对象所有涉及的渲染线程和主线程之间的交互
 * @param win 主窗口对象
 */
const IPCHandler = (win: BrowserWindow) => {
    /* ************************************************* ipcMain ********************************************** */
    
    /* ********** 执行自动化安装玲珑环境的脚本文件 ********** */
    ipcMain.on("to_install_linglong", async (_event, url: string) => {
        ipcLog.info('to_install_linglong', url);
        const scriptPath = path.join('/tmp', 'temp_script.sh');
        ipcLog.info('sh文件目录scriptPath：', scriptPath);
        // 1. 发起网络请求获取字符串数据
        await axios.get(`${url}/app/findShellString`).then(async response => {
            const data = response.data;
            const scriptContent = data.data;
            if (data.code == 200 && scriptContent && scriptContent.length > 0) {
                fs.writeFileSync(scriptPath, scriptContent); // 2. 将内容写入 .sh 文件
                fs.chmodSync(scriptPath, '755'); // 3. 赋予 .sh 文件执行权限
                // 4. 执行 .sh 文件并返回结果(继承父进程的输入输出)
                const result = await new Promise((resolve, reject) => {
                    const child = spawn('pkexec', ['bash', scriptPath], { stdio: ['inherit', 'pipe', 'pipe'] });
                    // 监听标准输出流
                    let stdoutData = '';
                    child.stdout.on('data', (data) => stdoutData += data);
                    ipcLog.info('runScript stdoutData', stdoutData);
                    // 监听标准错误输出流
                    let stderrData = '';
                    child.stderr.on('data', (data) => stderrData += data);
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
                ipcLog.info('Script Output:', result);
            } else {
                ipcLog.info('服务暂不可用！', response.data.data);
            }
        }).catch(error => ipcLog.info('error response', error.response))
        .finally(() => {
            fs.unlinkSync(scriptPath); // 可选：执行完毕后删除脚本文件
            win.close(); // win.reload();  // 重启服务
        });
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

    /* ****************** 命令 ll-cli list ******************* */
    ipcMain.on("linyaps-list", (event, params) => {
        exec(params.command, (error, stdout, stderr) => {
            ipcLog.info(`${params.command} >> `, { error, stdout, stderr });
            win.webContents.send("linyaps-list-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli search ******************* */
    ipcMain.on("linyaps-search", (event, params) => {
        exec(params.command, (error, stdout, stderr) => {
            ipcLog.info(`${params.command} >> `, { error, stdout, stderr });
            win.webContents.send("linyaps-search-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli update ******************* */
    ipcMain.on("linyaps-update", (event, params) => {
        exec(params.command, (error, stdout, stderr) => {
            ipcLog.info(`${params.command} >> `, { error, stdout, stderr });
            win.webContents.send("linyaps-update-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli install xxx ******************* */
    ipcMain.on("linyaps-install", (_event, params) => {
        const { password, appId, version } = params;
        let currentProcess: ChildProcessWithoutNullStreams;
        if (!password) {
            ipcLog.error('linyaps-install：密码为空, 使用非 sudo 安装应用');
            currentProcess = spawn("ll-cli", ["install", `${appId}/${version}`]);
        } else {
            ipcLog.info('linyaps-install：使用 sudo 安装应用');
            currentProcess = spawn("sudo", ["-S", "ll-cli", "install", `${appId}/${version}`]);
            // 自动输入密码到 sudo 的标准输入
            currentProcess.stdin.write(password + "\n");
        }
        // 捕获标准输出
        currentProcess.stdout.on("data", (data) => {
            ipcLog.info(`linyaps-install stdout: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            win.webContents.send(`linyaps-install-result`, { code: 'stdout', params, result });
        });
        // 捕获标准错误
        currentProcess.stderr.on("data", (data) => {
            ipcLog.error(`linyaps-install stderr: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            win.webContents.send(`linyaps-install-result`, { code: 'stderr', params, result });
        });
        // 捕获错误事件
        currentProcess.on('error', (data) => {
            ipcLog.error(`linyaps-install error: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            win.webContents.send(`linyaps-install-result`, { code: 'error', params, result });
        });
        // 子进程退出
        currentProcess.on("close", (code) => {
            ipcLog.info(`linyaps-install child process exited with code ${code}`);
            win.webContents.send(`linyaps-install-result`, { code: 'close', params, result: code });
        });
    });

    /* ****************** 命令 ll-cli uninstall xxx ******************* */
    ipcMain.on("linyaps-uninstall", (_event, params) => {
        const { password, appId, version } = params;
        if (!appId || !version) {
            ipcLog.error('linyaps-uninstall：应用ID或版本号为空，无法卸载应用');
            win.webContents.send("linyaps-uninstall-result", { error: '应用ID或版本号不能为空' });
            return;
        }
        if (!password) {
            ipcLog.error('linyaps-uninstall：密码为空, 使用非 sudo 卸载应用');
        }
        exec(`ll-cli uninstall ${appId}/${version}`, (error, stdout, stderr) => {
            ipcLog.info(`linyaps-uninstall >> `, { error, stdout, stderr });
            win.webContents.send("linyaps-uninstall-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli prune ******************* */
    ipcMain.on("linyaps-prune", () => {
        exec('ll-cli prune', (error, stdout, stderr) => {
            ipcLog.info(`linyaps-prune >> `, { error, stdout, stderr });
            win.webContents.send("linyaps-prune-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli run xxx ******************* */
    ipcMain.on('linyaps-run', (_event, params) => {
        const { appId, version } = params;
        let currentProcess = spawn("ll-cli", ["run", `${appId}/${version}`]);
        // 捕获标准输出
        currentProcess.stdout.on("data", (data) => {
            ipcLog.info(`linyaps-run stdout: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            win.webContents.send(`linyaps-run-result`, { code: 'stdout', params, result });
        });
        // 捕获标准错误
        currentProcess.stderr.on("data", (data) => {
            ipcLog.error(`linyaps-run stderr: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            win.webContents.send(`linyaps-run-result`, { code: 'stderr', params, result });
        });
        // 捕获错误事件
        currentProcess.on('error', (data) => {
            ipcLog.error(`linyaps-run error: ${data}`);
            // 使用 stripAnsi 去除 ANSI 转义序列
            let result = stripAnsi(data.toString());
            win.webContents.send(`linyaps-run-result`, { code: 'error', params, result });
        });
        // 子进程退出
        currentProcess.on("close", (code) => {
            ipcLog.info(`linyaps-run child process exited with code ${code}`);
            win.webContents.send(`linyaps-run-result`, { code: 'close', params, result: code });
        });
    });

    /* ****************** 命令 ll-cli --json ps ******************* */
    ipcMain.on("linyaps-ps", () => {
        exec('ll-cli --json ps', (error, stdout, stderr) => {
            ipcLog.info(`linyaps-ps >> `, { error, stdout, stderr });
            win.webContents.send("linyaps-ps-result", { error, stdout, stderr });
        });
    });

    /* ****************** 命令 ll-cli kill ******************* */
    ipcMain.on("linyaps-kill", (event, params) => {
        exec(params.command, (error, stdout, stderr) => {
            ipcLog.info(`linyaps-kill >> `, { error, stdout, stderr });
            win.webContents.send("linyaps-kill-result", { error, stdout, stderr });
        });
    });

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
    });

    /* ****************** 打开终端并执行命令 ******************* */
    ipcMain.on('open-terminal', (_event, params) => {
        const platform = os.platform()
        if (platform === 'win32') { // Windows - 打开 cmd
            spawn('cmd.exe', { stdio: 'inherit', shell: true })
        } else if (platform === 'darwin') { // macOS - 打开 Terminal
            spawn('open', ['-a', 'Terminal'], { stdio: 'inherit' })
        } else if (platform === 'linux') { // Linux - 根据常用终端之一打开
            const terminals = ['deepin-terminal', 'gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm']
            const terminal = terminals.find(term => {
                try {
                    spawn(term, ['--version']) // 简单验证可用性
                    return true
                } catch {
                    return false
                }
            })
            if (terminal) {
                spawn(terminal, params.code, { stdio: 'inherit' })
            } else {
                console.error('No supported terminal found.')
            }
        }
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
