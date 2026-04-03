import request from '@/utils/request';
import type {
  CreateOutPaintingTaskResponse,
  CreatePictureOutPaintingTaskRequest,
  GetOutPaintingTaskResponse,
} from '@/types/picture';

export function createOutPaintingTask(data: CreatePictureOutPaintingTaskRequest) {
  return request.post<never, CreateOutPaintingTaskResponse>(
    '/picture/out_painting/create_task',
    data,
  );
}

export function getOutPaintingTask(taskId: string) {
  return request.get<never, GetOutPaintingTaskResponse>(
    '/picture/out_painting/get_task',
    {
      params: { taskId },
    },
  );
}
