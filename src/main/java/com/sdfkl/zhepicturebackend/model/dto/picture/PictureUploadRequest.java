package com.sdfkl.zhepicturebackend.model.dto.picture;

import lombok.Data;

import java.io.Serializable;

/**
 * 图片上传请求
 */
@Data
public class PictureUploadRequest implements Serializable {
    private static final long serialVersionUID = 7660034417259743373L;
    /**
     * 图片id（用于修改）
     */
    private Long id;
}
