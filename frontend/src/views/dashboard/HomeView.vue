<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPictureTagCategory, listPicturesByPage } from '@/api/picture';
import type { PictureVO } from '@/types/picture';
import { formatDateTime } from '@/utils/format';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const loadingMore = ref(false);
const pictures = ref<PictureVO[]>([]);
const categoryOptions = ref<string[]>([]);
const tagOptions = ref<string[]>([]);
const activeCategory = ref('全部');
const activeTag = ref('');
const loadMoreRef = ref<HTMLDivElement | null>(null);

const searchForm = reactive({
  keyword: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const categoryTabs = computed(() => ['全部', ...categoryOptions.value]);
const hasMore = computed(() => pictures.value.length < pagination.total);
const showLoadMore = computed(() => pictures.value.length > 0 && hasMore.value);

let observer: IntersectionObserver | null = null;

function syncKeywordFromRoute() {
  searchForm.keyword = typeof route.query.q === 'string' ? route.query.q : '';
}

function buildQuery() {
  return {
    current: pagination.current,
    pageSize: pagination.pageSize,
    searchText: searchForm.keyword || undefined,
    name: searchForm.keyword || undefined,
    category: activeCategory.value === '全部' ? undefined : activeCategory.value,
    tags: activeTag.value ? [activeTag.value] : undefined,
    sortField: 'createTime',
    sortOrder: 'descend',
  };
}

function mergePictures(list: PictureVO[]) {
  const map = new Map<string, PictureVO>();
  [...pictures.value, ...list].forEach((item) => {
    map.set(String(item.id), item);
  });
  pictures.value = Array.from(map.values());
}

async function loadMeta() {
  const result = await getPictureTagCategory();
  categoryOptions.value = result.categoryList || [];
  tagOptions.value = result.tagList || [];
}

async function fetchPictures(options: { reset?: boolean } = {}) {
  const { reset = false } = options;
  if (reset) {
    loading.value = true;
  } else {
    loadingMore.value = true;
  }

  try {
    const result = await listPicturesByPage(buildQuery());
    pagination.total = Number(result.total || 0);
    const records = result.records || [];

    if (reset) {
      pictures.value = records;
    } else {
      mergePictures(records);
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

async function reloadPictures() {
  pagination.current = 1;
  pictures.value = [];
  await fetchPictures({ reset: true });
  await nextTick();
  setupObserver();
}

async function loadMorePictures() {
  if (!hasMore.value || loading.value || loadingMore.value) {
    return;
  }
  pagination.current += 1;
  try {
    await fetchPictures();
  } catch (error) {
    pagination.current -= 1;
    throw error;
  }
}

function disconnectObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function setupObserver() {
  disconnectObserver();
  if (!loadMoreRef.value) {
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      const firstEntry = entries[0];
      if (firstEntry?.isIntersecting) {
        loadMorePictures();
      }
    },
    {
      rootMargin: '180px 0px',
      threshold: 0,
    },
  );
  observer.observe(loadMoreRef.value);
}

async function handleSearch() {
  const nextKeyword = searchForm.keyword.trim();
  const currentKeyword = typeof route.query.q === 'string' ? route.query.q : '';
  if (nextKeyword === currentKeyword) {
    await reloadPictures();
    return;
  }
  await router.replace({
    path: '/dashboard',
    query: nextKeyword ? { q: nextKeyword } : {},
  });
}

async function handleCategoryChange(category: string) {
  activeCategory.value = category;
  await reloadPictures();
}

async function handleTagChange(tag: string) {
  activeTag.value = activeTag.value === tag ? '' : tag;
  await reloadPictures();
}

watch(
  () => route.query.q,
  async () => {
    syncKeywordFromRoute();
    await reloadPictures();
  },
);

watch(loadMoreRef, async () => {
  await nextTick();
  setupObserver();
});

onMounted(async () => {
  syncKeywordFromRoute();
  await loadMeta();
  await reloadPictures();
});

onBeforeUnmount(() => {
  disconnectObserver();
});
</script>

<template>
  <div class="app-page">
    <div class="surface-panel">
      <div class="surface-panel-body" style="padding-top: 16px; padding-bottom: 0">
        <div class="hero-search">
          <div class="hero-search-box">
            <el-input
              v-model="searchForm.keyword"
              placeholder="从海量图片中搜索"
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>

        <div style="padding-top: 12px">
          <div class="filter-tabs">
            <button
              v-for="category in categoryTabs"
              :key="category"
              type="button"
              class="filter-tab"
              :class="{ active: activeCategory === category }"
              @click="handleCategoryChange(category)"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <hr class="soft-divider" style="margin-top: 0" />

        <div class="tag-line" style="padding: 20px 0 24px">
          <span style="font-size: 18px; font-weight: 700">标签：</span>
          <button
            v-for="tag in tagOptions"
            :key="tag"
            type="button"
            class="tag-chip"
            :class="{ active: activeTag === tag }"
            @click="handleTagChange(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>

    <div class="gallery-grid" v-loading="loading">
      <div
        v-for="picture in pictures"
        :key="picture.id"
        class="gallery-card clickable"
        @click="router.push(`/pictures/${picture.id}`)"
      >
        <img :src="picture.thumbnailUrl || picture.url" class="gallery-cover" />
        <div class="gallery-body">
          <h3 class="gallery-title">{{ picture.name || `图片 ${picture.id}` }}</h3>
          <p class="gallery-desc">
            {{ picture.category || '未分类' }}
            <span v-if="picture.tags?.length"> · {{ picture.tags.join(' / ') }}</span>
          </p>
          <div class="inline-tags" style="margin-top: 14px">
            <el-tag type="success" round>默认</el-tag>
            <span class="muted-text" style="font-size: 12px">{{ formatDateTime(picture.createTime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!pictures.length && !loading" class="surface-panel empty-placeholder">
      没有找到符合条件的图片，试试切换分类、标签或搜索词。
    </div>

    <div v-if="pictures.length" class="surface-panel home-gallery-footer">
      <div class="home-gallery-footer-inner">
        <div class="muted-text">已展示 {{ pictures.length }} / {{ pagination.total }} 张图片</div>
        <el-button v-if="showLoadMore" type="primary" plain :loading="loadingMore" @click="loadMorePictures">
          加载更多
        </el-button>
        <span v-else class="muted-text">已经到底了</span>
      </div>
    </div>

    <div ref="loadMoreRef" class="load-more-anchor" />
  </div>
</template>

<style scoped>
.home-gallery-footer {
  padding: 16px 22px;
}

.home-gallery-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.load-more-anchor {
  height: 1px;
}
</style>