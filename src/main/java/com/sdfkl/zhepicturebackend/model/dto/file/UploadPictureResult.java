package com.sdfkl.zhepicturebackend.model.dto.file;

import lombok.Data;

import java.util.Date;

/**
 * 上传图片返回结果
 */
@Data
public class UploadPictureResult {
    /**
     * 图片 url
     */
    private String url;

    /**
     * 缩略图 url
     */
    private String thumbnailUrl;

    private String objectKey;

    private String thumbnailObjectKey;

    private String compressedObjectKey;

    private String contentType;

    private String etag;


    /**
     * 图片名称
     */
    private String picName;

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
     * 图片颜色
     */
    private String picColor;

}
