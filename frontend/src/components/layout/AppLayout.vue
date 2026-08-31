<script setup lang="ts">
import {
  DataAnalysis,
  FolderOpened,
  House,
  Picture,
  SwitchButton,
  User,
  UserFilled,
} from '@element-plus/icons-vue';
import { computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { APP_TITLE } from '@/constants/app';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const menuItems = computed(() => {
  const items = [
    { path: '/dashboard', label: '首页', icon: House },
    { path: '/pictures', label: '图片管理', icon: Picture },
    { path: '/spaces', label: '空间管理', icon: FolderOpened },
    { path: '/space-members', label: '空间成员', icon: UserFilled },
    { path: '/space-analysis', label: '空间分析', icon: DataAnalysis },
    { path: '/users', label: '用户管理', icon: User, adminOnly: true },
  ];
  return items.filter((item) => !item.adminOnly || authStore.isAdmin);
});

const activePath = computed(() => {
  if (route.path.startsWith('/pictures/')) {
    return '/pictures';
  }
  return route.path;
});

function go(path: string) {
  router.push(path);
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定退出当前账号吗？', '退出登录', {
      type: 'warning',
    });
    await authStore.logout();
    ElMessage.success('已退出登录');
    router.replace('/login');
  } catch {
    // 用户取消时无需处理
  }
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="app-header-inner">
        <div class="brand clickable" @click="go('/dashboard')">
          <div class="brand-logo">
            <div class="brand-cloud brand-cloud-left"></div>
            <div class="brand-cloud brand-cloud-right"></div>
            <div class="brand-cloud brand-cloud-core"></div>
            <div class="brand-star"></div>
          </div>
          <div class="brand-title">{{ APP_TITLE }}</div>
        </div>

        <nav class="top-nav">
          <button
            v-for="item in menuItems"
            :key="item.path"
            class="top-nav-item"
            :class="{ active: activePath === item.path }"
            type="button"
            @click="go(item.path)"
          >
            <el-icon class="top-nav-icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <div class="header-right">
          <el-dropdown>
            <div class="user-brief">
              <el-avatar :size="42" :src="authStore.user?.userAvatar">
                {{ authStore.user?.userName?.slice(0, 1) || 'U' }}
              </el-avatar>
              <div class="user-brief-name">{{ authStore.user?.userName || authStore.user?.userAccount }}</div>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="app-main-inner">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--page-bg);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line-soft);
}

.app-header-inner {
  width: min(calc(100% - 32px), var(--app-width));
  margin: 0 auto;
  min-height: 72px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-logo {
  position: relative;
  width: 64px;
  height: 46px;
  border-radius: 4px;
  overflow: hidden;
  background: radial-gradient(circle at 22% 18%, #394150 0%, #151922 72%);
}

.brand-cloud {
  position: absolute;
  background: linear-gradient(135deg, #fa78ff, #8fe2ff 72%, #ffffff);
  box-shadow: 0 0 20px rgba(143, 226, 255, 0.32);
}

.brand-cloud-left {
  width: 18px;
  height: 18px;
  left: 14px;
  top: 14px;
  border-radius: 50%;
}

.brand-cloud-right {
  width: 15px;
  height: 15px;
  left: 30px;
  top: 18px;
  border-radius: 50%;
}

.brand-cloud-core {
  width: 36px;
  height: 14px;
  left: 14px;
  top: 24px;
  border-radius: 999px;
}

.brand-star {
  position: absolute;
  left: 9px;
  top: 9px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ffd9f8;
  box-shadow: 8px 10px 0 0 #9ce8ff, 12px -3px 0 0 #d8f0ff;
}

.brand-title {
  font-size: 17px;
  font-weight: 700;
  white-space: nowrap;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-wrap: nowrap;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.top-nav::-webkit-scrollbar {
  display: none;
}

.top-nav-item {
  position: relative;
  border: none;
  background: transparent;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  flex: 0 0 auto;
}

.top-nav-icon {
  font-size: 15px;
}

.top-nav-item.active {
  color: var(--primary-color);
}

.top-nav-item.active::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 2px;
  height: 3px;
  border-radius: 999px;
  background: var(--primary-color);
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.user-brief {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-brief-name {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.app-main {
  padding: 22px 0 28px;
}

.app-main-inner {
  width: min(calc(100% - 32px), var(--app-width));
  margin: 0 auto;
}

@media (max-width: 1480px) {
  .app-header-inner {
    width: min(calc(100% - 24px), var(--app-width));
    gap: 12px;
  }

  .user-brief-name {
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
