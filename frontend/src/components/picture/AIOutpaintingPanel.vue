<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { createOutPaintingTask, getOutPaintingTask } from '@/api/ai';
import { uploadPictureByUrl } from '@/api/picture';
import type {
  GetOutPaintingTaskResponse,
  PictureOutPaintingParams,
} from '@/types/picture';
import type { Id } from '@/types/common';

const props = defineProps<{
  pictureId?: Id | null;
}>();

const emit = defineEmits<{
  applied: [];
}>();

const creating = ref(false);
const querying = ref(false);
const applying = ref(false);
const queryTaskId = ref('');
const pictureIdInput = ref('');
const latestTask = ref<GetOutPaintingTaskResponse | null>(null);
const taskHistory = ref<GetOutPaintingTaskResponse[]>([]);
const createIdempotencyKey = ref('');
let lastCreateFingerprint = '';
let pollTimer: number | null = null;

const form = reactive<PictureOutPaintingParams>({
  leftOffset: 20,
  rightOffset: 20,
  topOffset: 20,
  bottomOffset: 20,
  xScale: 1,
  yScale: 1,
  addWatermark: false,
});

const effectivePictureId = computed(() => props.pictureId || pictureIdInput.value || undefined);

const latestStatusType = computed(() => {
  const status = latestTask.value?.output?.taskStatus;
  if (status === 'SUCCEEDED') {
    return 'success';
  }
  if (status === 'FAILED' || status === 'SUSPENDED') {
    return 'danger';
  }
  return 'warning';
});

watch(
  () => props.pictureId,
  (value) => {
    if (value) {
      pictureIdInput.value = String(value);
    }
  },
  { immediate: true },
);

function clearPolling() {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

function upsertTask(task: GetOutPaintingTaskResponse) {
  latestTask.value = task;
  const taskId = task.output?.taskId;
  if (!taskId) {
    return;
  }
  const exists = taskHistory.value.findIndex((item) => item.output?.taskId === taskId);
  if (exists >= 0) {
    taskHistory.value.splice(exists, 1, task);
  } else {
    taskHistory.value.unshift(task);
  }
  taskHistory.value = taskHistory.value.slice(0, 6);
}

function normalizeNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = Number(value);
  return Number.isNaN(normalized) ? null : normalized;
}

function buildOutPaintingParams(): PictureOutPaintingParams {
  const leftOffset = normalizeNumber(form.leftOffset) ?? 0;
  const rightOffset = normalizeNumber(form.rightOffset) ?? 0;
  const topOffset = normalizeNumber(form.topOffset) ?? 0;
  const bottomOffset = normalizeNumber(form.bottomOffset) ?? 0;
  const xScale = normalizeNumber(form.xScale);
  const yScale = normalizeNumber(form.yScale);

  const useOffsetMode = leftOffset > 0 || rightOffset > 0 || topOffset > 0 || bottomOffset > 0;
  const useScaleMode = !useOffsetMode && xScale !== null && yScale !== null;

  return {
    leftOffset,
    rightOffset,
    topOffset,
    bottomOffset,
    xScale: useScaleMode ? xScale : null,
    yScale: useScaleMode ? yScale : null,
    addWatermark: !!form.addWatermark,
  };
}

function createRequestIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function handleCreate() {
  if (!effectivePictureId.value) {
    ElMessage.warning('请先提供图片 ID');
    return;
  }
  const parameters = buildOutPaintingParams();
  const payload = {
    pictureId: effectivePictureId.value,
    parameters,
  };
  const fingerprint = JSON.stringify(payload);
  if (fingerprint !== lastCreateFingerprint || !createIdempotencyKey.value) {
    lastCreateFingerprint = fingerprint;
    createIdempotencyKey.value = createRequestIdempotencyKey();
  }
  creating.value = true;
  try {
    const response = await createOutPaintingTask(payload, createIdempotencyKey.value);
    queryTaskId.value = response.output?.taskId || '';
    ElMessage.success(`任务创建成功：${queryTaskId.value || '已受理'}`);
    if (queryTaskId.value) {
      await handleQuery(queryTaskId.value);
      startPolling(queryTaskId.value);
    }
  } finally {
    creating.value = false;
  }
}

