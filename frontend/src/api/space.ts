import request from '@/utils/request';
import type { Id, PageResult } from '@/types/common';
import type {
  SpaceAddRequest,
  SpaceEditRequest,
  SpaceLevel,
  SpaceQueryRequest,
  SpaceVO,
} from '@/types/space';

export function listSpaceVOByPage(data: SpaceQueryRequest) {
  return request.post<never, PageResult<SpaceVO>>('/space/list/page/vo', data);
}

export function getSpaceDetail(id: Id) {
  return request.get<never, SpaceVO>('/space/get/vo', {
    params: { id },
  });
}

export function addSpace(data: SpaceAddRequest) {
  return request.post<never, Id>('/space/add', data);
}

export function editSpace(data: SpaceEditRequest) {
  return request.post<never, boolean>('/space/edit', data);
}

export function deleteSpace(id: Id) {
  return request.post<never, boolean>('/space/delete', { id });
}

export function listSpaceLevels() {
  return request.get<never, SpaceLevel[]>('/space/list/level');
}
