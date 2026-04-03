import request from '@/utils/request';
import type {
  SpaceAnalyzeRequest,
  SpaceCategoryAnalyzeResponse,
  SpaceRankAnalyzeRequest,
  SpaceRankAnalyzeResponse,
  SpaceSizeAnalyzeResponse,
  SpaceTagAnalyzeResponse,
  SpaceUsageAnalyzeResponse,
  SpaceUserAnalyzeRequest,
  SpaceUserAnalyzeResponse,
} from '@/types/analyze';

export function getSpaceUsageAnalyze(data: SpaceAnalyzeRequest) {
  return request.post<never, SpaceUsageAnalyzeResponse>('/space/analyze/usage', data);
}

export function getSpaceCategoryAnalyze(data: SpaceAnalyzeRequest) {
  return request.post<never, SpaceCategoryAnalyzeResponse[]>('/space/analyze/category', data);
}

export function getSpaceTagAnalyze(data: SpaceAnalyzeRequest) {
  return request.post<never, SpaceTagAnalyzeResponse[]>('/space/analyze/tag', data);
}

export function getSpaceSizeAnalyze(data: SpaceAnalyzeRequest) {
  return request.post<never, SpaceSizeAnalyzeResponse[]>('/space/analyze/size', data);
}

export function getSpaceUserAnalyze(data: SpaceUserAnalyzeRequest) {
  return request.post<never, SpaceUserAnalyzeResponse[]>('/space/analyze/user', data);
}

export function getSpaceRankAnalyze(data: SpaceRankAnalyzeRequest) {
  return request.post<never, SpaceRankAnalyzeResponse>('/space/analyze/rank', data);
}