import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deletePicture, editPicture, getPictureTagCategory, listPicturesByPage, searchPictureByColor, } from '@/api/picture';
import PictureBatchUploadDialog from '@/components/picture/PictureBatchUploadDialog.vue';
import PictureEditDialog from '@/components/picture/PictureEditDialog.vue';
import PictureUploadDialog from '@/components/picture/PictureUploadDialog.vue';
import SpaceSelect from '@/components/space/SpaceSelect.vue';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { formatDateTime, formatFileSize, formatReviewStatus, reviewStatusTagType, } from '@/utils/format';
const router = useRouter();
const loading = ref(false);
const uploadVisible = ref(false);
const batchUploadVisible = ref(false);
const editVisible = ref(false);
const editLoading = ref(false);
const selectedPicture = ref(null);
const tagOptions = ref([]);
const categoryOptions = ref([]);
const spaces = ref([]);
const colorSearchMode = ref(false);
const colorSearchResults = ref([]);
const pagination = reactive({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
});
const filters = reactive({
    keyword: '',
    category: '',
    tags: [],
    reviewStatus: undefined,
    spaceId: '',
    colorValue: '#409EFF',
});
const tableData = ref([]);
const spaceMap = computed(() => {
    const map = new Map();
    spaces.value.forEach((item) => {
        map.set(String(item.id), item);
    });
    return map;
});
const currentRows = computed(() => {
    if (!colorSearchMode.value) {
        return tableData.value;
    }
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return colorSearchResults.value.slice(start, end);
});
const totalText = computed(() => {
    if (colorSearchMode.value) {
        return `主色搜索结果 ${colorSearchResults.value.length} 张`;
    }
    return `共 ${pagination.total} 张图片`;
});
async function loadMeta() {
    const result = await getPictureTagCategory();
    tagOptions.value = result.tagList || [];
    categoryOptions.value = result.categoryList || [];
}
async function loadPictures() {
    loading.value = true;
    try {
        const result = await listPicturesByPage({
            current: pagination.current,
            pageSize: pagination.pageSize,
            searchText: filters.keyword || undefined,
            name: filters.keyword || undefined,
            category: filters.category || undefined,
            tags: filters.tags.length ? [...filters.tags] : undefined,
            reviewStatus: filters.reviewStatus,
            spaceId: filters.spaceId || undefined,
            sortField: 'updateTime',
            sortOrder: 'descend',
        });
        tableData.value = result.records;
        pagination.total = result.total;
    }
    finally {
        loading.value = false;
    }
}
async function handleSearch() {
    colorSearchMode.value = false;
    colorSearchResults.value = [];
    pagination.current = 1;
    await loadPictures();
}
async function handleColorSearch() {
    if (!filters.spaceId) {
        ElMessage.warning('按主色搜索仅支持空间内图片，请先选择一个空间');
        return;
    }
    loading.value = true;
    try {
        const result = await searchPictureByColor({
            spaceId: filters.spaceId,
            picColor: filters.colorValue,
        });
        colorSearchResults.value = result;
        colorSearchMode.value = true;
        pagination.current = 1;
        pagination.total = result.length;
    }
    finally {
        loading.value = false;
    }
}
function handleReset() {
    filters.keyword = '';
    filters.category = '';
    filters.tags = [];
    filters.reviewStatus = undefined;
    filters.spaceId = '';
    filters.colorValue = '#409EFF';
    colorSearchMode.value = false;
    colorSearchResults.value = [];
    pagination.current = 1;
    void loadPictures();
}
function handlePageChange() {
    if (colorSearchMode.value) {
        return;
    }
    void loadPictures();
}
function handleSizeChange() {
    pagination.current = 1;
    if (colorSearchMode.value) {
        return;
    }
    void loadPictures();
}
function openEdit(row) {
    selectedPicture.value = row;
    editVisible.value = true;
}
async function handleEditSubmit(payload) {
    editLoading.value = true;
    try {
        await editPicture(payload);
        ElMessage.success('图片信息已更新');
        editVisible.value = false;
        if (colorSearchMode.value) {
            await handleColorSearch();
        }
        else {
            await loadPictures();
        }
    }
    finally {
        editLoading.value = false;
    }
}
async function handleDelete(row) {
    await ElMessageBox.confirm(`确定删除图片“${row.name || row.id}”吗？`, '删除确认', {
        type: 'warning',
    });
    await deletePicture(row.id);
    ElMessage.success('图片已删除');
    if (colorSearchMode.value) {
        await handleColorSearch();
    }
    else {
        await loadPictures();
    }
}
function handleSpaceLoaded(items) {
    spaces.value = items;
}
async function handleBatchSuccess() {
    colorSearchMode.value = false;
    colorSearchResults.value = [];
    pagination.current = 1;
    await loadPictures();
}
onMounted(async () => {
    await Promise.all([loadMeta(), loadPictures()]);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['picture-manage-page']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-page-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-page picture-manage-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header picture-page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "picture-page-heading" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "page-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "page-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-actions picture-page-actions" },
});
const __VLS_0 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (...[$event]) => {
        __VLS_ctx.uploadVisible = true;
    }
};
__VLS_3.slots.default;
var __VLS_3;
const __VLS_8 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    plain: true,
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    plain: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (...[$event]) => {
        __VLS_ctx.batchUploadVisible = true;
    }
};
__VLS_11.slots.default;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body filter-panel-body" },
});
const __VLS_16 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    labelWidth: "0",
}));
const __VLS_18 = __VLS_17({
    labelWidth: "0",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ElRow;
/** @type {[typeof __VLS_components.ElRow, typeof __VLS_components.elRow, typeof __VLS_components.ElRow, typeof __VLS_components.elRow, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    gutter: (16),
}));
const __VLS_22 = __VLS_21({
    gutter: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    xl: (5),
    lg: (6),
    md: (12),
    sm: (12),
    xs: (24),
}));
const __VLS_26 = __VLS_25({
    xl: (5),
    lg: (6),
    md: (12),
    sm: (12),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({}));
const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "filter-label" },
});
const __VLS_32 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    modelValue: (__VLS_ctx.filters.keyword),
    clearable: true,
    placeholder: "从名称和简介搜索",
}));
const __VLS_34 = __VLS_33({
    modelValue: (__VLS_ctx.filters.keyword),
    clearable: true,
    placeholder: "从名称和简介搜索",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
var __VLS_31;
var __VLS_27;
const __VLS_36 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    xl: (4),
    lg: (5),
    md: (12),
    sm: (12),
    xs: (24),
}));
const __VLS_38 = __VLS_37({
    xl: (4),
    lg: (5),
    md: (12),
    sm: (12),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
const __VLS_40 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({}));
const __VLS_42 = __VLS_41({}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "filter-label" },
});
const __VLS_44 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    modelValue: (__VLS_ctx.filters.category),
    clearable: true,
    filterable: true,
    placeholder: "请选择类型",
}));
const __VLS_46 = __VLS_45({
    modelValue: (__VLS_ctx.filters.category),
    clearable: true,
    filterable: true,
    placeholder: "请选择类型",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.categoryOptions))) {
    const __VLS_48 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        key: (item),
        label: (item),
        value: (item),
    }));
    const __VLS_50 = __VLS_49({
        key: (item),
        label: (item),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
}
var __VLS_47;
var __VLS_43;
var __VLS_39;
const __VLS_52 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    xl: (4),
    lg: (5),
    md: (12),
    sm: (12),
    xs: (24),
}));
const __VLS_54 = __VLS_53({
    xl: (4),
    lg: (5),
    md: (12),
    sm: (12),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({}));
const __VLS_58 = __VLS_57({}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "filter-label" },
});
const __VLS_60 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    modelValue: (__VLS_ctx.filters.tags),
    multiple: true,
    collapseTags: true,
    collapseTagsTooltip: true,
    placeholder: "请选择标签",
}));
const __VLS_62 = __VLS_61({
    modelValue: (__VLS_ctx.filters.tags),
    multiple: true,
    collapseTags: true,
    collapseTagsTooltip: true,
    placeholder: "请选择标签",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.tagOptions))) {
    const __VLS_64 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        key: (item),
        label: (item),
        value: (item),
    }));
    const __VLS_66 = __VLS_65({
        key: (item),
        label: (item),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
}
var __VLS_63;
var __VLS_59;
var __VLS_55;
var __VLS_23;
const __VLS_68 = {}.ElRow;
/** @type {[typeof __VLS_components.ElRow, typeof __VLS_components.elRow, typeof __VLS_components.ElRow, typeof __VLS_components.elRow, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    gutter: (16),
}));
const __VLS_70 = __VLS_69({
    gutter: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    xl: (4),
    lg: (5),
    md: (12),
    sm: (12),
    xs: (24),
}));
const __VLS_74 = __VLS_73({
    xl: (4),
    lg: (5),
    md: (12),
    sm: (12),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
const __VLS_76 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({}));
const __VLS_78 = __VLS_77({}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "filter-label" },
});
const __VLS_80 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    modelValue: (__VLS_ctx.filters.reviewStatus),
    clearable: true,
    placeholder: "请选择审核状态",
}));
const __VLS_82 = __VLS_81({
    modelValue: (__VLS_ctx.filters.reviewStatus),
    clearable: true,
    placeholder: "请选择审核状态",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
const __VLS_84 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    label: "待审核",
    value: (0),
}));
const __VLS_86 = __VLS_85({
    label: "待审核",
    value: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
const __VLS_88 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    label: "审核通过",
    value: (1),
}));
const __VLS_90 = __VLS_89({
    label: "审核通过",
    value: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
const __VLS_92 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    label: "审核拒绝",
    value: (2),
}));
const __VLS_94 = __VLS_93({
    label: "审核拒绝",
    value: (2),
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
var __VLS_83;
var __VLS_79;
var __VLS_75;
const __VLS_96 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    xl: (5),
    lg: (6),
    md: (12),
    sm: (12),
    xs: (24),
}));
const __VLS_98 = __VLS_97({
    xl: (5),
    lg: (6),
    md: (12),
    sm: (12),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
__VLS_99.slots.default;
const __VLS_100 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({}));
const __VLS_102 = __VLS_101({}, ...__VLS_functionalComponentArgsRest(__VLS_101));
__VLS_103.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "filter-label" },
});
/** @type {[typeof SpaceSelect, ]} */ ;
// @ts-ignore
const __VLS_104 = __VLS_asFunctionalComponent(SpaceSelect, new SpaceSelect({
    ...{ 'onLoaded': {} },
    modelValue: (__VLS_ctx.filters.spaceId),
    includePublic: true,
    placeholder: "选择公共图库或空间",
}));
const __VLS_105 = __VLS_104({
    ...{ 'onLoaded': {} },
    modelValue: (__VLS_ctx.filters.spaceId),
    includePublic: true,
    placeholder: "选择公共图库或空间",
}, ...__VLS_functionalComponentArgsRest(__VLS_104));
let __VLS_107;
let __VLS_108;
let __VLS_109;
const __VLS_110 = {
    onLoaded: (__VLS_ctx.handleSpaceLoaded)
};
var __VLS_106;
var __VLS_103;
var __VLS_99;
var __VLS_71;
const __VLS_111 = {}.ElRow;
/** @type {[typeof __VLS_components.ElRow, typeof __VLS_components.elRow, typeof __VLS_components.ElRow, typeof __VLS_components.elRow, ]} */ ;
// @ts-ignore
const __VLS_112 = __VLS_asFunctionalComponent(__VLS_111, new __VLS_111({
    gutter: (16),
    ...{ class: "color-filter-row" },
}));
const __VLS_113 = __VLS_112({
    gutter: (16),
    ...{ class: "color-filter-row" },
}, ...__VLS_functionalComponentArgsRest(__VLS_112));
__VLS_114.slots.default;
const __VLS_115 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_116 = __VLS_asFunctionalComponent(__VLS_115, new __VLS_115({
    xl: (6),
    lg: (7),
    md: (12),
    sm: (12),
    xs: (24),
}));
const __VLS_117 = __VLS_116({
    xl: (6),
    lg: (7),
    md: (12),
    sm: (12),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_116));
__VLS_118.slots.default;
const __VLS_119 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_120 = __VLS_asFunctionalComponent(__VLS_119, new __VLS_119({}));
const __VLS_121 = __VLS_120({}, ...__VLS_functionalComponentArgsRest(__VLS_120));
__VLS_122.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "filter-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "color-input-row" },
});
const __VLS_123 = {}.ElColorPicker;
/** @type {[typeof __VLS_components.ElColorPicker, typeof __VLS_components.elColorPicker, ]} */ ;
// @ts-ignore
const __VLS_124 = __VLS_asFunctionalComponent(__VLS_123, new __VLS_123({
    modelValue: (__VLS_ctx.filters.colorValue),
}));
const __VLS_125 = __VLS_124({
    modelValue: (__VLS_ctx.filters.colorValue),
}, ...__VLS_functionalComponentArgsRest(__VLS_124));
const __VLS_127 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_128 = __VLS_asFunctionalComponent(__VLS_127, new __VLS_127({
    modelValue: (__VLS_ctx.filters.colorValue),
    placeholder: "#409EFF",
}));
const __VLS_129 = __VLS_128({
    modelValue: (__VLS_ctx.filters.colorValue),
    placeholder: "#409EFF",
}, ...__VLS_functionalComponentArgsRest(__VLS_128));
var __VLS_122;
var __VLS_118;
const __VLS_131 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_132 = __VLS_asFunctionalComponent(__VLS_131, new __VLS_131({
    xl: (6),
    lg: (7),
    md: (12),
    sm: (12),
    xs: (24),
}));
const __VLS_133 = __VLS_132({
    xl: (6),
    lg: (7),
    md: (12),
    sm: (12),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_132));
