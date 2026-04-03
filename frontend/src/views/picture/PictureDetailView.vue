<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deletePicture, editPicture, getPictureDetail, getPictureTagCategory } from '@/api/picture';
import PictureEditDialog from '@/components/picture/PictureEditDialog.vue';
import AIOutpaintingPanel from '@/components/picture/AIOutpaintingPanel.vue';
import { usePictureWebSocket } from '@/composables/usePictureWebSocket';
import { useAuthStore } from '@/store/auth';
import type { PictureVO } from '@/types/picture';
import {
  formatDateTime,
  formatFileSize,
  formatReviewStatus,
  reviewStatusTagType,
} from '@/utils/format';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const picture = ref<PictureVO | null>(null);
const tagOptions = ref<string[]>([]);
const categoryOptions = ref<string[]>([]);
const editVisible = ref(false);
const editLoading = ref(false);
const editorRotation = ref(0);
const editorScale = ref(1);

const pictureId = computed(() => String(route.params.id || ''));
const canEdit = computed(
  () => authStore.isAdmin || picture.value?.permissionList?.includes('picture:edit'),
);
const editorImageStyle = computed(() => ({
  transform: `rotate(${editorRotation.value}deg) scale(${editorScale.value})`,
}));

const {
  isConnected,
  onlineUsers,
  editingUser,
  latestEditAction,
  isEditing,
  messages,
  connect,
  enterEdit,
  exitEdit,
  sendAction,
} = usePictureWebSocket(pictureId);

const editorStatusText = computed(() => {
  if (isEditing.value) {
    return `正在编辑中 · 旋转 ${editorRotation.value}° · 缩放 ${Math.round(editorScale.value * 100)}%`;
  }
  if (editingUser.value) {
    return `${editingUser.value.userName} 正在编辑中 · 当前预览已同步其动作`;
  }
  return '可编辑';
});

function getMemberStatus(userId?: string | number) {
  const normalizedId = String(userId || '');
  if (String(editingUser.value?.id || '') === normalizedId) {
    return '正在编辑';
  }
  if (String(authStore.user?.id || '') === normalizedId) {
    return '已加入';
  }
  return '在线';
}

function getMemberTagType(userId?: string | number) {
  const normalizedId = String(userId || '');
  if (String(editingUser.value?.id || '') === normalizedId) {
    return 'success';
  }
  if (String(authStore.user?.id || '') === normalizedId) {
    return 'primary';
  }
  return 'info';
}

function resetEditorState() {
  editorRotation.value = 0;
  editorScale.value = 1;
}

function applyEditorAction(action: 'ROTATE_LEFT' | 'ROTATE_RIGHT' | 'ZOOM_IN' | 'ZOOM_OUT') {
  switch (action) {
    case 'ROTATE_LEFT':
      editorRotation.value -= 90;
      break;
    case 'ROTATE_RIGHT':
      editorRotation.value += 90;
      break;
    case 'ZOOM_IN':
      editorScale.value = Math.min(2.4, Number((editorScale.value + 0.1).toFixed(2)));
      break;
    case 'ZOOM_OUT':
      editorScale.value = Math.max(0.5, Number((editorScale.value - 0.1).toFixed(2)));
      break;
  }
}

async function loadPicture() {
  if (!pictureId.value) {
    return;
  }
  loading.value = true;
  try {
    picture.value = await getPictureDetail(pictureId.value);
  } finally {
    loading.value = false;
  }
}

async function loadMeta() {
  const result = await getPictureTagCategory();
  tagOptions.value = result.tagList || [];
  categoryOptions.value = result.categoryList || [];
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
    await loadPicture();
  } finally {
    editLoading.value = false;
  }
}

async function handleDelete() {
  if (!picture.value?.id) {
    return;
  }
  await ElMessageBox.confirm('确定删除当前图片吗？', '删除确认', {
    type: 'warning',
  });
  await deletePicture(picture.value.id);
  ElMessage.success('图片已删除');
  router.push('/pictures');
}

