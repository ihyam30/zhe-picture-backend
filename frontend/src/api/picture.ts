import request from '@/utils/request';
import type { Id, PageResult } from '@/types/common';
import type {
  PictureBatchUploadRequest,
  PictureEditRequest,
  PictureQueryRequest,
  PictureTagCategory,
  PictureUploadRequest,
  PictureVO,
  SearchPictureByColorRequest,
} from '@/types/picture';

export function listPicturesByPage(data: PictureQueryRequest) {
  return request.post<never, PageResult<PictureVO>>('/picture/list/page/vo', data);
}

export function getPictureDetail(id: Id) {
  return request.get<never, PictureVO>('/picture/get/vo', {
    params: { id },
  });
}

export function getPictureTagCategory() {
  return request.get<never, PictureTagCategory>('/picture/tag_category');
}

export function uploadPicture(file: File, data: PictureUploadRequest) {
  const formData = new FormData();
  formData.append('file', file);
  if (data.id) {
    formData.append('id', String(data.id));
  }
  if (data.picName) {
    formData.append('picName', data.picName);
  }
  if (data.spaceId) {
    formData.append('spaceId', String(data.spaceId));
  }
  return request.post<never, PictureVO>('/picture/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function uploadPictureByUrl(data: PictureUploadRequest) {
  return request.post<never, PictureVO>('/picture/upload/url', data);
}

export function uploadPictureBatch(data: PictureBatchUploadRequest) {
  return request.post<never, number>('/picture/upload/batch', data, {
    timeout: 120000,
  });
}

export function editPicture(data: PictureEditRequest) {
  return request.post<never, boolean>('/picture/edit', data);
}

export function deletePicture(id: Id) {
  return request.post<never, boolean>('/picture/delete', { id });
}

export function searchPictureByColor(data: SearchPictureByColorRequest) {
  return request.post<never, PictureVO[]>('/picture/search/color', data);
}