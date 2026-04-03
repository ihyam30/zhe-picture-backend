import { reactive, watch } from 'vue';
const props = withDefaults(defineProps(), {
    initialValue: null,
    levels: () => [],
    loading: false,
});
const emit = defineEmits();
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
watch(() => props.modelValue, (visible) => {
    if (visible) {
        fillForm();
    }
}, { immediate: true });
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    initialValue: null,
    levels: () => [],
    loading: false,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: (__VLS_ctx.mode === 'create' ? '创建空间' : '编辑空间'),
    width: "540px",
    destroyOnClose: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: (__VLS_ctx.mode === 'create' ? '创建空间' : '编辑空间'),
    width: "540px",
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
    labelWidth: "92px",
}));
const __VLS_11 = __VLS_10({
    labelWidth: "92px",
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    label: "空间名称",
    required: true,
}));
const __VLS_15 = __VLS_14({
    label: "空间名称",
    required: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
const __VLS_17 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    modelValue: (__VLS_ctx.form.spaceName),
    maxlength: "30",
    showWordLimit: true,
    placeholder: "请输入空间名称",
}));
const __VLS_19 = __VLS_18({
    modelValue: (__VLS_ctx.form.spaceName),
    maxlength: "30",
    showWordLimit: true,
    placeholder: "请输入空间名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
var __VLS_16;
if (__VLS_ctx.mode === 'create') {
    const __VLS_21 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
        label: "空间等级",
    }));
    const __VLS_23 = __VLS_22({
        label: "空间等级",
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    __VLS_24.slots.default;
    const __VLS_25 = {}.ElSelect;
    /** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
        modelValue: (__VLS_ctx.form.spaceLevel),
        ...{ style: {} },
        placeholder: "请选择等级",
    }));
    const __VLS_27 = __VLS_26({
        modelValue: (__VLS_ctx.form.spaceLevel),
        ...{ style: {} },
        placeholder: "请选择等级",
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    __VLS_28.slots.default;
    for (const [level] of __VLS_getVForSourceType((__VLS_ctx.levels))) {
        const __VLS_29 = {}.ElOption;
        /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
        // @ts-ignore
        const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
            key: (level.value),
            label: (`${level.text} / ${level.maxCount} 张 / ${level.maxSize}`),
            value: (level.value),
        }));
        const __VLS_31 = __VLS_30({
            key: (level.value),
            label: (`${level.text} / ${level.maxCount} 张 / ${level.maxSize}`),
            value: (level.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    }
    var __VLS_28;
    var __VLS_24;
}
if (__VLS_ctx.mode === 'create') {
    const __VLS_33 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        label: "空间类型",
    }));
    const __VLS_35 = __VLS_34({
        label: "空间类型",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    __VLS_36.slots.default;
    const __VLS_37 = {}.ElRadioGroup;
    /** @type {[typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        modelValue: (__VLS_ctx.form.spaceType),
    }));
    const __VLS_39 = __VLS_38({
        modelValue: (__VLS_ctx.form.spaceType),
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    __VLS_40.slots.default;
    const __VLS_41 = {}.ElRadio;
    /** @type {[typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        value: (0),
    }));
    const __VLS_43 = __VLS_42({
        value: (0),
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    __VLS_44.slots.default;
    var __VLS_44;
    const __VLS_45 = {}.ElRadio;
    /** @type {[typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
        value: (1),
    }));
    const __VLS_47 = __VLS_46({
        value: (1),
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    __VLS_48.slots.default;
    var __VLS_48;
    var __VLS_40;
    var __VLS_36;
}
if (__VLS_ctx.mode === 'edit') {
    const __VLS_49 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        title: "按你当前后端接口，编辑态主要修改空间名称；等级和类型建议在创建时确认。",
        type: "info",
        closable: (false),
        showIcon: true,
    }));
    const __VLS_51 = __VLS_50({
        title: "按你当前后端接口，编辑态主要修改空间名称；等级和类型建议在创建时确认。",
        type: "info",
        closable: (false),
        showIcon: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
}
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
    (__VLS_ctx.mode === 'create' ? '创建空间' : '保存修改');
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
