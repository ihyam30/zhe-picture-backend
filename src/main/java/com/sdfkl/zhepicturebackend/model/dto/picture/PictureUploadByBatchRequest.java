package com.sdfkl.zhepicturebackend.model.dto.picture;

import lombok.Data;

import java.io.Serializable;

/**
 * 批量上传图片请求
 */
@Data
public class PictureUploadByBatchRequest implements Serializable {
    /**
     * 搜索关键字
     */
    private String searchText;

    /**
     * 抓取数量
     */
    private Integer count = 10;

    /**
     * 文件名前缀
     */
    private String namePrefix;

    private static final long serialVersionUID = 1L;
}
