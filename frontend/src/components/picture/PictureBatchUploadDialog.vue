<script setup lang="ts">
import { reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { uploadPictureBatch } from '@/api/picture';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [count: number];
}>();

const form = reactive({
  searchText: '',
  count: 10,
  namePrefix: '',
});

const submitting = reactive({
  value: false,
});

function resetForm() {
  form.searchText = '';
  form.count = 10;
  form.namePrefix = '';
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      resetForm();
    }
  },
);

function close() {
  emit('update:modelValue', false);
}

async function handleSubmit() {
  const searchText = form.searchText.trim();
  const namePrefix = form.namePrefix.trim();

  if (!searchText) {
    ElMessage.warning('请输入批量抓取关键词');
    return;
  }

  if (form.count < 1 || form.count > 30) {
    ElMessage.warning('抓取数量需在 1 到 30 之间');
    return;
  }

  submitting.value = true;
  try {
    const count = await uploadPictureBatch({
      searchText,
      count: form.count,
      namePrefix: namePrefix || undefined,
    });
    ElMessage.success(`批量创建完成，成功创建 ${count} 张图片`);
    emit('success', count);
    close();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="批量创建图片"
    width="640px"
    destroy-on-close
    class="picture-batch-dialog"
    @close="close"
  >
    <div class="dialog-intro">
      <div class="dialog-intro-title">根据关键词批量抓取并创建图片</div>
      <div class="dialog-intro-text">适合快速导入一批素材图，名称前缀可选填。</div>
    </div>

    <el-form label-width="104px" class="batch-form">
      <el-form-item label="抓取关键词" required>
        <el-input
          v-model="form.searchText"
          placeholder="例如：篮球壁纸、科技海报、校园插画"
          clearable
        />
      </el-form-item>

      <el-form-item label="抓取数量" required>
        <div class="count-row">
          <el-input-number v-model="form.count" :min="1" :max="30" :step="1" />
          <span class="helper-text">最多抓取 30 张图片</span>
        </div>
      </el-form-item>

      <el-form-item label="名称前缀">
        <el-input
          v-model="form.namePrefix"
          placeholder="不填则默认使用关键词作为名称前缀"
          clearable
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="submitting.value" @click="handleSubmit">
          {{ submitting.value ? '批量创建中...' : '开始批量创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-intro {
  margin-bottom: 14px;
}

.dialog-intro-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.dialog-intro-text {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.batch-form {
  padding-top: 2px;
}

.count-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.helper-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.picture-batch-dialog .el-dialog) {
  border-radius: 26px;
  overflow: hidden;
}

:deep(.picture-batch-dialog .el-dialog__header) {
  padding: 24px 28px 10px;
}

:deep(.picture-batch-dialog .el-dialog__title) {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

:deep(.picture-batch-dialog .el-dialog__body) {
  padding: 0 28px 16px;
}

:deep(.picture-batch-dialog .el-dialog__footer) {
  padding: 8px 28px 24px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 700;
  color: var(--text-primary);
}

:deep(.el-input__wrapper),
:deep(.el-input-number),
:deep(.el-input-number .el-input__wrapper) {
  border-radius: 16px;
}
</style>
