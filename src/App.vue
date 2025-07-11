<template>
  <router-view></router-view>
  <ExitConfirmDialog :visible="exitConfirmDialogVisible" @update:visible="exitConfirmDialogVisible = $event" />
</template>
<script setup lang="ts">
import ExitConfirmDialog from '@/components/ExitConfirmDialog.vue';
import { ipcRenderer } from 'electron';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useSystemConfigStore } from '@/store/systemConfig';

const systemConfigStore = useSystemConfigStore();

// 退出确认弹窗
const exitConfirmDialogVisible = ref(false);

onMounted(() => {
  // 监听关闭事件
  ipcRenderer.on('show-close-confirm', () => {
    if (systemConfigStore.rememberCloseDialog) {
      if (systemConfigStore.rememberLastAction === 'quit') {
        ipcRenderer.send('close-action', 'quit');
      } else {
        ipcRenderer.send('close-action', 'minimize');
      }
    } else {
      exitConfirmDialogVisible.value = true;
    }
  })
})

// 销毁前执行
onBeforeUnmount(() => {
    ipcRenderer.removeListener('show-close-confirm', () => { })
});
</script>

<style scoped></style>