async function handleQuery(taskId = queryTaskId.value) {
  if (!taskId) {
    ElMessage.warning('请输入任务 ID');
    return;
  }
  querying.value = true;
  try {
    const result = await getOutPaintingTask(taskId);
    upsertTask(result);
    queryTaskId.value = result.output?.taskId || taskId;
    return result;
  } finally {
    querying.value = false;
  }
}

async function handleApplyResult(task = latestTask.value) {
  const outputImageUrl = task?.output?.outputImageUrl;
  if (!props.pictureId) {
    ElMessage.warning('当前页面没有绑定图片 ID，无法直接覆盖原图');
    return;
  }
  if (!outputImageUrl) {
    ElMessage.warning('当前任务还没有可用的生成图片');
    return;
  }
  applying.value = true;
  try {
    await uploadPictureByUrl({
      id: props.pictureId,
      fileUrl: outputImageUrl,
    });
    ElMessage.success('已将扩图结果应用为当前图片');
    emit('applied');
  } finally {
    applying.value = false;
  }
}

function startPolling(taskId: string) {
  clearPolling();
  pollTimer = window.setInterval(async () => {
    const result = await handleQuery(taskId);
    const status = result?.output?.taskStatus;
    if (!status || ['SUCCEEDED', 'FAILED', 'SUSPENDED', 'UNKNOWN'].includes(status)) {
      clearPolling();
    }
  }, 3000);
}

onBeforeUnmount(clearPolling);
</script>

