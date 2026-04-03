import { reactive, watch } from 'vue';
const props = withDefaults(defineProps(), {
    picture: null,
    categoryOptions: () => [],
    tagOptions: () => [],
    loading: false,
});
const emit = defineEmits();
const form = reactive({
    id: '',
    name: '',
    introduction: '',
    category: '',
    tags: [],
});
function fillForm() {
    form.id = props.picture?.id ? String(props.picture.id) : '';
    form.name = props.picture?.name || '';
    form.introduction = props.picture?.introduction || '';
    form.category = props.picture?.category || '';
    form.tags = props.picture?.tags ? [...props.picture.tags] : [];
}
watch(() => props.modelValue, (visible) => {
    if (visible) {
        fillForm();
    }
}, { immediate: true });
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    picture: null,
    categoryOptions: () => [],
    tagOptions: () => [],
    loading: false,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "编辑图片信息",
    width: "680px",
    destroyOnClose: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "编辑图片信息",
    width: "680px",
    destroyOnClose: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClose: (__VLS_ctx.close)
};
var __VLS_8 = {};
__VLS_3.slots.default;
const __VLS_9 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    labelWidth: "90px",
}));
const __VLS_11 = __VLS_10({
    labelWidth: "90px",
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    label: "名称",
}));
const __VLS_15 = __VLS_14({
    label: "名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
const __VLS_17 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    modelValue: (__VLS_ctx.form.name),
    maxlength: "40",
    showWordLimit: true,
    placeholder: "请输入图片名称",
}));
const __VLS_19 = __VLS_18({
    modelValue: (__VLS_ctx.form.name),
    maxlength: "40",
    showWordLimit: true,
    placeholder: "请输入图片名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
var __VLS_16;
const __VLS_21 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    label: "简介",
}));
const __VLS_23 = __VLS_22({
    label: "简介",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_24.slots.default;
const __VLS_25 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    modelValue: (__VLS_ctx.form.introduction),
    type: "textarea",
    rows: (4),
    maxlength: "240",
    showWordLimit: true,
    placeholder: "简单描述一下图片内容或用途",
}));
const __VLS_27 = __VLS_26({
    modelValue: (__VLS_ctx.form.introduction),
    type: "textarea",
    rows: (4),
    maxlength: "240",
    showWordLimit: true,
    placeholder: "简单描述一下图片内容或用途",
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
var __VLS_24;
const __VLS_29 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    label: "分类",
}));
const __VLS_31 = __VLS_30({
    label: "分类",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
__VLS_32.slots.default;
const __VLS_33 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    modelValue: (__VLS_ctx.form.category),
    clearable: true,
    filterable: true,
    ...{ style: {} },
    placeholder: "请选择分类",
}));
const __VLS_35 = __VLS_34({
    modelValue: (__VLS_ctx.form.category),
    clearable: true,
    filterable: true,
    ...{ style: {} },
    placeholder: "请选择分类",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
__VLS_36.slots.default;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.categoryOptions))) {
    const __VLS_37 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        key: (item),
        label: (item),
        value: (item),
    }));
    const __VLS_39 = __VLS_38({
        key: (item),
        label: (item),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
}
var __VLS_36;
var __VLS_32;
const __VLS_41 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    label: "标签",
}));
const __VLS_43 = __VLS_42({
    label: "标签",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
__VLS_44.slots.default;
const __VLS_45 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    modelValue: (__VLS_ctx.form.tags),
    multiple: true,
    filterable: true,
    allowCreate: true,
    defaultFirstOption: true,
    ...{ style: {} },
    placeholder: "选择或直接输入标签",
}));
const __VLS_47 = __VLS_46({
    modelValue: (__VLS_ctx.form.tags),
    multiple: true,
    filterable: true,
    allowCreate: true,
    defaultFirstOption: true,
    ...{ style: {} },
    placeholder: "选择或直接输入标签",
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.tagOptions))) {
    const __VLS_49 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        key: (item),
        label: (item),
        value: (item),
    }));
    const __VLS_51 = __VLS_50({
        key: (item),
        label: (item),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
}
var __VLS_48;
var __VLS_44;
var __VLS_12;
{
    const { footer: __VLS_thisSlot } = __VLS_3.slots;
    const __VLS_53 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        ...{ 'onClick': {} },
    }));
    const __VLS_55 = __VLS_54({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    let __VLS_57;
    let __VLS_58;
    let __VLS_59;
    const __VLS_60 = {
        onClick: (__VLS_ctx.close)
    };
    __VLS_56.slots.default;
    var __VLS_56;
    const __VLS_61 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.loading),
    }));
    const __VLS_63 = __VLS_62({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.loading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    let __VLS_65;
    let __VLS_66;
    let __VLS_67;
    const __VLS_68 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_64.slots.default;
    var __VLS_64;
}
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            form: form,
            close: close,
            handleSubmit: handleSubmit,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
