import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { APP_TITLE } from '@/constants/app';
import { useAuthStore } from '@/store/auth';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const form = reactive({
    userAccount: '',
    userPassword: '',
});
const redirect = computed(() => typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard');
const previewCards = [
    '公共图库检索',
    '空间协同管理',
    'AI 扩图任务',
    '图片详情编辑',
];
async function handleSubmit() {
    if (!form.userAccount.trim() || !form.userPassword.trim()) {
        ElMessage.warning('请输入账号和密码');
        return;
    }
    loading.value = true;
    try {
        await authStore.login({ ...form });
        ElMessage.success('登录成功');
        router.replace(redirect.value);
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['showcase-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-showcase']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-showcase']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-showcase']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-grid']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "auth-showcase" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "showcase-brand" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "showcase-logo" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.APP_TITLE);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "showcase-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "showcase-kicker" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "preview-grid" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.previewCards))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (item),
        ...{ class: "preview-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-cover" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-title" },
    });
    (item);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "auth-panel-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-panel surface-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-caption" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "auth-desc" },
});
const __VLS_0 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onSubmit: (__VLS_ctx.handleSubmit)
};
__VLS_3.slots.default;
const __VLS_8 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    label: "账号",
}));
const __VLS_10 = __VLS_9({
    label: "账号",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    modelValue: (__VLS_ctx.form.userAccount),
    placeholder: "请输入账号",
    size: "large",
}));
const __VLS_14 = __VLS_13({
    modelValue: (__VLS_ctx.form.userAccount),
    placeholder: "请输入账号",
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
var __VLS_11;
const __VLS_16 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    label: "密码",
}));
const __VLS_18 = __VLS_17({
    label: "密码",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.userPassword),
    type: "password",
    showPassword: true,
    placeholder: "请输入密码",
    size: "large",
}));
const __VLS_22 = __VLS_21({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.userPassword),
    type: "password",
    showPassword: true,
    placeholder: "请输入密码",
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onKeyup: (__VLS_ctx.handleSubmit)
};
var __VLS_23;
var __VLS_19;
const __VLS_28 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    loading: (__VLS_ctx.loading),
    ...{ style: {} },
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    loading: (__VLS_ctx.loading),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onClick: (__VLS_ctx.handleSubmit)
};
__VLS_31.slots.default;
var __VLS_31;
var __VLS_3;
const __VLS_36 = {}.ElAlert;
/** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    title: "如果提示 Network Error，请确认后端 http://localhost:8123 已启动，并且前端可访问 /api。",
    type: "info",
    closable: (false),
    showIcon: true,
}));
const __VLS_38 = __VLS_37({
    title: "如果提示 Network Error，请确认后端 http://localhost:8123 已启动，并且前端可访问 /api。",
    type: "info",
    closable: (false),
    showIcon: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-footer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "muted-text" },
});
const __VLS_40 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    to: "/register",
}));
const __VLS_42 = __VLS_41({
    to: "/register",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
var __VLS_43;
/** @type {__VLS_StyleScopedClasses['auth-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-showcase']} */ ;
/** @type {__VLS_StyleScopedClasses['showcase-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['showcase-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['showcase-content']} */ ;
/** @type {__VLS_StyleScopedClasses['showcase-kicker']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-card']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-title']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-panel-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            APP_TITLE: APP_TITLE,
            loading: loading,
            form: form,
            previewCards: previewCards,
            handleSubmit: handleSubmit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
