import type { Id, PageRequest } from './common';
import type { UserVO } from './user';

export interface PictureVO {
  id: Id;
  url?: string;
  thumbnailUrl?: string;
  name?: string;
  introduction?: string;
  category?: string;
  tags?: string[];
  picSize?: number;
  picWidth?: number;
  picHeight?: number;
  picScale?: number;
  picFormat?: string;
  userId?: Id;
  spaceId?: Id;
  createTime?: string;
  editTime?: string;
  updateTime?: string;
  userVO?: UserVO;
  picColor?: string;
  reviewStatus?: number;
  reviewMessage?: string;
  reviewerId?: Id;
  reviewTime?: string;
  permissionList?: string[];
}

export interface PictureQueryRequest extends PageRequest {
  id?: Id;
  name?: string;
  introduction?: string;
  category?: string;
  tags?: string[];
  picSize?: number;
  picWidth?: number;
  picHeight?: number;
  picScale?: number;
  picFormat?: string;
  searchText?: string;
  userId?: Id;
  spaceId?: Id;
  nullSpaceId?: boolean;
  reviewStatus?: number;
  reviewMessage?: string;
  reviewerId?: Id;
  reviewTime?: string;
  startEditTime?: string;
  endEditTime?: string;
}

export interface PictureUploadRequest {
  id?: Id;
  fileUrl?: string;
  picName?: string;
  spaceId?: Id;
}

export interface PictureBatchUploadRequest {
  searchText: string;
  count: number;
  namePrefix?: string;
}

export interface PictureEditRequest {
  id: Id;
  name?: string;
  introduction?: string;
  category?: string;
  tags?: string[];
}

export interface SearchPictureByColorRequest {
  spaceId: Id;
  picColor: string;
}

export interface PictureTagCategory {
  tagList: string[];
  categoryList: string[];
}

export interface PictureEditRequestMessage {
  type: 'ENTER_EDIT' | 'EXIT_EDIT' | 'EDIT_ACTION' | string;
  editAction?: string;
}

export interface PictureEditResponseMessage {
  type: 'INFO' | 'ERROR' | 'ENTER_EDIT' | 'EXIT_EDIT' | 'EDIT_ACTION' | string;
  message?: string;
  editAction?: string;
  user?: UserVO;
}

export interface PictureOutPaintingParams {
  leftOffset: number;
  rightOffset: number;
  topOffset: number;
  bottomOffset: number;
  xScale: number | null;
  yScale: number | null;
  addWatermark: boolean;
}

export interface CreatePictureOutPaintingTaskRequest {
  pictureId: Id;
  parameters: PictureOutPaintingParams;
}

export interface CreateOutPaintingTaskResponse {
  output?: {
    taskId?: string;
    taskStatus?: string;
  };
  code?: string;
  message?: string;
  requestId?: string;
}

export interface GetOutPaintingTaskResponse {
  requestId?: string;
  output?: {
    taskId?: string;
    taskStatus?: string;
    submitTime?: string;
    scheduledTime?: string;
    endTime?: string;
    outputImageUrl?: string;
    code?: string;
    message?: string;
    taskMetrics?: {
      total?: number;
      succeeded?: number;
      failed?: number;
    };
  };
}