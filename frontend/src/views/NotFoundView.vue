<template>
  <div class="status-page">
    <div class="status-card surface-panel">
      <div class="status-code">404</div>
      <h1>页面不存在</h1>
      <p>当前地址没有对应的前端页面，你可以返回首页继续浏览图片、空间和成员管理功能。</p>
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
  color: #0ea5e9;
}

h1 {
  margin: 16px 0 12px;
}

p {
  color: var(--text-secondary);
  line-height: 1.8;
}
</style>