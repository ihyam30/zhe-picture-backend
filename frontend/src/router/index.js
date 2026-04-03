import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';
import { APP_TITLE } from '@/constants/app';
import { useAuthStore } from '@/store/auth';
import pinia from '@/store';
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';
import HomeView from '@/views/dashboard/HomeView.vue';
import ProfileView from '@/views/dashboard/ProfileView.vue';
import PictureListView from '@/views/picture/PictureListView.vue';
import PictureDetailView from '@/views/picture/PictureDetailView.vue';
import AIOutpaintingView from '@/views/picture/AIOutpaintingView.vue';
import SpaceListView from '@/views/space/SpaceListView.vue';
import SpaceMembersView from '@/views/space/SpaceMembersView.vue';
import SpaceAnalysisView from '@/views/analysis/SpaceAnalysisView.vue';
import UserManageView from '@/views/admin/UserManageView.vue';
import ForbiddenView from '@/views/ForbiddenView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: {
                public: true,
                title: '登录',
            },
        },
        {
            path: '/register',
            name: 'register',
            component: RegisterView,
            meta: {
                public: true,
                title: '注册',
            },
        },
        {
            path: '/',
            component: AppLayout,
            redirect: '/dashboard',
            meta: {
                requiresAuth: true,
            },
            children: [
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    component: HomeView,
                    meta: { title: '首页', requiresAuth: true },
                },
                {
                    path: 'profile',
                    name: 'profile',
                    component: ProfileView,
                    meta: { title: '个人中心', requiresAuth: true, hidden: true },
                },
                {
                    path: 'pictures',
                    name: 'pictures',
                    component: PictureListView,
                    meta: { title: '图片管理', requiresAuth: true },
                },
                {
                    path: 'pictures/:id',
                    name: 'picture-detail',
                    component: PictureDetailView,
                    meta: { title: '图片详情', requiresAuth: true, hidden: true },
                },
                {
                    path: 'spaces',
                    name: 'spaces',
                    component: SpaceListView,
                    meta: { title: '空间管理', requiresAuth: true },
                },
                {
                    path: 'space-members',
                    name: 'space-members',
                    component: SpaceMembersView,
                    meta: { title: '空间成员', requiresAuth: true },
                },
                {
                    path: 'space-analysis',
                    name: 'space-analysis',
                    component: SpaceAnalysisView,
                    meta: { title: '空间分析', requiresAuth: true },
                },
                {
                    path: 'ai-outpainting',
                    name: 'ai-outpainting',
                    component: AIOutpaintingView,
                    meta: { title: 'AI 扩图', requiresAuth: true },
                },
                {
                    path: 'users',
                    name: 'users',
                    component: UserManageView,
                    meta: { title: '用户管理', requiresAuth: true, adminOnly: true },
                },
            ],
        },
        {
            path: '/403',
            name: 'forbidden',
            component: ForbiddenView,
            meta: { title: '无权限访问', public: true },
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: NotFoundView,
            meta: { title: '页面不存在', public: true },
        },
    ],
});
router.beforeEach(async (to) => {
    document.title = to.meta.title ? `${to.meta.title} - ${APP_TITLE}` : APP_TITLE;
    const authStore = useAuthStore(pinia);
    if (!authStore.sessionChecked && (authStore.user || !to.meta.public)) {
        await authStore.fetchCurrentUser({ silent: true });
    }
    if (to.meta.public) {
        if (authStore.isLogin && (to.path === '/login' || to.path === '/register')) {
            return { path: '/dashboard' };
        }
        return true;
    }
    if (!authStore.isLogin) {
        return {
            path: '/login',
            query: {
                redirect: to.fullPath,
            },
        };
    }
    if (to.meta.adminOnly && !authStore.isAdmin) {
        return { path: '/403' };
    }
    return true;
});
export default router;
