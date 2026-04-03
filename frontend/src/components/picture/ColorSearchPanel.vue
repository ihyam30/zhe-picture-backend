<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { searchPictureByColor } from '@/api/picture';
import SpaceSelect from '@/components/space/SpaceSelect.vue';
import type { Id } from '@/types/common';
import type { PictureVO } from '@/types/picture';

const router = useRouter();
const loading = ref(false);
const spaceId = ref<Id | ''>('');
const colorValue = ref('#409EFF');
const results = ref<PictureVO[]>([]);

async function handleSearch() {
  if (!spaceId.value) {
    ElMessage.warning('请先选择一个私有空间');
    return;
  }
  loading.value = true;
  try {
    results.value = await searchPictureByColor({
      spaceId: spaceId.value,
      picColor: colorValue.value,
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="color-search-header">
        <div>
          <div class="section-title">按主色搜索</div>
          <div class="section-subtitle">选择空间与颜色后，快速筛出匹配度最高的图片。</div>
        </div>
        <el-button type="primary" :loading="loading" @click="handleSearch">开始匹配</el-button>
      </div>
    </template>

    <div class="color-search-form">
      <div class="color-search-field">
        <span class="color-search-label">目标空间</span>
        <SpaceSelect v-model="spaceId" :include-public="false" placeholder="选择要搜索的空间" />
      </div>
      <div class="color-search-field">
        <span class="color-search-label">颜色值</span>
        <div class="color-input-row">
          <el-color-picker v-model="colorValue" />
          <el-input v-model="colorValue" style="max-width: 180px" placeholder="#409EFF" />
        </div>
      </div>
    </div>

    <div v-if="results.length" class="result-grid">
      <div
        v-for="item in results"
        :key="item.id"
        class="result-card clickable"
        @click="router.push(`/pictures/${item.id}`)"
      >
        <img :src="item.thumbnailUrl || item.url" class="result-image" />
        <div class="result-name">{{ item.name || `图片 ${item.id}` }}</div>
        <div class="muted-text">{{ item.picColor || colorValue }}</div>
      </div>
    </div>
    <div v-else class="empty-placeholder">选择颜色与空间后，这里会展示最接近的图片结果。</div>
  </el-card>
</template>

<style scoped>
.color-search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.color-search-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.color-search-field {
  display: grid;
  gap: 10px;
}

.color-search-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
}

.color-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.result-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}

.result-card {
  padding: 12px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.result-image {
  width: 100%;
  height: 120px;
  border-radius: 14px;
  object-fit: cover;
  background: #eef2f7;
}

.result-name {
  margin-top: 10px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .color-search-form {
    grid-template-columns: 1fr;
  }
}
</style>