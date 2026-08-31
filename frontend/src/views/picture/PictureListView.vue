<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  deletePicture,
  editPicture,
  getPictureTagCategory,
  listPicturesByPage,
  searchPictureByColor,
} from '@/api/picture';
import PictureBatchUploadDialog from '@/components/picture/PictureBatchUploadDialog.vue';
import PictureEditDialog from '@/components/picture/PictureEditDialog.vue';
import PictureUploadDialog from '@/components/picture/PictureUploadDialog.vue';
import SpaceSelect from '@/components/space/SpaceSelect.vue';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import type { PictureVO } from '@/types/picture';
import type { SpaceVO } from '@/types/space';
import {
  formatDateTime,
  formatFileSize,
  formatReviewStatus,
  reviewStatusTagType,
} from '@/utils/format';

const router = useRouter();
const loading = ref(false);
const uploadVisible = ref(false);
const batchUploadVisible = ref(false);
const editVisible = ref(false);
const editLoading = ref(false);
const selectedPicture = ref<PictureVO | null>(null);
const tagOptions = ref<string[]>([]);
const categoryOptions = ref<string[]>([]);
const spaces = ref<SpaceVO[]>([]);
const colorSearchMode = ref(false);
const colorSearchResults = ref<PictureVO[]>([]);

const pagination = reactive({
  current: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
});

const filters = reactive({
  keyword: '',
  category: '',
  tags: [] as string[],
  reviewStatus: undefined as number | undefined,
  spaceId: '' as string | number | '',
  colorValue: '#409EFF',
});

const tableData = ref<PictureVO[]>([]);

const spaceMap = computed(() => {
  const map = new Map<string, SpaceVO>();
  spaces.value.forEach((item) => {
    map.set(String(item.id), item);
  });
  return map;
});

const currentRows = computed(() => {
  if (!colorSearchMode.value) {
    return tableData.value;
  }
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return colorSearchResults.value.slice(start, end);
});

const totalText = computed(() => {
  if (colorSearchMode.value) {
    return `主色搜索结果 ${colorSearchResults.value.length} 张`;
  }
  return `共 ${pagination.total} 张图片`;
});

async function loadMeta() {
  const result = await getPictureTagCategory();
  tagOptions.value = result.tagList || [];
  categoryOptions.value = result.categoryList || [];
}