__VLS_134.slots.default;
const __VLS_135 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_136 = __VLS_asFunctionalComponent(__VLS_135, new __VLS_135({}));
const __VLS_137 = __VLS_136({}, ...__VLS_functionalComponentArgsRest(__VLS_136));
__VLS_138.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar-actions filter-actions" },
});
const __VLS_139 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_140 = __VLS_asFunctionalComponent(__VLS_139, new __VLS_139({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
}));
const __VLS_141 = __VLS_140({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_140));
let __VLS_143;
let __VLS_144;
let __VLS_145;
const __VLS_146 = {
    onClick: (__VLS_ctx.handleSearch)
};
__VLS_142.slots.default;
var __VLS_142;
const __VLS_147 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_148 = __VLS_asFunctionalComponent(__VLS_147, new __VLS_147({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}));
const __VLS_149 = __VLS_148({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_148));
let __VLS_151;
let __VLS_152;
let __VLS_153;
const __VLS_154 = {
    onClick: (__VLS_ctx.handleColorSearch)
};
__VLS_150.slots.default;
var __VLS_150;
const __VLS_155 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_156 = __VLS_asFunctionalComponent(__VLS_155, new __VLS_155({
    ...{ 'onClick': {} },
}));
const __VLS_157 = __VLS_156({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_156));
let __VLS_159;
let __VLS_160;
let __VLS_161;
const __VLS_162 = {
    onClick: (__VLS_ctx.handleReset)
};
__VLS_158.slots.default;
var __VLS_158;
var __VLS_138;
var __VLS_134;
var __VLS_114;
var __VLS_19;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body list-panel-body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "list-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
(__VLS_ctx.colorSearchMode ? '主色匹配结果' : '图片列表');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-subtitle" },
});
(__VLS_ctx.totalText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-shell" },
});
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
const __VLS_163 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_164 = __VLS_asFunctionalComponent(__VLS_163, new __VLS_163({
    data: (__VLS_ctx.currentRows),
    stripe: true,
    height: "620",
}));
const __VLS_165 = __VLS_164({
    data: (__VLS_ctx.currentRows),
    stripe: true,
    height: "620",
}, ...__VLS_functionalComponentArgsRest(__VLS_164));
__VLS_166.slots.default;
const __VLS_167 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_168 = __VLS_asFunctionalComponent(__VLS_167, new __VLS_167({
    label: "ID",
    width: "170",
}));
const __VLS_169 = __VLS_168({
    label: "ID",
    width: "170",
}, ...__VLS_functionalComponentArgsRest(__VLS_168));
__VLS_170.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_170.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.id);
}
var __VLS_170;
const __VLS_171 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_172 = __VLS_asFunctionalComponent(__VLS_171, new __VLS_171({
    label: "图片",
    width: "180",
}));
const __VLS_173 = __VLS_172({
    label: "图片",
    width: "180",
}, ...__VLS_functionalComponentArgsRest(__VLS_172));
__VLS_174.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_174.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (scope.row.thumbnailUrl || scope.row.url),
        ...{ class: "table-thumb" },
    });
}
var __VLS_174;
const __VLS_175 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_176 = __VLS_asFunctionalComponent(__VLS_175, new __VLS_175({
    label: "名称",
    minWidth: "190",
}));
const __VLS_177 = __VLS_176({
    label: "名称",
    minWidth: "190",
}, ...__VLS_functionalComponentArgsRest(__VLS_176));
__VLS_178.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_178.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-stack" },
    });
    const __VLS_179 = {}.ElLink;
    /** @type {[typeof __VLS_components.ElLink, typeof __VLS_components.elLink, typeof __VLS_components.ElLink, typeof __VLS_components.elLink, ]} */ ;
    // @ts-ignore
    const __VLS_180 = __VLS_asFunctionalComponent(__VLS_179, new __VLS_179({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_181 = __VLS_180({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_180));
    let __VLS_183;
    let __VLS_184;
    let __VLS_185;
    const __VLS_186 = {
        onClick: (...[$event]) => {
            __VLS_ctx.router.push(`/pictures/${scope.row.id}`);
        }
    };
    __VLS_182.slots.default;
    (scope.row.name || `图片 ${scope.row.id}`);
    var __VLS_182;
}
var __VLS_178;
const __VLS_187 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_188 = __VLS_asFunctionalComponent(__VLS_187, new __VLS_187({
    label: "简介",
    minWidth: "160",
}));
const __VLS_189 = __VLS_188({
    label: "简介",
    minWidth: "160",
}, ...__VLS_functionalComponentArgsRest(__VLS_188));
__VLS_190.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_190.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.introduction || '--');
}
var __VLS_190;
const __VLS_191 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_192 = __VLS_asFunctionalComponent(__VLS_191, new __VLS_191({
    label: "类型",
    minWidth: "100",
}));
const __VLS_193 = __VLS_192({
    label: "类型",
    minWidth: "100",
}, ...__VLS_functionalComponentArgsRest(__VLS_192));
__VLS_194.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_194.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.category || '--');
}
var __VLS_194;
const __VLS_195 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_196 = __VLS_asFunctionalComponent(__VLS_195, new __VLS_195({
    label: "标签",
    minWidth: "160",
}));
const __VLS_197 = __VLS_196({
    label: "标签",
    minWidth: "160",
}, ...__VLS_functionalComponentArgsRest(__VLS_196));
__VLS_198.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_198.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "inline-tags" },
    });
    for (const [tag] of __VLS_getVForSourceType((scope.row.tags || []))) {
        const __VLS_199 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_200 = __VLS_asFunctionalComponent(__VLS_199, new __VLS_199({
            key: (tag),
            round: true,
        }));
        const __VLS_201 = __VLS_200({
            key: (tag),
            round: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_200));
        __VLS_202.slots.default;
        (tag);
        var __VLS_202;
    }
}
var __VLS_198;
const __VLS_203 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_204 = __VLS_asFunctionalComponent(__VLS_203, new __VLS_203({
    label: "图片信息",
    minWidth: "190",
}));
const __VLS_205 = __VLS_204({
    label: "图片信息",
    minWidth: "190",
}, ...__VLS_functionalComponentArgsRest(__VLS_204));
__VLS_206.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_206.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-stack" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.picFormat || '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.picWidth || '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.picHeight || '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.picScale || '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.formatFileSize(scope.row.picSize));
    if (scope.row.picColor) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (scope.row.picColor);
    }
}
var __VLS_206;
const __VLS_207 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_208 = __VLS_asFunctionalComponent(__VLS_207, new __VLS_207({
    label: "归属信息",
    minWidth: "190",
}));
const __VLS_209 = __VLS_208({
    label: "归属信息",
    minWidth: "190",
}, ...__VLS_functionalComponentArgsRest(__VLS_208));
__VLS_210.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_210.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-stack" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.userId || '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "muted-text" },
    });
    (scope.row.spaceId ? __VLS_ctx.spaceMap.get(String(scope.row.spaceId))?.spaceName || `空间 ${scope.row.spaceId}` : '公共图库');
}
var __VLS_210;
const __VLS_211 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_212 = __VLS_asFunctionalComponent(__VLS_211, new __VLS_211({
    label: "审核信息",
    minWidth: "210",
}));
const __VLS_213 = __VLS_212({
    label: "审核信息",
    minWidth: "210",
}, ...__VLS_functionalComponentArgsRest(__VLS_212));
__VLS_214.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_214.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-stack" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    const __VLS_215 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_216 = __VLS_asFunctionalComponent(__VLS_215, new __VLS_215({
        type: (__VLS_ctx.reviewStatusTagType(scope.row.reviewStatus)),
    }));
    const __VLS_217 = __VLS_216({
        type: (__VLS_ctx.reviewStatusTagType(scope.row.reviewStatus)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_216));
    __VLS_218.slots.default;
    (__VLS_ctx.formatReviewStatus(scope.row.reviewStatus));
    var __VLS_218;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.reviewMessage || '--');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.reviewerId || '--');
}
var __VLS_214;
const __VLS_219 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_220 = __VLS_asFunctionalComponent(__VLS_219, new __VLS_219({
    label: "创建时间",
    minWidth: "180",
}));
const __VLS_221 = __VLS_220({
    label: "创建时间",
    minWidth: "180",
}, ...__VLS_functionalComponentArgsRest(__VLS_220));
__VLS_222.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_222.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    (__VLS_ctx.formatDateTime(scope.row.createTime));
}
var __VLS_222;
const __VLS_223 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_224 = __VLS_asFunctionalComponent(__VLS_223, new __VLS_223({
    label: "编辑时间",
    minWidth: "180",
}));
const __VLS_225 = __VLS_224({
    label: "编辑时间",
    minWidth: "180",
}, ...__VLS_functionalComponentArgsRest(__VLS_224));
__VLS_226.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_226.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    (__VLS_ctx.formatDateTime(scope.row.editTime));
}
var __VLS_226;
const __VLS_227 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_228 = __VLS_asFunctionalComponent(__VLS_227, new __VLS_227({
    label: "操作",
    fixed: "right",
    width: "120",
}));
const __VLS_229 = __VLS_228({
    label: "操作",
    fixed: "right",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_228));
