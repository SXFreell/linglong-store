<template>
    <div class="no-data-container">
        <div style="width: 180px;height: 300px">
            <img class="image" :src="defaultImage" alt="Image" />
        </div>
        <h1>暂无数据</h1>
    </div>
</template>
<script lang="ts" setup>
import defaultImage from '@/assets/logo.svg';
</script>