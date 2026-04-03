<script setup lang="ts">
import * as echarts from 'echarts';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { EChartsOption } from 'echarts';

const props = withDefaults(
  defineProps<{
    title: string;
    option?: EChartsOption;
    height?: number;
    loading?: boolean;
  }>(),
  {
    option: undefined,
    height: 320,
    loading: false,
  },
);

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function ensureChart() {
  if (!chartRef.value) {
    return null;
  }
  if (!chart || chart.getDom() !== chartRef.value) {
    chart?.dispose();
    chart = echarts.init(chartRef.value);
  }
  return chart;
}

function resizeChart() {
  chart?.resize();
}

async function renderChart() {
  await nextTick();
  if (!chartRef.value || !props.option) {
    return;
  }
  const instance = ensureChart();
  if (!instance) {
    return;
  }
  instance.setOption(props.option, true);
  instance.resize();
}

watch(
  () => props.option,
  () => {
    renderChart();
  },
  { deep: true },
);

watch(
  () => props.loading,
  (loading) => {
    if (!loading) {
      renderChart();
    }
  },
);

onMounted(() => {
  renderChart();
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ title }}</span>
      </div>
    </template>

    <div class="chart-shell" :style="{ height: `${height}px` }">
      <div ref="chartRef" class="chart-canvas" />
      <div v-if="loading" class="chart-loading-mask">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="rect" :style="{ width: '100%', height: `${height}px`, borderRadius: '18px' }" />
          </template>
        </el-skeleton>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-shell {
  position: relative;
  width: 100%;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.chart-loading-mask {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.86);
}
</style>