import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addUser, deleteUser, listUsersByPage, updateUser } from '@/api/user';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { formatDateTime } from '@/utils/format';
const loading = ref(false);
const dialogVisible = ref(false);
const dialogLoading = ref(false);
const dialogMode = ref('add');
const tableData = ref([]);
const pagination = reactive({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
});
const queryForm = reactive({
    userName: '',
    userAccount: '',
    userRole: '',
});
const dialogForm = reactive({
    id: '',
    userAccount: '',
    userName: '',
    userAvatar: '',
    userProfile: '',
    userRole: 'user',
});
const stats = computed(() => {
    const adminCount = tableData.value.filter((item) => item.userRole === 'admin').length;
    return [
        { label: '当前页用户数', value: tableData.value.length },
        { label: '管理员数量', value: adminCount },
        { label: '普通用户数量', value: Math.max(tableData.value.length - adminCount, 0) },
        { label: '总用户数', value: pagination.total },
    ];
});
async function loadUsers() {
    loading.value = true;
    try {
        const result = await listUsersByPage({
            current: pagination.current,
            pageSize: pagination.pageSize,
            userName: queryForm.userName || undefined,
            userAccount: queryForm.userAccount || undefined,
            userRole: queryForm.userRole || undefined,
            sortField: 'createTime',
            sortOrder: 'descend',
        });
        tableData.value = result.records;
        pagination.total = result.total;
    }
    finally {
        loading.value = false;
    }
}
function handleSearch() {
    pagination.current = 1;
    loadUsers();
}
function handleReset() {
    queryForm.userName = '';
    queryForm.userAccount = '';
    queryForm.userRole = '';
    handleSearch();
}
function resetDialogForm() {
    dialogForm.id = '';
    dialogForm.userAccount = '';
    dialogForm.userName = '';
    dialogForm.userAvatar = '';
    dialogForm.userProfile = '';
    dialogForm.userRole = 'user';
}
function openAddDialog() {
    dialogMode.value = 'add';
    resetDialogForm();
    dialogVisible.value = true;
}
function openEditDialog(user) {
    dialogMode.value = 'edit';
    dialogForm.id = String(user.id);
    dialogForm.userAccount = user.userAccount;
    dialogForm.userName = user.userName || '';
    dialogForm.userAvatar = user.userAvatar || '';
    dialogForm.userProfile = user.userProfile || '';
    dialogForm.userRole = user.userRole || 'user';
    dialogVisible.value = true;
}
async function handleSubmit() {
    if (dialogMode.value === 'add' && !dialogForm.userAccount.trim()) {
        ElMessage.warning('请输入账号');
        return;
    }
    dialogLoading.value = true;
    try {
        if (dialogMode.value === 'add') {
            await addUser({
                userAccount: dialogForm.userAccount,
                userName: dialogForm.userName || undefined,
                userAvatar: dialogForm.userAvatar || undefined,
                userProfile: dialogForm.userProfile || undefined,
                userRole: dialogForm.userRole,
            });
            ElMessage.success('用户已创建，默认密码以后端逻辑为准');
        }
        else {
            await updateUser({
                id: dialogForm.id,
                userName: dialogForm.userName || undefined,
                userAvatar: dialogForm.userAvatar || undefined,
                userProfile: dialogForm.userProfile || undefined,
                userRole: dialogForm.userRole,
            });
            ElMessage.success('用户信息已更新');
        }
        dialogVisible.value = false;
        await loadUsers();
    }
    finally {
        dialogLoading.value = false;
    }
}
async function handleDelete(row) {
    await ElMessageBox.confirm(`确定删除用户 ${row.userName || row.userAccount} 吗？`, '删除用户', {
        type: 'warning',
    });
    await deleteUser(row.id);
    ElMessage.success('用户已删除');
    await loadUsers();
}
onMounted(loadUsers);
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
    ...{ class: "toolbar-actions" },
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
    onClick: (__VLS_ctx.openAddDialog)
};
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "stats-row" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.stats))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
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
    ...{ class: "toolbar-actions" },
});
const __VLS_8 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (__VLS_ctx.handleSearch)
};
__VLS_11.slots.default;
var __VLS_11;
const __VLS_16 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (__VLS_ctx.handleReset)
};
__VLS_19.slots.default;
var __VLS_19;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
});
const __VLS_24 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    labelWidth: "86px",
}));
const __VLS_26 = __VLS_25({
    labelWidth: "86px",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.ElRow;
/** @type {[typeof __VLS_components.ElRow, typeof __VLS_components.elRow, typeof __VLS_components.ElRow, typeof __VLS_components.elRow, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    gutter: (18),
}));
const __VLS_30 = __VLS_29({
    gutter: (18),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    xl: (8),
    lg: (8),
    md: (12),
    sm: (24),
    xs: (24),
}));
const __VLS_34 = __VLS_33({
    xl: (8),
    lg: (8),
    md: (12),
    sm: (24),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    label: "昵称",
}));
const __VLS_38 = __VLS_37({
    label: "昵称",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
const __VLS_40 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    modelValue: (__VLS_ctx.queryForm.userName),
    clearable: true,
    placeholder: "请输入用户昵称",
}));
const __VLS_42 = __VLS_41({
    modelValue: (__VLS_ctx.queryForm.userName),
    clearable: true,
    placeholder: "请输入用户昵称",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
var __VLS_39;
var __VLS_35;
const __VLS_44 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    xl: (8),
    lg: (8),
    md: (12),
    sm: (24),
    xs: (24),
}));
const __VLS_46 = __VLS_45({
    xl: (8),
    lg: (8),
    md: (12),
    sm: (24),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    label: "账号",
}));
const __VLS_50 = __VLS_49({
    label: "账号",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.queryForm.userAccount),
    clearable: true,
    placeholder: "请输入登录账号",
}));
const __VLS_54 = __VLS_53({
    modelValue: (__VLS_ctx.queryForm.userAccount),
    clearable: true,
    placeholder: "请输入登录账号",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
var __VLS_51;
var __VLS_47;
const __VLS_56 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    xl: (8),
    lg: (8),
    md: (12),
    sm: (24),
    xs: (24),
}));
const __VLS_58 = __VLS_57({
    xl: (8),
    lg: (8),
    md: (12),
    sm: (24),
    xs: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    label: "角色",
}));
const __VLS_62 = __VLS_61({
    label: "角色",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    modelValue: (__VLS_ctx.queryForm.userRole),
    clearable: true,
    ...{ style: {} },
    placeholder: "请选择角色",
}));
const __VLS_66 = __VLS_65({
    modelValue: (__VLS_ctx.queryForm.userRole),
    clearable: true,
    ...{ style: {} },
    placeholder: "请选择角色",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
const __VLS_68 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    label: "普通用户",
    value: "user",
}));
const __VLS_70 = __VLS_69({
    label: "普通用户",
    value: "user",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
const __VLS_72 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    label: "管理员",
    value: "admin",
}));
const __VLS_74 = __VLS_73({
    label: "管理员",
    value: "admin",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
var __VLS_67;
var __VLS_63;
var __VLS_59;
var __VLS_31;
var __VLS_27;
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
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
(__VLS_ctx.pagination.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
});
const __VLS_76 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    data: (__VLS_ctx.tableData),
    stripe: true,
}));
const __VLS_78 = __VLS_77({
    data: (__VLS_ctx.tableData),
    stripe: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
__VLS_79.slots.default;
const __VLS_80 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    label: "用户",
    minWidth: "260",
}));
const __VLS_82 = __VLS_81({
    label: "用户",
    minWidth: "260",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_83.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "user-cell" },
    });
    const __VLS_84 = {}.ElAvatar;
    /** @type {[typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        src: (scope.row.userAvatar),
    }));
    const __VLS_86 = __VLS_85({
        src: (scope.row.userAvatar),
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_87.slots.default;
    (scope.row.userName?.slice(0, 1) || 'U');
    var __VLS_87;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "user-name" },
    });
    (scope.row.userName || scope.row.userAccount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "muted-text" },
    });
    (scope.row.userAccount);
}
var __VLS_83;
const __VLS_88 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    label: "角色",
    width: "140",
}));
const __VLS_90 = __VLS_89({
    label: "角色",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
__VLS_91.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_91.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_92 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        type: (scope.row.userRole === 'admin' ? 'danger' : 'info'),
    }));
    const __VLS_94 = __VLS_93({
        type: (scope.row.userRole === 'admin' ? 'danger' : 'info'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    __VLS_95.slots.default;
    (scope.row.userRole === 'admin' ? '管理员' : '普通用户');
    var __VLS_95;
}
var __VLS_91;
const __VLS_96 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    label: "个人简介",
    minWidth: "260",
}));
const __VLS_98 = __VLS_97({
    label: "个人简介",
    minWidth: "260",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
__VLS_99.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_99.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (scope.row.userProfile || '--');
}
var __VLS_99;
const __VLS_100 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    label: "创建时间",
    minWidth: "200",
}));
const __VLS_102 = __VLS_101({
    label: "创建时间",
    minWidth: "200",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
__VLS_103.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_103.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    (__VLS_ctx.formatDateTime(scope.row.createTime));
}
var __VLS_103;
const __VLS_104 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    label: "操作",
    width: "180",
    fixed: "right",
}));
const __VLS_106 = __VLS_105({
    label: "操作",
    width: "180",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
__VLS_107.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_107.slots;
    const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_108 = {}.ElSpace;
    /** @type {[typeof __VLS_components.ElSpace, typeof __VLS_components.elSpace, typeof __VLS_components.ElSpace, typeof __VLS_components.elSpace, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({}));
    const __VLS_110 = __VLS_109({}, ...__VLS_functionalComponentArgsRest(__VLS_109));
    __VLS_111.slots.default;
    const __VLS_112 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        ...{ 'onClick': {} },
        link: true,
        type: "primary",
    }));
    const __VLS_114 = __VLS_113({
        ...{ 'onClick': {} },
        link: true,
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    let __VLS_116;
    let __VLS_117;
    let __VLS_118;
    const __VLS_119 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openEditDialog(scope.row);
        }
    };
    __VLS_115.slots.default;
    var __VLS_115;
    const __VLS_120 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        ...{ 'onClick': {} },
        link: true,
        type: "danger",
    }));
    const __VLS_122 = __VLS_121({
        ...{ 'onClick': {} },
        link: true,
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    let __VLS_124;
    let __VLS_125;
    let __VLS_126;
    const __VLS_127 = {
        onClick: (...[$event]) => {
            __VLS_ctx.handleDelete(scope.row);
        }
    };
    __VLS_123.slots.default;
    var __VLS_123;
    var __VLS_111;
}
var __VLS_107;
var __VLS_79;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_128 = {}.ElPagination;
/** @type {[typeof __VLS_components.ElPagination, typeof __VLS_components.elPagination, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.pagination.current),
    pageSize: (__VLS_ctx.pagination.pageSize),
    layout: "total, prev, pager, next",
    total: (__VLS_ctx.pagination.total),
}));
const __VLS_130 = __VLS_129({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.pagination.current),
    pageSize: (__VLS_ctx.pagination.pageSize),
    layout: "total, prev, pager, next",
    total: (__VLS_ctx.pagination.total),
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
let __VLS_132;
let __VLS_133;
let __VLS_134;
const __VLS_135 = {
    onCurrentChange: (__VLS_ctx.loadUsers)
};
var __VLS_131;
const __VLS_136 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    modelValue: (__VLS_ctx.dialogVisible),
    title: (__VLS_ctx.dialogMode === 'add' ? '新建用户' : '编辑用户'),
    width: "560px",
}));
const __VLS_138 = __VLS_137({
    modelValue: (__VLS_ctx.dialogVisible),
    title: (__VLS_ctx.dialogMode === 'add' ? '新建用户' : '编辑用户'),
    width: "560px",
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
__VLS_139.slots.default;
const __VLS_140 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    labelWidth: "96px",
}));
const __VLS_142 = __VLS_141({
    labelWidth: "96px",
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
__VLS_143.slots.default;
if (__VLS_ctx.dialogMode === 'add') {
    const __VLS_144 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
        label: "账号",
    }));
    const __VLS_146 = __VLS_145({
        label: "账号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_145));
    __VLS_147.slots.default;
    const __VLS_148 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
        modelValue: (__VLS_ctx.dialogForm.userAccount),
        placeholder: "请输入新账号",
    }));
    const __VLS_150 = __VLS_149({
        modelValue: (__VLS_ctx.dialogForm.userAccount),
        placeholder: "请输入新账号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_149));
    var __VLS_147;
}
const __VLS_152 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
    label: "昵称",
}));
const __VLS_154 = __VLS_153({
    label: "昵称",
}, ...__VLS_functionalComponentArgsRest(__VLS_153));
__VLS_155.slots.default;
const __VLS_156 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    modelValue: (__VLS_ctx.dialogForm.userName),
    placeholder: "请输入用户昵称",
}));
const __VLS_158 = __VLS_157({
    modelValue: (__VLS_ctx.dialogForm.userName),
    placeholder: "请输入用户昵称",
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
var __VLS_155;
const __VLS_160 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
    label: "头像 URL",
}));
const __VLS_162 = __VLS_161({
    label: "头像 URL",
}, ...__VLS_functionalComponentArgsRest(__VLS_161));
__VLS_163.slots.default;
const __VLS_164 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    modelValue: (__VLS_ctx.dialogForm.userAvatar),
    placeholder: "请输入头像地址",
}));
const __VLS_166 = __VLS_165({
    modelValue: (__VLS_ctx.dialogForm.userAvatar),
    placeholder: "请输入头像地址",
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
var __VLS_163;
const __VLS_168 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
    label: "个人简介",
}));
const __VLS_170 = __VLS_169({
    label: "个人简介",
}, ...__VLS_functionalComponentArgsRest(__VLS_169));
__VLS_171.slots.default;
const __VLS_172 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    modelValue: (__VLS_ctx.dialogForm.userProfile),
    type: "textarea",
    rows: (3),
    placeholder: "请输入用户简介",
}));
const __VLS_174 = __VLS_173({
    modelValue: (__VLS_ctx.dialogForm.userProfile),
    type: "textarea",
    rows: (3),
    placeholder: "请输入用户简介",
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
var __VLS_171;
const __VLS_176 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
    label: "角色",
}));
const __VLS_178 = __VLS_177({
    label: "角色",
}, ...__VLS_functionalComponentArgsRest(__VLS_177));
__VLS_179.slots.default;
const __VLS_180 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    modelValue: (__VLS_ctx.dialogForm.userRole),
    ...{ style: {} },
}));
const __VLS_182 = __VLS_181({
    modelValue: (__VLS_ctx.dialogForm.userRole),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
__VLS_183.slots.default;
const __VLS_184 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
    label: "普通用户",
    value: "user",
}));
const __VLS_186 = __VLS_185({
    label: "普通用户",
    value: "user",
}, ...__VLS_functionalComponentArgsRest(__VLS_185));
const __VLS_188 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
    label: "管理员",
    value: "admin",
}));
const __VLS_190 = __VLS_189({
    label: "管理员",
    value: "admin",
}, ...__VLS_functionalComponentArgsRest(__VLS_189));
var __VLS_183;
var __VLS_179;
if (__VLS_ctx.dialogMode === 'add') {
    const __VLS_192 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
        title: "根据你提供的后端代码，新建用户时会使用后端内置默认密码。",
        type: "warning",
        closable: (false),
        showIcon: true,
    }));
    const __VLS_194 = __VLS_193({
        title: "根据你提供的后端代码，新建用户时会使用后端内置默认密码。",
        type: "warning",
        closable: (false),
        showIcon: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_193));
}
var __VLS_143;
{
    const { footer: __VLS_thisSlot } = __VLS_139.slots;
    const __VLS_196 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
        ...{ 'onClick': {} },
    }));
    const __VLS_198 = __VLS_197({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_197));
    let __VLS_200;
    let __VLS_201;
    let __VLS_202;
    const __VLS_203 = {
        onClick: (...[$event]) => {
            __VLS_ctx.dialogVisible = false;
        }
    };
    __VLS_199.slots.default;
    var __VLS_199;
    const __VLS_204 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.dialogLoading),
    }));
    const __VLS_206 = __VLS_205({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.dialogLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_205));
    let __VLS_208;
    let __VLS_209;
    let __VLS_210;
    const __VLS_211 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_207.slots.default;
    var __VLS_207;
}
var __VLS_139;
/** @type {__VLS_StyleScopedClasses['page-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['page-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-row']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['user-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['user-name']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            formatDateTime: formatDateTime,
            loading: loading,
            dialogVisible: dialogVisible,
            dialogLoading: dialogLoading,
            dialogMode: dialogMode,
            tableData: tableData,
            pagination: pagination,
            queryForm: queryForm,
            dialogForm: dialogForm,
            stats: stats,
            loadUsers: loadUsers,
            handleSearch: handleSearch,
            handleReset: handleReset,
            openAddDialog: openAddDialog,
            openEditDialog: openEditDialog,
            handleSubmit: handleSubmit,
            handleDelete: handleDelete,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
