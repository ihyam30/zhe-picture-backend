<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addSpace, deleteSpace, editSpace, listSpaceLevels, listSpaceVOByPage } from '@/api/space';
import { listMyTeamSpaces } from '@/api/spaceUser';
import SpaceFormDialog from '@/components/space/SpaceFormDialog.vue';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { useAuthStore } from '@/store/auth';
import type { SpaceLevel, SpaceVO } from '@/types/space';
import type { SpaceUserVO } from '@/types/space-user';
import { formatDateTime, formatFileSize, formatPercent, formatSpaceLevel, formatSpaceType } from '@/utils/format';

const authStore = useAuthStore();
const loading = ref(false);
const dialogVisible = ref(false);
const dialogLoading = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentSpace = ref<SpaceVO | null>(null);
const spaceLevels = ref<SpaceLevel[]>([]);
const ownedSpaces = ref<SpaceVO[]>([]);
const teamSpaces = ref<SpaceUserVO[]>([]);
const currentView = ref<'public' | 'mine' | 'team'>('mine');

const filters = reactive({
  keyword: '',
});

const pagination = reactive({
  current: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
});

const visibleOwnedSpaces = computed(() =>
  ownedSpaces.value.filter((space) =>
    !filters.keyword || space.spaceName?.includes(filters.keyword),
  ),
);

const visibleTeamSpaces = computed(() =>
  teamSpaces.value.filter((item) =>
    !filters.keyword || item.space?.spaceName?.includes(filters.keyword),
  ),
);

const statItems = computed(() => {
  const totalStorage = ownedSpaces.value.reduce((sum, item) => sum + (item.totalSize || 0), 0);
  return [
    { label: '我的空间数', value: ownedSpaces.value.length },
    { label: '团队空间数', value: teamSpaces.value.length },
    { label: '已用容量', value: formatFileSize(totalStorage) },
    {
      label: '空间等级种类',
      value: new Set(ownedSpaces.value.map((item) => item.spaceLevel)).size || 0,
    },
  ];
});

async function loadSpaces() {
  if (!authStore.user?.id) {
    return;
  }
  loading.value = true;
  try {
    const [ownedResult, teamResult] = await Promise.all([
      listSpaceVOByPage({
        current: pagination.current,
        pageSize: Math.max(pagination.pageSize, 20),
        userId: authStore.user.id,
        sortField: 'updateTime',
        sortOrder: 'descend',
      }),
      listMyTeamSpaces(),
    ]);
    ownedSpaces.value = ownedResult.records;
    pagination.total = ownedResult.total;
    teamSpaces.value = teamResult;
  } finally {
    loading.value = false;
  }
}

async function loadLevels() {
  spaceLevels.value = await listSpaceLevels();
}

function openCreate() {
  dialogMode.value = 'create';
  currentSpace.value = null;
  dialogVisible.value = true;
}

function openEdit(row: SpaceVO) {
  dialogMode.value = 'edit';
  currentSpace.value = row;
  dialogVisible.value = true;
}

async function handleSubmit(payload: { spaceName: string; spaceLevel?: number; spaceType?: number } | { id: string | number; spaceName: string }) {
  dialogLoading.value = true;
  try {
    if (dialogMode.value === 'create') {
      await addSpace(payload as { spaceName: string; spaceLevel?: number; spaceType?: number });
      ElMessage.success('空间创建成功');
    } else {
      await editSpace(payload as { id: string | number; spaceName: string });
      ElMessage.success('空间信息已更新');
    }
    dialogVisible.value = false;
    await loadSpaces();
  } finally {
    dialogLoading.value = false;
  }
}

async function handleDelete(row: SpaceVO) {
  await ElMessageBox.confirm(`确定删除空间“${row.spaceName}”吗？`, '删除确认', {
    type: 'warning',
  });
  await deleteSpace(row.id);
  ElMessage.success('空间已删除');
  await loadSpaces();
}

function usagePercent(space?: SpaceVO) {
  if (!space?.maxSize) {
    return 0;
  }
  return Math.min(100, ((space.totalSize || 0) / space.maxSize) * 100);
}

onMounted(async () => {
  await Promise.all([loadLevels(), loadSpaces()]);
});
</script>

