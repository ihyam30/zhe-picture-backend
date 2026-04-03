import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deletePicture, editPicture, getPictureDetail, getPictureTagCategory } from '@/api/picture';
import PictureEditDialog from '@/components/picture/PictureEditDialog.vue';
import AIOutpaintingPanel from '@/components/picture/AIOutpaintingPanel.vue';
import { usePictureWebSocket } from '@/composables/usePictureWebSocket';
import { useAuthStore } from '@/store/auth';
import { formatDateTime, formatFileSize, formatReviewStatus, reviewStatusTagType, } from '@/utils/format';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const picture = ref(null);
const tagOptions = ref([]);
const categoryOptions = ref([]);
const editVisible = ref(false);
const editLoading = ref(false);
const editorRotation = ref(0);
const editorScale = ref(1);
const pictureId = computed(() => String(route.params.id || ''));
const canEdit = computed(() => authStore.isAdmin || picture.value?.permissionList?.includes('picture:edit'));
const editorImageStyle = computed(() => ({
    transform: `rotate(${editorRotation.value}deg) scale(${editorScale.value})`,
}));
const { isConnected, onlineUsers, editingUser, latestEditAction, isEditing, messages, connect, enterEdit, exitEdit, sendAction, } = usePictureWebSocket(pictureId);
const editorStatusText = computed(() => {
    if (isEditing.value) {
        return `正在编辑中 · 旋转 ${editorRotation.value}° · 缩放 ${Math.round(editorScale.value * 100)}%`;
    }
    if (editingUser.value) {
        return `${editingUser.value.userName} 正在编辑中 · 当前预览已同步其动作`;
    }
    return '可编辑';
});
function getMemberStatus(userId) {
    const normalizedId = String(userId || '');
    if (String(editingUser.value?.id || '') === normalizedId) {
        return '正在编辑';
    }
    if (String(authStore.user?.id || '') === normalizedId) {
        return '已加入';
    }
    return '在线';
}
function getMemberTagType(userId) {
    const normalizedId = String(userId || '');
    if (String(editingUser.value?.id || '') === normalizedId) {
        return 'success';
    }
    if (String(authStore.user?.id || '') === normalizedId) {
        return 'primary';
    }
    return 'info';
}
function resetEditorState() {
    editorRotation.value = 0;
    editorScale.value = 1;
}
function applyEditorAction(action) {
    switch (action) {
        case 'ROTATE_LEFT':
            editorRotation.value -= 90;
            break;
        case 'ROTATE_RIGHT':
            editorRotation.value += 90;
            break;
        case 'ZOOM_IN':
            editorScale.value = Math.min(2.4, Number((editorScale.value + 0.1).toFixed(2)));
            break;
        case 'ZOOM_OUT':
            editorScale.value = Math.max(0.5, Number((editorScale.value - 0.1).toFixed(2)));
            break;
    }
}
async function loadPicture() {
    if (!pictureId.value) {
        return;
    }
    loading.value = true;
    try {
        picture.value = await getPictureDetail(pictureId.value);
    }
    finally {
        loading.value = false;
    }
}
async function loadMeta() {
    const result = await getPictureTagCategory();
    tagOptions.value = result.tagList || [];
    categoryOptions.value = result.categoryList || [];
}
async function handleEditSubmit(payload) {
    editLoading.value = true;
    try {
        await editPicture(payload);
        ElMessage.success('图片信息已更新');
        editVisible.value = false;
        await loadPicture();
    }
    finally {
        editLoading.value = false;
    }
}
async function handleDelete() {
    if (!picture.value?.id) {
        return;
    }
    await ElMessageBox.confirm('确定删除当前图片吗？', '删除确认', {
        type: 'warning',
    });
    await deletePicture(picture.value.id);
    ElMessage.success('图片已删除');
    router.push('/pictures');
}
function handleDownload() {
    if (!picture.value?.url) {
        return;
    }
    window.open(picture.value.url, '_blank');
}
function handleEditorAction(action) {
    if (!isEditing.value) {
        return;
    }
    applyEditorAction(action);
    sendAction(action);
}
onMounted(async () => {
    await Promise.all([loadMeta(), loadPicture()]);
    await connect();
});
watch(() => route.params.id, async () => {
    resetEditorState();
    await loadPicture();
    await connect();
});
watch(() => picture.value?.id, () => {
    resetEditorState();
});
watch(latestEditAction, (payload) => {
    if (!payload?.action) {
        return;
    }
    if (payload.userId && String(payload.userId) === String(authStore.user?.id || '')) {
        return;
    }
    if (payload.action === 'ROTATE_LEFT' || payload.action === 'ROTATE_RIGHT' || payload.action === 'ZOOM_IN' || payload.action === 'ZOOM_OUT') {
        applyEditorAction(payload.action);
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "content-grid-2" },
});
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
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
    ...{ class: "detail-preview-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: (__VLS_ctx.picture?.url || __VLS_ctx.picture?.thumbnailUrl),
    ...{ class: "detail-preview" },
});
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-list" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-value" },
});
(__VLS_ctx.picture?.userVO?.userName || __VLS_ctx.picture?.userVO?.userAccount || '--');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-value" },
});
(__VLS_ctx.picture?.name || '--');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-value" },
});
(__VLS_ctx.picture?.introduction || '暂无简介');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-value" },
});
(__VLS_ctx.picture?.category || '--');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "inline-tags" },
});
for (const [tag] of __VLS_getVForSourceType((__VLS_ctx.picture?.tags || []))) {
    const __VLS_0 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        key: (tag),
        round: true,
    }));
    const __VLS_2 = __VLS_1({
        key: (tag),
        round: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    (tag);
    var __VLS_3;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-value" },
});
(__VLS_ctx.picture?.picFormat || '--');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-value" },
});
(__VLS_ctx.picture?.picWidth || '--');
(__VLS_ctx.picture?.picHeight || '--');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-value" },
});
(__VLS_ctx.picture?.picScale || '--');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-value" },
});
(__VLS_ctx.formatFileSize(__VLS_ctx.picture?.picSize));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-value" },
});
const __VLS_4 = {}.ElTag;
/** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    type: (__VLS_ctx.reviewStatusTagType(__VLS_ctx.picture?.reviewStatus)),
}));
const __VLS_6 = __VLS_5({
    type: (__VLS_ctx.reviewStatusTagType(__VLS_ctx.picture?.reviewStatus)),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
(__VLS_ctx.formatReviewStatus(__VLS_ctx.picture?.reviewStatus));
var __VLS_7;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "inline-tags" },
});
for (const [permission] of __VLS_getVForSourceType((__VLS_ctx.picture?.permissionList || []))) {
    const __VLS_8 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        key: (permission),
    }));
    const __VLS_10 = __VLS_9({
        key: (permission),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    (permission);
    var __VLS_11;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar-actions" },
    ...{ style: {} },
});
const __VLS_12 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.handleDownload)
};
__VLS_15.slots.default;
var __VLS_15;
if (__VLS_ctx.canEdit) {
    const __VLS_20 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ 'onClick': {} },
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_24;
    let __VLS_25;
    let __VLS_26;
    const __VLS_27 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.canEdit))
                return;
            __VLS_ctx.editVisible = true;
        }
    };
    __VLS_23.slots.default;
    var __VLS_23;
}
if (__VLS_ctx.canEdit) {
    const __VLS_28 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        ...{ 'onClick': {} },
        type: "danger",
        plain: true,
    }));
    const __VLS_30 = __VLS_29({
        ...{ 'onClick': {} },
        type: "danger",
        plain: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    let __VLS_32;
    let __VLS_33;
    let __VLS_34;
    const __VLS_35 = {
        onClick: (__VLS_ctx.handleDelete)
    };
    __VLS_31.slots.default;
    var __VLS_31;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel" },
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
    ...{ class: "page-actions" },
});
const __VLS_36 = {}.ElTag;
/** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    type: (__VLS_ctx.isConnected ? 'success' : 'info'),
}));
const __VLS_38 = __VLS_37({
    type: (__VLS_ctx.isConnected ? 'success' : 'info'),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
(__VLS_ctx.isConnected ? '连接已建立' : '连接未建立');
var __VLS_39;
const __VLS_40 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (!__VLS_ctx.canEdit || __VLS_ctx.isEditing),
}));
const __VLS_42 = __VLS_41({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (!__VLS_ctx.canEdit || __VLS_ctx.isEditing),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
let __VLS_44;
let __VLS_45;
let __VLS_46;
const __VLS_47 = {
    onClick: (__VLS_ctx.enterEdit)
};
__VLS_43.slots.default;
var __VLS_43;
const __VLS_48 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.canEdit || !__VLS_ctx.isEditing),
}));
const __VLS_50 = __VLS_49({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.canEdit || !__VLS_ctx.isEditing),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
let __VLS_52;
let __VLS_53;
let __VLS_54;
const __VLS_55 = {
    onClick: (__VLS_ctx.exitEdit)
};
__VLS_51.slots.default;
var __VLS_51;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-banner" },
    ...{ class: (__VLS_ctx.isEditing ? 'editing' : 'waiting') },
});
(__VLS_ctx.editorStatusText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-stage checkerboard" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-stage-inner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: (__VLS_ctx.picture?.url || __VLS_ctx.picture?.thumbnailUrl),
    ...{ style: (__VLS_ctx.editorImageStyle) },
    ...{ class: "editor-image" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar-actions" },
    ...{ style: {} },
});
const __VLS_56 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.isEditing),
}));
const __VLS_58 = __VLS_57({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.isEditing),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
let __VLS_60;
let __VLS_61;
let __VLS_62;
const __VLS_63 = {
    onClick: (...[$event]) => {
        __VLS_ctx.handleEditorAction('ROTATE_LEFT');
    }
};
__VLS_59.slots.default;
var __VLS_59;
const __VLS_64 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.isEditing),
}));
const __VLS_66 = __VLS_65({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.isEditing),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
let __VLS_68;
let __VLS_69;
let __VLS_70;
const __VLS_71 = {
    onClick: (...[$event]) => {
        __VLS_ctx.handleEditorAction('ROTATE_RIGHT');
    }
};
__VLS_67.slots.default;
var __VLS_67;
const __VLS_72 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.isEditing),
}));
const __VLS_74 = __VLS_73({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.isEditing),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
let __VLS_76;
let __VLS_77;
let __VLS_78;
const __VLS_79 = {
    onClick: (...[$event]) => {
        __VLS_ctx.handleEditorAction('ZOOM_IN');
    }
};
__VLS_75.slots.default;
var __VLS_75;
const __VLS_80 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.isEditing),
}));
const __VLS_82 = __VLS_81({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.isEditing),
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
let __VLS_84;
let __VLS_85;
let __VLS_86;
const __VLS_87 = {
    onClick: (...[$event]) => {
        __VLS_ctx.handleEditorAction('ZOOM_OUT');
    }
};
__VLS_83.slots.default;
var __VLS_83;
const __VLS_88 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (!__VLS_ctx.isEditing),
}));
const __VLS_90 = __VLS_89({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (!__VLS_ctx.isEditing),
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
let __VLS_92;
let __VLS_93;
let __VLS_94;
const __VLS_95 = {
    onClick: (__VLS_ctx.exitEdit)
};
__VLS_91.slots.default;
var __VLS_91;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-tip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "content-grid-2" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
    ...{ style: {} },
});
if (__VLS_ctx.messages.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-stack" },
        ...{ style: {} },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.messages))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (item.id),
            ...{ class: "collab-message-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "collab-message-text" },
        });
        (item.text);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "muted-text" },
        });
        (__VLS_ctx.formatDateTime(item.createdAt));
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-placeholder" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel" },
    ...{ style: {} },
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
if (__VLS_ctx.onlineUsers.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-stack" },
        ...{ style: {} },
    });
    for (const [user] of __VLS_getVForSourceType((__VLS_ctx.onlineUsers))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (user.id),
            ...{ class: "member-item" },
        });
        const __VLS_96 = {}.ElAvatar;
        /** @type {[typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, ]} */ ;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
            src: (user.userAvatar),
        }));
        const __VLS_98 = __VLS_97({
            src: (user.userAvatar),
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        __VLS_99.slots.default;
        (user.userName?.slice(0, 1) || 'U');
        var __VLS_99;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "member-meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "member-name-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        (user.userName || user.userAccount);
        const __VLS_100 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
            size: "small",
            type: (__VLS_ctx.getMemberTagType(user.id)),
        }));
        const __VLS_102 = __VLS_101({
            size: "small",
            type: (__VLS_ctx.getMemberTagType(user.id)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        __VLS_103.slots.default;
        (__VLS_ctx.getMemberStatus(user.id));
        var __VLS_103;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "muted-text" },
        });
        (user.userRole || '成员');
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-placeholder" },
    });
}
/** @type {[typeof AIOutpaintingPanel, ]} */ ;
// @ts-ignore
const __VLS_104 = __VLS_asFunctionalComponent(AIOutpaintingPanel, new AIOutpaintingPanel({
    ...{ 'onApplied': {} },
    pictureId: (__VLS_ctx.picture?.id),
}));
const __VLS_105 = __VLS_104({
    ...{ 'onApplied': {} },
    pictureId: (__VLS_ctx.picture?.id),
}, ...__VLS_functionalComponentArgsRest(__VLS_104));
let __VLS_107;
let __VLS_108;
let __VLS_109;
const __VLS_110 = {
    onApplied: (__VLS_ctx.loadPicture)
};
var __VLS_106;
/** @type {[typeof PictureEditDialog, ]} */ ;
// @ts-ignore
const __VLS_111 = __VLS_asFunctionalComponent(PictureEditDialog, new PictureEditDialog({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.editVisible),
    picture: (__VLS_ctx.picture),
    tagOptions: (__VLS_ctx.tagOptions),
    categoryOptions: (__VLS_ctx.categoryOptions),
    loading: (__VLS_ctx.editLoading),
}));
const __VLS_112 = __VLS_111({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.editVisible),
    picture: (__VLS_ctx.picture),
    tagOptions: (__VLS_ctx.tagOptions),
    categoryOptions: (__VLS_ctx.categoryOptions),
    loading: (__VLS_ctx.editLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_111));
