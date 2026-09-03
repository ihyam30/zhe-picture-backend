package com.sdfkl.zhepicturebackend.service.impl;

import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.COSObjectInputStream;
import com.sdfkl.zhepicturebackend.config.CosClientConfig;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.manager.CosManager;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.enums.PictureUploadStatusEnum;
import com.sdfkl.zhepicturebackend.service.PictureDerivativeService;
import com.sdfkl.zhepicturebackend.service.PictureService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.Resource;
import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@Slf4j
@Service
public class PictureDerivativeServiceImpl implements PictureDerivativeService {
    private static final int THUMBNAIL_MAX_EDGE = 256;

    @Resource
    private PictureService pictureService;

    @Resource
    private CosManager cosManager;

    @Resource
    private CosClientConfig cosClientConfig;

    @Override
    public void generate(Long pictureId) {
        Picture picture = pictureService.getById(pictureId);
        if (picture == null || !PictureUploadStatusEnum.READY.name().equals(picture.getUploadStatus())
                || picture.getObjectKey() == null) {
            return;
        }
        File source = null;
        File thumbnail = null;
        File compressed = null;
        try {
            source = File.createTempFile("picture_source_", ".tmp");
            thumbnail = File.createTempFile("picture_thumbnail_", ".jpg");
            compressed = File.createTempFile("picture_compressed_", ".jpg");
            download(picture.getObjectKey(), source);
            BufferedImage sourceImage = ImageIO.read(source);
            if (sourceImage == null) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "原图无法解码");
            }
            BufferedImage thumbnailImage = scale(sourceImage, THUMBNAIL_MAX_EDGE);
            writeJpeg(thumbnailImage, thumbnail);
            writeJpeg(sourceImage, compressed);
            String baseKey = picture.getObjectKey();
            int suffixIndex = baseKey.lastIndexOf('.');
            if (suffixIndex > 0) {
                baseKey = baseKey.substring(0, suffixIndex);
            }
            String thumbnailKey = baseKey + "_thumbnail.jpg";
            String compressedKey = baseKey + "_compressed.jpg";
            cosManager.putObject(thumbnailKey, thumbnail, "image/jpeg");
            cosManager.putObject(compressedKey, compressed, "image/jpeg");

            Picture current = pictureService.getById(pictureId);
            if (current == null || !PictureUploadStatusEnum.READY.name().equals(current.getUploadStatus())
                    || !picture.getObjectKey().equals(current.getObjectKey())) {
                return;
            }
            current.setThumbnailObjectKey(thumbnailKey);
            current.setThumbnailUrl(buildUrl(thumbnailKey));
            current.setCompressedObjectKey(compressedKey);
            if (current.getVersion() == null) current.setVersion(0);
            if (!pictureService.updateById(current)) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新图片衍生文件信息失败");
            }
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "生成图片衍生文件失败");
        } finally {
            delete(source);
            delete(thumbnail);
            delete(compressed);
        }
    }

    private void download(String key, File target) throws IOException {
        COSObject object = cosManager.getObject(key);
        try (COSObjectInputStream input = object.getObjectContent(); FileOutputStream output = new FileOutputStream(target)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
        }
    }

    private BufferedImage scale(BufferedImage source, int maxEdge) {
        double ratio = Math.min(1.0, maxEdge * 1.0 / Math.max(source.getWidth(), source.getHeight()));
        int width = Math.max(1, (int) Math.round(source.getWidth() * ratio));
        int height = Math.max(1, (int) Math.round(source.getHeight() * ratio));
        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = result.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.drawImage(source, 0, 0, width, height, null);
        } finally {
            graphics.dispose();
        }
        return result;
    }

    private void writeJpeg(BufferedImage image, File target) throws IOException {
        if (!ImageIO.write(image, "jpg", target)) {
            throw new IOException("JPEG 编码器不可用");
        }
    }

    private String buildUrl(String key) {
        if (cosClientConfig.getHost() == null || cosClientConfig.getHost().trim().isEmpty()) return key;
        return cosClientConfig.getHost().replaceAll("/+$", "") + "/" + key.replaceAll("^/+", "");
    }

    private void delete(File file) {
        if (file != null && file.exists() && !file.delete()) file.deleteOnExit();
    }
}
