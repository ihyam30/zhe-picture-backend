package com.sdfkl.zhepicturebackend.manager.upload;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileTypeUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.NumberUtil;
import cn.hutool.core.util.RandomUtil;
import com.qcloud.cos.model.PutObjectResult;
import com.sdfkl.zhepicturebackend.config.CosClientConfig;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.manager.CosManager;
import com.sdfkl.zhepicturebackend.model.dto.file.UploadPictureResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;

import javax.annotation.Resource;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;

@Slf4j
public abstract class PictureUploadTemplate {
    private static final Set<String> ALLOWED_FORMATS = new HashSet<>(Arrays.asList("jpg", "jpeg", "png", "gif", "webp"));

    @Resource
    private CosManager cosManager;

    @Resource
    private CosClientConfig cosClientConfig;

    @Value("${picture.upload.max-pixels:16000000}")
    private long maxPixels;

    @Value("${picture.upload.cos.max-retries:3}")
    private int cosMaxRetries;

    /**
     * 先在本地完成下载、真实类型校验和尺寸校验，尚不访问 COS。
     */
    public PreparedPicture preparePicture(Object inputResource, String uploadPathPrefix) {
        validPicture(inputResource);
        File file = null;
        try {
            file = File.createTempFile("picture_upload_", ".tmp");
            processFile(inputResource, file);
            if (!file.exists() || file.length() == 0) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片内容为空");
            }
            String format = normalizeFormat(FileTypeUtil.getType(file));
            if (!ALLOWED_FORMATS.contains(format)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件实际格式不受支持");
            }
            ImageDimensions dimensions = readAndValidateImage(file);
            String originalFilename = getOriginalFilename(inputResource);
            if (originalFilename == null || originalFilename.trim().isEmpty()) {
                originalFilename = RandomUtil.randomString(12) + "." + format;
            }
            String objectKey = normalizeKey(uploadPathPrefix) + "/"
                    + DateUtil.formatDate(new java.util.Date()) + "_"
                    + RandomUtil.randomString(24) + "." + format;
            PreparedPicture preparedPicture = new PreparedPicture();
            preparedPicture.setFile(file);
            preparedPicture.setOriginalFilename(originalFilename);
            preparedPicture.setObjectKey(objectKey);
            preparedPicture.setFormat(format);
            preparedPicture.setContentType(getContentType(format));
            preparedPicture.setPicSize(file.length());
            preparedPicture.setPicWidth(dimensions.width);
            preparedPicture.setPicHeight(dimensions.height);
            preparedPicture.setPicScale(NumberUtil.round(dimensions.width * 1.0 / dimensions.height, 2).doubleValue());
            return preparedPicture;
        } catch (RuntimeException e) {
            deleteTempFile(file);
            throw e;
        } catch (Exception e) {
            deleteTempFile(file);
            log.error("图片本地准备失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "图片处理失败");
        }
    }

    /**
     * 上传已经完成本地校验的图片。调用方负责在最终事务完成后清理临时文件。
     */
    public UploadPictureResult uploadPreparedPicture(PreparedPicture preparedPicture) {
        PutObjectResult putObjectResult = null;
        Exception lastException = null;
        int maxAttempts = Math.max(1, cosMaxRetries);
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // objectKey 是本次任务唯一且幂等的 key，超时后重试不会产生第二个对象。
                putObjectResult = cosManager.putObject(
                        preparedPicture.getObjectKey(), preparedPicture.getFile(), preparedPicture.getContentType());
                lastException = null;
                break;
            } catch (Exception e) {
                lastException = e;
                if (attempt < maxAttempts) {
                    try {
                        Thread.sleep(200L * (1L << Math.min(attempt - 1, 3)));
                    } catch (InterruptedException interruptedException) {
                        Thread.currentThread().interrupt();
                        lastException = interruptedException;
                        break;
                    }
                }
            }
        }
        if (lastException != null) {
            log.error("图片上传到对象存储失败，key={}", preparedPicture.getObjectKey(), lastException);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败");
        }
        try {
            UploadPictureResult result = new UploadPictureResult();
            result.setObjectKey(preparedPicture.getObjectKey());
            result.setThumbnailObjectKey(preparedPicture.getObjectKey());
            result.setCompressedObjectKey(null);
            result.setUrl(buildObjectUrl(preparedPicture.getObjectKey()));
            result.setThumbnailUrl(buildObjectUrl(preparedPicture.getObjectKey()));
            result.setPicName(FileUtil.mainName(stripQuery(preparedPicture.getOriginalFilename())));
            result.setPicSize(preparedPicture.getPicSize());
            result.setPicWidth(preparedPicture.getPicWidth());
            result.setPicHeight(preparedPicture.getPicHeight());
            result.setPicScale(preparedPicture.getPicScale());
            result.setPicFormat(preparedPicture.getFormat());
            result.setContentType(preparedPicture.getContentType());
            result.setEtag(putObjectResult == null ? null : putObjectResult.getETag());
            return result;
        } catch (Exception e) {
            log.error("封装图片上传结果失败，key={}", preparedPicture.getObjectKey(), e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败");
        }
    }

    private ImageDimensions readAndValidateImage(File file) throws IOException {
        try (ImageInputStream imageInputStream = ImageIO.createImageInputStream(file)) {
            if (imageInputStream == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片内容无法解码");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInputStream);
            if (!readers.hasNext()) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片格式无法解码");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInputStream, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || ((long) width * height) > maxPixels) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片像素尺寸超过限制");
                }
                // 真实解码一次，避免只依赖扩展名或文件头。
                BufferedImage image = reader.read(0);
                if (image == null) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片内容无法解码");
                }
                return new ImageDimensions(width, height);
            } finally {
                reader.dispose();
            }
        }
    }

    private String normalizeFormat(String type) {
        if (type == null) {
            return "";
        }
        String normalized = type.toLowerCase(Locale.ROOT);
        return "jpeg".equals(normalized) ? "jpg" : normalized;
    }

    private String getContentType(String format) {
        if ("jpg".equals(format)) return "image/jpeg";
        if ("png".equals(format)) return "image/png";
        if ("gif".equals(format)) return "image/gif";
        if ("webp".equals(format)) return "image/webp";
        return "application/octet-stream";
    }

    private String buildObjectUrl(String key) {
        String host = cosClientConfig.getHost();
        if (host == null || host.trim().isEmpty()) {
            return key;
        }
        return host.replaceAll("/+$", "") + "/" + key.replaceAll("^/+", "");
    }

    private String normalizeKey(String key) {
        return key == null ? "" : key.replaceAll("^/+|/+$", "");
    }

    private String stripQuery(String filename) {
        int index = filename == null ? -1 : filename.indexOf('?');
        return index >= 0 ? filename.substring(0, index) : filename;
    }

    protected abstract void processFile(Object inputResource, File file);

    protected abstract String getOriginalFilename(Object inputResource);

    protected abstract void validPicture(Object inputResource);

    private static void deleteTempFile(File file) {
        if (file != null && file.exists() && !file.delete()) {
            file.deleteOnExit();
        }
    }

    private static class ImageDimensions {
        private final int width;
        private final int height;

        private ImageDimensions(int width, int height) {
            this.width = width;
            this.height = height;
        }
    }
}