function handleDownload() {
  if (!picture.value?.url) {
    return;
  }
  window.open(picture.value.url, '_blank');
}

function handleEditorAction(action: 'ROTATE_LEFT' | 'ROTATE_RIGHT' | 'ZOOM_IN' | 'ZOOM_OUT') {
  if (!isEditing.value) {
    return;
  }
  applyEditorAction(action);
  sendAction(action);
}

onMounted(async () => {
  await Promise.all([loadMeta(), loadPicture()]);
  await connect();
});

watch(
  () => route.params.id,
  async () => {
    resetEditorState();
    await loadPicture();
    await connect();
  },
);

watch(
  () => picture.value?.id,
  () => {
    resetEditorState();
  },
);

watch(
  latestEditAction,
  (payload) => {
    if (!payload?.action) {
      return;
    }
    if (payload.userId && String(payload.userId) === String(authStore.user?.id || '')) {
      return;
    }
    if (payload.action === 'ROTATE_LEFT' || payload.action === 'ROTATE_RIGHT' || payload.action === 'ZOOM_IN' || payload.action === 'ZOOM_OUT') {
      applyEditorAction(payload.action);
    }
  },
);
</script>

<template>
  <div class="app-page">
    <div class="content-grid-2" v-loading="loading">
      <div class="surface-panel">
        <div class="surface-panel-header">
          <h3 class="section-title">图片预览</h3>
        </div>
        <div class="detail-preview-wrap">
          <img :src="picture?.url || picture?.thumbnailUrl" class="detail-preview" />
        </div>
      </div>

      <div class="surface-panel">
        <div class="surface-panel-header">
          <h3 class="section-title">图片信息</h3>
        </div>
        <div class="surface-panel-body">
          <div class="info-list">
            <div class="info-item">
              <div class="info-label">作者</div>
              <div class="info-value">{{ picture?.userVO?.userName || picture?.userVO?.userAccount || '--' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">名称</div>
              <div class="info-value">{{ picture?.name || '--' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">简介</div>
              <div class="info-value">{{ picture?.introduction || '暂无简介' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">分类</div>
              <div class="info-value">{{ picture?.category || '--' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">标签</div>
              <div class="inline-tags">
                <el-tag v-for="tag in picture?.tags || []" :key="tag" round>{{ tag }}</el-tag>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">格式</div>
              <div class="info-value">{{ picture?.picFormat || '--' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">尺寸</div>
              <div class="info-value">{{ picture?.picWidth || '--' }} × {{ picture?.picHeight || '--' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">宽高比</div>
              <div class="info-value">{{ picture?.picScale || '--' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">大小</div>
              <div class="info-value">{{ formatFileSize(picture?.picSize) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">审核状态</div>
              <div class="info-value">
                <el-tag :type="reviewStatusTagType(picture?.reviewStatus)">
                  {{ formatReviewStatus(picture?.reviewStatus) }}
                </el-tag>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">空间权限</div>
              <div class="inline-tags">
                <el-tag v-for="permission in picture?.permissionList || []" :key="permission">{{ permission }}</el-tag>
              </div>
            </div>
          </div>

          <div class="toolbar-actions" style="margin-top: 28px">
            <el-button type="primary" @click="handleDownload">免费下载</el-button>
            <el-button v-if="canEdit" @click="editVisible = true">编辑</el-button>
            <el-button v-if="canEdit" type="danger" plain @click="handleDelete">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="surface-panel">
      <div class="surface-panel-header">
        <div>
          <h3 class="section-title">协同编辑</h3>
          <p class="section-subtitle">进入编辑后即可通过 WebSocket 向后端发送旋转、缩放等广播动作。</p>
        </div>
        <div class="page-actions">
          <el-tag :type="isConnected ? 'success' : 'info'">
            {{ isConnected ? '连接已建立' : '连接未建立' }}
          </el-tag>
          <el-button type="primary" :disabled="!canEdit || isEditing" @click="enterEdit">进入编辑</el-button>
          <el-button :disabled="!canEdit || !isEditing" @click="exitEdit">退出编辑</el-button>
        </div>
      </div>
      <div class="surface-panel-body">
        <div class="editor-banner" :class="isEditing ? 'editing' : 'waiting'">
          {{ editorStatusText }}
        </div>

        <div class="editor-stage checkerboard">
          <div class="editor-stage-inner">
            <img
              :src="picture?.url || picture?.thumbnailUrl"
              :style="editorImageStyle"
              class="editor-image"
            />
          </div>
        </div>

        <div class="toolbar-actions" style="justify-content: center; margin-top: 22px">
          <el-button :disabled="!isEditing" @click="handleEditorAction('ROTATE_LEFT')">向左旋转</el-button>
          <el-button :disabled="!isEditing" @click="handleEditorAction('ROTATE_RIGHT')">向右旋转</el-button>
          <el-button :disabled="!isEditing" @click="handleEditorAction('ZOOM_IN')">放大</el-button>
          <el-button :disabled="!isEditing" @click="handleEditorAction('ZOOM_OUT')">缩小</el-button>
          <el-button type="primary" :disabled="!isEditing" @click="exitEdit">确认</el-button>
        </div>

        <div class="editor-tip">
          当前预览会同步显示本地动作和其他成员广播过来的旋转、缩放动作，但不会直接覆盖原图。
        </div>

        <div class="content-grid-2" style="margin-top: 26px; grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr)">
          <div class="surface-panel" style="box-shadow: none">
            <div class="surface-panel-header">
              <h3 class="section-title">协同消息</h3>
            </div>
            <div class="surface-panel-body" style="max-height: 320px; overflow: auto">
              <div v-if="messages.length" class="info-stack" style="gap: 14px">
                <div v-for="item in messages" :key="item.id" class="collab-message-item">
                  <div class="collab-message-text">{{ item.text }}</div>
                  <div class="muted-text">{{ formatDateTime(item.createdAt) }}</div>
                </div>
              </div>
              <div v-else class="empty-placeholder">还没有协同消息。</div>
            </div>
          </div>

          <div class="surface-panel" style="box-shadow: none">
            <div class="surface-panel-header">
              <h3 class="section-title">在线成员</h3>
            </div>
            <div class="surface-panel-body">
              <div v-if="onlineUsers.length" class="info-stack" style="gap: 12px">
                <div v-for="user in onlineUsers" :key="user.id" class="member-item">
                  <el-avatar :src="user.userAvatar">{{ user.userName?.slice(0, 1) || 'U' }}</el-avatar>
                  <div class="member-meta">
                    <div class="member-name-row">
                      <div style="font-weight: 700">{{ user.userName || user.userAccount }}</div>
                      <el-tag size="small" :type="getMemberTagType(user.id)">{{ getMemberStatus(user.id) }}</el-tag>
                    </div>
                    <div class="muted-text">{{ user.userRole || '成员' }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-placeholder">当前没有协同成员。</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AIOutpaintingPanel :picture-id="picture?.id" @applied="loadPicture" />

    <PictureEditDialog
      v-model="editVisible"
      :picture="picture"
      :tag-options="tagOptions"
      :category-options="categoryOptions"
      :loading="editLoading"
      @submit="handleEditSubmit"
    />
  </div>
</template>

<style scoped>
.editor-stage {
  border-radius: 18px;
  overflow: hidden;
}

.editor-stage-inner {
  min-height: 600px;
  padding: 28px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.editor-image {
  max-width: min(72vw, 980px);
  max-height: 520px;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.22s ease;
  will-change: transform;
  flex: 0 0 auto;
}

.editor-tip {
  margin-top: 14px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.collab-message-item {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line-soft);
}

.collab-message-text {
  font-weight: 700;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-meta {
  min-width: 0;
  flex: 1;
}

.member-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
