<template>
    <el-dialog v-model="props.visible" width="500" center destroy-on-close :close-on-click-modal="false"
        :show-close="false" :close-on-press-escape="false">
        <template #header>
            <span style="user-select: none;color: black;font-weight: bold;">警告</span>
        </template>
        <span style="user-select: none;">
            <strong style="text-align: center; display: block; color: red">检测当前系统中不存在玲珑组件环境</strong>
            <div style="text-align: center; margin-top: 10px">
                <p>请先安装玲珑组件环境，方可使用本玲珑商店。</p>
                <p>目前自动安装支持Deepin 23/UOS 1070/OpenEuler 24.03/Ubuntu 22.04/Ubuntu 24.04/Debian 12/openKylin 2.0rc</p>
            </div>
        </span>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="info" @click="exitBtnClick">退出商店</el-button>
                <el-button type="info" @click="autoInstallBtnClick">自动安装</el-button>
                <el-button type="primary" @click="manualInstallBtnClick">手动安装</el-button>
            </div>
        </template>
    </el-dialog>
</template>
<script setup lang="ts">
import { ElMessageBox } from 'element-plus';
import { ipcRenderer } from 'electron';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})
// 退出按钮点击事件
const exitBtnClick = () => {
    ElMessageBox.confirm('确定退出吗？', '提示', {
        confirmButtonText: '确认', cancelButtonText: '取消', type: 'info', center: true,
    }).then(() => ipcRenderer.send('app-quit'));
}
// 手动安装点击事件
const manualInstallBtnClick = () => {
    window.open('https://www.linglong.space/guide/start/install.html');
    ipcRenderer.send('app-quit');
}
// 自动安装点击事件
const autoInstallBtnClick = () => {
    // 执行脚本文件
    ipcRenderer.send('to_install_linglong', import.meta.env.VITE_SERVER_URL); 
}
</script>