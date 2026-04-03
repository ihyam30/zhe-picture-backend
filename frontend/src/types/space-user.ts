import type { Id } from './common';
import type { SpaceVO } from './space';
import type { UserVO } from './user';

export interface SpaceUserVO {
  id: Id;
  spaceId: Id;
  userId: Id;
  spaceRole: string;
  createTime?: string;
  updateTime?: string;
  user?: UserVO;
  space?: SpaceVO;
}

export interface SpaceUserAddRequest {
  spaceId: Id;
  userId: Id;
  spaceRole: string;
}

export interface SpaceUserEditRequest {
  id: Id;
  spaceRole: string;
}

export interface SpaceUserQueryRequest {
  id?: Id;
  spaceId?: Id;
  userId?: Id;
  spaceRole?: string;
}