__VLS_230.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_230.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-stack action-stack" },
    });
    const __VLS_231 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_232 = __VLS_asFunctionalComponent(__VLS_231, new __VLS_231({
        ...{ 'onClick': {} },
        link: true,
        type: "primary",
    }));
    const __VLS_233 = __VLS_232({
        ...{ 'onClick': {} },
        link: true,
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_232));
    let __VLS_235;
    let __VLS_236;
    let __VLS_237;
    const __VLS_238 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openEdit(scope.row);
        }
    };
    __VLS_234.slots.default;
    var __VLS_234;
    const __VLS_239 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_240 = __VLS_asFunctionalComponent(__VLS_239, new __VLS_239({
        ...{ 'onClick': {} },
        link: true,
        type: "danger",
    }));
    const __VLS_241 = __VLS_240({
        ...{ 'onClick': {} },
        link: true,
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_240));
    let __VLS_243;
    let __VLS_244;
    let __VLS_245;
    const __VLS_246 = {
        onClick: (...[$event]) => {
            __VLS_ctx.handleDelete(scope.row);
        }
    };
    __VLS_242.slots.default;
    var __VLS_242;
}
var __VLS_230;
var __VLS_166;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pagination-wrap" },
});
const __VLS_247 = {}.ElPagination;
/** @type {[typeof __VLS_components.ElPagination, typeof __VLS_components.elPagination, ]} */ ;
// @ts-ignore
const __VLS_248 = __VLS_asFunctionalComponent(__VLS_247, new __VLS_247({
    ...{ 'onCurrentChange': {} },
    ...{ 'onSizeChange': {} },
    currentPage: (__VLS_ctx.pagination.current),
    pageSize: (__VLS_ctx.pagination.pageSize),
    layout: "total, prev, pager, next, sizes",
    pageSizes: ([10, 20, 30, 50]),
    total: (__VLS_ctx.pagination.total),
}));
const __VLS_249 = __VLS_248({
    ...{ 'onCurrentChange': {} },
    ...{ 'onSizeChange': {} },
    currentPage: (__VLS_ctx.pagination.current),
    pageSize: (__VLS_ctx.pagination.pageSize),
    layout: "total, prev, pager, next, sizes",
    pageSizes: ([10, 20, 30, 50]),
    total: (__VLS_ctx.pagination.total),
}, ...__VLS_functionalComponentArgsRest(__VLS_248));
let __VLS_251;
let __VLS_252;
let __VLS_253;
const __VLS_254 = {
    onCurrentChange: (__VLS_ctx.handlePageChange)
};
const __VLS_255 = {
    onSizeChange: (__VLS_ctx.handleSizeChange)
};
var __VLS_250;
/** @type {[typeof PictureUploadDialog, ]} */ ;
// @ts-ignore
const __VLS_256 = __VLS_asFunctionalComponent(PictureUploadDialog, new PictureUploadDialog({
    ...{ 'onSuccess': {} },
    modelValue: (__VLS_ctx.uploadVisible),
    categoryOptions: (__VLS_ctx.categoryOptions),
    tagOptions: (__VLS_ctx.tagOptions),
}));
const __VLS_257 = __VLS_256({
    ...{ 'onSuccess': {} },
    modelValue: (__VLS_ctx.uploadVisible),
    categoryOptions: (__VLS_ctx.categoryOptions),
    tagOptions: (__VLS_ctx.tagOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_256));
let __VLS_259;
let __VLS_260;
let __VLS_261;
const __VLS_262 = {
    onSuccess: (__VLS_ctx.loadPictures)
};
var __VLS_258;
/** @type {[typeof PictureBatchUploadDialog, ]} */ ;
// @ts-ignore
const __VLS_263 = __VLS_asFunctionalComponent(PictureBatchUploadDialog, new PictureBatchUploadDialog({
    ...{ 'onSuccess': {} },
    modelValue: (__VLS_ctx.batchUploadVisible),
}));
const __VLS_264 = __VLS_263({
    ...{ 'onSuccess': {} },
    modelValue: (__VLS_ctx.batchUploadVisible),
}, ...__VLS_functionalComponentArgsRest(__VLS_263));
let __VLS_266;
let __VLS_267;
let __VLS_268;
const __VLS_269 = {
    onSuccess: (__VLS_ctx.handleBatchSuccess)
};
var __VLS_265;
/** @type {[typeof PictureEditDialog, ]} */ ;
// @ts-ignore
const __VLS_270 = __VLS_asFunctionalComponent(PictureEditDialog, new PictureEditDialog({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.editVisible),
    picture: (__VLS_ctx.selectedPicture),
    categoryOptions: (__VLS_ctx.categoryOptions),
    tagOptions: (__VLS_ctx.tagOptions),
    loading: (__VLS_ctx.editLoading),
}));
const __VLS_271 = __VLS_270({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.editVisible),
    picture: (__VLS_ctx.selectedPicture),
    categoryOptions: (__VLS_ctx.categoryOptions),
    tagOptions: (__VLS_ctx.tagOptions),
    loading: (__VLS_ctx.editLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_270));