async function loadPictures() {
  loading.value = true;
  try {
    const result = await listPicturesByPage({
      current: pagination.current,
      pageSize: pagination.pageSize,
      searchText: filters.keyword || undefined,
      name: filters.keyword || undefined,
      category: filters.category || undefined,
      tags: filters.tags.length ? [...filters.tags] : undefined,
      reviewStatus: filters.reviewStatus,
      spaceId: filters.spaceId || undefined,
      sortField: 'updateTime',
      sortOrder: 'descend',
    });
    tableData.value = result.records;
    pagination.total = result.total;
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  colorSearchMode.value = false;
  colorSearchResults.value = [];
  pagination.current = 1;
  await loadPictures();
}

async function handleColorSearch() {
  if (!filters.spaceId) {
    ElMessage.warning('按主色搜索仅支持空间内图片，请先选择一个空间');
    return;
  }
  loading.value = true;
  try {
    const result = await searchPictureByColor({
      spaceId: filters.spaceId,
      picColor: filters.colorValue,
    });
    colorSearchResults.value = result;
    colorSearchMode.value = true;
    pagination.current = 1;
    pagination.total = result.length;
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  filters.keyword = '';
  filters.category = '';
  filters.tags = [];
  filters.reviewStatus = undefined;
  filters.spaceId = '';
  filters.colorValue = '#409EFF';
  colorSearchMode.value = false;
  colorSearchResults.value = [];
  pagination.current = 1;
  void loadPictures();
}

function handlePageChange() {
  if (colorSearchMode.value) {
    return;
  }
  void loadPictures();
}

function handleSizeChange() {
  pagination.current = 1;
  if (colorSearchMode.value) {
    return;
  }
  void loadPictures();
}

function openEdit(row: PictureVO) {
  selectedPicture.value = row;
  editVisible.value = true;
}

async function handleEditSubmit(payload: {
  id: string | number;
  name?: string;
  introduction?: string;
  category?: string;
  tags?: string[];
}) {
  editLoading.value = true;
  try {
    await editPicture(payload);
    ElMessage.success('图片信息已更新');
    editVisible.value = false;
    if (colorSearchMode.value) {
      await handleColorSearch();
    } else {
      await loadPictures();
    }
  } finally {
    editLoading.value = false;
  }
}

async function handleDelete(row: PictureVO) {
  await ElMessageBox.confirm(`确定删除图片“${row.name || row.id}”吗？`, '删除确认', {
    type: 'warning',
  });
  await deletePicture(row.id);
  ElMessage.success('图片已删除');
  if (colorSearchMode.value) {
    await handleColorSearch();
  } else {
    await loadPictures();
  }
}

function handleSpaceLoaded(items: SpaceVO[]) {
  spaces.value = items;
}

async function handleBatchSuccess() {
  colorSearchMode.value = false;
  colorSearchResults.value = [];
  pagination.current = 1;
  await loadPictures();
}

onMounted(async () => {
  await Promise.all([loadMeta(), loadPictures()]);
});
</script>

<template>
  <div class="app-page picture-manage-page">
    <div class="page-header picture-page-header">
      <div class="picture-page-heading">
        <h1 class="page-title">图片管理</h1>
        <p class="page-subtitle">统一管理图片、空间归属、审核信息，并支持在空间内按主色快速筛图。</p>
      </div>
      <div class="page-actions picture-page-actions">
        <el-button type="primary" @click="uploadVisible = true">+ 创建图片</el-button>
        <el-button plain @click="batchUploadVisible = true">+ 批量创建图片</el-button>
      </div>
    </div>

    <div class="surface-panel">
      <div class="surface-panel-body filter-panel-body">
        <el-form label-width="0">
          <el-row :gutter="16">
            <el-col :xl="5" :lg="6" :md="12" :sm="12" :xs="24">
              <el-form-item>
                <div class="filter-field">
                  <span class="filter-label">关键词</span>
                  <el-input v-model="filters.keyword" clearable placeholder="从名称和简介搜索" />
                </div>
              </el-form-item>
            </el-col>
            <el-col :xl="4" :lg="5" :md="12" :sm="12" :xs="24">
              <el-form-item>
                <div class="filter-field">
                  <span class="filter-label">类型</span>
                  <el-select v-model="filters.category" clearable filterable placeholder="请选择类型">
                    <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
                  </el-select>
                </div>
              </el-form-item>
            </el-col>
            <el-col :xl="4" :lg="5" :md="12" :sm="12" :xs="24">
              <el-form-item>
                <div class="filter-field">
                  <span class="filter-label">标签</span>
                  <el-select
                    v-model="filters.tags"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="请选择标签"
                  >
                    <el-option v-for="item in tagOptions" :key="item" :label="item" :value="item" />
                  </el-select>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xl="4" :lg="5" :md="12" :sm="12" :xs="24">
              <el-form-item>
                <div class="filter-field">
                  <span class="filter-label">审核状态</span>
                  <el-select v-model="filters.reviewStatus" clearable placeholder="请选择审核状态">
                    <el-option label="待审核" :value="0" />
                    <el-option label="审核通过" :value="1" />
                    <el-option label="审核拒绝" :value="2" />
                  </el-select>
                </div>
              </el-form-item>
            </el-col>
            <el-col :xl="5" :lg="6" :md="12" :sm="12" :xs="24">
              <el-form-item>
                <div class="filter-field">
                  <span class="filter-label">所属空间</span>
                  <SpaceSelect
                    v-model="filters.spaceId"
                    include-public
                    placeholder="选择公共图库或空间"
                    @loaded="handleSpaceLoaded"
                  />
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16" class="color-filter-row">
            <el-col :xl="6" :lg="7" :md="12" :sm="12" :xs="24">
              <el-form-item>
                <div class="filter-field">
                  <span class="filter-label">按主色搜索</span>
                  <div class="color-input-row">
                    <el-color-picker v-model="filters.colorValue" />
                    <el-input v-model="filters.colorValue" placeholder="#409EFF" />
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :xl="5" :lg="6" :md="12" :sm="12" :xs="24">
              <el-form-item>
                <div class="toolbar-actions filter-actions">
                  <el-button type="primary" :loading="loading" @click="handleSearch">基础搜索</el-button>
                  <el-button :loading="loading" @click="handleColorSearch">按主色搜索</el-button>
                  <el-button @click="handleReset">重置</el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <div class="surface-panel">
      <div class="surface-panel-body list-panel-body">
        <div class="list-toolbar">
          <div>
            <div class="section-title">{{ colorSearchMode ? '主色匹配结果' : '图片列表' }}</div>
            <div class="section-subtitle">{{ totalText }}</div>
          </div>
        </div>

        <div class="table-shell" v-loading="loading">
          <el-table :data="currentRows" stripe height="620">
            <el-table-column label="ID" width="170">
              <template #default="scope">
                <span>{{ scope.row.id }}</span>
              </template>
            </el-table-column>
            <el-table-column label="图片" width="180">
              <template #default="scope">
                <img :src="scope.row.thumbnailUrl || scope.row.url" class="table-thumb" />
              </template>
            </el-table-column>
            <el-table-column label="名称" min-width="190">
              <template #default="scope">
                <div class="info-stack">
                  <el-link type="primary" @click="router.push(`/pictures/${scope.row.id}`)">
                    {{ scope.row.name || `图片 ${scope.row.id}` }}
                  </el-link>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="简介" min-width="160">
              <template #default="scope">
                <span>{{ scope.row.introduction || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="类型" min-width="100">
              <template #default="scope">
                <span>{{ scope.row.category || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="标签" min-width="160">
              <template #default="scope">
                <div class="inline-tags">
                  <el-tag v-for="tag in scope.row.tags || []" :key="tag" round>{{ tag }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="图片信息" min-width="190">
              <template #default="scope">
                <div class="info-stack">
                  <span>格式：{{ scope.row.picFormat || '--' }}</span>
                  <span>宽度：{{ scope.row.picWidth || '--' }}</span>
                  <span>高度：{{ scope.row.picHeight || '--' }}</span>
                  <span>宽高比：{{ scope.row.picScale || '--' }}</span>
                  <span>大小：{{ formatFileSize(scope.row.picSize) }}</span>
                  <span v-if="scope.row.picColor">主色：{{ scope.row.picColor }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="归属信息" min-width="190">
              <template #default="scope">
                <div class="info-stack">
                  <span>用户：{{ scope.row.userId || '--' }}</span>
                  <span class="muted-text">
                    {{ scope.row.spaceId ? spaceMap.get(String(scope.row.spaceId))?.spaceName || `空间 ${scope.row.spaceId}` : '公共图库' }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="审核信息" min-width="210">
              <template #default="scope">
                <div class="info-stack">
                  <span>
                    审核状态：
                    <el-tag :type="reviewStatusTagType(scope.row.reviewStatus)">
                      {{ formatReviewStatus(scope.row.reviewStatus) }}
                    </el-tag>
                  </span>
                  <span>审核信息：{{ scope.row.reviewMessage || '--' }}</span>
                  <span>审核人：{{ scope.row.reviewerId || '--' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" min-width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="编辑时间" min-width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.editTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="120">
              <template #default="scope">
                <div class="info-stack action-stack">
                  <el-button link type="primary" @click="openEdit(scope.row)">编辑</el-button>
                  <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            layout="total, prev, pager, next, sizes"
            :page-sizes="[10, 20, 30, 50]"
            :total="pagination.total"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <PictureUploadDialog
      v-model="uploadVisible"
      :category-options="categoryOptions"
      :tag-options="tagOptions"
      @success="loadPictures"
    />

    <PictureBatchUploadDialog
      v-model="batchUploadVisible"
      @success="handleBatchSuccess"
    />

    <PictureEditDialog
      v-model="editVisible"
      :picture="selectedPicture"
      :category-options="categoryOptions"
      :tag-options="tagOptions"
      :loading="editLoading"
      @submit="handleEditSubmit"
    />
  </div>
</template>

<style scoped>
.picture-manage-page {
  display: grid;
  gap: 18px;
  max-width: 1360px;
  margin: 0 auto;
}

.picture-page-header {
  justify-content: flex-start;
  align-items: end;
  gap: 18px;
}

.picture-page-heading {
  min-width: 0;
}

.picture-page-actions {
  margin-left: 8px;
  flex-wrap: nowrap;
}

.filter-panel-body {
  padding-bottom: 16px;
}

.filter-field {
  display: grid;
  gap: 6px;
  width: 100%;
}

.filter-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
}

.color-filter-row {
  margin-top: 0;
}

.color-input-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  max-width: 420px;
}

.filter-actions {
  height: 100%;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  padding-top: 34px;
  margin-left: -72px;
}

.filter-actions :deep(.el-button) {
  min-height: 40px;
}

.list-panel-body {
  padding-top: 16px;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.table-shell {
  border-radius: 18px;
  overflow: hidden;
}

.table-thumb {
  width: 108px;
  height: 108px;
  border-radius: 14px;
  object-fit: cover;
  display: block;
  background: #eef2f7;
}

.action-stack {
  gap: 8px;
}

.pagination-wrap {
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .picture-manage-page {
    max-width: none;
  }

  .picture-page-header {
    justify-content: space-between;
    align-items: center;
  }

  .picture-page-actions {
    margin-left: 0;
    flex-wrap: wrap;
  }

  .filter-actions {
    justify-content: flex-start;
  }
}
</style>
