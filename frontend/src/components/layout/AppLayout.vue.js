import { DataAnalysis, FolderOpened, House, Picture, SwitchButton, User, UserFilled, } from '@element-plus/icons-vue';
import { computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { APP_TITLE } from '@/constants/app';
import { useAuthStore } from '@/store/auth';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const menuItems = computed(() => {
    const items = [
        { path: '/dashboard', label: '首页', icon: House },
        { path: '/pictures', label: '图片管理', icon: Picture },
        { path: '/spaces', label: '空间管理', icon: FolderOpened },
        { path: '/space-members', label: '空间成员', icon: UserFilled },
        { path: '/space-analysis', label: '空间分析', icon: DataAnalysis },
        { path: '/users', label: '用户管理', icon: User, adminOnly: true },
    ];
    return items.filter((item) => !item.adminOnly || authStore.isAdmin);
});
const activePath = computed(() => {
    if (route.path.startsWith('/pictures/')) {
        return '/pictures';
    }
    return route.path;
});
function go(path) {
    router.push(path);
}
async function handleLogout() {
    try {
        await ElMessageBox.confirm('确定退出当前账号吗？', '退出登录', {
            type: 'warning',
        });
        await authStore.logout();
        ElMessage.success('已退出登录');
        router.replace('/login');
    }
    catch {
        // 用户取消时无需处理
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['top-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['top-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['top-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['app-header-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['user-brief-name']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "app-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-header-inner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.go('/dashboard');
        } },
    ...{ class: "brand clickable" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-logo" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-cloud brand-cloud-left" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-cloud brand-cloud-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-cloud brand-cloud-core" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-star" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-title" },
});
(__VLS_ctx.APP_TITLE);
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "top-nav" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.menuItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.go(item.path);
            } },
        key: (item.path),
        ...{ class: "top-nav-item" },
        ...{ class: ({ active: __VLS_ctx.activePath === item.path }) },
        type: "button",
    });
    const __VLS_0 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "top-nav-icon" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "top-nav-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    const __VLS_4 = ((item.icon));
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
    const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
    var __VLS_3;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (item.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-right" },
});
const __VLS_8 = {}.ElDropdown;
/** @type {[typeof __VLS_components.ElDropdown, typeof __VLS_components.elDropdown, typeof __VLS_components.ElDropdown, typeof __VLS_components.elDropdown, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "user-brief" },
});
const __VLS_12 = {}.ElAvatar;
/** @type {[typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    size: (42),
    src: (__VLS_ctx.authStore.user?.userAvatar),
}));
const __VLS_14 = __VLS_13({
    size: (42),
    src: (__VLS_ctx.authStore.user?.userAvatar),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
(__VLS_ctx.authStore.user?.userName?.slice(0, 1) || 'U');
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "user-brief-name" },
});
(__VLS_ctx.authStore.user?.userName || __VLS_ctx.authStore.user?.userAccount);
{
    const { dropdown: __VLS_thisSlot } = __VLS_11.slots;
    const __VLS_16 = {}.ElDropdownMenu;
    /** @type {[typeof __VLS_components.ElDropdownMenu, typeof __VLS_components.elDropdownMenu, typeof __VLS_components.ElDropdownMenu, typeof __VLS_components.elDropdownMenu, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({}));
    const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    const __VLS_20 = {}.ElDropdownItem;
    /** @type {[typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, ]} */ ;
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
            __VLS_ctx.router.push('/profile');
        }
    };
    __VLS_23.slots.default;
    var __VLS_23;
    const __VLS_28 = {}.ElDropdownItem;
    /** @type {[typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        ...{ 'onClick': {} },
        divided: true,
    }));
    const __VLS_30 = __VLS_29({
        ...{ 'onClick': {} },
        divided: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    let __VLS_32;
    let __VLS_33;
    let __VLS_34;
    const __VLS_35 = {
        onClick: (__VLS_ctx.handleLogout)
    };
    __VLS_31.slots.default;
    const __VLS_36 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
    const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    const __VLS_40 = {}.SwitchButton;
    /** @type {[typeof __VLS_components.SwitchButton, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({}));
    const __VLS_42 = __VLS_41({}, ...__VLS_functionalComponentArgsRest(__VLS_41));
    var __VLS_39;
    var __VLS_31;
    var __VLS_19;
}
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "app-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-main-inner" },
});
const __VLS_44 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({}));
const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
/** @type {__VLS_StyleScopedClasses['app-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['app-header']} */ ;
/** @type {__VLS_StyleScopedClasses['app-header-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-cloud']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-cloud-left']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-cloud']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-cloud-right']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-cloud']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-cloud-core']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-star']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-title']} */ ;
/** @type {__VLS_StyleScopedClasses['top-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['top-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['top-nav-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['user-brief']} */ ;
/** @type {__VLS_StyleScopedClasses['user-brief-name']} */ ;
/** @type {__VLS_StyleScopedClasses['app-main']} */ ;
/** @type {__VLS_StyleScopedClasses['app-main-inner']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SwitchButton: SwitchButton,
            APP_TITLE: APP_TITLE,
            router: router,
            authStore: authStore,
            menuItems: menuItems,
            activePath: activePath,
            go: go,
            handleLogout: handleLogout,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
