import request from '@/utils/request';
import type { Id } from '@/types/common';
import type {
  SpaceUserAddRequest,
  SpaceUserEditRequest,
  SpaceUserQueryRequest,
  SpaceUserVO,
} from '@/types/space-user';

export function listSpaceUsers(data: SpaceUserQueryRequest) {
  return request.post<never, SpaceUserVO[]>('/spaceUser/list', data);
}

export function addSpaceUser(data: SpaceUserAddRequest) {
  return request.post<never, Id>('/spaceUser/add', data);
}

export function editSpaceUser(data: SpaceUserEditRequest) {
  return request.post<never, boolean>('/spaceUser/edit', data);
}

export function deleteSpaceUser(id: Id) {
  return request.post<never, boolean>('/spaceUser/delete', { id });
}

export function listMyTeamSpaces() {
  return request.post<never, SpaceUserVO[]>('/spaceUser/list/my');
}
