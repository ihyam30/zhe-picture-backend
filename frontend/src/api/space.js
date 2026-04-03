import request from '@/utils/request';
export function listSpaceVOByPage(data) {
    return request.post('/space/list/page/vo', data);
}
export function getSpaceDetail(id) {
    return request.get('/space/get/vo', {
        params: { id },
    });
}
export function addSpace(data) {
    return request.post('/space/add', data);
}
export function editSpace(data) {
    return request.post('/space/edit', data);
}
export function deleteSpace(id) {
    return request.post('/space/delete', { id });
}
export function listSpaceLevels() {
    return request.get('/space/list/level');
}
