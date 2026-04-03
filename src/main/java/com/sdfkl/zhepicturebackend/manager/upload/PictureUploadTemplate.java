package com.sdfkl.zhepicturebackend.manager.upload;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileTypeUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.NumberUtil;
import cn.hutool.core.util.RandomUtil;
import com.qcloud.cos.model.PutObjectResult;
import com.qcloud.cos.model.ciModel.persistence.CIObject;
import com.qcloud.cos.model.ciModel.persistence.ImageInfo;
import com.qcloud.cos.model.ciModel.persistence.ProcessResults;
import com.sdfkl.zhepicturebackend.config.CosClientConfig;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.manager.CosManager;
import com.sdfkl.zhepicturebackend.model.dto.file.UploadPictureResult;
import lombok.extern.slf4j.Slf4j;

import javax.annotation.Resource;
import java.io.File;

import java.net.URL;
import java.net.URLConnection;
import java.util.Date;
import java.util.List;

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
        // 1. 去 query 参数
        if (originalFilename.contains("?")) {
            originalFilename = originalFilename.substring(0, originalFilename.indexOf("?"));
        }

        // 2. 获取后缀
        String suffix = FileUtil.getSuffix(originalFilename);

        // 3. 兜底
        if (suffix == null || suffix.isEmpty() || suffix.length() > 10) {
            suffix = "jpg";
        }
        // 拼接文件上传路径
//        String uploadFilename = String.format("%s_%s.%s", DateUtil.formatDate(new Date()), uuid, FileUtil.getSuffix(originalFilename));
        suffix = "jpg"; // 默认兜底

        try {
            URL urlObj = new URL((String) inputResource);
            URLConnection conn = urlObj.openConnection();
            String contentType = conn.getContentType(); // image/jpeg

            if (contentType != null && contentType.contains("/")) {
                suffix = contentType.split("/")[1];
            }
        } catch (Exception e) {
            log.warn("获取Content-Type失败，使用默认jpg");
        }

        String uploadFilename = String.format(
                "%s_%s.%s",
                DateUtil.formatDate(new Date()),
                uuid,
                suffix
        );
        File file = null;
        try {
            // 1️⃣ 先创建临时文件（先随便用 jpg）
            file = File.createTempFile("upload_", ".jpg");

            // 2️⃣ 下载文件
            processFile(inputResource, file);

            // 3️⃣ 用文件内容判断真实类型（最关键！）
            suffix = FileTypeUtil.getType(file);

            if (suffix == null) {
                suffix = "jpg";
            }

            if ("jpeg".equals(suffix)) {
                suffix = "jpg";
            }

            // 4️⃣ 🚨 在这里才生成最终文件名
            uploadFilename = String.format(
                    "%s_%s.%s",
                    DateUtil.formatDate(new Date()),
                    uuid,
                    suffix
            );

            String uploadPath = String.format("/%s/%s", uploadPathPrefix, uploadFilename);

            // 5️⃣ 上传
            PutObjectResult putObjectResult = cosManager.putPictureObject(uploadPath, file);
            ImageInfo imageInfo = putObjectResult.getCiUploadResult().getOriginalInfo().getImageInfo();
            // 获取到图片处理结果
            ProcessResults processResults = putObjectResult.getCiUploadResult().getProcessResults();
            List<CIObject> objectList = processResults.getObjectList();
            if(CollUtil.isNotEmpty(objectList)){
                CIObject compressCiObject = null;
                CIObject thumbnailCiObject = null;
                for (CIObject ciObject : objectList) {
                    String key = ciObject.getKey();
                    if (key != null && key.contains("_thumbnail")) {
                        thumbnailCiObject = ciObject;
                    } else if (compressCiObject == null) {
                        compressCiObject = ciObject;
                    }
                }
                // 如果没找到主图，就退化成用第一个
                if (compressCiObject == null) {
                    compressCiObject = objectList.get(0);
                }
                // 如果没找到缩略图，就让缩略图等于主图
                if (thumbnailCiObject == null) {
                    thumbnailCiObject = compressCiObject;
                }
                return buildResult(originalFilename, compressCiObject, thumbnailCiObject, imageInfo);
            }
            return buildResult(originalFilename,file,uploadPath,imageInfo);
        } catch (Exception e) {
            log.error("图片上传到对象存储失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败");
        } finally {
            deleteTempFile(file);
        }
    }

    /**
     * 封装返回结果
     *
     * @param originalFilename  原始文件名
     * @param ciObject          对象存储对象
     * @param thumbnailCiObject
     * @return 返回结果
     */
    private UploadPictureResult buildResult(String originalFilename, CIObject ciObject, CIObject thumbnailCiObject, ImageInfo imageInfo) {
        // 计算宽高
        int picWidth = ciObject.getWidth();
        int picHeight = ciObject.getHeight();
        double picScale = NumberUtil.round(picWidth * 1.0 / picHeight, 2).doubleValue();
        // 封装返回结果
        UploadPictureResult uploadPictureResult = new UploadPictureResult();
        // 设置压缩后的原图地址
        uploadPictureResult.setUrl(cosClientConfig.getHost() + "/" + ciObject.getKey());
        uploadPictureResult.setPicName(FileUtil.mainName(originalFilename));
        uploadPictureResult.setPicSize(ciObject.getSize().longValue());
        uploadPictureResult.setPicWidth(picWidth);
        uploadPictureResult.setPicHeight(picHeight);
        uploadPictureResult.setPicScale(picScale);
        uploadPictureResult.setPicFormat(ciObject.getFormat());
        uploadPictureResult.setPicColor(imageInfo.getAve());
        // 设置缩略图地址
        uploadPictureResult.setThumbnailUrl(cosClientConfig.getHost() + "/" + thumbnailCiObject.getKey());
        // 返回可访问的地址
        return uploadPictureResult;
    }


    /**
     *  封装返回结果
     * @param originalFilename 原始文件名
     * @param file  文件
     * @param uploadPath 上传路径
     * @param imageInfo 图片信息
     * @return 返回结果
     */
    private UploadPictureResult buildResult(String originalFilename, File file, String uploadPath, ImageInfo imageInfo) {
        // 计算宽高
        int picWidth = imageInfo.getWidth();
        int picHeight = imageInfo.getHeight();
        double picScale = NumberUtil.round(picWidth * 1.0 / picHeight, 2).doubleValue();
        // 封装返回结果
        UploadPictureResult uploadPictureResult = new UploadPictureResult();
        uploadPictureResult.setUrl(cosClientConfig.getHost() + "/" + uploadPath);
        uploadPictureResult.setPicName(FileUtil.mainName(originalFilename));
        uploadPictureResult.setPicSize(FileUtil.size(file));
        uploadPictureResult.setPicWidth(picWidth);
        uploadPictureResult.setPicHeight(picHeight);
        uploadPictureResult.setPicScale(picScale);
        uploadPictureResult.setPicFormat(imageInfo.getFormat());
        uploadPictureResult.setPicColor(imageInfo.getAve());
        // 返回可访问的地址
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
