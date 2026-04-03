import request from '@/utils/request';
export function login(data) {
    return request.post('/user/login', data);
}
export function register(data) {
    return request.post('/user/register', data);
}
export function getLoginUser() {
    return request.get('/user/get/login');
}
export function logout() {
    return request.post('/user/logout');
}
export function listUsersByPage(data) {
    return request.post('/user/list/page/vo', data);
}
export function addUser(data) {
    return request.post('/user/add', data);
}
export function updateUser(data) {
    return request.post('/user/update', data);
}
export function deleteUser(id) {
    return request.post('/user/delete', { id });
}
