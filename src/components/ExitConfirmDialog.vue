<template>
  <el-dialog v-model="props.visible" :title="`关闭确认`" width="400px" center append-to-body :close-on-click-modal="false"
    :close-on-press-escape="false" :before-close="cancel">
    <div class="dialog-content">
      <p>您想要最小化到托盘还是退出程序？</p>
      <el-checkbox class="remember-checkbox" v-model="systemConfigStore.rememberCloseDialog"
      @change="rememberChange">记住本次操作</el-checkbox>
    </div>
    <template #footer>
      <el-button @click="minimize">最小化到托盘</el-button>
      <el-button type="primary" @click="quit">退出商店</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ipcRenderer } from 'electron';
import { useSystemConfigStore } from '@/store/systemConfig';

const systemConfigStore = useSystemConfigStore();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible']);

const rememberChange = (val: boolean) => {
  systemConfigStore.changeRememberCloseDialog(val);
}

const quit = () => {
  systemConfigStore.changeRememberLastAction('quit');
  emit('update:visible', false);
  ipcRenderer.send('close-action', 'quit');
}

const minimize = () => {
  systemConfigStore.changeRememberLastAction('minimize');
  emit('update:visible', false);
  ipcRenderer.send('close-action', 'minimize');
}

const cancel = () => {
  systemConfigStore.changeRememberCloseDialog(false);
  emit('update:visible', false);
}

</script>
<style lang="css" scoped>
.dialog-content {
  text-align: center;
}

.remember-checkbox {
  margin-top: 10px;
}
</style>