<template>
  <div class="app-page workspace-shell">
    <aside class="workspace-sidebar">
      <button type="button" class="workspace-nav-item" :class="{ active: currentView === 'public' }" @click="currentView = 'public'">
        <span class="workspace-nav-icon">⌂</span>
        <span>公共空间</span>
      </button>
      <button type="button" class="workspace-nav-item" :class="{ active: currentView === 'mine' }" @click="currentView = 'mine'">
        <span class="workspace-nav-icon">👤</span>
        <span>我的空间</span>
      </button>
      <button type="button" class="workspace-nav-item" :class="{ active: currentView === 'team' }" @click="currentView = 'team'">
        <span class="workspace-nav-icon">🏢</span>
        <span>团队空间</span>
      </button>
      <button type="button" class="workspace-nav-item" @click="openCreate">
        <span class="workspace-nav-icon">＋</span>
        <span>创建团队空间</span>
      </button>
    </aside>

    <section class="workspace-content">
      <div class="stats-row">
        <div v-for="item in statItems" :key="item.label" class="surface-panel stat-card">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value">{{ item.value }}</div>
        </div>
      </div>

      <div class="surface-panel">
        <div class="surface-panel-header">
          <div>
            <h2 class="section-title">
              {{ currentView === 'public' ? '公共空间入口' : currentView === 'mine' ? `${authStore.user?.userName || '我'}的个人空间` : '我加入的团队空间' }}
            </h2>
            <p class="section-subtitle">参考图里的空间工作台风格已经同步到这里，支持切换不同空间视图。</p>
          </div>
          <div class="page-actions">
            <el-input v-model="filters.keyword" placeholder="搜索空间名称" clearable style="width: 280px" />
            <el-button type="primary" @click="openCreate">+ 创建空间</el-button>
          </div>
        </div>
        <div class="surface-panel-body">
          <template v-if="currentView === 'public'">
            <div class="surface-panel" style="box-shadow: none">
              <div class="surface-panel-body" style="text-align: center">
                <h3 style="margin: 0; font-size: 24px">公共空间用于浏览公开图片资源</h3>
                <p class="page-subtitle" style="margin-top: 12px">你可以回到首页查看公共图库，也可以继续在这里创建自己的个人或团队空间。</p>
                <div class="page-actions" style="justify-content: center; margin-top: 18px">
                  <router-link to="/dashboard"><el-button type="primary">进入公共图库</el-button></router-link>
                  <el-button @click="openCreate">创建我的空间</el-button>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="currentView === 'mine'">
            <div v-if="visibleOwnedSpaces.length" class="gallery-grid" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
              <div v-for="space in visibleOwnedSpaces" :key="space.id" class="gallery-card">
                <div style="aspect-ratio: 1 / 0.6; background: linear-gradient(135deg, #dbe7ff, #f3f7ff 55%, #c7d7ff); display: flex; align-items: center; justify-content: center; font-size: 42px; font-weight: 700; color: #2f6df6">
                  {{ (space.spaceName || 'S').slice(0, 1) }}
                </div>
                <div class="gallery-body">
                  <h3 class="gallery-title">{{ space.spaceName }}</h3>
                  <p class="gallery-desc">{{ formatSpaceType(space.spaceType) }} · {{ formatSpaceLevel(space.spaceLevel) }}</p>
                  <div class="info-stack" style="margin-top: 14px">
                    <span>已用容量：{{ formatFileSize(space.totalSize) }} / {{ formatFileSize(space.maxSize) }}</span>
                    <span>图片数量：{{ space.totalCount || 0 }} / {{ space.maxCount || 0 }}</span>
                    <span>更新时间：{{ formatDateTime(space.updateTime) }}</span>
                  </div>
                  <el-progress :percentage="usagePercent(space)" style="margin-top: 14px" />
                  <div class="page-actions" style="margin-top: 16px">
                    <el-button @click="openEdit(space)">编辑</el-button>
                    <el-button type="danger" plain @click="handleDelete(space)">删除</el-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-placeholder">当前没有匹配的个人空间。</div>
          </template>

          <template v-else>
            <div v-if="visibleTeamSpaces.length" class="gallery-grid" style="grid-template-columns: repeat(3, minmax(0, 1fr))">
              <div v-for="item in visibleTeamSpaces" :key="item.id" class="gallery-card">
                <div style="aspect-ratio: 1 / 0.6; background: linear-gradient(135deg, #eff5ff, #ffffff 55%, #d8e5ff); display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 700; color: #2f6df6">
                  团队
                </div>
                <div class="gallery-body">
                  <h3 class="gallery-title">{{ item.space?.spaceName || `空间 ${item.spaceId}` }}</h3>
                  <p class="gallery-desc">我的角色：{{ item.spaceRole }}</p>
                  <div class="info-stack" style="margin-top: 14px">
                    <span>空间类型：{{ formatSpaceType(item.space?.spaceType) }}</span>
                    <span>空间等级：{{ formatSpaceLevel(item.space?.spaceLevel) }}</span>
                    <span>容量占比：{{ formatPercent(((item.space?.totalSize || 0) / (item.space?.maxSize || 1)) || 0) }}</span>
                    <span>加入时间：{{ formatDateTime(item.createTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-placeholder">当前没有匹配的团队空间。</div>
          </template>
        </div>
      </div>
    </section>

    <SpaceFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :initial-value="currentSpace"
      :levels="spaceLevels"
      :loading="dialogLoading"
      @submit="handleSubmit"
    />
  </div>
</template>