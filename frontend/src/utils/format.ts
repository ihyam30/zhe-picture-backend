import type { Id } from '@/types/common';

export function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return '--';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString('zh-CN', {
    hour12: false,
  });
}

export function formatFileSize(size?: number | null) {
  if (!size && size !== 0) {
    return '--';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatReviewStatus(status?: number | null) {
  const map: Record<number, string> = {
    0: '待审核',
    1: '审核通过',
    2: '审核拒绝',
  };
  if (status === undefined || status === null) {
    return '未返回';
  }
  return map[status] || '未知状态';
}

export function reviewStatusTagType(status?: number | null) {
  if (status === 1) {
    return 'success';
  }
  if (status === 2) {
    return 'danger';
  }
  if (status === 0) {
    return 'warning';
  }
  return 'info';
}

export function formatSpaceType(type?: number | null) {
  if (type === 1) {
    return '团队空间';
  }
  if (type === 0) {
    return '个人空间';
  }
  return '--';
}

export function formatSpaceLevel(level?: number | null) {
  const map: Record<number, string> = {
    0: '普通版',
    1: '专业版',
    2: '旗舰版',
  };
  if (level === undefined || level === null) {
    return '--';
  }
  return map[level] || `等级 ${level}`;
}

export function formatSpaceRole(role?: string | null) {
  const map: Record<string, string> = {
    viewer: '浏览者',
    editor: '协作者',
    admin: '管理员',
  };
  if (!role) {
    return '--';
  }
  return map[role] || role;
}

export function formatPercent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '0.00%';
  }
  return `${(value * 100).toFixed(2)}%`;
}

export function toNumber(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? undefined : numberValue;
}

export function uniqueById<T extends { id?: Id }>(list: T[]) {
  const map = new Map<string, T>();
  list.forEach((item) => {
    if (item.id !== undefined && item.id !== null) {
      map.set(String(item.id), item);
    }
  });
  return Array.from(map.values());
}