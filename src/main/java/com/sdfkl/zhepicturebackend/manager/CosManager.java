package com.sdfkl.zhepicturebackend.manager;

import cn.hutool.core.io.FileUtil;
import com.qcloud.cos.COSClient;
import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.GetObjectRequest;
import com.qcloud.cos.model.PutObjectRequest;
import com.qcloud.cos.model.PutObjectResult;
import com.qcloud.cos.model.ObjectMetadata;
import com.qcloud.cos.model.COSObjectSummary;
import com.qcloud.cos.model.ListObjectsRequest;
import com.qcloud.cos.model.ObjectListing;
import com.qcloud.cos.model.ciModel.persistence.PicOperations;
import com.sdfkl.zhepicturebackend.config.CosClientConfig;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Component
public class CosManager {
    @Resource
    private CosClientConfig cosClientConfig;

    @Resource
    private COSClient cosClient;

    /**
     * 上传文件
     *
     * @param key  唯一键
     * @param file 文件
     * @return 上传结果
     */
    public PutObjectResult putObject(String key, File file) {
        PutObjectRequest putObjectRequest = new PutObjectRequest(cosClientConfig.getBucket(), key, file);
        return cosClient.putObject(putObjectRequest);
    }

    /**
     * 上传文件并显式设置内容类型。
     */
    public PutObjectResult putObject(String key, File file, String contentType) {
        PutObjectRequest putObjectRequest = new PutObjectRequest(cosClientConfig.getBucket(), key, file);
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(contentType);
        metadata.setContentLength(file.length());
        putObjectRequest.setMetadata(metadata);
        return cosClient.putObject(putObjectRequest);
    }

    /**
     * 获取文件
     *
     * @param key 唯一键
     * @return 文件
     */
    public COSObject getObject(String key) {
        GetObjectRequest getObjectRequest = new GetObjectRequest(cosClientConfig.getBucket(), key);
        return cosClient.getObject(getObjectRequest);
    }

    /**
     * 上传文件(附带图片信息)
     *
     * @param key  唯一键
     * @param file 文件
     * @return 上传结果
     */
    public PutObjectResult putPictureObject(String key, File file) {
        PutObjectRequest putObjectRequest = new PutObjectRequest(cosClientConfig.getBucket(), key, file);
        // 对图片进行处理
        PicOperations picOperations = new PicOperations();
        // 1 表示返回原图信息
        picOperations.setIsPicInfo(1);
        // 图片处理规则列表
        List<PicOperations.Rule> rules = new ArrayList<>();
        // 图片压缩（转为 webp 格式）
        String webpKey = FileUtil.mainName(file) + ".webp";
        PicOperations.Rule compressRule = new PicOperations.Rule();
        compressRule.setFileId(webpKey);
        compressRule.setBucket(cosClientConfig.getBucket());
        compressRule.setRule("imageMogr2/format/webp");
        rules.add(compressRule);
        // 缩略图处理 仅对 > 20k 的图片有效
        if(FileUtil.size(file) > 2 * 1024){
            PicOperations.Rule thumbnailRule = new PicOperations.Rule();
            String thumbnailKey = FileUtil.mainName(key) + "_thumbnail." + FileUtil.getSuffix(key);
            thumbnailRule.setFileId(thumbnailKey);
            thumbnailRule.setBucket(cosClientConfig.getBucket());
            thumbnailRule.setRule(String.format("imageMogr2/thumbnail/%sx%s>",256,256));
            rules.add(thumbnailRule);
        }
        // 构造处理参数
        picOperations.setRules(rules);
        putObjectRequest.setPicOperations(picOperations);
        return cosClient.putObject(putObjectRequest);
    }

    /**
     * 删除文件
     *
     * @param key        唯一键
     */
    public void deleteObject(String key){
        if (key == null || key.trim().isEmpty()) {
            return;
        }
        // 新链路只接受对象 key，兼容历史数据时仅去掉开头的斜杠，不解析 URL。
        String normalizedKey = key.trim().replaceFirst("^/+", "");
        cosClient.deleteObject(cosClientConfig.getBucket(), normalizedKey);
    }

    /**
     * 分页读取指定前缀下的对象，用于孤儿对象对账。
     */
    public List<COSObjectSummary> listObjectSummaries(String prefix) {
        List<COSObjectSummary> result = new ArrayList<>();
        ListObjectsRequest request = new ListObjectsRequest();
        request.setBucketName(cosClientConfig.getBucket());
        request.setPrefix(prefix);
        request.setMaxKeys(1000);
        ObjectListing listing;
        do {
            listing = cosClient.listObjects(request);
            result.addAll(listing.getObjectSummaries());
            if (listing.isTruncated()) {
                request.setMarker(listing.getNextMarker());
            }
        } while (listing.isTruncated());
        return result;
    }

}
