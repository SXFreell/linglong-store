<!-- Floating.vue -->
<template>
    <div @click="openBusinessPage" class="floating-widget">
      <!-- 悬浮框内容 -->
       1111
      <img src="../public/logo.png" alt="logo" id="pet-image">
    </div>
  </template>
  
  <script setup>
  import { ipcRenderer } from 'electron';
  
  function openBusinessPage() {
    ipcRenderer.send('open-business-window');
  }
  </script>
  
  <style>
  .floating-widget {
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    cursor: pointer;
  }
  </style>
  