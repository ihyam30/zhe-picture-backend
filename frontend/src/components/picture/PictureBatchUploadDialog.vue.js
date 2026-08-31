import { reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { uploadPictureBatch } from '@/api/picture';
const props = defineProps();
const emit = defineEmits();
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
watch(() => props.modelValue, (visible) => {
    if (!visible) {
        resetForm();
    }
});
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
    }
    finally {
        submitting.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['picture-batch-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-batch-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-batch-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-batch-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['el-input-number']} */ ;
/** @type {__VLS_StyleScopedClasses['el-input__wrapper']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "批量创建图片",
    width: "640px",
    destroyOnClose: true,
    ...{ class: "picture-batch-dialog" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "批量创建图片",
    width: "640px",
    destroyOnClose: true,
    ...{ class: "picture-batch-dialog" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClose: (__VLS_ctx.close)
};
var __VLS_8 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dialog-intro" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dialog-intro-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dialog-intro-text" },
});
const __VLS_9 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    labelWidth: "104px",
    ...{ class: "batch-form" },
}));
const __VLS_11 = __VLS_10({
    labelWidth: "104px",
    ...{ class: "batch-form" },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    label: "抓取关键词",
    required: true,
}));
const __VLS_15 = __VLS_14({
    label: "抓取关键词",
    required: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
const __VLS_17 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    modelValue: (__VLS_ctx.form.searchText),
    placeholder: "例如：篮球壁纸、科技海报、校园插画",
    clearable: true,
}));
const __VLS_19 = __VLS_18({
    modelValue: (__VLS_ctx.form.searchText),
    placeholder: "例如：篮球壁纸、科技海报、校园插画",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
var __VLS_16;
const __VLS_21 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    label: "抓取数量",
    required: true,
}));
const __VLS_23 = __VLS_22({
    label: "抓取数量",
    required: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_24.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "count-row" },
});
const __VLS_25 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    modelValue: (__VLS_ctx.form.count),
    min: (1),
    max: (30),
    step: (1),
}));
const __VLS_27 = __VLS_26({
    modelValue: (__VLS_ctx.form.count),
    min: (1),
    max: (30),
    step: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "helper-text" },
});
var __VLS_24;
const __VLS_29 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    label: "名称前缀",
}));
const __VLS_31 = __VLS_30({
    label: "名称前缀",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
__VLS_32.slots.default;
const __VLS_33 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    modelValue: (__VLS_ctx.form.namePrefix),
    placeholder: "不填则默认使用关键词作为名称前缀",
    clearable: true,
}));
const __VLS_35 = __VLS_34({
    modelValue: (__VLS_ctx.form.namePrefix),
    placeholder: "不填则默认使用关键词作为名称前缀",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
var __VLS_32;
var __VLS_12;
{
    const { footer: __VLS_thisSlot } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dialog-footer" },
    });
    const __VLS_37 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        ...{ 'onClick': {} },
    }));
    const __VLS_39 = __VLS_38({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    let __VLS_41;
    let __VLS_42;
    let __VLS_43;
    const __VLS_44 = {
        onClick: (__VLS_ctx.close)
    };
    __VLS_40.slots.default;
    var __VLS_40;
    const __VLS_45 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting.value),
    }));
    const __VLS_47 = __VLS_46({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    let __VLS_49;
    let __VLS_50;
    let __VLS_51;
    const __VLS_52 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_48.slots.default;
    (__VLS_ctx.submitting.value ? '批量创建中...' : '开始批量创建');
    var __VLS_48;
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['picture-batch-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['dialog-intro']} */ ;
/** @type {__VLS_StyleScopedClasses['dialog-intro-title']} */ ;
/** @type {__VLS_StyleScopedClasses['dialog-intro-text']} */ ;
/** @type {__VLS_StyleScopedClasses['batch-form']} */ ;
/** @type {__VLS_StyleScopedClasses['count-row']} */ ;
/** @type {__VLS_StyleScopedClasses['helper-text']} */ ;
/** @type {__VLS_StyleScopedClasses['dialog-footer']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            form: form,
            submitting: submitting,
            close: close,
            handleSubmit: handleSubmit,
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
