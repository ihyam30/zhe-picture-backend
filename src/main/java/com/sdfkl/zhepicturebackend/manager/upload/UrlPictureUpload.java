package com.sdfkl.zhepicturebackend.manager.upload;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import org.springframework.stereotype.Service;

import java.io.File;
import jakarta.annotation.Resource;

@Service
public class UrlPictureUpload extends PictureUploadTemplate {
    @Resource
    private SafeRemoteImageDownloader safeRemoteImageDownloader;

    @Override
    protected void processFile(Object inputResource, File file) {
        String fileUrl = (String) inputResource;
        safeRemoteImageDownloader.download(fileUrl, file);
    }

    @Override
    protected String getOriginalFilename(Object inputResource) {
        String fileUrl = (String) inputResource;

        // 1. 先尝试从 URL 获取后缀
        String suffix = FileUtil.extName(fileUrl);

        // URL 后缀仅用于临时展示，最终扩展名以文件内容检测结果为准。
        if (StrUtil.isBlank(suffix)) {
            suffix = "jpg";
        }

        // 4. 生成文件名
        return IdUtil.simpleUUID() + "." + suffix;
    }

    @Override
    protected void validPicture(Object inputResource) {
        String fileUrl = (String) inputResource;
        ThrowUtils.throwIf(fileUrl == null, ErrorCode.PARAMS_ERROR, "图片不能为空");
        safeRemoteImageDownloader.validateUrl(fileUrl);
    }
}
