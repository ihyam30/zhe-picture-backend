package com.sdfkl.zhepicturebackend.worker;

import com.qcloud.cos.model.COSObjectSummary;
import com.sdfkl.zhepicturebackend.manager.CosManager;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.PictureUploadTask;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.enums.OutboxEventTypeEnum;
import com.sdfkl.zhepicturebackend.model.enums.PictureUploadStatusEnum;
import com.sdfkl.zhepicturebackend.model.enums.PictureUploadTaskStatusEnum;
import com.sdfkl.zhepicturebackend.service.OutboxEventService;
import com.sdfkl.zhepicturebackend.service.PictureService;
import com.sdfkl.zhepicturebackend.service.PictureUploadTaskService;
import com.sdfkl.zhepicturebackend.service.SpaceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 只把超过安全宽限期的孤儿对象写入 Outbox，不在扫描线程中直接删除。
 */
@Slf4j
@Component
@ConditionalOnProperty(value = "picture.reconcile.orphan-scan-enabled", havingValue = "true")
public class OrphanObjectScanner {
    @Resource
    private CosManager cosManager;
    @Resource
    private PictureService pictureService;
    @Resource
    private PictureUploadTaskService pictureUploadTaskService;
    @Resource
    private SpaceService spaceService;
    @Resource
    private OutboxEventService outboxEventService;

    @Value("${picture.reconcile.orphan-grace-ms:86400000}")
    private long orphanGraceMs;

    @Scheduled(fixedDelayString = "${picture.reconcile.orphan-scan-delay-ms:3600000}")
    public void scan() {
        Set<String> referencedKeys = new HashSet<>();
        List<Picture> publicPictures = pictureService.lambdaQuery().isNull(Picture::getSpaceId).list();
        addPictureKeys(referencedKeys, publicPictures);
        for (Space space : spaceService.list()) {
            addPictureKeys(referencedKeys, pictureService.lambdaQuery()
                    .eq(Picture::getSpaceId, space.getId()).list());
        }
        List<PictureUploadTask> activeTasks = pictureUploadTaskService.lambdaQuery()
                .eq(PictureUploadTask::getStatus, PictureUploadTaskStatusEnum.UPLOADING.name())
                .list();
        addUploadTaskKeys(referencedKeys, activeTasks);
        scanPrefix("public/", referencedKeys);
        scanPrefix("space/", referencedKeys);
    }

    private void scanPrefix(String prefix, Set<String> referencedKeys) {
        Date cutoff = new Date(System.currentTimeMillis() - orphanGraceMs);
        for (COSObjectSummary summary : cosManager.listObjectSummaries(prefix)) {
            if (summary.getLastModified() == null || summary.getLastModified().after(cutoff)) continue;
            if (referencedKeys.contains(summary.getKey())) continue;
            outboxEventService.publish(OutboxEventTypeEnum.DELETE_OBJECT.name(), null,
                    "orphan-object:" + summary.getKey(), "[\"" + escapeJson(summary.getKey()) + "\"]");
            log.warn("发现孤儿 COS 对象，已加入清理队列，key={}", summary.getKey());
        }
    }

    private void addPictureKeys(Set<String> keys, List<Picture> pictures) {
        for (Picture picture : pictures) {
            String uploadStatus = picture.getUploadStatus();
            if (uploadStatus != null
                    && !PictureUploadStatusEnum.READY.name().equals(uploadStatus)
                    && !PictureUploadStatusEnum.UPLOADING.name().equals(uploadStatus)) {
                continue;
            }
            if (picture.getObjectKey() != null) keys.add(picture.getObjectKey());
            if (picture.getThumbnailObjectKey() != null) keys.add(picture.getThumbnailObjectKey());
            if (picture.getCompressedObjectKey() != null) keys.add(picture.getCompressedObjectKey());
        }
    }

    private void addUploadTaskKeys(Set<String> keys, List<PictureUploadTask> tasks) {
        for (PictureUploadTask task : tasks) {
            if (task.getObjectKey() != null) keys.add(task.getObjectKey());
            if (task.getThumbnailObjectKey() != null) keys.add(task.getThumbnailObjectKey());
            if (task.getCompressedObjectKey() != null) keys.add(task.getCompressedObjectKey());
        }
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
