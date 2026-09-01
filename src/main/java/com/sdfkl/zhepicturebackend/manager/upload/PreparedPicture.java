package com.sdfkl.zhepicturebackend.manager.upload;

import lombok.Data;

import java.io.File;

/**
 * 已完成本地落盘和内容校验、但尚未上传 COS 的图片。
 */
@Data
public class PreparedPicture {
    private File file;
    private String originalFilename;
    private String objectKey;
    private String contentType;
    private String format;
    private Long picSize;
    private Integer picWidth;
    private Integer picHeight;
    private Double picScale;

    public void deleteTempFile() {
        if (file != null && file.exists() && !file.delete()) {
            file.deleteOnExit();
        }
    }
}
