<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getSpaceCategoryAnalyze,
  getSpaceRankAnalyze,
  getSpaceSizeAnalyze,
  getSpaceTagAnalyze,
  getSpaceUsageAnalyze,
  getSpaceUserAnalyze,
} from '@/api/analyze';
import ChartPanel from '@/components/analysis/ChartPanel.vue';
import SpaceSelect from '@/components/space/SpaceSelect.vue';
import { useAuthStore } from '@/store/auth';
import type {
  AnalyzeTimeDimension,
  SpaceCategoryAnalyzeResponse,
  SpaceRankAnalyzeResponse,
  SpaceSizeAnalyzeResponse,
  SpaceTagAnalyzeResponse,
  SpaceUsageAnalyzeResponse,
  SpaceUserAnalyzeRequest,
  SpaceUserAnalyzeResponse,
} from '@/types/analyze';
import type { Id } from '@/types/common';
import type { SpaceVO } from '@/types/space';
import { formatFileSize, formatPercent } from '@/utils/format';

const authStore = useAuthStore();
const loading = ref(false);
const scopeMode = ref<'space' | 'public' | 'all'>('space');
const timeDimension = ref<AnalyzeTimeDimension>('day');
const spaceId = ref<Id | ''>('');
const initialized = ref(false);

const usage = ref<SpaceUsageAnalyzeResponse | null>(null);
const categories = ref<SpaceCategoryAnalyzeResponse[]>([]);
const tags = ref<SpaceTagAnalyzeResponse[]>([]);
const sizes = ref<SpaceSizeAnalyzeResponse[]>([]);
const users = ref<SpaceUserAnalyzeResponse[]>([]);
const ranks = ref<SpaceRankAnalyzeResponse>([]);

const dimensionTextMap: Record<AnalyzeTimeDimension, string> = {
  day: '按天',
  week: '按周',
  month: '按月',
};

const defaultCategoryData = [{ name: '暂无分类数据', value: 1 }];
const defaultTagLabels = ['暂无标签数据'];
const defaultSizeLabels = ['<100KB', '100KB-500KB', '500KB-1MB', '>1MB'];
const defaultUserPeriods = ['暂无数据'];

function buildBasePayload() {
  return {
    spaceId: scopeMode.value === 'space' ? spaceId.value || undefined : undefined,
    queryPublic: scopeMode.value === 'public',
    queryAll: scopeMode.value === 'all',
  };
}

function buildUserAnalyzePayload(): SpaceUserAnalyzeRequest {
  return {
    ...buildBasePayload(),
    timeDimension: timeDimension.value,
  };
}

async function loadAnalysis() {
  if (scopeMode.value === 'space' && !spaceId.value) {
    ElMessage.warning('请选择要分析的空间');
    return;
  }

  loading.value = true;
  try {
    const basePayload = buildBasePayload();
    const userAnalyzePayload = buildUserAnalyzePayload();
    const [usageResult, categoryResult, tagResult, sizeResult, userResult, rankResult] = await Promise.allSettled([
      getSpaceUsageAnalyze(basePayload),
      getSpaceCategoryAnalyze(basePayload),
      getSpaceTagAnalyze(basePayload),
      getSpaceSizeAnalyze(basePayload),
      getSpaceUserAnalyze(userAnalyzePayload),
      authStore.isAdmin ? getSpaceRankAnalyze({ topN: 10 }) : Promise.resolve([]),
    ]);

    usage.value = usageResult.status === 'fulfilled' ? usageResult.value : null;
    categories.value = categoryResult.status === 'fulfilled' ? (categoryResult.value || []) : [];
    tags.value = tagResult.status === 'fulfilled' ? (tagResult.value || []) : [];
    sizes.value = sizeResult.status === 'fulfilled' ? (sizeResult.value || []) : [];
    users.value = userResult.status === 'fulfilled' ? (userResult.value || []) : [];
    ranks.value = rankResult.status === 'fulfilled' ? (rankResult.value as SpaceRankAnalyzeResponse) : [];
  } finally {
    loading.value = false;
  }
}

