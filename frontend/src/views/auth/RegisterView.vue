<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { APP_TITLE } from '@/constants/app';
import { register } from '@/api/user';

const router = useRouter();
const loading = ref(false);

const form = reactive({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
});

async function handleSubmit() {
  if (!form.userAccount.trim() || !form.userPassword.trim() || !form.checkPassword.trim()) {
    ElMessage.warning('请完整填写注册信息');
    return;
  }
  if (form.userPassword !== form.checkPassword) {
    ElMessage.warning('两次输入的密码不一致');
    return;
  }
  loading.value = true;
  try {
    await register({ ...form });
    ElMessage.success('注册成功，请返回登录');
    router.replace('/login');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-shell auth-shell--register">
    <section class="auth-aside">
      <div class="brand-row">
        <div class="brand-logo"></div>
        <span>{{ APP_TITLE }}</span>
      </div>

      <div class="aside-copy">
        <div class="auth-kicker">账号入口</div>
        <h1>创建你的云图库账号</h1>
        <p>
          注册后即可进入同一套后台工作流。当前页面保留最基础的账号注册能力，方便你继续完成接口联调和权限验证。
        </p>

        <div class="aside-notes">
          <div class="aside-note">支持账号密码注册，成功后自动返回登录页。</div>
          <div class="aside-note">如果后端仍限制管理员注册，页面会直接展示后端返回的错误信息。</div>
        </div>
      </div>
    </section>

    <section class="auth-main">
      <div class="auth-card surface-panel">
        <div>
          <div class="auth-kicker">开始使用</div>
          <h2>注册账号</h2>
          <p class="auth-desc">填写基础信息，创建一个新的系统账号。</p>
        </div>

        <el-form label-position="top" @submit.prevent="handleSubmit">
          <el-form-item label="账号">
            <el-input v-model="form.userAccount" placeholder="请输入账号" size="large" clearable />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.userPassword" type="password" show-password placeholder="请输入密码" size="large" />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input
              v-model="form.checkPassword"
              type="password"
              show-password
              placeholder="请再次输入密码"
              size="large"
              @keyup.enter="handleSubmit"
            />
          </el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="auth-submit" @click="handleSubmit">
            注册
          </el-button>
        </el-form>

        <div class="auth-footer">
          <span class="muted-text">已经有账号？</span>
          <router-link to="/login">返回登录</router-link>
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
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.16), transparent 30%),
    linear-gradient(135deg, #fffef9, #f6f9ff 58%, #eef3fb);
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
  max-width: 640px;
}

.auth-kicker {
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.aside-copy h1 {
  margin: 18px 0 16px;
  font-size: 60px;
  line-height: 1.06;
  letter-spacing: -0.04em;
}

.aside-copy p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.85;
}

.aside-notes {
  margin-top: 28px;
  display: grid;
  gap: 14px;
}

.aside-note {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(47, 109, 246, 0.1);
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
    font-size: 44px;
  }
}
</style>
