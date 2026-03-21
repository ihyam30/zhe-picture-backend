package com.sdfkl.zhepicturebackend.manager.upload;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpStatus;
import cn.hutool.http.HttpUtil;
import cn.hutool.http.Method;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.List;

@Service
public class UrlPictureUpload extends PictureUploadTemplate {
    @Override
    protected void processFile(Object inputResource, File file) {
        String fileUrl = (String) inputResource;
        HttpUtil.downloadFile(fileUrl, file);
    }

    @Override
    protected String getOriginalFilename(Object inputResource) {
        String fileUrl = (String) inputResource;

        // 1. 先尝试从 URL 获取后缀
        String suffix = FileUtil.extName(fileUrl);

        // 2. 如果没有后缀 → 用 Content-Type 判断
        if (StrUtil.isBlank(suffix)) {
            suffix = getSuffixByContentType(fileUrl);
        }

        // 3. 兜底
        if (StrUtil.isBlank(suffix)) {
            suffix = "jpg";
        }

        // 4. 生成文件名
        return IdUtil.simpleUUID() + "." + suffix;
    }

    @Override
    protected void validPicture(Object inputResource) {
        String fileUrl = (String) inputResource;
        // 校验非空
        ThrowUtils.throwIf(fileUrl == null, ErrorCode.PARAMS_ERROR, "图片不能为空");
        // 校验 URL 格式
        try {
            new URL(fileUrl);
        } catch (MalformedURLException e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片 URL 格式错误");
        }
        // 校验 URL 的协议
        ThrowUtils.throwIf(!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://"), ErrorCode.PARAMS_ERROR, "图片 URL 协议错误");
        HttpResponse httpResponse = null;
        try {
            // 发送 HEAD 请求验证文件是否存在
            httpResponse = HttpUtil.createRequest(Method.HEAD, fileUrl).execute();
            // 未正常返回，无需执行其他判断
            if (httpResponse.getStatus() != HttpStatus.HTTP_OK) {
                return;
            }
            // 文件存在，文件类型校验
            String contentType = httpResponse.header("Content-Type");
            // 不为空，才校验是否合法
            if (StrUtil.isNotBlank(contentType)) {
                // 允许的图片类型
                final List<String> ALLOW_CONTENT_TYPES = Arrays.asList("image/jpeg", "image/png", "image/jpg", "image/webp");
                ThrowUtils.throwIf(!ALLOW_CONTENT_TYPES.contains(contentType), ErrorCode.PARAMS_ERROR, "图片格式错误");
            }
            // 文件存在，文件大小校验
            String contentLengthStr = httpResponse.header("Content-Length");
            if (StrUtil.isNotBlank(contentLengthStr)) {
                try {
                    long contentLength = Long.parseLong(contentLengthStr);
                    final long ONE_MB = 1024 * 1024;
                    ThrowUtils.throwIf(contentLength > 2 * ONE_MB, ErrorCode.PARAMS_ERROR, "文件大小不能超过2MB");
                } catch (NumberFormatException e) {
                    throw new BusinessException(ErrorCode.SYSTEM_ERROR, "文件大小转换错误");
                }
            }
        } finally {
            // 释放资源
            if (httpResponse != null) {
                httpResponse.close();
            }
        }
    }
    private String getSuffixByContentType(String fileUrl) {
        try {
            HttpResponse response = HttpUtil.createRequest(Method.HEAD, fileUrl).execute();
            String contentType = response.header("Content-Type");

            if (contentType == null) return "jpg";

            if (contentType.contains("jpeg")) return "jpg";
            if (contentType.contains("png")) return "png";
            if (contentType.contains("webp")) return "webp";
            if (contentType.contains("gif")) return "gif";

        } catch (Exception e) {
            e.printStackTrace();
        }
        return "jpg";
    }
}
