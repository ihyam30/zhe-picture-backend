import request from '@/utils/request';
export function createOutPaintingTask(data) {
    return request.post('/picture/out_painting/create_task', data);
}
export function getOutPaintingTask(taskId) {
    return request.get('/picture/out_painting/get_task', {
        params: { taskId },
    });
}
