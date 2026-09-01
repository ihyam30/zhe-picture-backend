package com.sdfkl.zhepicturebackend.worker;

import cn.hutool.json.JSONUtil;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import com.sdfkl.zhepicturebackend.manager.CosManager;
import com.sdfkl.zhepicturebackend.model.entity.OutboxEvent;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.PictureUploadTask;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.enums.OutboxEventStatusEnum;
import com.sdfkl.zhepicturebackend.model.enums.OutboxEventTypeEnum;
import com.sdfkl.zhepicturebackend.model.enums.PictureUploadStatusEnum;
import com.sdfkl.zhepicturebackend.model.enums.PictureUploadTaskStatusEnum;
import com.sdfkl.zhepicturebackend.service.OutboxEventService;
import com.sdfkl.zhepicturebackend.service.PictureDerivativeService;
import com.sdfkl.zhepicturebackend.service.PictureService;
import com.sdfkl.zhepicturebackend.service.PictureUploadTaskService;
import com.sdfkl.zhepicturebackend.service.SpaceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import javax.annotation.Resource;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

/**
 * 数据库 Outbox 轮询器。对象删除和衍生文件生成均设计为幂等操作。
 */
@Slf4j
@Component
public class OutboxEventWorker {
    @Resource
    private OutboxEventService outboxEventService;
    @Resource
    private CosManager cosManager;
    @Resource
    private PictureDerivativeService pictureDerivativeService;
    @Resource
    private PictureUploadTaskService pictureUploadTaskService;
    @Resource
    private PictureService pictureService;
    @Resource
    private SpaceService spaceService;
    @Resource
    private TransactionTemplate transactionTemplate;

    @Value("${picture.upload.reconcile-timeout-ms:900000}")
    private long reconcileTimeoutMs;

    @Value("${outbox.worker.batch-size:20}")
    private int batchSize;

    @Value("${outbox.worker.max-retries:8}")
    private int maxRetries;

    @Scheduled(fixedDelayString = "${outbox.worker.fixed-delay-ms:5000}")
    public void processPendingEvents() {
        Date now = new Date();
        List<OutboxEvent> events = outboxEventService.lambdaQuery()
                .in(OutboxEvent::getStatus, Arrays.asList(
                        OutboxEventStatusEnum.PENDING.name(), OutboxEventStatusEnum.PROCESSING.name()))
                .and(wrapper -> wrapper.isNull(OutboxEvent::getLockedUntil)
                        .or().lt(OutboxEvent::getLockedUntil, now))
                .le(OutboxEvent::getNextRetryTime, now)
                .orderByAsc(OutboxEvent::getId)
                .last("LIMIT " + Math.max(1, Math.min(batchSize, 100)))
                .list();
        for (OutboxEvent event : events) {
            if (claim(event.getId())) {
                processOne(event);
            }
        }
    }

    private boolean claim(Long eventId) {
        Date now = new Date();
        Date lockedUntil = new Date(now.getTime() + 60_000L);
        return outboxEventService.lambdaUpdate()
                .eq(OutboxEvent::getId, eventId)
                .in(OutboxEvent::getStatus, Arrays.asList(
                        OutboxEventStatusEnum.PENDING.name(), OutboxEventStatusEnum.PROCESSING.name()))
                .and(wrapper -> wrapper.isNull(OutboxEvent::getLockedUntil)
                        .or().lt(OutboxEvent::getLockedUntil, now))
                .set(OutboxEvent::getStatus, OutboxEventStatusEnum.PROCESSING.name())
                .set(OutboxEvent::getLockedUntil, lockedUntil)
                .update();
    }

    private void processOne(OutboxEvent event) {
        try {
            event.setStatus(OutboxEventStatusEnum.PROCESSING.name());
            String eventType = event.getEventType();
            if (OutboxEventTypeEnum.DELETE_OBJECT.name().equals(eventType)) {
                List<String> keys = JSONUtil.parseArray(event.getPayload()).toList(String.class);
                for (String key : keys) {
                    if (!isObjectKeyReferenced(key)) {
                        cosManager.deleteObject(key);
                    }
                }
            } else if (OutboxEventTypeEnum.GENERATE_DERIVATIVES.name().equals(eventType)) {
                Long pictureId = JSONUtil.parseObj(event.getPayload()).getLong("taskId");
                pictureDerivativeService.generate(pictureId);
            } else if (OutboxEventTypeEnum.RECONCILE_UPLOAD.name().equals(eventType)) {
                reconcileUpload(event);
            }
            if (OutboxEventStatusEnum.PROCESSING.name().equals(event.getStatus())) {
                markSucceeded(event);
            }
        } catch (Exception e) {
            retry(event, e);
        }
    }

