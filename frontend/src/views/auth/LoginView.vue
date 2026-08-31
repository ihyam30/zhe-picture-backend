<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { APP_TITLE } from '@/constants/app';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

const form = reactive({
  userAccount: '',
  userPassword: '',
});

const redirect = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard',
);

async function handleSubmit() {
  if (!form.userAccount.trim() || !form.userPassword.trim()) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  loading.value = true;
  try {
    await authStore.login({ ...form });
    ElMessage.success('登录成功');
    router.replace(redirect.value);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-shell auth-shell--login">
    <section class="auth-aside">
      <div class="brand-row">
        <div class="brand-logo"></div>
        <span>{{ APP_TITLE }}</span>
      </div>

      <div class="aside-copy">
        <div class="auth-kicker">后台入口</div>
        <h1>更轻、更干净的云图库管理后台</h1>
        <p>
          登录后即可进入图片管理、空间协作、成员管理、空间分析与 AI 扩图等模块，直接开始联调与日常管理。
        </p>

        <div class="aside-points">
          <div class="aside-point">
            <strong>图片管理</strong>
            <span>上传、编辑、审核与颜色检索统一入口。</span>
          </div>
          <div class="aside-point">
            <strong>空间协作</strong>
            <span>团队成员、权限与协同编辑能力集中处理。</span>
          </div>
          <div class="aside-point">
            <strong>分析与 AI</strong>
            <span>空间分析、AI 扩图与结果回写已串联。</span>
          </div>
        </div>
      </div>
    </section>

    <section class="auth-main">
      <div class="auth-card surface-panel">
        <div>
          <div class="auth-kicker">欢迎回来</div>
          <h2>登录系统</h2>
          <p class="auth-desc">输入账号和密码，进入折纸云图库管理后台。</p>
        </div>

        <el-form label-position="top" @submit.prevent="handleSubmit">
          <el-form-item label="账号">
            <el-input v-model="form.userAccount" placeholder="请输入账号" size="large" clearable />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.userPassword"
              type="password"
              show-password
              placeholder="请输入密码"
              size="large"
              @keyup.enter="handleSubmit"
            />
          </el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="auth-submit" @click="handleSubmit">
            登录
          </el-button>
        </el-form>

        <div class="auth-footer">
          <span class="muted-text">还没有账号？</span>
          <router-link to="/register">前往注册</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(440px, 1fr) minmax(420px, 520px);
  background:
    radial-gradient(circle at top left, rgba(47, 109, 246, 0.14), transparent 30%),
    linear-gradient(135deg, #f7faff, #eef3fb 58%, #e8eef9);
}

.auth-aside {
  padding: 44px 56px;
  display: flex;
  flex-direction: column;
}

.brand-row {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

.brand-logo {
  width: 72px;
  height: 52px;
  border-radius: 6px;
  background:
    radial-gradient(circle at 32% 52%, #ffffff 0 14px, transparent 15px),
    radial-gradient(circle at 52% 48%, #9fe7ff 0 12px, transparent 13px),
    linear-gradient(135deg, #202632, #11151b 72%);
  position: relative;
  overflow: hidden;
}

.brand-logo::after {
  content: '';
  position: absolute;
  inset: auto 14px 10px 12px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f47cf9, #88e0ff 72%, #ffffff);
}

.aside-copy {
  margin: auto 0;
  max-width: 680px;
}

.auth-kicker {
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.aside-copy h1 {
  margin: 18px 0 16px;
  font-size: 64px;
  line-height: 1.04;
  letter-spacing: -0.04em;
}

.aside-copy p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.85;
}

.aside-points {
  margin-top: 34px;
  display: grid;
  gap: 16px;
}

.aside-point {
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(47, 109, 246, 0.1);
  backdrop-filter: blur(8px);
}

.aside-point strong {
  display: block;
  font-size: 17px;
  margin-bottom: 6px;
}

.aside-point span {
  color: var(--text-secondary);
  line-height: 1.7;
}

.auth-main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 48px 40px 0;
}

.auth-card {
  width: min(500px, 100%);
  padding: 42px 40px;
  display: grid;
  gap: 26px;
  border-radius: 30px;
}

.auth-card h2 {
  margin: 10px 0 8px;
  font-size: 34px;
  line-height: 1.12;
}

.auth-desc {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.auth-submit {
  width: 100%;
  margin-top: 6px;
}

.auth-footer {
  display: flex;
  gap: 10px;
  align-items: center;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 700;
  color: var(--text-primary);
  padding-bottom: 8px;
}

:deep(.el-input__wrapper) {
  min-height: 48px;
  border-radius: 16px;
}

@media (max-width: 1280px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-main {
    padding: 0 24px 32px;
  }

  .auth-aside {
    padding: 32px 24px 20px;
  }

  .aside-copy h1 {
    font-size: 46px;
  }
}
</style>
