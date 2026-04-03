<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';
import { formatDateTime } from '@/utils/format';

const authStore = useAuthStore();
const loading = ref(false);

async function refreshUser() {
  loading.value = true;
  try {
    await authStore.fetchCurrentUser();
    ElMessage.success('账户信息已刷新');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="app-page">
    <div class="content-grid-2">
      <div class="surface-panel">
        <div class="surface-panel-header">
          <h3 class="section-title">个人资料</h3>
        </div>
        <div class="surface-panel-body">
          <div style="display: flex; align-items: center; gap: 18px; margin-bottom: 24px">
            <el-avatar :size="88" :src="authStore.user?.userAvatar">
              {{ authStore.user?.userName?.slice(0, 1) || 'U' }}
            </el-avatar>
            <div>
              <div style="font-size: 28px; font-weight: 700">{{ authStore.user?.userName || authStore.user?.userAccount }}</div>
              <div class="muted-text" style="margin-top: 8px">{{ authStore.user?.userRole === 'admin' ? '管理员' : '普通用户' }}</div>
            </div>
          </div>

          <div class="info-list">
            <div class="info-item"><div class="info-label">用户 ID</div><div class="info-value">{{ authStore.user?.id || '--' }}</div></div>
            <div class="info-item"><div class="info-label">账号</div><div class="info-value">{{ authStore.user?.userAccount || '--' }}</div></div>
            <div class="info-item"><div class="info-label">简介</div><div class="info-value">{{ authStore.user?.userProfile || '暂无简介' }}</div></div>
            <div class="info-item"><div class="info-label">创建时间</div><div class="info-value">{{ formatDateTime(authStore.user?.createTime) }}</div></div>
            <div class="info-item"><div class="info-label">更新时间</div><div class="info-value">{{ formatDateTime(authStore.user?.updateTime) }}</div></div>
          </div>
        </div>
      </div>

      <div class="surface-panel">
        <div class="surface-panel-header">
          <h3 class="section-title">账户状态</h3>
        </div>
        <div class="surface-panel-body">
          <el-alert
            title="当前前端通过 Pinia 和 localStorage 缓存登录用户，并在路由守卫中按需调用 /user/get/login 校验会话。"
            type="success"
            :closable="false"
            show-icon
          />
          <div class="info-stack" style="margin-top: 20px; gap: 16px">
            <div><strong>会话方式：</strong>Cookie + Spring Session / Sa-Token</div>
            <div><strong>权限分流：</strong>管理员菜单按 userRole 控制显示</div>
            <div><strong>异常处理：</strong>40100 / 40101 会自动跳转登录页或无权限页</div>
          </div>
          <div style="margin-top: 28px">
            <el-button type="primary" :loading="loading" @click="refreshUser">刷新账户信息</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>