    private void reconcileUpload(OutboxEvent event) {
        Long taskId = JSONUtil.parseObj(event.getPayload()).getLong("taskId");
        PictureUploadTask task = pictureUploadTaskService.getById(taskId);
        if (task == null || !PictureUploadTaskStatusEnum.UPLOADING.name().equals(task.getStatus())) {
            markSucceeded(event);
            return;
        }
        if (task.getCreateTime() != null && task.getCreateTime().getTime() + reconcileTimeoutMs > System.currentTimeMillis()) {
            event.setNextRetryTime(new Date(System.currentTimeMillis() + reconcileTimeoutMs));
            event.setLockedUntil(null);
            event.setStatus(OutboxEventStatusEnum.PENDING.name());
            outboxEventService.updateById(event);
            return;
        }
        transactionTemplate.execute(status -> {
            Space lockedSpace = null;
            if (task.getSpaceId() != null) {
                lockedSpace = spaceService.lambdaQuery().eq(Space::getId, task.getSpaceId())
                        .last("FOR UPDATE").one();
            }
            // 必须在事务内按“空间→图片→任务”顺序重新加锁，避免与上传完成并发时把 READY 回退成 FAILED。
            Picture picture = pictureService.lambdaQuery().eq(Picture::getId, task.getPictureId())
                    .last("FOR UPDATE").one();
            PictureUploadTask currentTask = pictureUploadTaskService.lambdaQuery()
                    .eq(PictureUploadTask::getId, task.getId()).last("FOR UPDATE").one();
            if (currentTask == null || !PictureUploadTaskStatusEnum.UPLOADING.name().equals(currentTask.getStatus())) {
                return true;
            }
            if (picture != null) {
                picture.setUploadStatus(currentTask.getOldPictureId() == null
                        ? PictureUploadStatusEnum.FAILED.name() : PictureUploadStatusEnum.READY.name());
                if (picture.getVersion() == null) picture.setVersion(0);
                ThrowUtils.throwIf(!pictureService.updateById(picture), ErrorCode.OPERATION_ERROR, "更新图片状态失败");
            }
            if (lockedSpace != null) {
                lockedSpace.setReservedSize(Math.max(0, value(lockedSpace.getReservedSize()) - value(currentTask.getPicSize())));
                if (currentTask.getOldPictureId() == null) {
                    lockedSpace.setReservedCount(Math.max(0, value(lockedSpace.getReservedCount()) - 1));
                }
                ThrowUtils.throwIf(!spaceService.updateById(lockedSpace), ErrorCode.OPERATION_ERROR, "释放空间额度失败");
            }
            currentTask.setStatus(PictureUploadTaskStatusEnum.FAILED.name());
            currentTask.setLastError("上传任务超时，已自动补偿");
            pictureUploadTaskService.updateById(currentTask);
            outboxEventService.publish(OutboxEventTypeEnum.DELETE_OBJECT.name(), currentTask.getPictureId(),
                    "upload-timeout-cleanup:" + currentTask.getId(), JSONUtil.toJsonStr(Arrays.asList(
                            currentTask.getObjectKey(), currentTask.getThumbnailObjectKey(), currentTask.getCompressedObjectKey())));
            return true;
        });
    }

    private void markSucceeded(OutboxEvent event) {
        event.setStatus(OutboxEventStatusEnum.SUCCEEDED.name());
        event.setLockedUntil(null);
        outboxEventService.updateById(event);
    }

    private void retry(OutboxEvent event, Exception exception) {
        int retryCount = event.getRetryCount() == null ? 0 : event.getRetryCount();
        retryCount++;
        event.setRetryCount(retryCount);
        event.setLastError(shortError(exception));
        event.setLockedUntil(null);
        if (retryCount >= maxRetries) {
            event.setStatus(OutboxEventStatusEnum.DEAD.name());
        } else {
            long delay = Math.min(3_600_000L, 10_000L * (1L << Math.min(retryCount, 8)));
            event.setStatus(OutboxEventStatusEnum.PENDING.name());
            event.setNextRetryTime(new Date(System.currentTimeMillis() + delay));
        }
        outboxEventService.updateById(event);
        log.error("Outbox 事件处理失败，id={}, type={}, retry={}", event.getId(), event.getEventType(), retryCount, exception);
    }

    private long value(Long value) {
        return value == null ? 0 : value;
    }

    private boolean isObjectKeyReferenced(String objectKey) {
        if (objectKey == null || objectKey.trim().isEmpty()) {
            return false;
        }
        return pictureService.lambdaQuery()
                .and(wrapper -> wrapper.eq(Picture::getObjectKey, objectKey)
                        .or().eq(Picture::getThumbnailObjectKey, objectKey)
                        .or().eq(Picture::getCompressedObjectKey, objectKey))
                .and(wrapper -> wrapper.isNull(Picture::getUploadStatus)
                        .or().in(Picture::getUploadStatus, Arrays.asList(
                                PictureUploadStatusEnum.UPLOADING.name(),
                                PictureUploadStatusEnum.READY.name())))
                .exists();
    }

    private String shortError(Exception exception) {
        String message = exception.getMessage();
        if (message == null) return exception.getClass().getSimpleName();
        return message.length() > 500 ? message.substring(0, 500) : message;
    }
}
