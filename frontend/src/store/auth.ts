import { defineStore } from 'pinia';
import { getLoginUser, login as loginApi, logout as logoutApi } from '@/api/user';
import { AUTH_USER_STORAGE_KEY } from '@/constants/storage';
import type { UserLoginRequest, UserLoginVO } from '@/types/user';

function loadCachedUser() {
  const cache = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!cache) {
    return null;
  }
  try {
    return JSON.parse(cache) as UserLoginVO;
  } catch (error) {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: loadCachedUser() as UserLoginVO | null,
    sessionChecked: false,
  }),
  getters: {
    isLogin: (state) => Boolean(state.user?.id),
    isAdmin: (state) => state.user?.userRole === 'admin',
  },
  actions: {
    setUser(user: UserLoginVO | null) {
      this.user = user;
      if (user) {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      }
    },
    clearUser() {
      this.setUser(null);
    },
    async login(payload: UserLoginRequest) {
      const user = await loginApi(payload);
      this.setUser(user);
      this.sessionChecked = true;
      return user;
    },
    async logout() {
      try {
        await logoutApi();
      } finally {
        this.clearUser();
        this.sessionChecked = true;
      }
    },
    async fetchCurrentUser(options: { silent?: boolean } = {}) {
      try {
        const user = await getLoginUser();
        this.setUser(user);
        return user;
      } catch (error) {
        if (!options.silent || !this.user) {
          this.clearUser();
        }
        return null;
      } finally {
        this.sessionChecked = true;
      }
    },
  },
});
