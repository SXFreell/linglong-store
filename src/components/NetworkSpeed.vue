<template>
    <div class="network-info">
        <div class="network-info-title">当前实时网速</div>
        <el-icon><Top /></el-icon>上传速度: {{ uploadSpeed }}<br>
        <el-icon><Bottom /></el-icon>下载速度: {{ downloadSpeed }}
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import sysinfo from 'systeminformation';

// 定义上传和下载速度的响应式变量
const uploadSpeed = ref<string>('0.00 KB/s');
const downloadSpeed = ref<string>('0.00 KB/s');

// 网卡网速检测函数
sysinfo.networkStats().then((data: { [x: string]: any }) => {
    // 假设我们使用的是第一个网络接口
    const iface = Object.keys(data)[0];
    const networkData = data[iface];
    // 设置两个变量来跟踪之前的接收和发送的字节数
    let prevInBytes = networkData.tx_bytes;
    let prevOutBytes = networkData.rx_bytes;
    // 每隔一定时间计算网速
    setInterval(() => {
        sysinfo.networkStats().then((data: { [x: string]: any }) => {
            const networkData = data[iface];
            const inBytes = networkData.tx_bytes;
            const outBytes = networkData.rx_bytes;
            // 计算两次间隔的字节数差异，并转换为KB/s
            const inSpeed = (inBytes - prevInBytes) / 1024;
            const outSpeed = (outBytes - prevOutBytes) / 1024;
            // 当速度超过1024时，则以MB/s为单位
            uploadSpeed.value = inSpeed > 1024 ? (inSpeed / 1024).toFixed(2) + ' MB/s' : inSpeed.toFixed(2) + ' KB/s';
            downloadSpeed.value = outSpeed > 1024 ? (outSpeed / 1024).toFixed(2) + ' MB/s' : outSpeed.toFixed(2) + ' KB/s';
            // 更新之前的字节数
            prevInBytes = inBytes;
            prevOutBytes = outBytes;
        });
    }, 1000); // 每1000毫秒计算一次网速
});
</script>
<style scoped>
.network-info {
    position: fixed;
    bottom: 12px;
    height: 75px;
    width: 140px;
    font-size: 12px;
    text-align: center;
    color: var(--menu-base-font-color);
    background-color: var(--menu-base-color);
    border-radius: 15px;
    margin: 5px;
}
.network-info-title {
    font-size: 14px;
    font-weight: bold;
    margin: 3px;
    color: var(--menu-base-font-color);
}
</style>