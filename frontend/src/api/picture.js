import request from '@/utils/request';
export function listPicturesByPage(data) {
    return request.post('/picture/list/page/vo', data);
}
export function getPictureDetail(id) {
    return request.get('/picture/get/vo', {
        params: { id },
    });
}
export function getPictureTagCategory() {
    return request.get('/picture/tag_category');
}
export function uploadPicture(file, data) {
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
    return request.post('/picture/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}
export function uploadPictureByUrl(data) {
    return request.post('/picture/upload/url', data);
}
export function uploadPictureBatch(data) {
    return request.post('/picture/upload/batch', data, {
        timeout: 120000,
    });
}
export function editPicture(data) {
    return request.post('/picture/edit', data);
}
export function deletePicture(id) {
    return request.post('/picture/delete', { id });
}
export function searchPictureByColor(data) {
    return request.post('/picture/search/color', data);
}
