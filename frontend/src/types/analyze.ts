import type { Id } from './common';
import type { SpaceVO } from './space';

export interface SpaceAnalyzeRequest {
  spaceId?: Id;
  queryPublic?: boolean;
  queryAll?: boolean;
}

export type AnalyzeTimeDimension = 'day' | 'week' | 'month';

export interface SpaceUserAnalyzeRequest extends SpaceAnalyzeRequest {
  userId?: Id;
  timeDimension: AnalyzeTimeDimension;
}

export interface SpaceUsageAnalyzeResponse {
  usedSize?: number;
  maxSize?: number;
  sizeUsageRatio?: number;
  usedCount?: number;
  maxCount?: number;
  countUsageRatio?: number;
}

export interface SpaceCategoryAnalyzeResponse {
  category: string;
  count: number;
  totalSize: number;
}

export interface SpaceTagAnalyzeResponse {
  tag: string;
  count: number;
}

export interface SpaceSizeAnalyzeResponse {
  sizeRange: string;
  count: number;
}

export interface SpaceUserAnalyzeResponse {
  period: string;
  count: number;
}

export interface SpaceRankAnalyzeRequest {
  topN?: number;
}

export type SpaceRankAnalyzeResponse = SpaceVO[];