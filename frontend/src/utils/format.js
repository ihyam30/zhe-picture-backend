export function formatDateTime(value) {
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
export function formatFileSize(size) {
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
export function formatReviewStatus(status) {
    const map = {
        0: '待审核',
        1: '审核通过',
        2: '审核拒绝',
    };
    if (status === undefined || status === null) {
        return '未返回';
    }
    return map[status] || '未知状态';
}
export function reviewStatusTagType(status) {
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
export function formatSpaceType(type) {
    if (type === 1) {
        return '团队空间';
    }
    if (type === 0) {
        return '个人空间';
    }
    return '--';
}
export function formatSpaceLevel(level) {
    const map = {
        0: '普通版',
        1: '专业版',
        2: '旗舰版',
    };
    if (level === undefined || level === null) {
        return '--';
    }
    return map[level] || `等级 ${level}`;
}
export function formatSpaceRole(role) {
    const map = {
        viewer: '浏览者',
        editor: '协作者',
        admin: '管理员',
    };
    if (!role) {
        return '--';
    }
    return map[role] || role;
}
export function formatPercent(value) {
    if (value === undefined || value === null || Number.isNaN(value)) {
        return '0.00%';
    }
    return `${(value * 100).toFixed(2)}%`;
}
export function toNumber(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? undefined : numberValue;
}
export function uniqueById(list) {
    const map = new Map();
    list.forEach((item) => {
        if (item.id !== undefined && item.id !== null) {
            map.set(String(item.id), item);
        }
    });
    return Array.from(map.values());
}
