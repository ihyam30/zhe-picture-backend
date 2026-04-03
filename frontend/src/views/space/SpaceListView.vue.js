import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addSpace, deleteSpace, editSpace, listSpaceLevels, listSpaceVOByPage } from '@/api/space';
import { listMyTeamSpaces } from '@/api/spaceUser';
import SpaceFormDialog from '@/components/space/SpaceFormDialog.vue';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { useAuthStore } from '@/store/auth';
import { formatDateTime, formatFileSize, formatPercent, formatSpaceLevel, formatSpaceType } from '@/utils/format';
const authStore = useAuthStore();
const loading = ref(false);
const dialogVisible = ref(false);
const dialogLoading = ref(false);
const dialogMode = ref('create');
const currentSpace = ref(null);
const spaceLevels = ref([]);
const ownedSpaces = ref([]);
const teamSpaces = ref([]);
const currentView = ref('mine');
const filters = reactive({
    keyword: '',
});
const pagination = reactive({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
});
const visibleOwnedSpaces = computed(() => ownedSpaces.value.filter((space) => !filters.keyword || space.spaceName?.includes(filters.keyword)));
const visibleTeamSpaces = computed(() => teamSpaces.value.filter((item) => !filters.keyword || item.space?.spaceName?.includes(filters.keyword)));
const statItems = computed(() => {
    const totalStorage = ownedSpaces.value.reduce((sum, item) => sum + (item.totalSize || 0), 0);
    return [
        { label: '我的空间数', value: ownedSpaces.value.length },
        { label: '团队空间数', value: teamSpaces.value.length },
        { label: '已用容量', value: formatFileSize(totalStorage) },
        {
            label: '空间等级种类',
            value: new Set(ownedSpaces.value.map((item) => item.spaceLevel)).size || 0,
        },
    ];
});
async function loadSpaces() {
    if (!authStore.user?.id) {
        return;
    }
    loading.value = true;
    try {
        const [ownedResult, teamResult] = await Promise.all([
            listSpaceVOByPage({
                current: pagination.current,
                pageSize: Math.max(pagination.pageSize, 20),
                userId: authStore.user.id,
                sortField: 'updateTime',
                sortOrder: 'descend',
            }),
            listMyTeamSpaces(),
        ]);
        ownedSpaces.value = ownedResult.records;
        pagination.total = ownedResult.total;
        teamSpaces.value = teamResult;
    }
    finally {
        loading.value = false;
    }
}
async function loadLevels() {
    spaceLevels.value = await listSpaceLevels();
}
function openCreate() {
    dialogMode.value = 'create';
    currentSpace.value = null;
    dialogVisible.value = true;
}
function openEdit(row) {
    dialogMode.value = 'edit';
    currentSpace.value = row;
    dialogVisible.value = true;
}
async function handleSubmit(payload) {
    dialogLoading.value = true;
    try {
        if (dialogMode.value === 'create') {
            await addSpace(payload);
            ElMessage.success('空间创建成功');
        }
        else {
            await editSpace(payload);
            ElMessage.success('空间信息已更新');
        }
        dialogVisible.value = false;
        await loadSpaces();
    }
    finally {
        dialogLoading.value = false;
    }
}
async function handleDelete(row) {
    await ElMessageBox.confirm(`确定删除空间“${row.spaceName}”吗？`, '删除确认', {
        type: 'warning',
    });
    await deleteSpace(row.id);
    ElMessage.success('空间已删除');
    await loadSpaces();
}
function usagePercent(space) {
    if (!space?.maxSize) {
        return 0;
    }
    return Math.min(100, ((space.totalSize || 0) / space.maxSize) * 100);
}
onMounted(async () => {
    await Promise.all([loadLevels(), loadSpaces()]);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-page workspace-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "workspace-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.currentView = 'public';
        } },
    type: "button",
    ...{ class: "workspace-nav-item" },
    ...{ class: ({ active: __VLS_ctx.currentView === 'public' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "workspace-nav-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.currentView = 'mine';
        } },
    type: "button",
    ...{ class: "workspace-nav-item" },
    ...{ class: ({ active: __VLS_ctx.currentView === 'mine' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "workspace-nav-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.currentView = 'team';
        } },
    type: "button",
    ...{ class: "workspace-nav-item" },
    ...{ class: ({ active: __VLS_ctx.currentView === 'team' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "workspace-nav-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openCreate) },
    type: "button",
    ...{ class: "workspace-nav-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "workspace-nav-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "workspace-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stats-row" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.statItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (item.label),
        ...{ class: "surface-panel stat-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stat-label" },
    });
    (item.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stat-value" },
    });
    (item.value);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "section-title" },
});
(__VLS_ctx.currentView === 'public' ? '公共空间入口' : __VLS_ctx.currentView === 'mine' ? `${__VLS_ctx.authStore.user?.userName || '我'}的个人空间` : '我加入的团队空间');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "section-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-actions" },
});
const __VLS_0 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.filters.keyword),
    placeholder: "搜索空间名称",
    clearable: true,
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.filters.keyword),
    placeholder: "搜索空间名称",
    clearable: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_4 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_6 = __VLS_5({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onClick: (__VLS_ctx.openCreate)
};
__VLS_7.slots.default;
var __VLS_7;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
});
if (__VLS_ctx.currentView === 'public') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "surface-panel" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "surface-panel-body" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "page-subtitle" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "page-actions" },
        ...{ style: {} },
    });
    const __VLS_12 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        to: "/dashboard",
    }));
    const __VLS_14 = __VLS_13({
        to: "/dashboard",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    const __VLS_16 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        type: "primary",
    }));
    const __VLS_18 = __VLS_17({
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    var __VLS_19;
    var __VLS_15;
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
        onClick: (__VLS_ctx.openCreate)
    };
    __VLS_23.slots.default;
    var __VLS_23;
}
else if (__VLS_ctx.currentView === 'mine') {
    if (__VLS_ctx.visibleOwnedSpaces.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "gallery-grid" },
            ...{ style: {} },
        });
        for (const [space] of __VLS_getVForSourceType((__VLS_ctx.visibleOwnedSpaces))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (space.id),
                ...{ class: "gallery-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: {} },
            });
            ((space.spaceName || 'S').slice(0, 1));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "gallery-body" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                ...{ class: "gallery-title" },
            });
            (space.spaceName);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "gallery-desc" },
            });
            (__VLS_ctx.formatSpaceType(space.spaceType));
            (__VLS_ctx.formatSpaceLevel(space.spaceLevel));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "info-stack" },
                ...{ style: {} },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatFileSize(space.totalSize));
            (__VLS_ctx.formatFileSize(space.maxSize));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (space.totalCount || 0);
            (space.maxCount || 0);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatDateTime(space.updateTime));
            const __VLS_28 = {}.ElProgress;
            /** @type {[typeof __VLS_components.ElProgress, typeof __VLS_components.elProgress, ]} */ ;
            // @ts-ignore
            const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
                percentage: (__VLS_ctx.usagePercent(space)),
                ...{ style: {} },
            }));
            const __VLS_30 = __VLS_29({
                percentage: (__VLS_ctx.usagePercent(space)),
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_29));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "page-actions" },
                ...{ style: {} },
            });
            const __VLS_32 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
                ...{ 'onClick': {} },
            }));
            const __VLS_34 = __VLS_33({
                ...{ 'onClick': {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_33));
            let __VLS_36;
            let __VLS_37;
            let __VLS_38;
            const __VLS_39 = {
                onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.currentView === 'public'))
                        return;
                    if (!(__VLS_ctx.currentView === 'mine'))
                        return;
                    if (!(__VLS_ctx.visibleOwnedSpaces.length))
                        return;
                    __VLS_ctx.openEdit(space);
                }
            };
            __VLS_35.slots.default;
            var __VLS_35;
            const __VLS_40 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
                ...{ 'onClick': {} },
                type: "danger",
                plain: true,
            }));
            const __VLS_42 = __VLS_41({
                ...{ 'onClick': {} },
                type: "danger",
                plain: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_41));
            let __VLS_44;
            let __VLS_45;
            let __VLS_46;
            const __VLS_47 = {
                onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.currentView === 'public'))
                        return;
                    if (!(__VLS_ctx.currentView === 'mine'))
                        return;
                    if (!(__VLS_ctx.visibleOwnedSpaces.length))
                        return;
                    __VLS_ctx.handleDelete(space);
                }
            };
            __VLS_43.slots.default;
            var __VLS_43;
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-placeholder" },
        });
    }
}
else {
    if (__VLS_ctx.visibleTeamSpaces.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "gallery-grid" },
            ...{ style: {} },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.visibleTeamSpaces))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (item.id),
                ...{ class: "gallery-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "gallery-body" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                ...{ class: "gallery-title" },
            });
            (item.space?.spaceName || `空间 ${item.spaceId}`);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "gallery-desc" },
            });
            (item.spaceRole);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "info-stack" },
                ...{ style: {} },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatSpaceType(item.space?.spaceType));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatSpaceLevel(item.space?.spaceLevel));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatPercent(((item.space?.totalSize || 0) / (item.space?.maxSize || 1)) || 0));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatDateTime(item.createTime));
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-placeholder" },
        });
    }
}
/** @type {[typeof SpaceFormDialog, ]} */ ;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent(SpaceFormDialog, new SpaceFormDialog({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.dialogVisible),
    mode: (__VLS_ctx.dialogMode),
    initialValue: (__VLS_ctx.currentSpace),
    levels: (__VLS_ctx.spaceLevels),
    loading: (__VLS_ctx.dialogLoading),
}));
const __VLS_49 = __VLS_48({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.dialogVisible),
    mode: (__VLS_ctx.dialogMode),
    initialValue: (__VLS_ctx.currentSpace),
    levels: (__VLS_ctx.spaceLevels),
    loading: (__VLS_ctx.dialogLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
let __VLS_51;
let __VLS_52;
let __VLS_53;
const __VLS_54 = {
    onSubmit: (__VLS_ctx.handleSubmit)
};
var __VLS_50;
/** @type {__VLS_StyleScopedClasses['app-page']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-content']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-row']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['page-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['page-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['page-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-card']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-body']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-title']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['page-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-card']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-body']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-title']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-placeholder']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SpaceFormDialog: SpaceFormDialog,
            formatDateTime: formatDateTime,
            formatFileSize: formatFileSize,
            formatPercent: formatPercent,
            formatSpaceLevel: formatSpaceLevel,
            formatSpaceType: formatSpaceType,
            authStore: authStore,
            dialogVisible: dialogVisible,
            dialogLoading: dialogLoading,
            dialogMode: dialogMode,
            currentSpace: currentSpace,
            spaceLevels: spaceLevels,
            currentView: currentView,
            filters: filters,
            visibleOwnedSpaces: visibleOwnedSpaces,
            visibleTeamSpaces: visibleTeamSpaces,
            statItems: statItems,
            openCreate: openCreate,
            openEdit: openEdit,
            handleSubmit: handleSubmit,
            handleDelete: handleDelete,
            usagePercent: usagePercent,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
