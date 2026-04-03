import request from '@/utils/request';
export function getSpaceUsageAnalyze(data) {
    return request.post('/space/analyze/usage', data);
}
export function getSpaceCategoryAnalyze(data) {
    return request.post('/space/analyze/category', data);
}
export function getSpaceTagAnalyze(data) {
    return request.post('/space/analyze/tag', data);
}
export function getSpaceSizeAnalyze(data) {
    return request.post('/space/analyze/size', data);
}
export function getSpaceUserAnalyze(data) {
    return request.post('/space/analyze/user', data);
}
export function getSpaceRankAnalyze(data) {
    return request.post('/space/analyze/rank', data);
}
