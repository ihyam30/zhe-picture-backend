<template>
  <div class="status-page">
    <div class="status-card surface-panel">
      <div class="status-code">403</div>
      <h1>无权限访问</h1>
      <p>当前账号没有访问这个页面的权限，请检查角色配置，或者返回其他模块继续操作。</p>
      <div class="toolbar-actions" style="justify-content: center">
        <router-link to="/dashboard">
          <el-button type="primary">返回首页</el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.status-card {
  width: min(560px, 100%);
  padding: 48px;
  text-align: center;
}

.status-code {
  font-size: 72px;
  font-weight: 800;
  color: #1d4ed8;
}

h1 {
  margin: 16px 0 12px;
}

p {
  color: var(--text-secondary);
  line-height: 1.8;
}
</style>