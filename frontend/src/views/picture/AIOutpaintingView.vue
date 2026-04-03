<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AIOutpaintingPanel from '@/components/picture/AIOutpaintingPanel.vue';

const route = useRoute();
const pictureId = computed(() =>
  typeof route.query.pictureId === 'string' ? route.query.pictureId : undefined,
);
</script>

<template>
  <div class="page-shell">
    <section class="page-header">
      <div>
        <h1 class="page-title">AI 扩图</h1>
        <p class="page-subtitle">
          可以单独输入图片 ID 创建扩图任务，也可以从图片详情页带着 pictureId 直接进入当前页面。
        </p>
      </div>
      <el-tag v-if="pictureId" size="large" type="primary">当前图片 ID：{{ pictureId }}</el-tag>
    </section>

    <AIOutpaintingPanel :picture-id="pictureId" />
  </div>
</template>