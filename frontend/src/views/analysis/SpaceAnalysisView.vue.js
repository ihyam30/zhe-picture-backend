import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getSpaceCategoryAnalyze, getSpaceRankAnalyze, getSpaceSizeAnalyze, getSpaceTagAnalyze, getSpaceUsageAnalyze, getSpaceUserAnalyze, } from '@/api/analyze';
import ChartPanel from '@/components/analysis/ChartPanel.vue';
import SpaceSelect from '@/components/space/SpaceSelect.vue';
import { useAuthStore } from '@/store/auth';
import { formatFileSize, formatPercent } from '@/utils/format';
const authStore = useAuthStore();
const loading = ref(false);
const scopeMode = ref('space');
const timeDimension = ref('day');
const spaceId = ref('');
const initialized = ref(false);
const usage = ref(null);
const categories = ref([]);
const tags = ref([]);
const sizes = ref([]);
const users = ref([]);
const ranks = ref([]);
const dimensionTextMap = {
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
function buildUserAnalyzePayload() {
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
        ranks.value = rankResult.status === 'fulfilled' ? rankResult.value : [];
    }
    finally {
        loading.value = false;
    }
}
function handleSpaceLoaded(items) {
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
const categoryOption = computed(() => {
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
const tagOption = computed(() => {
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
const sizeOption = computed(() => {
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
const userOption = computed(() => {
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['analysis-filters']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "page-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "page-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-actions" },
});
const __VLS_0 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.loadAnalysis)
};
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "analysis-filters" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "analysis-filter-block" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "analysis-filter-label" },
});
const __VLS_8 = {}.ElRadioGroup;
/** @type {[typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.scopeMode),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.scopeMode),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onChange: (__VLS_ctx.handleFilterChange)
};
__VLS_11.slots.default;
const __VLS_16 = {}.ElRadio;
/** @type {[typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    value: "space",
}));
const __VLS_18 = __VLS_17({
    value: "space",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
var __VLS_19;
const __VLS_20 = {}.ElRadio;
/** @type {[typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    value: "public",
}));
const __VLS_22 = __VLS_21({
    value: "public",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
var __VLS_23;
const __VLS_24 = {}.ElRadio;
/** @type {[typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    value: "all",
}));
const __VLS_26 = __VLS_25({
    value: "all",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
var __VLS_27;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "analysis-filter-block" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "analysis-filter-label" },
});
const __VLS_28 = {}.ElRadioGroup;
/** @type {[typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.timeDimension),
}));
const __VLS_30 = __VLS_29({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.timeDimension),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onChange: (__VLS_ctx.handleFilterChange)
};
__VLS_31.slots.default;
const __VLS_36 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    value: "day",
}));
const __VLS_38 = __VLS_37({
    value: "day",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
var __VLS_39;
const __VLS_40 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    value: "week",
}));
const __VLS_42 = __VLS_41({
    value: "week",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
var __VLS_43;
const __VLS_44 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    value: "month",
}));
const __VLS_46 = __VLS_45({
    value: "month",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
var __VLS_47;
var __VLS_31;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "analysis-filter-space" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "analysis-filter-label" },
});
/** @type {[typeof SpaceSelect, ]} */ ;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent(SpaceSelect, new SpaceSelect({
    ...{ 'onLoaded': {} },
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.spaceId),
    includePublic: (false),
    placeholder: "选择空间",
}));
const __VLS_49 = __VLS_48({
    ...{ 'onLoaded': {} },
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.spaceId),
    includePublic: (false),
    placeholder: "选择空间",
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
let __VLS_51;
let __VLS_52;
let __VLS_53;
const __VLS_54 = {
    onLoaded: (__VLS_ctx.handleSpaceLoaded)
};
const __VLS_55 = {
    onChange: (__VLS_ctx.handleFilterChange)
};
var __VLS_50;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stats-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.formatFileSize(__VLS_ctx.usage?.usedSize));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "muted-text" },
});
(__VLS_ctx.formatFileSize(__VLS_ctx.usage?.maxSize));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.usage?.usedCount || 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "muted-text" },
});
(__VLS_ctx.usage?.maxCount || 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.formatPercent(__VLS_ctx.usage?.sizeUsageRatio));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.formatPercent(__VLS_ctx.usage?.countUsageRatio));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "content-grid-2" },
    ...{ style: {} },
});
/** @type {[typeof ChartPanel, ]} */ ;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent(ChartPanel, new ChartPanel({
    title: "图片分类分布",
    loading: (__VLS_ctx.loading),
    option: (__VLS_ctx.categoryOption),
}));
const __VLS_57 = __VLS_56({
    title: "图片分类分布",
    loading: (__VLS_ctx.loading),
    option: (__VLS_ctx.categoryOption),
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
/** @type {[typeof ChartPanel, ]} */ ;
// @ts-ignore
const __VLS_59 = __VLS_asFunctionalComponent(ChartPanel, new ChartPanel({
    title: "标签使用分布",
    loading: (__VLS_ctx.loading),
    option: (__VLS_ctx.tagOption),
}));
const __VLS_60 = __VLS_59({
    title: "标签使用分布",
    loading: (__VLS_ctx.loading),
    option: (__VLS_ctx.tagOption),
}, ...__VLS_functionalComponentArgsRest(__VLS_59));
/** @type {[typeof ChartPanel, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(ChartPanel, new ChartPanel({
    title: "图片大小分布",
    loading: (__VLS_ctx.loading),
    option: (__VLS_ctx.sizeOption),
}));
const __VLS_63 = __VLS_62({
    title: "图片大小分布",
    loading: (__VLS_ctx.loading),
    option: (__VLS_ctx.sizeOption),
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
/** @type {[typeof ChartPanel, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(ChartPanel, new ChartPanel({
    title: (`用户上传行为趋势（${__VLS_ctx.dimensionTextMap[__VLS_ctx.timeDimension]}）`),
    loading: (__VLS_ctx.loading),
    option: (__VLS_ctx.userOption),
}));
const __VLS_66 = __VLS_65({
    title: (`用户上传行为趋势（${__VLS_ctx.dimensionTextMap[__VLS_ctx.timeDimension]}）`),
    loading: (__VLS_ctx.loading),
    option: (__VLS_ctx.userOption),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
});
const __VLS_68 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    data: (__VLS_ctx.ranks),
    stripe: true,
}));
const __VLS_70 = __VLS_69({
    data: (__VLS_ctx.ranks),
    stripe: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    type: "index",
    label: "排名",
    width: "80",
}));
const __VLS_74 = __VLS_73({
    type: "index",
    label: "排名",
    width: "80",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
const __VLS_76 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    label: "空间名称",
    minWidth: "220",
    prop: "spaceName",
}));
const __VLS_78 = __VLS_77({
    label: "空间名称",
    minWidth: "220",
    prop: "spaceName",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
const __VLS_80 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    label: "类型",
    width: "120",
}));
const __VLS_82 = __VLS_81({
    label: "类型",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_83.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    (scope.row.spaceType === 1 ? '团队空间' : '个人空间');
}
var __VLS_83;
const __VLS_84 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    label: "已用容量",
    minWidth: "180",
}));
const __VLS_86 = __VLS_85({
    label: "已用容量",
    minWidth: "180",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_87.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    (__VLS_ctx.formatFileSize(scope.row.totalSize));
}
var __VLS_87;
const __VLS_88 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    label: "图片数量",
    minWidth: "120",
}));
const __VLS_90 = __VLS_89({
    label: "图片数量",
    minWidth: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
__VLS_91.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_91.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    (scope.row.totalCount || 0);
}
var __VLS_91;
var __VLS_71;
/** @type {__VLS_StyleScopedClasses['app-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['page-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['page-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['analysis-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['analysis-filter-block']} */ ;
/** @type {__VLS_StyleScopedClasses['analysis-filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['analysis-filter-block']} */ ;
/** @type {__VLS_StyleScopedClasses['analysis-filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['analysis-filter-space']} */ ;
/** @type {__VLS_StyleScopedClasses['analysis-filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-row']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ChartPanel: ChartPanel,
            SpaceSelect: SpaceSelect,
            formatFileSize: formatFileSize,
            formatPercent: formatPercent,
            loading: loading,
            scopeMode: scopeMode,
            timeDimension: timeDimension,
            spaceId: spaceId,
            usage: usage,
            ranks: ranks,
            dimensionTextMap: dimensionTextMap,
            loadAnalysis: loadAnalysis,
            handleSpaceLoaded: handleSpaceLoaded,
            handleFilterChange: handleFilterChange,
            categoryOption: categoryOption,
            tagOption: tagOption,
            sizeOption: sizeOption,
            userOption: userOption,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