<template>
  <div class="page-shell">
    <section class="surface-panel ai-panel-shell">
      <div class="surface-panel-header">
        <div>
          <h3 class="section-title">AI 扩图任务配置</h3>
          <p class="section-subtitle">按照后端 `/picture/out_painting` 接口创建任务，并支持轮询查看状态与结果。</p>
        </div>
        <div class="toolbar-actions">
          <el-button type="primary" :loading="creating" @click="handleCreate">创建任务</el-button>
          <el-button :loading="querying" @click="handleQuery()">查询任务</el-button>
        </div>
      </div>

      <div class="surface-panel-body ai-panel-content">
        <section class="ai-config-grid">
          <div class="surface-panel ai-config-card">
            <div class="surface-panel-header inner-header">
              <div>
                <h4 class="section-title">扩图参数</h4>
                <p class="section-subtitle">填写图片 ID、扩展比例与缩放参数。</p>
              </div>
            </div>
            <div class="surface-panel-body">
              <el-form label-width="112px">
                <el-form-item label="图片 ID">
                  <el-input v-model="pictureIdInput" :disabled="!!props.pictureId" placeholder="请输入图片 ID" />
                </el-form-item>
                <el-form-item label="左侧扩展">
                  <el-input-number v-model="form.leftOffset" :min="0" :step="5" />
                </el-form-item>
                <el-form-item label="右侧扩展">
                  <el-input-number v-model="form.rightOffset" :min="0" :step="5" />
                </el-form-item>
                <el-form-item label="顶部扩展">
                  <el-input-number v-model="form.topOffset" :min="0" :step="5" />
                </el-form-item>
                <el-form-item label="底部扩展">
                  <el-input-number v-model="form.bottomOffset" :min="0" :step="5" />
                </el-form-item>
                <el-form-item label="X 缩放">
                  <el-input-number v-model="form.xScale" :min="0.1" :max="2" :step="0.1" />
                </el-form-item>
                <el-form-item label="Y 缩放">
                  <el-input-number v-model="form.yScale" :min="0.1" :max="2" :step="0.1" />
                </el-form-item>
                <el-form-item label="添加水印">
                  <el-switch v-model="form.addWatermark" />
                </el-form-item>
                <el-form-item label="任务 ID">
                  <el-input v-model="queryTaskId" placeholder="创建后自动回填，也支持手动输入历史任务 ID" />
                </el-form-item>
              </el-form>
            </div>
          </div>

          <div class="surface-panel ai-result-card">
            <div class="surface-panel-header inner-header">
              <div>
                <h4 class="section-title">任务结果</h4>
                <p class="section-subtitle">展示最新一次查询结果和输出图片。</p>
              </div>
            </div>
            <div class="surface-panel-body result-card-body">
              <div v-if="latestTask" class="task-card">
                <div class="task-header">
                  <div>
                    <div class="task-title">最新任务：{{ latestTask.output?.taskId || '--' }}</div>
                    <div class="muted-text">状态：{{ latestTask.output?.taskStatus || '--' }}</div>
                  </div>
                  <el-tag :type="latestStatusType">
                    {{ latestTask.output?.taskStatus || 'UNKNOWN' }}
                  </el-tag>
                </div>

                <el-descriptions :column="1" border>
                  <el-descriptions-item label="提交时间">{{ latestTask.output?.submitTime || '--' }}</el-descriptions-item>
                  <el-descriptions-item label="结束时间">{{ latestTask.output?.endTime || '--' }}</el-descriptions-item>
                  <el-descriptions-item label="成功数量">{{ latestTask.output?.taskMetrics?.succeeded ?? '--' }}</el-descriptions-item>
                  <el-descriptions-item label="失败数量">{{ latestTask.output?.taskMetrics?.failed ?? '--' }}</el-descriptions-item>
                </el-descriptions>

                <div v-if="latestTask.output?.outputImageUrl" class="preview-block">
                  <el-image :src="latestTask.output.outputImageUrl" fit="contain" class="outpaint-image" />
                </div>

                <div class="toolbar-actions" style="justify-content: flex-end">
                  <el-button
                    v-if="latestTask.output?.outputImageUrl && props.pictureId"
                    type="primary"
                    plain
                    :loading="applying"
                    @click="handleApplyResult()"
                  >
                    应用为当前图片
                  </el-button>
                </div>
              </div>

              <div v-else class="empty-placeholder">创建或查询任务后，这里会展示状态、时间和生成结果。</div>
            </div>
          </div>
        </section>

        <section v-if="taskHistory.length" class="surface-panel">
          <div class="surface-panel-header inner-header">
            <div>
              <h4 class="section-title">最近任务记录</h4>
              <p class="section-subtitle">保留最近 6 条扩图任务，便于快速追踪。</p>
            </div>
          </div>
          <div class="surface-panel-body">
            <el-table :data="taskHistory" stripe>
              <el-table-column label="任务 ID" min-width="220">
                <template #default="scope">
                  {{ scope.row.output?.taskId || '--' }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="140">
                <template #default="scope">
                  <el-tag>{{ scope.row.output?.taskStatus || 'UNKNOWN' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="结果图片" min-width="220">
                <template #default="scope">
                  <div class="info-stack" style="gap: 8px">
                    <el-link
                      v-if="scope.row.output?.outputImageUrl"
                      :href="scope.row.output.outputImageUrl"
                      target="_blank"
                      type="primary"
                    >
                      查看生成图片
                    </el-link>
                    <el-button
                      v-if="scope.row.output?.outputImageUrl && props.pictureId"
                      link
                      type="primary"
                      :disabled="applying"
                      @click="handleApplyResult(scope.row)"
                    >
                      应用到当前图片
                    </el-button>
                    <span v-if="!scope.row.output?.outputImageUrl" class="muted-text">暂无</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ai-panel-shell {
  overflow: hidden;
}

.ai-panel-content {
  display: grid;
  gap: 20px;
}

.ai-config-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.95fr);
  gap: 20px;
}

.ai-config-card,
.ai-result-card {
  box-shadow: none;
}

.inner-header {
  padding: 20px 24px;
}

.result-card-body {
  min-height: 100%;
}

.task-card {
  display: grid;
  gap: 16px;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-title {
  font-size: 18px;
  font-weight: 700;
}

.preview-block {
  padding: 12px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.outpaint-image {
  width: 100%;
  max-height: 420px;
  border-radius: 16px;
}
</style>
