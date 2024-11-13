// network.ts
import si from 'systeminformation'; // 确保安装了 systeminformation 库
import { ref } from 'vue';

export function useNetworkSpeed() {
    // 定义上传和下载速度的响应式变量
    const uploadSpeed = ref<string>('0 KB/s');
    const downloadSpeed = ref<string>('0 KB/s');

    // 网卡网速检测函数
    function initNetStatus() {
        si.networkStats().then((data: { [x: string]: any }) => {
            // 假设我们使用的是第一个网络接口
            const iface = Object.keys(data)[0];
            const networkData = data[iface];
            
            // 设置两个变量来跟踪之前的接收和发送的字节数
            let prevInBytes = networkData.tx_bytes;
            let prevOutBytes = networkData.rx_bytes;

            // 每隔一定时间计算网速
            setInterval(() => {
                si.networkStats().then((data: { [x: string]: any }) => {
                    const networkData = data[iface];
                    const inBytes = networkData.tx_bytes;
                    const outBytes = networkData.rx_bytes;

                    // 计算两次间隔的字节数差异
                    const inDiff = inBytes - prevInBytes;
                    const outDiff = outBytes - prevOutBytes;

                    // 更新之前的字节数
                    prevInBytes = inBytes;
                    prevOutBytes = outBytes;

                    // 转换为KB/s
                    const inSpeed = inDiff / 1024;
                    const outSpeed = outDiff / 1024;

                    // 当速度超过1024时，则以MB/s为单位
                    uploadSpeed.value = inSpeed > 1024
                        ? (inSpeed / 1024).toFixed(2) + ' MB/s'
                        : inSpeed.toFixed(2) + ' KB/s';

                    downloadSpeed.value = outSpeed > 1024
                        ? (outSpeed / 1024).toFixed(2) + ' MB/s'
                        : outSpeed.toFixed(2) + ' KB/s';
                });
            }, 1000); // 每1000毫秒计算一次网速
        });
    }

    // 启动网速检测
    initNetStatus();

    // 返回响应式变量
    return { uploadSpeed, downloadSpeed };
}
