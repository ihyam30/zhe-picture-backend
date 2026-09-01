package com.sdfkl.zhepicturebackend.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 上传任务，用于持久化上传中和替换图片时的旧对象快照。
 */
@Data
@TableName("picture_upload_task")
public class PictureUploadTask implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long pictureId;

    /**
     * 被替换的旧图片 id；新增上传时为空，不能用 oldPicSize 作为替换标志。
     */
    private Long oldPictureId;

    private Long userId;

    private Long spaceId;

    private String idempotencyKey;

    private String objectKey;

    private String thumbnailObjectKey;

    private String compressedObjectKey;

    private Long picSize;

    private String oldObjectKey;

    private String oldThumbnailObjectKey;

    private String oldCompressedObjectKey;

    private Long oldPicSize;

    private String status;

    private Integer retryCount;

    private String lastError;

    private Date createTime;

    private Date updateTime;
}
