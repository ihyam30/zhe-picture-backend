import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addSpaceUser, deleteSpaceUser, editSpaceUser, listMyTeamSpaces, listSpaceUsers } from '@/api/spaceUser';
import { formatDateTime, formatSpaceRole } from '@/utils/format';
const loading = ref(false);
const teamSpaces = ref([]);
const selectedSpaceId = ref('');
const members = ref([]);
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const previewVisible = ref(false);
const dialogLoading = ref(false);
const currentMember = ref(null);
const addForm = reactive({
    userId: '',
    spaceRole: 'viewer',
});
const editForm = reactive({
    id: '',
    spaceRole: 'viewer',
});
const selectedTeam = ref(null);
async function loadTeams() {
    teamSpaces.value = await listMyTeamSpaces();
    if (!selectedSpaceId.value && teamSpaces.value[0]?.spaceId) {
        selectedSpaceId.value = String(teamSpaces.value[0].spaceId);
    }
}
async function loadMembers() {
    if (!selectedSpaceId.value) {
        members.value = [];
        return;
    }
    loading.value = true;
    try {
        members.value = await listSpaceUsers({
            spaceId: selectedSpaceId.value,
        });
        selectedTeam.value =
            teamSpaces.value.find((item) => String(item.spaceId) === String(selectedSpaceId.value)) || null;
    }
    finally {
        loading.value = false;
    }
}
watch(selectedSpaceId, () => {
    loadMembers();
});
function openAddDialog() {
    addForm.userId = '';
    addForm.spaceRole = 'viewer';
    addDialogVisible.value = true;
}
function openEditDialog(member) {
    currentMember.value = member;
    editForm.id = String(member.id);
    editForm.spaceRole = member.spaceRole;
    editDialogVisible.value = true;
}
async function handleAddMember() {
    if (!selectedSpaceId.value || !addForm.userId.trim()) {
        ElMessage.warning('请选择团队空间并填写用户 ID');
        return;
    }
    dialogLoading.value = true;
    try {
        await addSpaceUser({
            spaceId: selectedSpaceId.value,
            userId: addForm.userId.trim(),
            spaceRole: addForm.spaceRole,
        });
        ElMessage.success('成员添加成功');
        addDialogVisible.value = false;
        await loadMembers();
    }
    finally {
        dialogLoading.value = false;
    }
}
async function handleEditMember() {
    dialogLoading.value = true;
    try {
        await editSpaceUser({
            id: editForm.id,
            spaceRole: editForm.spaceRole,
        });
        ElMessage.success('成员角色已更新');
        editDialogVisible.value = false;
        await loadMembers();
    }
    finally {
        dialogLoading.value = false;
    }
}
async function handleDeleteMember(member) {
    await ElMessageBox.confirm(`确定移除成员 ${member.user?.userName || member.user?.userAccount || member.userId} 吗？`, '移除成员', { type: 'warning' });
    await deleteSpaceUser(member.id);
    ElMessage.success('成员已移除');
    await loadMembers();
}
onMounted(async () => {
    await loadTeams();
    await loadMembers();
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
for (const [team] of __VLS_getVForSourceType((__VLS_ctx.teamSpaces))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectedSpaceId = String(team.spaceId);
            } },
        key: (team.id),
        type: "button",
        ...{ class: "workspace-nav-item" },
        ...{ class: ({ active: __VLS_ctx.selectedSpaceId === String(team.spaceId) }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "workspace-nav-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (team.space?.spaceName || `空间 ${team.spaceId}`);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openAddDialog) },
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
    ...{ class: "surface-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "section-title" },
});
(__VLS_ctx.selectedTeam?.space?.spaceName || '团队成员管理');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "section-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-actions" },
});
const __VLS_0 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (...[$event]) => {
        __VLS_ctx.previewVisible = true;
    }
};
__VLS_3.slots.default;
var __VLS_3;
const __VLS_8 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (__VLS_ctx.openAddDialog)
};
__VLS_11.slots.default;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
});
if (__VLS_ctx.members.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "content-grid-3" },
        ...{ style: {} },
    });
    for (const [member] of __VLS_getVForSourceType((__VLS_ctx.members))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (member.id),
            ...{ class: "surface-panel" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "surface-panel-body" },
            ...{ style: {} },
        });
        const __VLS_16 = {}.ElAvatar;
        /** @type {[typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            size: (64),
            src: (member.user?.userAvatar),
        }));
        const __VLS_18 = __VLS_17({
            size: (64),
            src: (member.user?.userAvatar),
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        __VLS_19.slots.default;
        (member.user?.userName?.slice(0, 1) || 'U');
        var __VLS_19;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        (member.user?.userName || member.user?.userAccount || member.userId);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "muted-text" },
            ...{ style: {} },
        });
        (member.userId);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "inline-tags" },
            ...{ style: {} },
        });
        const __VLS_20 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            round: true,
        }));
        const __VLS_22 = __VLS_21({
            round: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        __VLS_23.slots.default;
        (__VLS_ctx.formatSpaceRole(member.spaceRole));
        var __VLS_23;
        const __VLS_24 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
            type: "info",
            round: true,
        }));
        const __VLS_26 = __VLS_25({
            type: "info",
            round: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        __VLS_27.slots.default;
        (__VLS_ctx.formatDateTime(member.createTime));
        var __VLS_27;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "info-stack" },
            ...{ style: {} },
        });
        const __VLS_28 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            ...{ 'onClick': {} },
            link: true,
            type: "primary",
        }));
        const __VLS_30 = __VLS_29({
            ...{ 'onClick': {} },
            link: true,
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        let __VLS_32;
        let __VLS_33;
        let __VLS_34;
        const __VLS_35 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.members.length))
                    return;
                __VLS_ctx.openEditDialog(member);
            }
        };
        __VLS_31.slots.default;
        var __VLS_31;
        const __VLS_36 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            ...{ 'onClick': {} },
            link: true,
            type: "danger",
        }));
        const __VLS_38 = __VLS_37({
            ...{ 'onClick': {} },
            link: true,
            type: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        let __VLS_40;
        let __VLS_41;
        let __VLS_42;
        const __VLS_43 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.members.length))
                    return;
                __VLS_ctx.handleDeleteMember(member);
            }
        };
        __VLS_39.slots.default;
        var __VLS_39;
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-placeholder" },
    });
}
const __VLS_44 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    modelValue: (__VLS_ctx.previewVisible),
    title: "团队成员",
    width: "700px",
}));
const __VLS_46 = __VLS_45({
    modelValue: (__VLS_ctx.previewVisible),
    title: "团队成员",
    width: "700px",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
if (__VLS_ctx.members.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "info-stack" },
        ...{ style: {} },
    });
    for (const [member] of __VLS_getVForSourceType((__VLS_ctx.members))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (member.id),
            ...{ style: {} },
        });
        const __VLS_48 = {}.ElAvatar;
        /** @type {[typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, ]} */ ;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
            size: (54),
            src: (member.user?.userAvatar),
        }));
        const __VLS_50 = __VLS_49({
            size: (54),
            src: (member.user?.userAvatar),
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        __VLS_51.slots.default;
        (member.user?.userName?.slice(0, 1) || 'U');
        var __VLS_51;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        (member.user?.userName || member.user?.userAccount || member.userId);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "muted-text" },
            ...{ style: {} },
        });
        (__VLS_ctx.formatDateTime(member.createTime));
        const __VLS_52 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
            round: true,
        }));
        const __VLS_54 = __VLS_53({
            round: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        __VLS_55.slots.default;
        (__VLS_ctx.formatSpaceRole(member.spaceRole));
        var __VLS_55;
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-placeholder" },
    });
}
var __VLS_47;
const __VLS_56 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    modelValue: (__VLS_ctx.addDialogVisible),
    title: "添加成员",
    width: "440px",
}));
const __VLS_58 = __VLS_57({
    modelValue: (__VLS_ctx.addDialogVisible),
    title: "添加成员",
    width: "440px",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    labelWidth: "90px",
}));
const __VLS_62 = __VLS_61({
    labelWidth: "90px",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    label: "用户 ID",
}));
const __VLS_66 = __VLS_65({
    label: "用户 ID",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
const __VLS_68 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    modelValue: (__VLS_ctx.addForm.userId),
    placeholder: "请输入要加入空间的用户 ID",
}));
const __VLS_70 = __VLS_69({
    modelValue: (__VLS_ctx.addForm.userId),
    placeholder: "请输入要加入空间的用户 ID",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
var __VLS_67;
const __VLS_72 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    label: "空间角色",
}));
const __VLS_74 = __VLS_73({
    label: "空间角色",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
const __VLS_76 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    modelValue: (__VLS_ctx.addForm.spaceRole),
    ...{ style: {} },
}));
const __VLS_78 = __VLS_77({
    modelValue: (__VLS_ctx.addForm.spaceRole),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    label: "浏览者",
    value: "viewer",
}));
const __VLS_82 = __VLS_81({
    label: "浏览者",
    value: "viewer",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
const __VLS_84 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    label: "编辑者",
    value: "editor",
}));
const __VLS_86 = __VLS_85({
    label: "编辑者",
    value: "editor",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
const __VLS_88 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    label: "管理员",
    value: "admin",
}));
const __VLS_90 = __VLS_89({
    label: "管理员",
    value: "admin",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
var __VLS_79;
var __VLS_75;
var __VLS_63;
{
    const { footer: __VLS_thisSlot } = __VLS_59.slots;
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
        onClick: (...[$event]) => {
            __VLS_ctx.addDialogVisible = false;
        }
    };
    __VLS_95.slots.default;
    var __VLS_95;
    const __VLS_100 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.dialogLoading),
    }));
    const __VLS_102 = __VLS_101({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.dialogLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    let __VLS_104;
    let __VLS_105;
    let __VLS_106;
    const __VLS_107 = {
        onClick: (__VLS_ctx.handleAddMember)
    };
    __VLS_103.slots.default;
    var __VLS_103;
}
var __VLS_59;
const __VLS_108 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    modelValue: (__VLS_ctx.editDialogVisible),
    title: "编辑成员角色",
    width: "440px",
}));
const __VLS_110 = __VLS_109({
    modelValue: (__VLS_ctx.editDialogVisible),
    title: "编辑成员角色",
    width: "440px",
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
__VLS_111.slots.default;
const __VLS_112 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    labelWidth: "90px",
}));
const __VLS_114 = __VLS_113({
    labelWidth: "90px",
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
__VLS_115.slots.default;
const __VLS_116 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    label: "成员 ID",
}));
const __VLS_118 = __VLS_117({
    label: "成员 ID",
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
__VLS_119.slots.default;
const __VLS_120 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    modelValue: (__VLS_ctx.currentMember?.userId || '--'),
    disabled: true,
}));
const __VLS_122 = __VLS_121({
    modelValue: (__VLS_ctx.currentMember?.userId || '--'),
    disabled: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
var __VLS_119;
const __VLS_124 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
    label: "空间角色",
}));
const __VLS_126 = __VLS_125({
    label: "空间角色",
}, ...__VLS_functionalComponentArgsRest(__VLS_125));
__VLS_127.slots.default;
const __VLS_128 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    modelValue: (__VLS_ctx.editForm.spaceRole),
    ...{ style: {} },
}));
const __VLS_130 = __VLS_129({
    modelValue: (__VLS_ctx.editForm.spaceRole),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
__VLS_131.slots.default;
const __VLS_132 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    label: "浏览者",
    value: "viewer",
}));
const __VLS_134 = __VLS_133({
    label: "浏览者",
    value: "viewer",
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
const __VLS_136 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    label: "编辑者",
    value: "editor",
}));
const __VLS_138 = __VLS_137({
    label: "编辑者",
    value: "editor",
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
const __VLS_140 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    label: "管理员",
    value: "admin",
}));
const __VLS_142 = __VLS_141({
    label: "管理员",
    value: "admin",
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
var __VLS_131;
var __VLS_127;
var __VLS_115;
{
    const { footer: __VLS_thisSlot } = __VLS_111.slots;
    const __VLS_144 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
        ...{ 'onClick': {} },
    }));
    const __VLS_146 = __VLS_145({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_145));
    let __VLS_148;
    let __VLS_149;
    let __VLS_150;
    const __VLS_151 = {
        onClick: (...[$event]) => {
            __VLS_ctx.editDialogVisible = false;
        }
    };
    __VLS_147.slots.default;
    var __VLS_147;
    const __VLS_152 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.dialogLoading),
    }));
    const __VLS_154 = __VLS_153({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.dialogLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_153));
    let __VLS_156;
    let __VLS_157;
    let __VLS_158;
    const __VLS_159 = {
        onClick: (__VLS_ctx.handleEditMember)
    };
    __VLS_155.slots.default;
    var __VLS_155;
}
var __VLS_111;
/** @type {__VLS_StyleScopedClasses['app-page']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-nav-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['workspace-content']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['page-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid-3']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['info-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-placeholder']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            formatDateTime: formatDateTime,
            formatSpaceRole: formatSpaceRole,
            teamSpaces: teamSpaces,
            selectedSpaceId: selectedSpaceId,
            members: members,
            addDialogVisible: addDialogVisible,
            editDialogVisible: editDialogVisible,
            previewVisible: previewVisible,
            dialogLoading: dialogLoading,
            currentMember: currentMember,
            addForm: addForm,
            editForm: editForm,
            selectedTeam: selectedTeam,
            openAddDialog: openAddDialog,
            openEditDialog: openEditDialog,
            handleAddMember: handleAddMember,
            handleEditMember: handleEditMember,
            handleDeleteMember: handleDeleteMember,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
