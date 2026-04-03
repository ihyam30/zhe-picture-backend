<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { PictureEditRequest, PictureVO } from '@/types/picture';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    picture?: Partial<PictureVO> | null;
    categoryOptions?: string[];
    tagOptions?: string[];
    loading?: boolean;
  }>(),
  {
    picture: null,
    categoryOptions: () => [],
    tagOptions: () => [],
    loading: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [value: PictureEditRequest];
}>();

const form = reactive({
  id: '',
  name: '',
  introduction: '',
  category: '',
  tags: [] as string[],
});

function fillForm() {
  form.id = props.picture?.id ? String(props.picture.id) : '';
  form.name = props.picture?.name || '';
  form.introduction = props.picture?.introduction || '';
  form.category = props.picture?.category || '';
  form.tags = props.picture?.tags ? [...props.picture.tags] : [];
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      fillForm();
    }
  },
  { immediate: true },
);

function close() {
  emit('update:modelValue', false);
}

function handleSubmit() {
  emit('submit', {
    id: form.id,
    name: form.name || undefined,
    introduction: form.introduction || undefined,
    category: form.category || undefined,
    tags: form.tags.length ? [...form.tags] : undefined,
  });
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="编辑图片信息"
    width="680px"
    destroy-on-close
    @close="close"
  >
    <el-form label-width="90px">
      <el-form-item label="名称">
        <el-input v-model="form.name" maxlength="40" show-word-limit placeholder="请输入图片名称" />
      </el-form-item>
      <el-form-item label="简介">
        <el-input
          v-model="form.introduction"
          type="textarea"
          :rows="4"
          maxlength="240"
          show-word-limit
          placeholder="简单描述一下图片内容或用途"
        />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category" clearable filterable style="width: 100%" placeholder="请选择分类">
          <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          style="width: 100%"
          placeholder="选择或直接输入标签"
        >
          <el-option v-for="item in tagOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">保存修改</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.el-select__tags) {
  max-width: calc(100% - 36px);
}

:deep(.el-select__tags-text) {
  max-width: 100%;
}
</style>
