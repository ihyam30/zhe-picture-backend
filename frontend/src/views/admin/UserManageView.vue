<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addUser, deleteUser, listUsersByPage, updateUser } from '@/api/user';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import type { UserVO } from '@/types/user';
import { formatDateTime } from '@/utils/format';

const loading = ref(false);
const dialogVisible = ref(false);
const dialogLoading = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const tableData = ref<UserVO[]>([]);

const pagination = reactive({
  current: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
});

const queryForm = reactive({
  userName: '',
  userAccount: '',
  userRole: '',
});

const dialogForm = reactive({
  id: '',
  userAccount: '',
  userName: '',
  userAvatar: '',
  userProfile: '',
  userRole: 'user',
});

const stats = computed(() => {
  const adminCount = tableData.value.filter((item) => item.userRole === 'admin').length;
  return [
    { label: '当前页用户数', value: tableData.value.length },
    { label: '管理员数量', value: adminCount },
    { label: '普通用户数量', value: Math.max(tableData.value.length - adminCount, 0) },
    { label: '总用户数', value: pagination.total },
  ];
});

async function loadUsers() {
  loading.value = true;
  try {
    const result = await listUsersByPage({
      current: pagination.current,
      pageSize: pagination.pageSize,
      userName: queryForm.userName || undefined,
      userAccount: queryForm.userAccount || undefined,
      userRole: queryForm.userRole || undefined,
      sortField: 'createTime',
      sortOrder: 'descend',
    });
    tableData.value = result.records;
    pagination.total = result.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  loadUsers();
}

function handleReset() {
  queryForm.userName = '';
  queryForm.userAccount = '';
  queryForm.userRole = '';
  handleSearch();
}

function resetDialogForm() {
  dialogForm.id = '';
  dialogForm.userAccount = '';
  dialogForm.userName = '';
  dialogForm.userAvatar = '';
  dialogForm.userProfile = '';
  dialogForm.userRole = 'user';
}

function openAddDialog() {
  dialogMode.value = 'add';
  resetDialogForm();
  dialogVisible.value = true;
}

function openEditDialog(user: UserVO) {
  dialogMode.value = 'edit';
  dialogForm.id = String(user.id);
  dialogForm.userAccount = user.userAccount;
  dialogForm.userName = user.userName || '';
  dialogForm.userAvatar = user.userAvatar || '';
  dialogForm.userProfile = user.userProfile || '';
  dialogForm.userRole = user.userRole || 'user';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (dialogMode.value === 'add' && !dialogForm.userAccount.trim()) {
    ElMessage.warning('请输入账号');
    return;
  }

  dialogLoading.value = true;
  try {
    if (dialogMode.value === 'add') {
      await addUser({
        userAccount: dialogForm.userAccount,
        userName: dialogForm.userName || undefined,
        userAvatar: dialogForm.userAvatar || undefined,
        userProfile: dialogForm.userProfile || undefined,
        userRole: dialogForm.userRole,
      });
      ElMessage.success('用户已创建，默认密码以后端逻辑为准');
    } else {
      await updateUser({
        id: dialogForm.id,
        userName: dialogForm.userName || undefined,
        userAvatar: dialogForm.userAvatar || undefined,
        userProfile: dialogForm.userProfile || undefined,
        userRole: dialogForm.userRole,
      });
      ElMessage.success('用户信息已更新');
    }
    dialogVisible.value = false;
    await loadUsers();
  } finally {
    dialogLoading.value = false;
  }
}

async function handleDelete(row: UserVO) {
  await ElMessageBox.confirm(`确定删除用户 ${row.userName || row.userAccount} 吗？`, '删除用户', {
    type: 'warning',
  });
  await deleteUser(row.id);
  ElMessage.success('用户已删除');
  await loadUsers();
}

onMounted(loadUsers);
</script>

<template>
  <div class="page-shell">
    <section class="page-header">
      <div>
        <h1 class="page-title">用户管理</h1>
        <p class="page-subtitle">管理员可以查看用户列表、创建用户、调整角色以及删除账号。</p>
      </div>
      <div class="toolbar-actions">
        <el-button type="primary" @click="openAddDialog">+ 新建用户</el-button>
      </div>
    </section>

    <section class="stats-row">
      <article v-for="item in stats" :key="item.label" class="surface-panel stat-card">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">{{ item.value }}</div>
      </article>
    </section>

    <section class="surface-panel">
      <div class="surface-panel-header">
        <div>
          <h3 class="section-title">筛选条件</h3>
          <p class="section-subtitle">支持按昵称、账号和角色筛选后台用户。</p>
        </div>
        <div class="toolbar-actions">
          <el-button type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
      <div class="surface-panel-body">
        <el-form label-width="86px">
          <el-row :gutter="18">
            <el-col :xl="8" :lg="8" :md="12" :sm="24" :xs="24">
              <el-form-item label="昵称">
                <el-input v-model="queryForm.userName" clearable placeholder="请输入用户昵称" />
              </el-form-item>
            </el-col>
            <el-col :xl="8" :lg="8" :md="12" :sm="24" :xs="24">
              <el-form-item label="账号">
                <el-input v-model="queryForm.userAccount" clearable placeholder="请输入登录账号" />
              </el-form-item>
            </el-col>
            <el-col :xl="8" :lg="8" :md="12" :sm="24" :xs="24">
              <el-form-item label="角色">
                <el-select v-model="queryForm.userRole" clearable style="width: 100%" placeholder="请选择角色">
                  <el-option label="普通用户" value="user" />
                  <el-option label="管理员" value="admin" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </section>

    <section class="surface-panel">
      <div class="surface-panel-header">
        <div>
          <h3 class="section-title">用户列表</h3>
          <p class="section-subtitle">共 {{ pagination.total }} 条记录</p>
        </div>
      </div>
      <div class="surface-panel-body">
        <el-table :data="tableData" v-loading="loading" stripe>
          <el-table-column label="用户" min-width="260">
            <template #default="scope">
              <div class="user-cell">
                <el-avatar :src="scope.row.userAvatar">{{ scope.row.userName?.slice(0, 1) || 'U' }}</el-avatar>
                <div>
                  <div class="user-name">{{ scope.row.userName || scope.row.userAccount }}</div>
                  <div class="muted-text">{{ scope.row.userAccount }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="角色" width="140">
            <template #default="scope">
              <el-tag :type="scope.row.userRole === 'admin' ? 'danger' : 'info'">
                {{ scope.row.userRole === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="个人简介" min-width="260">
            <template #default="scope">
              <span>{{ scope.row.userProfile || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="200">
            <template #default="scope">
              {{ formatDateTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-space>
                <el-button link type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
              </el-space>
            </template>
          </el-table-column>
        </el-table>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            layout="total, prev, pager, next"
            :total="pagination.total"
            @current-change="loadUsers"
          />
        </div>
      </div>
    </section>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新建用户' : '编辑用户'" width="560px">
      <el-form label-width="96px">
        <el-form-item v-if="dialogMode === 'add'" label="账号">
          <el-input v-model="dialogForm.userAccount" placeholder="请输入新账号" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="dialogForm.userName" placeholder="请输入用户昵称" />
        </el-form-item>
        <el-form-item label="头像 URL">
          <el-input v-model="dialogForm.userAvatar" placeholder="请输入头像地址" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="dialogForm.userProfile" type="textarea" :rows="3" placeholder="请输入用户简介" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="dialogForm.userRole" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="dialogMode === 'add'"
          title="根据你提供的后端代码，新建用户时会使用后端内置默认密码。"
          type="warning"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 16px;
  font-weight: 700;
}
</style>