<template>
  <div style="height: calc(100vh - 88px);">
    <li><a class="title">基础设置</a></li>
    <div style="margin-left: 30px;">
      <el-checkbox v-model="autoCheckUpdate" size="large"
        @change="systemConfigStore.changeAutoCheckUpdate(autoCheckUpdate)">
        启动App自动检测商店版本
      </el-checkbox>
    </div>
    <hr>
    <li><a class="title">卸载程序</a></li>
    <div style="margin-left: 30px;">
      <el-checkbox v-model="isShowBaseService" size="large" @change="checkedBaseService(isShowBaseService)">
        显示基础运行服务
      </el-checkbox>
      <el-checkbox v-model="isMergeApp" size="large" @change="systemConfigStore.changeIsShowMergeApp(isMergeApp)">
        同appId程序合并
      </el-checkbox>
      <el-button v-if="compareVersions(systemConfigStore.llVersion, '1.7.0') >= 0" type="success" @click="pruneLinyaps"
        style="margin-left: 50px;height: 24px;">清除废弃基础服务</el-button>
    </div>
    <hr>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { compareVersions } from '@/util/checkVersion';
import { useSystemConfigStore } from "@/store/systemConfig";

const systemConfigStore = useSystemConfigStore();

// 默认玲珑仓库对象
let defaultRepo = ref('');
// 自动检测更新
let autoCheckUpdate = ref(true);
// 是否显示基础运行服务
let isShowBaseService = ref(false);
// 卸载程序页面同程序合并
let isMergeApp = ref(true);

// 是否显示基础运行服务的变更事件
const checkedBaseService = (checkStatus: boolean) => {
  // 修改系统配置文件，记录状态
  systemConfigStore.changeIsShowBaseService(checkStatus);
  // 检测版本，执行不同的命令
  let getInstalledItemsCommand = "ll-cli --json list";
  if (compareVersions(systemConfigStore.llVersion, "1.3.99") < 0) {
    getInstalledItemsCommand = "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'"; // 1.4.0版本之前的命令
  }
  ipcRenderer.send('command', { command: getInstalledItemsCommand, type: "refreshInstalledApps" });
}

// 清除无用组件
const pruneLinyaps = () => {
  ipcRenderer.send('command', { command: "ll-cli prune" });
  ipcRenderer.once('command-result', (_event, res) => {
    if ('stdout' == res.code && res.param.command == 'll-cli prune') {
      ElNotification({ title: '操作成功!', type: 'success', duration: 3000, message: res.result });
    }
  })
}

// 页面启动时加载
onMounted(() => {
  defaultRepo.value = systemConfigStore.defaultRepoName;  // 默认仓库
  autoCheckUpdate.value = systemConfigStore.autoCheckUpdate;  // 是否自动检测更新
  isShowBaseService.value = systemConfigStore.isShowBaseService;  // 是否显示基础运行服务
  isMergeApp.value = systemConfigStore.isShowMergeApp;  // 卸载程序页面同程序合并
})
</script>

<style scoped>
.title {
  font-weight: bold;
  font-size: 16px;
  color: #D3D3D3;
  text-decoration: inherit;
}

@media (prefers-color-scheme: light) {
  .title {
    color: #000;
  }
}
</style>