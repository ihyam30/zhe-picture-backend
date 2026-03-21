package com.sdfkl.zhepicturebackend.manager.upload;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.NumberUtil;
import cn.hutool.core.util.RandomUtil;
import com.qcloud.cos.model.PutObjectResult;
import com.qcloud.cos.model.ciModel.persistence.ImageInfo;
import com.sdfkl.zhepicturebackend.config.CosClientConfig;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.manager.CosManager;
import com.sdfkl.zhepicturebackend.model.dto.file.UploadPictureResult;
import lombok.extern.slf4j.Slf4j;

import javax.annotation.Resource;
import java.io.File;

import java.util.Date;

@Slf4j
public abstract class PictureUploadTemplate {
    @Resource
    private CosManager cosManager;

    @Resource
    private CosClientConfig cosClientConfig;

    /**
     * 上传图片
     *
     * @param inputResource    输入资源
     * @param uploadPathPrefix 上传路径前缀
     * @return 图片信息
     */
    public UploadPictureResult uploadPicture(Object inputResource, String uploadPathPrefix) {
        // 校验图片
        validPicture(inputResource);
        // 图片的上传地址
        String uuid = RandomUtil.randomString(16);
        String originalFilename = getOriginalFilename(inputResource);
        // 拼接文件上传路径
        String uploadFilename = String.format("%s_%s.%s", DateUtil.formatDate(new Date()), uuid, FileUtil.getSuffix(originalFilename));
        String uploadPath = String.format("/%s/%s", uploadPathPrefix, uploadFilename);
        File file = null;
        try {
            //上传文件
            file = File.createTempFile(uploadPath, null);
            processFile(inputResource, file);
            PutObjectResult putObjectResult = cosManager.putPictureObject(uploadPath, file);
            return getUploadPictureResult(putObjectResult, uploadPath, originalFilename, file);
        } catch (Exception e) {
            log.error("图片上传到对象存储失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败");
        } finally {
            deleteTempFile(file);
        }
    }

    private UploadPictureResult getUploadPictureResult(PutObjectResult putObjectResult, String uploadPath, String originalFilename, File file) {
        // 获取图片信息对象
        ImageInfo imageInfo = putObjectResult.getCiUploadResult().getOriginalInfo().getImageInfo();
        String format = imageInfo.getFormat();
        int width = imageInfo.getWidth();
        int height = imageInfo.getHeight();
        // 计算宽高比
        double picScale = NumberUtil.round(width * 1.0 / height, 2).doubleValue();
        UploadPictureResult uploadPictureResult = new UploadPictureResult();
        uploadPictureResult.setUrl(cosClientConfig.getHost() + "/" + uploadPath);
        uploadPictureResult.setPicName(FileUtil.mainName(originalFilename));
        uploadPictureResult.setPicSize(FileUtil.size(file));
        uploadPictureResult.setPicWidth(width);
        uploadPictureResult.setPicHeight(height);
        uploadPictureResult.setPicScale(picScale);
        uploadPictureResult.setPicFormat(format);

        return uploadPictureResult;
    }

    /**
     * 输入资源转文件
     *
     * @param inputResource 输入资源
     */
    protected abstract void processFile(Object inputResource, File file);

    /**
     * 获取原始文件名
     *
     * @param inputResource 输入资源
     */
    protected abstract String getOriginalFilename(Object inputResource);

    /**
     * 校验图片
     *
     * @param inputResource 输入资源
     */
    protected abstract void validPicture(Object inputResource);

    /**
     * 删除临时文件
     *
     * @param file 临时文件
     */
    private static void deleteTempFile(File file) {
        if (file != null) {
            // 删除临时文件
            boolean delete = file.delete();
            if (!delete) {
                log.error("file delete error,filePath:{}", file.getAbsolutePath());
            }
        }
    }
}
