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
    width="620px"
    destroy-on-close
    @close="close"
  >
    <el-form label-width="104px">
      <el-form-item label="抓取关键词" required>
        <el-input
          v-model="form.searchText"
          placeholder="例如：篮球壁纸、科技海报、校园插画"
          clearable
        />
      </el-form-item>

      <el-form-item label="抓取数量" required>
        <el-input-number v-model="form.count" :min="1" :max="30" :step="1" />
        <span class="helper-text">后端当前限制单次最多抓取 30 张</span>
      </el-form-item>

      <el-form-item label="名称前缀">
        <el-input
          v-model="form.namePrefix"
          placeholder="不填则默认使用关键词作为名称前缀"
          clearable
        />
      </el-form-item>

      <el-alert
        title="该功能会调用后端 /picture/upload/batch 接口，从网络图片搜索结果中批量抓取并创建图片。"
        type="info"
        :closable="false"
        show-icon
      />
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting.value" @click="handleSubmit">
        {{ submitting.value ? '批量创建中...' : '开始批量创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.helper-text {
  margin-left: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>