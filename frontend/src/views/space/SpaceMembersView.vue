<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addSpaceUser, deleteSpaceUser, editSpaceUser, listMyTeamSpaces, listSpaceUsers } from '@/api/spaceUser';
import type { SpaceUserVO } from '@/types/space-user';
import { formatDateTime, formatSpaceRole } from '@/utils/format';

const loading = ref(false);
const teamSpaces = ref<SpaceUserVO[]>([]);
const selectedSpaceId = ref<string>('');
const members = ref<SpaceUserVO[]>([]);
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const previewVisible = ref(false);
const dialogLoading = ref(false);
const currentMember = ref<SpaceUserVO | null>(null);

const addForm = reactive({
  userId: '',
  spaceRole: 'viewer',
});

const editForm = reactive({
  id: '',
  spaceRole: 'viewer',
});

const selectedTeam = ref<SpaceUserVO | null>(null);

async function loadTeams() {
  teamSpaces.value = await listMyTeamSpaces();
  if (!selectedSpaceId.value && teamSpaces.value[0]?.spaceId) {
    selectedSpaceId.value = String(teamSpaces.value[0].spaceId);
  }
}

async function loadMembers() {
  if (!selectedSpaceId.value) {
    members.value = [];
    return;
  }
  loading.value = true;
  try {
    members.value = await listSpaceUsers({
      spaceId: selectedSpaceId.value,
    });
    selectedTeam.value =
      teamSpaces.value.find((item) => String(item.spaceId) === String(selectedSpaceId.value)) || null;
  } finally {
    loading.value = false;
  }
}

watch(selectedSpaceId, () => {
  loadMembers();
});

function openAddDialog() {
  addForm.userId = '';
  addForm.spaceRole = 'viewer';
  addDialogVisible.value = true;
}

function openEditDialog(member: SpaceUserVO) {
  currentMember.value = member;
  editForm.id = String(member.id);
  editForm.spaceRole = member.spaceRole;
  editDialogVisible.value = true;
}

async function handleAddMember() {
  if (!selectedSpaceId.value || !addForm.userId.trim()) {
    ElMessage.warning('请选择团队空间并填写用户 ID');
    return;
  }
  dialogLoading.value = true;
  try {
    await addSpaceUser({
      spaceId: selectedSpaceId.value,
      userId: addForm.userId.trim(),
      spaceRole: addForm.spaceRole,
    });
    ElMessage.success('成员添加成功');
    addDialogVisible.value = false;
    await loadMembers();
  } finally {
    dialogLoading.value = false;
  }
}

async function handleEditMember() {
  dialogLoading.value = true;
  try {
    await editSpaceUser({
      id: editForm.id,
      spaceRole: editForm.spaceRole,
    });
    ElMessage.success('成员角色已更新');
    editDialogVisible.value = false;
    await loadMembers();
  } finally {
    dialogLoading.value = false;
  }
}

async function handleDeleteMember(member: SpaceUserVO) {
  await ElMessageBox.confirm(
    `确定移除成员 ${member.user?.userName || member.user?.userAccount || member.userId} 吗？`,
    '移除成员',
    { type: 'warning' },
  );
  await deleteSpaceUser(member.id);
  ElMessage.success('成员已移除');
  await loadMembers();
}

onMounted(async () => {
  await loadTeams();
  await loadMembers();
});
</script>

