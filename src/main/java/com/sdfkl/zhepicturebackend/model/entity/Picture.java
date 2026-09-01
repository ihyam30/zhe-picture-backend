package com.sdfkl.zhepicturebackend.model.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.io.Serializable;
import java.util.Date;

import lombok.Data;

/**
 * 图片
 *
 * @TableName picture
 */
@TableName(value = "picture")
@Data
public class Picture implements Serializable {
    private static final long serialVersionUID = 7660034417259743373L;
    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 图片 url
     */
    private String url;

    /**
     * 缩略图 url
     */
    private String thumbnailUrl;

    /**
     * 原图 COS 对象 key，删除对象时只使用该字段，不再从 URL 反解析。
     */
    private String objectKey;

    /**
     * 缩略图 COS 对象 key。
     */
    private String thumbnailObjectKey;

    /**
     * 压缩图 COS 对象 key。
     */
    private String compressedObjectKey;

    /**
     * 上传生命周期状态。
     */
    private String uploadStatus;

    /**
     * 实际内容类型。
     */
    private String contentType;

    /**
     * COS ETag。
     */
    private String etag;

    /**
     * 乐观锁版本号。
     */
    @Version
    private Integer version;

    /**
     * 客户端幂等号。
     */
    private String idempotencyKey;

    /**
     * 图片名称
     */
    private String name;

    /**
     * 简介
     */
    private String introduction;

    /**
     * 分类
     */
    private String category;

    /**
     * 标签（JSON 数组）
     */
    private String tags;

    /**
     * 图片体积
     */
    private Long picSize;

    /**
     * 图片宽度
     */
    private Integer picWidth;

    /**
     * 图片高度
     */
    private Integer picHeight;

    /**
     * 图片宽高比例
     */
    private Double picScale;

    /**
     * 图片格式
     */
    private String picFormat;

    /**
     * 创建用户 id
     */
    private Long userId;

    /**
     * 空间 id
     */
    private Long spaceId;

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 编辑时间
     */
    private Date editTime;

    /**
     * 更新时间
     */
    private Date updateTime;

    /**
     * 是否删除
     */
    @TableLogic
    private Integer isDelete;

    /**
     * 审核状态：0-待审核; 1-通过; 2-拒绝
     */
    private Integer reviewStatus;

    /**
     * 审核信息
     */
    private String reviewMessage;


    /**
     * 审核人 ID
     */
    private Long reviewerId;

    /**
     * 审核时间
     */
    private Date reviewTime;

    /**
     * 图片颜色
     */
    private String picColor;
}
