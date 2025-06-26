<template>
    <div class="apps-container" >
        <el-table :data="runtimeList" border stripe height="100%" style="width: 100%;border-radius: 5px;">
            <el-table-column prop="app" label="包名" width="180" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="version" label="版本号" width="120" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="arch" label="架构" width="80" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="channel" label="渠道" width="80" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="repo" label="来源" width="80" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="pid" label="进程ID" width="100" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="containerId" label="容器ID" width="500" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="Path" min-width="300" label="玲珑目录" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column fixed="right" label="操作" width="100" header-align="center" align="center">
                <template #default="scope">
                    <el-button class="un_install_btn" @click="stopPross(scope.row)">停止</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { parseRef } from "@/util/refParam";
import { compareVersions } from '@/util/checkVersion';
import { useSystemConfigStore } from "@/store/systemConfig";

const systemConfigStore = useSystemConfigStore();

interface RunTime {
    app: string,
    containerId: string,
    pid: string,
    Path: string,
    version: string,
    arch: string,
    channel: string,
    repo: string,
}

let runtimeList = ref<RunTime[]>([]);

// 监听命令事件
const commandResult = (_event: any, res: any) => {
    const code: string = res.code;  // 执行返回状态码
    const command: string = res.param.command; // 执行的命令
    const result: string = res.result;  // 执行命令返回的结果
    // 1.5.0版本以前的命令处理
    if (command == 'll-cli ps') {
        if ('stdout' != code) {
            ElNotification({ title:'提示', message:result, type:'error', duration:500 });
            return;
        }
        const apps: string[] = result.split('\n');
        if (apps.length > 1) {
            for (let index = 1; index < apps.length - 1; index++) {
                const runItem: string = apps[index].trim();
                const items: RegExpMatchArray | null = runItem.match(/'[^']+'|\S+/g);
                if (items) {
                    const runTime = { app: items[0], containerId: items[1], pid: items[2], Path: items[3] }
                    runtimeList.value.push(runTime as RunTime);
                }
            }
        }
        // 刷新表格视图
        runtimeList.value = [...runtimeList.value];
    }
    // 玲珑1.5.0-1版本使用命令
    if (command == 'll-cli --json ps') {
        if ('stdout' != code) {
            ElNotification({ title:'提示', message:result, type:'error', duration:500 });
            return;
        }
        const apps: any[] = JSON.parse(result);
        for (let item of apps) {
            let containerId = item.id;
            let pid = item.pid;
            let pack = item.package;
            let packs = parseRef(pack);
            const runtimeEntity = {
                app: packs.appId,
                containerId: containerId,
                pid: pid,
                version: packs.version,
                arch: packs.arch,
                channel: packs.channel,
                repo: packs.repo ? packs.repo : systemConfigStore.defaultRepoName
            }
            runtimeList.value.push(runtimeEntity as RunTime);
        }
        // 刷新表格视图
        runtimeList.value = [...runtimeList.value];
    }
    // 停止程序命令返回
    if (command.startsWith('ll-cli kill')) {
        if ('stdout' != code) {
            ElNotification({ title: '错误', message: result, type: 'error', duration: 500 });
            return;
        }
        if (result.trim().endsWith('success')) {
            ElNotification({ title: '提示', message: "操作成功", type: 'info', duration: 500 });
            runtimeList.value.splice(0, runtimeList.value.length);
            // 刷新表格视图
            runtimeList.value = [...runtimeList.value];
        }
        // 发送操作命令
        ipcRenderer.send('command', { command: "ll-cli ps" });
    }
}

// 强制退出程序
const killAppResult = async (_event: any, res: any) => {
    const code: string = res.code;  // 执行返回状态码
    const result: string = res.result;  // 执行命令返回的结果
    const linglongBinVersion = systemConfigStore.linglongBinVersion;
    if ('close' == code && '0' == result) {
        if ('0' != result) {
            ElNotification({ title:'错误', message:result, type:'error', duration:500 });
            return;
        }
        ElNotification({ title:'提示', message:"操作成功", type:'info', duration:500 });
        runtimeList.value.splice(0, runtimeList.value.length);
        // 延时1000毫秒进入
        await new Promise(resolve => setTimeout(resolve, 200));
        if (linglongBinVersion && compareVersions(linglongBinVersion,'1.5.0') < 0) {
            ipcRenderer.send('command', { command: "ll-cli ps" });
        } else {
            ipcRenderer.send('command', { command: "ll-cli --json ps" });
        }
    }
}

// 停止服务按钮点击事件
const stopPross = (item: RunTime) => {
    const { containerId } = item;
    const linglongBinVersion = systemConfigStore.linglongBinVersion;
    const llVersion = systemConfigStore.llVersion;
    if (linglongBinVersion && compareVersions(linglongBinVersion,'1.5.0') < 0) {
        ipcRenderer.send('command', { command: `ll-cli kill ${containerId}` });
    } else if (compareVersions(llVersion,'1.7.0') >= 0) {
        // main:org.dde.calendar/5.14.5.1/x86_64
        const { channel, app, version, arch } = item;
        ipcRenderer.send('kill-app', { command: `ll-cli kill ${channel}:${app}/${version}/${arch}` });
    } else {
        ipcRenderer.send('kill-app', { command: `ll-cli kill ${containerId}` });
    }
}

// 页面启动时加载
onMounted(() => {
    // 判断版本号，发送查询运行中程序的命令
    const linglongBinVersion = systemConfigStore.linglongBinVersion;
    if (linglongBinVersion && compareVersions(linglongBinVersion,'1.5.0') < 0) {
        ipcRenderer.send('command', { command: "ll-cli ps" });
    } else {
        ipcRenderer.send('command', { command: "ll-cli --json ps" });
    }
    // 开启页面监听器
    ipcRenderer.on('command-result', commandResult);
    ipcRenderer.on('kill-app-result', killAppResult);
})
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult); // 公共调用方法
    ipcRenderer.removeListener('kill-app-result', killAppResult); // 强制退出程序
})
</script>
<style scoped>
.un_install_btn {
    background-color: red;
    color: white;
    padding: 6px;
    height: 24px;
    width: 50px;
}
</style>