<template>
  <div class="app-page workspace-shell">
    <aside class="workspace-sidebar">
      <button
        v-for="team in teamSpaces"
        :key="team.id"
        type="button"
        class="workspace-nav-item"
        :class="{ active: selectedSpaceId === String(team.spaceId) }"
        @click="selectedSpaceId = String(team.spaceId)"
      >
        <span class="workspace-nav-icon">👥</span>
        <span>{{ team.space?.spaceName || `空间 ${team.spaceId}` }}</span>
      </button>
      <button type="button" class="workspace-nav-item" @click="openAddDialog">
        <span class="workspace-nav-icon">＋</span>
        <span>添加成员</span>
      </button>
    </aside>

    <section class="workspace-content">
      <div class="surface-panel">
        <div class="surface-panel-header">
          <div>
            <h2 class="section-title">{{ selectedTeam?.space?.spaceName || '团队成员管理' }}</h2>
            <p class="section-subtitle">可以像参考图那样用弹窗查看成员，同时也支持在当前页面直接改角色或移除成员。</p>
          </div>
          <div class="page-actions">
            <el-button @click="previewVisible = true">团队成员弹窗</el-button>
            <el-button type="primary" @click="openAddDialog">添加成员</el-button>
          </div>
        </div>
        <div class="surface-panel-body">
          <div v-if="members.length" class="content-grid-3" style="grid-template-columns: repeat(2, minmax(0, 1fr))">
            <div v-for="member in members" :key="member.id" class="surface-panel" style="box-shadow: none">
              <div class="surface-panel-body" style="display: flex; gap: 16px; align-items: center">
                <el-avatar :size="64" :src="member.user?.userAvatar">
                  {{ member.user?.userName?.slice(0, 1) || 'U' }}
                </el-avatar>
                <div style="flex: 1">
                  <div style="font-size: 24px; font-weight: 700">{{ member.user?.userName || member.user?.userAccount || member.userId }}</div>
                  <div class="muted-text" style="margin-top: 6px">成员 ID：{{ member.userId }}</div>
                  <div class="inline-tags" style="margin-top: 12px">
                    <el-tag round>{{ formatSpaceRole(member.spaceRole) }}</el-tag>
                    <el-tag type="info" round>{{ formatDateTime(member.createTime) }}</el-tag>
                  </div>
                </div>
                <div class="info-stack" style="align-items: flex-end">
                  <el-button link type="primary" @click="openEditDialog(member)">编辑角色</el-button>
                  <el-button link type="danger" @click="handleDeleteMember(member)">移除成员</el-button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-placeholder">当前团队还没有成员记录。</div>
        </div>
      </div>
    </section>

    <el-dialog v-model="previewVisible" title="团队成员" width="700px">
      <div v-if="members.length" class="info-stack" style="gap: 0">
        <div
          v-for="member in members"
          :key="member.id"
          style="display: flex; align-items: center; gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--line-soft)"
        >
          <el-avatar :size="54" :src="member.user?.userAvatar">
            {{ member.user?.userName?.slice(0, 1) || 'U' }}
          </el-avatar>
          <div style="flex: 1">
            <div style="font-size: 18px; font-weight: 700">{{ member.user?.userName || member.user?.userAccount || member.userId }}</div>
            <div class="muted-text" style="margin-top: 6px">{{ formatDateTime(member.createTime) }}</div>
          </div>
          <el-tag round>{{ formatSpaceRole(member.spaceRole) }}</el-tag>
        </div>
      </div>
      <div v-else class="empty-placeholder">暂无成员数据。</div>
    </el-dialog>

    <el-dialog v-model="addDialogVisible" title="添加成员" width="440px">
      <el-form label-width="90px">
        <el-form-item label="用户 ID">
          <el-input v-model="addForm.userId" placeholder="请输入要加入空间的用户 ID" />
        </el-form-item>
        <el-form-item label="空间角色">
          <el-select v-model="addForm.spaceRole" style="width: 100%">
            <el-option label="浏览者" value="viewer" />
            <el-option label="编辑者" value="editor" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleAddMember">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑成员角色" width="440px">
      <el-form label-width="90px">
        <el-form-item label="成员 ID">
          <el-input :model-value="currentMember?.userId || '--'" disabled />
        </el-form-item>
        <el-form-item label="空间角色">
          <el-select v-model="editForm.spaceRole" style="width: 100%">
            <el-option label="浏览者" value="viewer" />
            <el-option label="编辑者" value="editor" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleEditMember">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>