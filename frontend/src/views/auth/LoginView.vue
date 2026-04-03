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

const previewCards = [
  '公共图库检索',
  '空间协同管理',
  'AI 扩图任务',
  '图片详情编辑',
];

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
  <div class="auth-shell">
    <section class="auth-showcase">
      <div class="showcase-brand">
        <div class="showcase-logo"></div>
        <span>{{ APP_TITLE }}</span>
      </div>

      <div class="showcase-content">
        <div class="showcase-kicker">在线图片管理与协同编辑系统</div>
        <h1>像你给的参考图一样，做一套更轻、更干净的云图库后台。</h1>
        <p>
          登录后即可进入图库首页、图片管理、空间协作、成员管理、空间分析与 AI 扩图等模块。
        </p>

        <div class="preview-grid">
          <div v-for="item in previewCards" :key="item" class="preview-card">
            <div class="preview-cover"></div>
            <div class="preview-title">{{ item }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="auth-panel-wrap">
      <div class="auth-panel surface-panel">
        <div>
          <div class="auth-caption">欢迎回来</div>
          <h2>登录系统</h2>
          <p class="auth-desc">请输入账号和密码，进入折纸云图库管理后台。</p>
        </div>

        <el-form @submit.prevent="handleSubmit">
          <el-form-item label="账号">
            <el-input v-model="form.userAccount" placeholder="请输入账号" size="large" />
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
          <el-button type="primary" size="large" :loading="loading" style="width: 100%" @click="handleSubmit">
            登录
          </el-button>
        </el-form>

        <el-alert
          title="如果提示 Network Error，请确认后端 http://localhost:8123 已启动，并且前端可访问 /api。"
          type="info"
          :closable="false"
          show-icon
        />

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
  grid-template-columns: 1.1fr 0.9fr;
  background:
    radial-gradient(circle at top left, rgba(47, 109, 246, 0.18), transparent 28%),
    linear-gradient(135deg, #f8fbff, #f4f7fc 55%, #eef3fb);
}

.auth-showcase {
  padding: 44px 56px;
  display: flex;
  flex-direction: column;
}

.showcase-brand {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-size: 32px;
  font-weight: 700;
}

.showcase-logo {
  width: 78px;
  height: 56px;
  border-radius: 4px;
  background:
    radial-gradient(circle at 32% 52%, #ffffff 0 14px, transparent 15px),
    radial-gradient(circle at 52% 48%, #9fe7ff 0 12px, transparent 13px),
    linear-gradient(135deg, #202632, #11151b 72%);
  position: relative;
  overflow: hidden;
}

.showcase-logo::after {
  content: '';
  position: absolute;
  inset: auto 14px 10px 12px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f47cf9, #88e0ff 72%, #ffffff);
}

.showcase-content {
  margin: auto 0;
  max-width: 760px;
}

.showcase-kicker {
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.auth-showcase h1 {
  margin: 18px 0 16px;
  font-size: 54px;
  line-height: 1.14;
}

.auth-showcase p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.9;
}

.preview-grid {
  margin-top: 36px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.preview-card {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(47, 109, 246, 0.12);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
}

.preview-cover {
  height: 148px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(47, 109, 246, 0.12), rgba(255, 255, 255, 0.85)),
    radial-gradient(circle at top right, rgba(47, 109, 246, 0.25), transparent 35%),
    #f8faff;
  border: 1px solid rgba(47, 109, 246, 0.08);
}

.preview-title {
  margin-top: 14px;
  font-size: 18px;
  font-weight: 700;
}

.auth-panel-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.auth-panel {
  width: min(520px, 100%);
  padding: 40px;
  display: grid;
  gap: 24px;
}

.auth-caption {
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.auth-panel h2 {
  margin: 12px 0 8px;
  font-size: 36px;
}

.auth-desc {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.auth-footer {
  display: flex;
  gap: 10px;
  align-items: center;
}

@media (max-width: 1280px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-showcase {
    padding-bottom: 12px;
  }

  .preview-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>