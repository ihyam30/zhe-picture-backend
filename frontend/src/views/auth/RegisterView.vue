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
  <div class="auth-shell register-shell">
    <section class="register-intro">
      <div class="showcase-brand">
        <div class="showcase-logo"></div>
        <span>{{ APP_TITLE }}</span>
      </div>

      <div class="register-copy">
        <div class="auth-caption">账号入口</div>
        <h1>创建你的云图库账号</h1>
        <p>
          前端已经对接 `/user/register`。如果后端仍限制管理员才能注册，页面会直接展示后端返回的错误提示，便于你继续联调。
        </p>
        <ul>
          <li>支持账号密码注册</li>
          <li>注册成功后直接跳转登录页</li>
          <li>统一沿用后台白底蓝色的视觉风格</li>
        </ul>
      </div>
    </section>

    <section class="auth-panel-wrap">
      <div class="auth-panel surface-panel">
        <div>
          <div class="auth-caption">开始使用</div>
          <h2>注册账号</h2>
          <p class="auth-desc">填写基础信息，创建一个新的系统账号。</p>
        </div>

        <el-form @submit.prevent="handleSubmit">
          <el-form-item label="账号">
            <el-input v-model="form.userAccount" placeholder="请输入账号" size="large" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.userPassword" type="password" show-password size="large" />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input
              v-model="form.checkPassword"
              type="password"
              show-password
              size="large"
              @keyup.enter="handleSubmit"
            />
          </el-form-item>
          <el-button type="primary" size="large" :loading="loading" style="width: 100%" @click="handleSubmit">
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
  grid-template-columns: 1fr 0.92fr;
  background:
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.18), transparent 28%),
    linear-gradient(135deg, #fffef9, #f6f9ff 55%, #eef3fb);
}

.register-intro {
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

.register-copy {
  margin: auto 0;
  max-width: 720px;
}

.auth-caption {
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.register-copy h1 {
  margin: 18px 0 16px;
  font-size: 52px;
  line-height: 1.14;
}

.register-copy p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.9;
}

.register-copy ul {
  margin: 28px 0 0;
  padding-left: 20px;
  color: var(--text-primary);
  line-height: 2;
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
}
</style>