function handleSpaceLoaded(items: SpaceVO[]) {
  if (!spaceId.value && items[0]) {
    spaceId.value = items[0].id;
  }
  if (!initialized.value) {
    initialized.value = true;
    loadAnalysis();
  }
}

function handleFilterChange() {
  if (!initialized.value) {
    return;
  }
  loadAnalysis();
}

const categoryOption = computed<EChartsOption>(() => {
  const hasData = categories.value.length > 0;
  return {
    tooltip: {
      trigger: 'item',
      formatter: hasData ? '{b}: {c}' : '当前范围内暂无分类统计数据',
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#6b7280' },
    },
    graphic: hasData
      ? undefined
      : [
          {
            type: 'text',
            left: 'center',
            top: '44%',
            style: {
              text: '暂无分类数据',
              fill: '#94a3b8',
              fontSize: 16,
              fontWeight: 600,
            },
          },
        ],
    series: [
      {
        type: 'pie',
        radius: ['42%', '72%'],
        silent: !hasData,
        label: { show: hasData },
        itemStyle: hasData ? undefined : { color: '#e8edf7' },
        data: hasData
          ? categories.value.map((item) => ({
              name: item.category || '未分类',
              value: item.count,
            }))
          : defaultCategoryData,
      },
    ],
  };
});

const tagOption = computed<EChartsOption>(() => {
  const hasData = tags.value.length > 0;
  return {
    tooltip: {
      trigger: 'axis',
      formatter: hasData ? undefined : '当前范围内暂无标签统计数据',
    },
    grid: {
      left: 24,
      right: 24,
      top: 36,
      bottom: 36,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: hasData ? tags.value.map((item) => item.tag || '未命名标签') : defaultTagLabels,
      axisLine: { lineStyle: { color: '#d7deea' } },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: hasData ? undefined : 1,
      interval: hasData ? undefined : 0.2,
      splitLine: { lineStyle: { color: '#eef2f7' } },
      axisLabel: { color: '#94a3b8' },
    },
    series: [
      {
        type: 'bar',
        data: hasData ? tags.value.map((item) => item.count) : [0],
        itemStyle: { color: '#2f6df6' },
        barMaxWidth: 38,
      },
    ],
  };
});

const sizeOption = computed<EChartsOption>(() => {
  const hasData = sizes.value.length > 0;
  return {
    tooltip: {
      trigger: 'axis',
      formatter: hasData ? undefined : '当前范围内暂无图片大小统计数据',
    },
    grid: {
      left: 24,
      right: 24,
      top: 36,
      bottom: 36,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: hasData ? sizes.value.map((item) => item.sizeRange || '未分类区间') : defaultSizeLabels,
      axisLine: { lineStyle: { color: '#d7deea' } },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: hasData ? undefined : 1,
      interval: hasData ? undefined : 0.2,
      splitLine: { lineStyle: { color: '#eef2f7' } },
      axisLabel: { color: '#94a3b8' },
    },
    series: [
      {
        type: 'bar',
        data: hasData ? sizes.value.map((item) => item.count) : [0, 0, 0, 0],
        itemStyle: { color: '#18b566' },
        barMaxWidth: 38,
      },
    ],
  };
});

const userOption = computed<EChartsOption>(() => {
  const hasData = users.value.length > 0;
  return {
    tooltip: {
      trigger: 'axis',
      formatter: hasData ? undefined : '当前范围内暂无用户上传行为数据',
    },
    grid: {
      left: 24,
      right: 24,
      top: 36,
      bottom: 36,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: hasData ? users.value.map((item) => item.period || '未知时间') : defaultUserPeriods,
      axisLine: { lineStyle: { color: '#d7deea' } },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: hasData ? undefined : 1,
      interval: hasData ? undefined : 0.2,
      splitLine: { lineStyle: { color: '#eef2f7' } },
      axisLabel: { color: '#94a3b8' },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbolSize: 8,
        data: hasData ? users.value.map((item) => item.count) : [0],
        itemStyle: { color: '#2f6df6' },
        lineStyle: { color: '#2f6df6', width: 3 },
        areaStyle: hasData ? { color: 'rgba(47, 109, 246, 0.12)' } : undefined,
      },
    ],
  };
});
</script>