let __VLS_273;
let __VLS_274;
let __VLS_275;
const __VLS_276 = {
    onSubmit: (__VLS_ctx.handleEditSubmit)
};
var __VLS_272;
/** @type {__VLS_StyleScopedClasses['app-page']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-manage-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-page-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['page-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['page-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['picture-page-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-field']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-field']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-field']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-field']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-field']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['color-filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-field']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['color-input-row']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['list-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['list-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['table-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['table-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['action-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['pagination-wrap']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PictureBatchUploadDialog: PictureBatchUploadDialog,
            PictureEditDialog: PictureEditDialog,
            PictureUploadDialog: PictureUploadDialog,
            SpaceSelect: SpaceSelect,
            formatDateTime: formatDateTime,
            formatFileSize: formatFileSize,
            formatReviewStatus: formatReviewStatus,
            reviewStatusTagType: reviewStatusTagType,
            router: router,
            loading: loading,
            uploadVisible: uploadVisible,
            batchUploadVisible: batchUploadVisible,
            editVisible: editVisible,
            editLoading: editLoading,
            selectedPicture: selectedPicture,
            tagOptions: tagOptions,
            categoryOptions: categoryOptions,
            colorSearchMode: colorSearchMode,
            pagination: pagination,
            filters: filters,
            spaceMap: spaceMap,
            currentRows: currentRows,
            totalText: totalText,
            loadPictures: loadPictures,
            handleSearch: handleSearch,
            handleColorSearch: handleColorSearch,
            handleReset: handleReset,
            handlePageChange: handlePageChange,
            handleSizeChange: handleSizeChange,
            openEdit: openEdit,
            handleEditSubmit: handleEditSubmit,
            handleDelete: handleDelete,
            handleSpaceLoaded: handleSpaceLoaded,
            handleBatchSuccess: handleBatchSuccess,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
