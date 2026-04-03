import type { Id, PageRequest } from './common';

export type UserRole = 'user' | 'admin' | string;

export interface UserLoginVO {
  id: Id;
  userAccount: string;
  userName?: string;
  userAvatar?: string;
  userProfile?: string;
  userRole?: UserRole;
  editTime?: string;
  createTime?: string;
  updateTime?: string;
}

export interface UserVO {
  id: Id;
  userAccount: string;
  userName?: string;
  userAvatar?: string;
  userProfile?: string;
  userRole?: UserRole;
  createTime?: string;
}

export interface UserLoginRequest {
  userAccount: string;
  userPassword: string;
}

export interface UserRegisterRequest {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

export interface UserAddRequest {
  userAccount: string;
  userName?: string;
  userAvatar?: string;
  userProfile?: string;
  userRole?: UserRole;
}

export interface UserUpdateRequest {
  id: Id;
  userName?: string;
  userAvatar?: string;
  userProfile?: string;
  userRole?: UserRole;
}

export interface UserQueryRequest extends PageRequest {
  id?: Id;
  userName?: string;
  userAccount?: string;
  userProfile?: string;
  userRole?: UserRole;
}
