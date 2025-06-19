<template>
  <div ref="terminalRef" class="terminal-output">
    <div v-for="(line, index) in parsedLines" :key="index" v-html="line"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted, nextTick } from 'vue'
import AnsiToHtml from 'ansi-to-html'

const ansiConverter = new AnsiToHtml()
const terminalRef = ref<HTMLElement>()

// 模拟实时日志输入（可以替换为 WebSocket 接收）
const rawLogs = ref([
  '\x1B[32m✓ Build complete\x1B[0m',
  '\x1B[31m✖ Error: Cannot connect to server\x1B[0m'
])

// 用于显示的已解析行
const parsedLines = ref<string[]>([])

onMounted(() => {
  // 模拟日志追加
  setInterval(() => {
    const timestamp = new Date().toLocaleTimeString()
    const randomLine = Math.random() > 0.5
      ? `\x1B[32m✓ Success at ${timestamp}\x1B[0m`
      : `\x1B[31m✖ Failure at ${timestamp}\x1B[0m`
    rawLogs.value.push(randomLine)
  }, 2000)
})

// 转换 ANSI 为 HTML
watchEffect(() => {
  parsedLines.value = rawLogs.value.map(log => ansiConverter.toHtml(log))
  // 滚动到底部
  nextTick(() => {
    if (!terminalRef.value) return
    terminalRef.value.scrollTop = terminalRef.value.scrollHeight
  })
})
</script>

<style scoped>
.terminal-output {
  background: #1e1e1e;
  color: white;
  font-family: monospace;
  padding: 10px;
  height: 300px;
  overflow-y: auto;
  border-radius: 4px;
  border: 1px solid #333;
  white-space: pre-wrap;
}
</style>
