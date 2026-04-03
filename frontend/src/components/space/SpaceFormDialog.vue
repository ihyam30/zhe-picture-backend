<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { SpaceAddRequest, SpaceLevel, SpaceVO } from '@/types/space';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    mode: 'create' | 'edit';
    initialValue?: Partial<SpaceVO> | null;
    levels?: SpaceLevel[];
    loading?: boolean;
  }>(),
  {
    initialValue: null,
    levels: () => [],
    loading: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [value: SpaceAddRequest | { id: string | number; spaceName: string }];
}>();

const form = reactive({
  id: '',
  spaceName: '',
  spaceLevel: 0,
  spaceType: 0,
});

function fillForm() {
  form.id = props.initialValue?.id ? String(props.initialValue.id) : '';
  form.spaceName = props.initialValue?.spaceName || '';
  form.spaceLevel = props.initialValue?.spaceLevel ?? 0;
  form.spaceType = props.initialValue?.spaceType ?? 0;
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
  if (props.mode === 'create') {
    emit('submit', {
      spaceName: form.spaceName,
      spaceLevel: form.spaceLevel,
      spaceType: form.spaceType,
    });
    return;
  }
  emit('submit', {
    id: form.id,
    spaceName: form.spaceName,
  });
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'create' ? '创建空间' : '编辑空间'"
    width="540px"
    destroy-on-close
    @close="close"
  >
    <el-form label-width="92px">
      <el-form-item label="空间名称" required>
        <el-input v-model="form.spaceName" maxlength="30" show-word-limit placeholder="请输入空间名称" />
      </el-form-item>
      <el-form-item v-if="mode === 'create'" label="空间等级">
        <el-select v-model="form.spaceLevel" style="width: 100%" placeholder="请选择等级">
          <el-option
            v-for="level in levels"
            :key="level.value"
            :label="`${level.text} / ${level.maxCount} 张 / ${level.maxSize}`"
            :value="level.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="mode === 'create'" label="空间类型">
        <el-radio-group v-model="form.spaceType">
          <el-radio :value="0">个人空间</el-radio>
          <el-radio :value="1">团队空间</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-alert
        v-if="mode === 'edit'"
        title="按你当前后端接口，编辑态主要修改空间名称；等级和类型建议在创建时确认。"
        type="info"
        :closable="false"
        show-icon
      />
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ mode === 'create' ? '创建空间' : '保存修改' }}
      </el-button>
    </template>
  </el-dialog>
</template>