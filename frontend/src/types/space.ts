import type { Id, PageRequest } from './common';
import type { UserVO } from './user';

export interface SpaceVO {
  id: Id;
  spaceName: string;
  spaceLevel?: number;
  spaceType?: number;
  maxSize?: number;
  maxCount?: number;
  totalSize?: number;
  totalCount?: number;
  userId?: Id;
  createTime?: string;
  editTime?: string;
  updateTime?: string;
  userVO?: UserVO;
  permissionList?: string[];
}

export interface SpaceAddRequest {
  spaceName: string;
  spaceLevel?: number;
  spaceType?: number;
}

export interface SpaceEditRequest {
  id: Id;
  spaceName: string;
}

export interface SpaceQueryRequest extends PageRequest {
  spaceName?: string;
  spaceLevel?: number;
  spaceType?: number;
  id?: Id;
  userId?: Id;
}

export interface SpaceLevel {
  value: number;
  text: string;
  maxCount: number;
  maxSize: number;
}
