package com.sdfkl.zhepicturebackend.model.enums;

/**
 * 图片对象存储生命周期状态。
 */
public enum PictureUploadStatusEnum {
    UPLOADING,
    READY,
    FAILED,
    DELETE_PENDING,
    DELETED
}
