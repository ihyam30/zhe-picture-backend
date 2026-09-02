import request from '@/utils/request';
export function createOutPaintingTask(data, idempotencyKey) {
    return request.post('/picture/out_painting/create_task', data, {
        headers: { 'Idempotency-Key': idempotencyKey },
    });
}
export function getOutPaintingTask(taskId) {
    return request.get('/aiTask/my', {
        params: { taskId },
    });
}
