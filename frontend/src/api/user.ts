import request from '@/utils/request';
import type { Id, PageResult } from '@/types/common';
import type {
  UserAddRequest,
  UserLoginRequest,
  UserLoginVO,
  UserQueryRequest,
  UserRegisterRequest,
  UserUpdateRequest,
  UserVO,
} from '@/types/user';

export function login(data: UserLoginRequest) {
  return request.post<never, UserLoginVO>('/user/login', data);
}

export function register(data: UserRegisterRequest) {
  return request.post<never, Id>('/user/register', data);
}

export function getLoginUser() {
  return request.get<never, UserLoginVO>('/user/get/login');
}

export function logout() {
  return request.post<never, boolean>('/user/logout');
}

export function listUsersByPage(data: UserQueryRequest) {
  return request.post<never, PageResult<UserVO>>('/user/list/page/vo', data);
}

export function addUser(data: UserAddRequest) {
  return request.post<never, Id>('/user/add', data);
}

export function updateUser(data: UserUpdateRequest) {
  return request.post<never, boolean>('/user/update', data);
}

export function deleteUser(id: Id) {
  return request.post<never, boolean>('/user/delete', { id });
}
