export type Id = string | number;

export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface PageRequest {
  current: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: string;
}

export interface DeleteRequest {
  id: Id;
}

export interface OptionItem {
  label: string;
  value: string | number;
}