<template>
  <div class="app-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">空间分析</h1>
        <p class="page-subtitle">分析空间容量、分类、标签、大小区间与用户行为，整体视觉和图库工作台保持统一。</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" :loading="loading" @click="loadAnalysis">刷新分析</el-button>
      </div>
    </div>

    <div class="surface-panel">
      <div class="surface-panel-body">
        <div class="analysis-filters">
          <div class="analysis-filter-block">
            <div class="analysis-filter-label">分析范围</div>
            <el-radio-group v-model="scopeMode" @change="handleFilterChange">
              <el-radio value="space">指定空间</el-radio>
              <el-radio value="public">公共图库</el-radio>
              <el-radio value="all">全空间</el-radio>
            </el-radio-group>
          </div>

          <div class="analysis-filter-block">
            <div class="analysis-filter-label">行为趋势维度</div>
            <el-radio-group v-model="timeDimension" @change="handleFilterChange">
              <el-radio-button value="day">按天</el-radio-button>
              <el-radio-button value="week">按周</el-radio-button>
              <el-radio-button value="month">按月</el-radio-button>
            </el-radio-group>
          </div>

          <div class="analysis-filter-space">
            <div class="analysis-filter-label">目标空间</div>
            <SpaceSelect
              v-model="spaceId"
              :include-public="false"
              placeholder="选择空间"
              @loaded="handleSpaceLoaded"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="surface-panel stat-card">
        <div class="stat-label">已用容量</div>
        <div class="stat-value">{{ formatFileSize(usage?.usedSize) }}</div>
        <div class="muted-text">总容量 {{ formatFileSize(usage?.maxSize) }}</div>
      </div>
      <div class="surface-panel stat-card">
        <div class="stat-label">图片数量</div>
        <div class="stat-value">{{ usage?.usedCount || 0 }}</div>
        <div class="muted-text">总上限 {{ usage?.maxCount || 0 }}</div>
      </div>
      <div class="surface-panel stat-card">
        <div class="stat-label">容量使用率</div>
        <div class="stat-value">{{ formatPercent(usage?.sizeUsageRatio) }}</div>
      </div>
      <div class="surface-panel stat-card">
        <div class="stat-label">数量使用率</div>
        <div class="stat-value">{{ formatPercent(usage?.countUsageRatio) }}</div>
      </div>
    </div>

    <div class="content-grid-2" style="grid-template-columns: repeat(2, minmax(0, 1fr))">
      <ChartPanel title="图片分类分布" :loading="loading" :option="categoryOption" />
      <ChartPanel title="标签使用分布" :loading="loading" :option="tagOption" />
      <ChartPanel title="图片大小分布" :loading="loading" :option="sizeOption" />
      <ChartPanel :title="`用户上传行为趋势（${dimensionTextMap[timeDimension]}）`" :loading="loading" :option="userOption" />
    </div>

    <div class="surface-panel">
      <div class="surface-panel-header">
        <h3 class="section-title">空间排行</h3>
      </div>
      <div class="surface-panel-body">
        <el-table :data="ranks" stripe>
          <el-table-column type="index" label="排名" width="80" />
          <el-table-column label="空间名称" min-width="220" prop="spaceName" />
          <el-table-column label="类型" width="120">
            <template #default="scope">
              {{ scope.row.spaceType === 1 ? '团队空间' : '个人空间' }}
            </template>
          </el-table-column>
          <el-table-column label="已用容量" min-width="180">
            <template #default="scope">
              {{ formatFileSize(scope.row.totalSize) }}
            </template>
          </el-table-column>
          <el-table-column label="图片数量" min-width="120">
            <template #default="scope">
              {{ scope.row.totalCount || 0 }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analysis-filters {
  display: grid;
  grid-template-columns: 1.2fr 1fr 320px;
  gap: 20px;
  align-items: end;
}

.analysis-filter-block,
.analysis-filter-space {
  display: grid;
  gap: 12px;
}

.analysis-filter-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
}

@media (max-width: 1280px) {
  .analysis-filters {
    grid-template-columns: 1fr;
  }
}
</style>