import * as echarts from 'echarts';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
const props = withDefaults(defineProps(), {
    option: undefined,
    height: 320,
    loading: false,
});
const chartRef = ref(null);
let chart = null;
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
watch(() => props.option, () => {
    renderChart();
}, { deep: true });
watch(() => props.loading, (loading) => {
    if (!loading) {
        renderChart();
    }
});
onMounted(() => {
    renderChart();
    window.addEventListener('resize', resizeChart);
});
onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart);
    chart?.dispose();
    chart = null;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    option: undefined,
    height: 320,
    loading: false,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    shadow: "never",
}));
const __VLS_2 = __VLS_1({
    shadow: "never",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "section-title" },
    });
    (__VLS_ctx.title);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-shell" },
    ...{ style: ({ height: `${__VLS_ctx.height}px` }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ref: "chartRef",
    ...{ class: "chart-canvas" },
});
/** @type {typeof __VLS_ctx.chartRef} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chart-loading-mask" },
    });
    const __VLS_5 = {}.ElSkeleton;
    /** @type {[typeof __VLS_components.ElSkeleton, typeof __VLS_components.elSkeleton, typeof __VLS_components.ElSkeleton, typeof __VLS_components.elSkeleton, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
        animated: true,
    }));
    const __VLS_7 = __VLS_6({
        animated: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    __VLS_8.slots.default;
    {
        const { template: __VLS_thisSlot } = __VLS_8.slots;
        const __VLS_9 = {}.ElSkeletonItem;
        /** @type {[typeof __VLS_components.ElSkeletonItem, typeof __VLS_components.elSkeletonItem, ]} */ ;
        // @ts-ignore
        const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
            variant: "rect",
            ...{ style: ({ width: '100%', height: `${__VLS_ctx.height}px`, borderRadius: '18px' }) },
        }));
        const __VLS_11 = __VLS_10({
            variant: "rect",
            ...{ style: ({ width: '100%', height: `${__VLS_ctx.height}px`, borderRadius: '18px' }) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    }
    var __VLS_8;
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-loading-mask']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            chartRef: chartRef,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
