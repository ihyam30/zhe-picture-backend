<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { listSpaceVOByPage } from '@/api/space';
import { listMyTeamSpaces } from '@/api/spaceUser';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { useAuthStore } from '@/store/auth';
import type { Id } from '@/types/common';
import type { SpaceVO } from '@/types/space';
import { uniqueById } from '@/utils/format';

const props = withDefaults(
  defineProps<{
    modelValue?: Id | '';
    includePublic?: boolean;
    teamOnly?: boolean;
    clearable?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: '',
    includePublic: false,
    teamOnly: false,
    clearable: true,
    placeholder: '请选择空间',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: Id | ''];
  change: [value: Id | ''];
  loaded: [spaces: SpaceVO[]];
}>();

const authStore = useAuthStore();
const loading = ref(false);
const options = ref<SpaceVO[]>([]);
const innerValue = ref<Id | ''>(props.modelValue);

const selectOptions = computed(() => {
  const merged = props.teamOnly
    ? options.value.filter((item) => item.spaceType === 1)
    : options.value;
  return merged;
});

watch(
  () => props.modelValue,
  (value) => {
    innerValue.value = value;
  },
);

watch(innerValue, (value) => {
  emit('update:modelValue', value);
  emit('change', value);
});

async function loadSpaces() {
  if (!authStore.user?.id) {
    return;
  }
  loading.value = true;
  try {
    const [ownedResult, joinedResult] = await Promise.allSettled([
      listSpaceVOByPage({
        current: 1,
        pageSize: Math.max(DEFAULT_PAGE_SIZE * 2, 20),
        userId: authStore.user.id,
        sortField: 'updateTime',
        sortOrder: 'descend',
      }),
      listMyTeamSpaces(),
    ]);

    const ownedSpaces = ownedResult.status === 'fulfilled' ? ownedResult.value.records : [];
    const joinedSpaces =
      joinedResult.status === 'fulfilled'
        ? joinedResult.value
            .map((item) => item.space)
            .filter((item): item is SpaceVO => Boolean(item))
        : [];

    options.value = uniqueById([...ownedSpaces, ...joinedSpaces]);
    emit('loaded', options.value);
  } finally {
    loading.value = false;
  }
}

onMounted(loadSpaces);

defineExpose({
  refresh: loadSpaces,
});
</script>

<template>
  <el-select
    v-model="innerValue"
    :loading="loading"
    :placeholder="placeholder"
    :clearable="clearable"
    style="width: 100%"
  >
    <el-option v-if="includePublic" label="公共图库（默认）" value="" />
    <el-option
      v-for="space in selectOptions"
      :key="space.id"
      :label="space.spaceName"
      :value="space.id"
    >
      <div style="display: flex; justify-content: space-between; gap: 12px">
        <span>{{ space.spaceName }}</span>
        <span class="muted-text">{{ space.spaceType === 1 ? '团队空间' : '个人空间' }}</span>
      </div>
    </el-option>
  </el-select>
</template>