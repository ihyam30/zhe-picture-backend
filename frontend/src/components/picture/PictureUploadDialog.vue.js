import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { editPicture, uploadPicture, uploadPictureByUrl } from '@/api/picture';
import SpaceSelect from '@/components/space/SpaceSelect.vue';
const props = withDefaults(defineProps(), {
    categoryOptions: () => [],
    tagOptions: () => [],
});
const emit = defineEmits();
const submitting = ref(false);
const fileList = ref([]);
const selectedFile = ref(null);
const form = reactive({
    sourceType: 'local',
    fileUrl: '',
    picName: '',
    spaceId: '',
    introduction: '',
    category: '',
    tags: [],
});
function resetForm() {
    form.sourceType = 'local';
    form.fileUrl = '';
    form.picName = '';
    form.spaceId = '';
    form.introduction = '';
    form.category = '';
    form.tags = [];
    fileList.value = [];
    selectedFile.value = null;
}
watch(() => props.modelValue, (visible) => {
    if (!visible) {
        resetForm();
    }
});
function close() {
    emit('update:modelValue', false);
}
function handleFileChange(uploadFile, uploadFiles) {
    fileList.value = uploadFiles.slice(-1);
    selectedFile.value = uploadFile.raw || null;
}
async function handleSubmit() {
    const spaceId = form.spaceId || undefined;
    if (form.sourceType === 'local' && !selectedFile.value) {
        ElMessage.warning('请先选择本地图片');
        return;
    }
    if (form.sourceType === 'url' && !form.fileUrl.trim()) {
        ElMessage.warning('请输入图片 URL');
        return;
    }
    submitting.value = true;
    try {
        let picture;
        if (form.sourceType === 'local' && selectedFile.value) {
            picture = await uploadPicture(selectedFile.value, {
                picName: form.picName || undefined,
                spaceId,
            });
        }
        else {
            picture = await uploadPictureByUrl({
                fileUrl: form.fileUrl.trim(),
                picName: form.picName || undefined,
                spaceId,
            });
        }
        const hasMoreMetadata = !!form.picName ||
            !!form.introduction ||
            !!form.category ||
            form.tags.length > 0;
        if (hasMoreMetadata && picture.id) {
            await editPicture({
                id: picture.id,
                name: form.picName || undefined,
                introduction: form.introduction || undefined,
                category: form.category || undefined,
                tags: form.tags.length ? [...form.tags] : undefined,
            });
        }
        ElMessage.success('图片上传成功');
        emit('success', picture);
        close();
    }
    finally {
        submitting.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    categoryOptions: () => [],
    tagOptions: () => [],
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['upload-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-upload-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-upload-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-upload-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-upload-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['el-textarea__inner']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-form-grid']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "创建图片",
    width: "820px",
    destroyOnClose: true,
    ...{ class: "picture-upload-dialog" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "创建图片",
    width: "820px",
    destroyOnClose: true,
    ...{ class: "picture-upload-dialog" },
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
const __VLS_9 = {}.ElTabs;
/** @type {[typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    modelValue: (__VLS_ctx.form.sourceType),
    ...{ class: "upload-tabs" },
}));
const __VLS_11 = __VLS_10({
    modelValue: (__VLS_ctx.form.sourceType),
    ...{ class: "upload-tabs" },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    label: "本地上传",
    name: "local",
}));
const __VLS_15 = __VLS_14({
    label: "本地上传",
    name: "local",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const __VLS_17 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    label: "URL 上传",
    name: "url",
}));
const __VLS_19 = __VLS_18({
    label: "URL 上传",
    name: "url",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
var __VLS_12;
const __VLS_21 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    labelWidth: "92px",
    ...{ class: "upload-form" },
}));
const __VLS_23 = __VLS_22({
    labelWidth: "92px",
    ...{ class: "upload-form" },
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_24.slots.default;
if (__VLS_ctx.form.sourceType === 'local') {
    const __VLS_25 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
        label: "图片文件",
        required: true,
    }));
    const __VLS_27 = __VLS_26({
        label: "图片文件",
        required: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    __VLS_28.slots.default;
    const __VLS_29 = {}.ElUpload;
    /** @type {[typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, ]} */ ;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
        ...{ 'onChange': {} },
        autoUpload: (false),
        limit: (1),
        fileList: (__VLS_ctx.fileList),
        listType: "picture-card",
        accept: "image/*",
        ...{ class: "upload-picker" },
    }));
    const __VLS_31 = __VLS_30({
        ...{ 'onChange': {} },
        autoUpload: (false),
        limit: (1),
        fileList: (__VLS_ctx.fileList),
        listType: "picture-card",
        accept: "image/*",
        ...{ class: "upload-picker" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    let __VLS_33;
    let __VLS_34;
    let __VLS_35;
    const __VLS_36 = {
        onChange: (__VLS_ctx.handleFileChange)
    };
    __VLS_32.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-picker-text" },
    });
    var __VLS_32;
    var __VLS_28;
}
else {
    const __VLS_37 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        label: "图片 URL",
        required: true,
    }));
    const __VLS_39 = __VLS_38({
        label: "图片 URL",
        required: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    __VLS_40.slots.default;
    const __VLS_41 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        modelValue: (__VLS_ctx.form.fileUrl),
        placeholder: "请输入可访问的图片链接",
    }));
    const __VLS_43 = __VLS_42({
        modelValue: (__VLS_ctx.form.fileUrl),
        placeholder: "请输入可访问的图片链接",
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    var __VLS_40;
}
const __VLS_45 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    label: "图片名称",
}));
const __VLS_47 = __VLS_46({
    label: "图片名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
const __VLS_49 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    modelValue: (__VLS_ctx.form.picName),
    maxlength: "40",
    showWordLimit: true,
    placeholder: "给图片起一个名称",
}));
const __VLS_51 = __VLS_50({
    modelValue: (__VLS_ctx.form.picName),
    maxlength: "40",
    showWordLimit: true,
    placeholder: "给图片起一个名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
var __VLS_48;
const __VLS_53 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    label: "所属空间",
}));
const __VLS_55 = __VLS_54({
    label: "所属空间",
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
__VLS_56.slots.default;
/** @type {[typeof SpaceSelect, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(SpaceSelect, new SpaceSelect({
    modelValue: (__VLS_ctx.form.spaceId),
    includePublic: (true),
    placeholder: "不选则上传到公共图库",
}));
const __VLS_58 = __VLS_57({
    modelValue: (__VLS_ctx.form.spaceId),
    includePublic: (true),
    placeholder: "不选则上传到公共图库",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
var __VLS_56;
const __VLS_60 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    label: "图片简介",
}));
const __VLS_62 = __VLS_61({
    label: "图片简介",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    modelValue: (__VLS_ctx.form.introduction),
    type: "textarea",
    rows: (3),
    maxlength: "240",
    showWordLimit: true,
    placeholder: "可以补充来源、用途或备注信息",
}));
const __VLS_66 = __VLS_65({
    modelValue: (__VLS_ctx.form.introduction),
    type: "textarea",
    rows: (3),
    maxlength: "240",
    showWordLimit: true,
    placeholder: "可以补充来源、用途或备注信息",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
var __VLS_63;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "upload-form-grid" },
});
const __VLS_68 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    label: "分类",
    ...{ class: "upload-form-grid-item" },
}));
const __VLS_70 = __VLS_69({
    label: "分类",
    ...{ class: "upload-form-grid-item" },
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    modelValue: (__VLS_ctx.form.category),
    clearable: true,
    filterable: true,
    ...{ style: {} },
    placeholder: "请选择分类",
}));
const __VLS_74 = __VLS_73({
    modelValue: (__VLS_ctx.form.category),
    clearable: true,
    filterable: true,
    ...{ style: {} },
    placeholder: "请选择分类",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.categoryOptions))) {
    const __VLS_76 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        key: (item),
        label: (item),
        value: (item),
    }));
    const __VLS_78 = __VLS_77({
        key: (item),
        label: (item),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
}
var __VLS_75;
var __VLS_71;
const __VLS_80 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    label: "标签",
    ...{ class: "upload-form-grid-item" },
}));
const __VLS_82 = __VLS_81({
    label: "标签",
    ...{ class: "upload-form-grid-item" },
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
const __VLS_84 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    modelValue: (__VLS_ctx.form.tags),
    multiple: true,
    filterable: true,
    allowCreate: true,
    defaultFirstOption: true,
    ...{ style: {} },
    placeholder: "选择或输入标签",
}));
const __VLS_86 = __VLS_85({
    modelValue: (__VLS_ctx.form.tags),
    multiple: true,
    filterable: true,
    allowCreate: true,
    defaultFirstOption: true,
    ...{ style: {} },
    placeholder: "选择或输入标签",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.tagOptions))) {
    const __VLS_88 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        key: (item),
        label: (item),
        value: (item),
    }));
    const __VLS_90 = __VLS_89({
        key: (item),
        label: (item),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
}
var __VLS_87;
var __VLS_83;
var __VLS_24;
{
    const { footer: __VLS_thisSlot } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dialog-footer" },
    });
    const __VLS_92 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        ...{ 'onClick': {} },
    }));
    const __VLS_94 = __VLS_93({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    let __VLS_96;
    let __VLS_97;
    let __VLS_98;
    const __VLS_99 = {
        onClick: (__VLS_ctx.close)
    };
    __VLS_95.slots.default;
    var __VLS_95;
    const __VLS_100 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }));
    const __VLS_102 = __VLS_101({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    let __VLS_104;
    let __VLS_105;
    let __VLS_106;
    const __VLS_107 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_103.slots.default;
    (__VLS_ctx.submitting ? '上传中...' : '开始创建');
    var __VLS_103;
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['picture-upload-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['dialog-intro']} */ ;
/** @type {__VLS_StyleScopedClasses['dialog-intro-title']} */ ;
/** @type {__VLS_StyleScopedClasses['dialog-intro-text']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-form']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-picker-text']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-form-grid-item']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-form-grid-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dialog-footer']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SpaceSelect: SpaceSelect,
            submitting: submitting,
            fileList: fileList,
            form: form,
            close: close,
            handleFileChange: handleFileChange,
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
