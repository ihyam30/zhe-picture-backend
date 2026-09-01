import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { createOutPaintingTask, getOutPaintingTask } from '@/api/ai';
import { uploadPictureByUrl } from '@/api/picture';
const props = defineProps();
const emit = defineEmits();
const creating = ref(false);
const querying = ref(false);
const applying = ref(false);
const queryTaskId = ref('');
const pictureIdInput = ref('');
const latestTask = ref(null);
const taskHistory = ref([]);
const createIdempotencyKey = ref('');
let lastCreateFingerprint = '';
let pollTimer = null;
const form = reactive({
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
watch(() => props.pictureId, (value) => {
    if (value) {
        pictureIdInput.value = String(value);
    }
}, { immediate: true });
function clearPolling() {
    if (pollTimer !== null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
    }
}
function upsertTask(task) {
    latestTask.value = task;
    const taskId = task.output?.taskId;
    if (!taskId) {
        return;
    }
    const exists = taskHistory.value.findIndex((item) => item.output?.taskId === taskId);
    if (exists >= 0) {
        taskHistory.value.splice(exists, 1, task);
    }
    else {
        taskHistory.value.unshift(task);
    }
    taskHistory.value = taskHistory.value.slice(0, 6);
}
function normalizeNumber(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const normalized = Number(value);
    return Number.isNaN(normalized) ? null : normalized;
}
function buildOutPaintingParams() {
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
    }
    finally {
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
    }
    finally {
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
    }
    finally {
        applying.value = false;
    }
}
function startPolling(taskId) {
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "surface-panel ai-panel-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "section-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar-actions" },
});
const __VLS_0 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.creating),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.creating),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.handleCreate)
};
__VLS_3.slots.default;
var __VLS_3;
const __VLS_8 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.querying),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.querying),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (...[$event]) => {
        __VLS_ctx.handleQuery();
    }
};
__VLS_11.slots.default;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body ai-panel-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "ai-config-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel ai-config-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-header inner-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "section-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
});
const __VLS_16 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    labelWidth: "112px",
}));
const __VLS_18 = __VLS_17({
    labelWidth: "112px",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    label: "图片 ID",
}));
const __VLS_22 = __VLS_21({
    label: "图片 ID",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    modelValue: (__VLS_ctx.pictureIdInput),
    disabled: (!!props.pictureId),
    placeholder: "请输入图片 ID",
}));
const __VLS_26 = __VLS_25({
    modelValue: (__VLS_ctx.pictureIdInput),
    disabled: (!!props.pictureId),
    placeholder: "请输入图片 ID",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
var __VLS_23;
const __VLS_28 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    label: "左侧扩展",
}));
const __VLS_30 = __VLS_29({
    label: "左侧扩展",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    modelValue: (__VLS_ctx.form.leftOffset),
    min: (0),
    step: (5),
}));
const __VLS_34 = __VLS_33({
    modelValue: (__VLS_ctx.form.leftOffset),
    min: (0),
    step: (5),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
var __VLS_31;
const __VLS_36 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    label: "右侧扩展",
}));
const __VLS_38 = __VLS_37({
    label: "右侧扩展",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
const __VLS_40 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    modelValue: (__VLS_ctx.form.rightOffset),
    min: (0),
    step: (5),
}));
const __VLS_42 = __VLS_41({
    modelValue: (__VLS_ctx.form.rightOffset),
    min: (0),
    step: (5),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
var __VLS_39;
const __VLS_44 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    label: "顶部扩展",
}));
const __VLS_46 = __VLS_45({
    label: "顶部扩展",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    modelValue: (__VLS_ctx.form.topOffset),
    min: (0),
    step: (5),
}));
const __VLS_50 = __VLS_49({
    modelValue: (__VLS_ctx.form.topOffset),
    min: (0),
    step: (5),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
var __VLS_47;
const __VLS_52 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    label: "底部扩展",
}));
const __VLS_54 = __VLS_53({
    label: "底部扩展",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    modelValue: (__VLS_ctx.form.bottomOffset),
    min: (0),
    step: (5),
}));
const __VLS_58 = __VLS_57({
    modelValue: (__VLS_ctx.form.bottomOffset),
    min: (0),
    step: (5),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
var __VLS_55;
const __VLS_60 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    label: "X 缩放",
}));
const __VLS_62 = __VLS_61({
    label: "X 缩放",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    modelValue: (__VLS_ctx.form.xScale),
    min: (0.1),
    max: (2),
    step: (0.1),
}));
const __VLS_66 = __VLS_65({
    modelValue: (__VLS_ctx.form.xScale),
    min: (0.1),
    max: (2),
    step: (0.1),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
var __VLS_63;
const __VLS_68 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    label: "Y 缩放",
}));
const __VLS_70 = __VLS_69({
    label: "Y 缩放",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    modelValue: (__VLS_ctx.form.yScale),
    min: (0.1),
    max: (2),
    step: (0.1),
}));
const __VLS_74 = __VLS_73({
    modelValue: (__VLS_ctx.form.yScale),
    min: (0.1),
    max: (2),
    step: (0.1),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
var __VLS_71;
const __VLS_76 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    label: "添加水印",
}));
const __VLS_78 = __VLS_77({
    label: "添加水印",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    modelValue: (__VLS_ctx.form.addWatermark),
}));
const __VLS_82 = __VLS_81({
    modelValue: (__VLS_ctx.form.addWatermark),
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
var __VLS_79;
const __VLS_84 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    label: "任务 ID",
}));
const __VLS_86 = __VLS_85({
    label: "任务 ID",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
const __VLS_88 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    modelValue: (__VLS_ctx.queryTaskId),
    placeholder: "创建后自动回填，也支持手动输入历史任务 ID",
}));
const __VLS_90 = __VLS_89({
    modelValue: (__VLS_ctx.queryTaskId),
    placeholder: "创建后自动回填，也支持手动输入历史任务 ID",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
var __VLS_87;
var __VLS_19;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel ai-result-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-header inner-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "section-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body result-card-body" },
});
if (__VLS_ctx.latestTask) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "task-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "task-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "task-title" },
    });
    (__VLS_ctx.latestTask.output?.taskId || '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "muted-text" },
    });
    (__VLS_ctx.latestTask.output?.taskStatus || '--');
    const __VLS_92 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        type: (__VLS_ctx.latestStatusType),
    }));
    const __VLS_94 = __VLS_93({
        type: (__VLS_ctx.latestStatusType),
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    __VLS_95.slots.default;
    (__VLS_ctx.latestTask.output?.taskStatus || 'UNKNOWN');
    var __VLS_95;
    const __VLS_96 = {}.ElDescriptions;
    /** @type {[typeof __VLS_components.ElDescriptions, typeof __VLS_components.elDescriptions, typeof __VLS_components.ElDescriptions, typeof __VLS_components.elDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        column: (1),
        border: true,
    }));
    const __VLS_98 = __VLS_97({
        column: (1),
        border: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    __VLS_99.slots.default;
    const __VLS_100 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        label: "提交时间",
    }));
    const __VLS_102 = __VLS_101({
        label: "提交时间",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    __VLS_103.slots.default;
    (__VLS_ctx.latestTask.output?.submitTime || '--');
    var __VLS_103;
    const __VLS_104 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        label: "结束时间",
    }));
    const __VLS_106 = __VLS_105({
        label: "结束时间",
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    __VLS_107.slots.default;
    (__VLS_ctx.latestTask.output?.endTime || '--');
    var __VLS_107;
    const __VLS_108 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        label: "成功数量",
    }));
    const __VLS_110 = __VLS_109({
        label: "成功数量",
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    __VLS_111.slots.default;
    (__VLS_ctx.latestTask.output?.taskMetrics?.succeeded ?? '--');
    var __VLS_111;
    const __VLS_112 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        label: "失败数量",
    }));
    const __VLS_114 = __VLS_113({
        label: "失败数量",
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    __VLS_115.slots.default;
    (__VLS_ctx.latestTask.output?.taskMetrics?.failed ?? '--');
    var __VLS_115;
    var __VLS_99;
    if (__VLS_ctx.latestTask.output?.outputImageUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "preview-block" },
        });
        const __VLS_116 = {}.ElImage;
        /** @type {[typeof __VLS_components.ElImage, typeof __VLS_components.elImage, ]} */ ;
        // @ts-ignore
        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
            src: (__VLS_ctx.latestTask.output.outputImageUrl),
            fit: "contain",
            ...{ class: "outpaint-image" },
        }));
        const __VLS_118 = __VLS_117({
            src: (__VLS_ctx.latestTask.output.outputImageUrl),
            fit: "contain",
            ...{ class: "outpaint-image" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "toolbar-actions" },
        ...{ style: {} },
    });
    if (__VLS_ctx.latestTask.output?.outputImageUrl && props.pictureId) {
        const __VLS_120 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
            ...{ 'onClick': {} },
            type: "primary",
            plain: true,
            loading: (__VLS_ctx.applying),
        }));
        const __VLS_122 = __VLS_121({
            ...{ 'onClick': {} },
            type: "primary",
            plain: true,
            loading: (__VLS_ctx.applying),
        }, ...__VLS_functionalComponentArgsRest(__VLS_121));
        let __VLS_124;
        let __VLS_125;
        let __VLS_126;
        const __VLS_127 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.latestTask))
                    return;
                if (!(__VLS_ctx.latestTask.output?.outputImageUrl && props.pictureId))
                    return;
                __VLS_ctx.handleApplyResult();
            }
        };
        __VLS_123.slots.default;
        var __VLS_123;
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-placeholder" },
    });
}
if (__VLS_ctx.taskHistory.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "surface-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "surface-panel-header inner-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "section-subtitle" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "surface-panel-body" },
    });
    const __VLS_128 = {}.ElTable;
    /** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        data: (__VLS_ctx.taskHistory),
        stripe: true,
    }));
    const __VLS_130 = __VLS_129({
        data: (__VLS_ctx.taskHistory),
        stripe: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    __VLS_131.slots.default;
    const __VLS_132 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
        label: "任务 ID",
        minWidth: "220",
    }));
    const __VLS_134 = __VLS_133({
        label: "任务 ID",
        minWidth: "220",
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    __VLS_135.slots.default;
    {
        const { default: __VLS_thisSlot } = __VLS_135.slots;
        const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
        (scope.row.output?.taskId || '--');
    }
    var __VLS_135;
    const __VLS_136 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
        label: "状态",
        width: "140",
    }));
    const __VLS_138 = __VLS_137({
        label: "状态",
        width: "140",
    }, ...__VLS_functionalComponentArgsRest(__VLS_137));
    __VLS_139.slots.default;
    {
        const { default: __VLS_thisSlot } = __VLS_139.slots;
        const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
        const __VLS_140 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({}));
        const __VLS_142 = __VLS_141({}, ...__VLS_functionalComponentArgsRest(__VLS_141));
        __VLS_143.slots.default;
        (scope.row.output?.taskStatus || 'UNKNOWN');
        var __VLS_143;
    }
    var __VLS_139;
    const __VLS_144 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
        label: "结果图片",
        minWidth: "220",
    }));
    const __VLS_146 = __VLS_145({
        label: "结果图片",
        minWidth: "220",
    }, ...__VLS_functionalComponentArgsRest(__VLS_145));
    __VLS_147.slots.default;
    {
        const { default: __VLS_thisSlot } = __VLS_147.slots;
        const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "info-stack" },
            ...{ style: {} },
        });
        if (scope.row.output?.outputImageUrl) {
            const __VLS_148 = {}.ElLink;
            /** @type {[typeof __VLS_components.ElLink, typeof __VLS_components.elLink, typeof __VLS_components.ElLink, typeof __VLS_components.elLink, ]} */ ;
            // @ts-ignore
            const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
                href: (scope.row.output.outputImageUrl),
                target: "_blank",
                type: "primary",
            }));
            const __VLS_150 = __VLS_149({
                href: (scope.row.output.outputImageUrl),
                target: "_blank",
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_149));
            __VLS_151.slots.default;
            var __VLS_151;
        }
        if (scope.row.output?.outputImageUrl && props.pictureId) {
            const __VLS_152 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
                disabled: (__VLS_ctx.applying),
            }));
            const __VLS_154 = __VLS_153({
                ...{ 'onClick': {} },
                link: true,
                type: "primary",
                disabled: (__VLS_ctx.applying),
            }, ...__VLS_functionalComponentArgsRest(__VLS_153));
            let __VLS_156;
            let __VLS_157;
            let __VLS_158;
            const __VLS_159 = {
                onClick: (...[$event]) => {
                    if (!(__VLS_ctx.taskHistory.length))
                        return;
                    if (!(scope.row.output?.outputImageUrl && props.pictureId))
                        return;
                    __VLS_ctx.handleApplyResult(scope.row);
                }
            };
            __VLS_155.slots.default;
            var __VLS_155;
        }
        if (!scope.row.output?.outputImageUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "muted-text" },
            });
        }
    }
    var __VLS_147;
    var __VLS_131;
}
/** @type {__VLS_StyleScopedClasses['page-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['ai-panel-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['ai-panel-content']} */ ;
/** @type {__VLS_StyleScopedClasses['ai-config-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['ai-config-card']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['inner-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['ai-result-card']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['inner-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['result-card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['task-card']} */ ;
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
/** @type {__VLS_StyleScopedClasses['task-title']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-block']} */ ;
/** @type {__VLS_StyleScopedClasses['outpaint-image']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['inner-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            creating: creating,
            querying: querying,
            applying: applying,
            queryTaskId: queryTaskId,
            pictureIdInput: pictureIdInput,
            latestTask: latestTask,
            taskHistory: taskHistory,
            form: form,
            latestStatusType: latestStatusType,
            handleCreate: handleCreate,
            handleQuery: handleQuery,
            handleApplyResult: handleApplyResult,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
