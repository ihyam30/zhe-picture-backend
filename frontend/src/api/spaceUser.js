import request from '@/utils/request';
export function listSpaceUsers(data) {
    return request.post('/spaceUser/list', data);
}
export function addSpaceUser(data) {
    return request.post('/spaceUser/add', data);
}
export function editSpaceUser(data) {
    return request.post('/spaceUser/edit', data);
}
export function deleteSpaceUser(id) {
    return request.post('/spaceUser/delete', { id });
}
export function listMyTeamSpaces() {
    return request.post('/spaceUser/list/my');
}
