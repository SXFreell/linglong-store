<!-- Floating.vue -->
<template>
  <div @click="openBusinessPage" class="floating-widget">
    <!-- 悬浮框内容 -->
     111111
    <img src="../../assets/logo.png" alt="logo" id="pet-image">
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron';

function openBusinessPage() {
  ipcRenderer.send('open-business-window');
}
</script>

<style scoped>
/* .floating-widget {
  width: 100%;
  height: 100%; */
  /* background-color: rgba(0, 0, 0, 0.5); */
  /* cursor: pointer;
} */

.floating-widget {
  position: absolute;
  bottom: 0;
  left: 0;
  overflow: hidden;
}

.floating-widget:hover {
  cursor: pointer;
}

#pet-image {
  width: 100%;
  height: auto;
  user-select: none;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-20px);
  }

  100% {
    transform: translateY(0);
  }
}
</style>