let __VLS_114;
let __VLS_115;
let __VLS_116;
const __VLS_117 = {
    onSubmit: (__VLS_ctx.handleEditSubmit)
};
var __VLS_113;
/** @type {__VLS_StyleScopedClasses['app-page']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-preview-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['page-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-stage']} */ ;
/** @type {__VLS_StyleScopedClasses['checkerboard']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-stage-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-image']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['collab-message-item']} */ ;
/** @type {__VLS_StyleScopedClasses['collab-message-text']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['member-item']} */ ;
/** @type {__VLS_StyleScopedClasses['member-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['member-name-row']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-placeholder']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PictureEditDialog: PictureEditDialog,
            AIOutpaintingPanel: AIOutpaintingPanel,
            formatDateTime: formatDateTime,
            formatFileSize: formatFileSize,
            formatReviewStatus: formatReviewStatus,
            reviewStatusTagType: reviewStatusTagType,
            loading: loading,
            picture: picture,
            tagOptions: tagOptions,
            categoryOptions: categoryOptions,
            editVisible: editVisible,
            editLoading: editLoading,
            canEdit: canEdit,
            editorImageStyle: editorImageStyle,
            isConnected: isConnected,
            onlineUsers: onlineUsers,
            isEditing: isEditing,
            messages: messages,
            enterEdit: enterEdit,
            exitEdit: exitEdit,
            editorStatusText: editorStatusText,
            getMemberStatus: getMemberStatus,
            getMemberTagType: getMemberTagType,
            loadPicture: loadPicture,
            handleEditSubmit: handleEditSubmit,
            handleDelete: handleDelete,
            handleDownload: handleDownload,
            handleEditorAction: handleEditorAction,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
