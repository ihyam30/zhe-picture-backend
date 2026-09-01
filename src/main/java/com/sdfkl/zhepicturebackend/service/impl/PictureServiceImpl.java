package com.sdfkl.zhepicturebackend.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.sdfkl.zhepicturebackend.api.aliyunai.AliYunAIApi;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.common.DeleteRequest;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import com.sdfkl.zhepicturebackend.manager.CosManager;
import com.sdfkl.zhepicturebackend.manager.FileManager;
import com.sdfkl.zhepicturebackend.manager.upload.FilePictureUpload;
import com.sdfkl.zhepicturebackend.manager.upload.PictureUploadTemplate;
import com.sdfkl.zhepicturebackend.manager.upload.UrlPictureUpload;
import com.sdfkl.zhepicturebackend.model.dto.file.UploadPictureResult;
import com.sdfkl.zhepicturebackend.model.dto.picture.*;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.entity.OutboxEvent;
import com.sdfkl.zhepicturebackend.model.entity.PictureUploadTask;
import com.sdfkl.zhepicturebackend.model.enums.OutboxEventTypeEnum;
import com.sdfkl.zhepicturebackend.model.enums.PictureReviewStatusEnum;
import com.sdfkl.zhepicturebackend.model.enums.PictureUploadStatusEnum;
import com.sdfkl.zhepicturebackend.model.enums.PictureUploadTaskStatusEnum;
import com.sdfkl.zhepicturebackend.manager.upload.PreparedPicture;
import com.sdfkl.zhepicturebackend.model.vo.PictureVO;
import com.sdfkl.zhepicturebackend.model.vo.UserVO;
import com.sdfkl.zhepicturebackend.service.PictureService;
import com.sdfkl.zhepicturebackend.mapper.PictureMapper;
import com.sdfkl.zhepicturebackend.service.SpaceService;
import com.sdfkl.zhepicturebackend.service.OutboxEventService;
import com.sdfkl.zhepicturebackend.service.PictureUploadTaskService;
import com.sdfkl.zhepicturebackend.service.UserService;
import com.sdfkl.zhepicturebackend.utils.ColorSimilarUtils;
import com.sdfkl.zhepicturebackend.utils.ColorTransformUtils;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.awt.*;
import java.io.IOException;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author user
 * @description 针对表【picture(图片)】的数据库操作Service实现
 * @createDate 2026-03-19 19:11:30
 */
@Slf4j
@Service
public class PictureServiceImpl extends ServiceImpl<PictureMapper, Picture>
        implements PictureService {
    @Resource
    private FileManager fileManager;
    @Resource
    private UserService userService;
    @Resource
    private FilePictureUpload filePictureUpload;
    @Resource
    private UrlPictureUpload urlPictureUpload;
    @Resource
    private CosManager cosManager;
    @Resource
    private SpaceService spaceService;
    @Resource
    private TransactionTemplate transactionTemplate;
    @Resource
    private OutboxEventService outboxEventService;
    @Resource
    private PictureUploadTaskService pictureUploadTaskService;
    @Resource
    private AliYunAIApi aliYunAIApi;

    /**
     * 上传图片
     * @param inputResource        输入资源
     * @param pictureUploadRequest 图片信息
     * @param loginUser            登录用户
     * @return 图片信息
     */
    @Override
    public PictureVO uploadPicture(Object inputResource, PictureUploadRequest pictureUploadRequest, User loginUser) {
        return uploadPicture(inputResource, pictureUploadRequest, loginUser, null);
    }

    @Override
    public PictureVO uploadPicture(Object inputResource, PictureUploadRequest pictureUploadRequest,
                                   User loginUser, String idempotencyKey) {
        // 校验参数
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        if (pictureUploadRequest == null) {
            pictureUploadRequest = new PictureUploadRequest();
        }
        String requestKey = StrUtil.isBlank(idempotencyKey) ? IdUtil.simpleUUID() : idempotencyKey.trim();
        ThrowUtils.throwIf(requestKey.length() > 128, ErrorCode.PARAMS_ERROR, "幂等号长度不能超过128个字符");
        PictureUploadTask historicalTask = pictureUploadTaskService.lambdaQuery()
                .eq(PictureUploadTask::getUserId, loginUser.getId())
                .eq(PictureUploadTask::getIdempotencyKey, requestKey)
                .one();
        if (historicalTask != null) {
            Picture historicalPicture = historicalTask.getPictureId() == null
                    ? null : this.getById(historicalTask.getPictureId());
            if (PictureUploadTaskStatusEnum.SUCCEEDED.name().equals(historicalTask.getStatus())
                    && historicalPicture != null
                    && PictureUploadStatusEnum.READY.name().equals(historicalPicture.getUploadStatus())
                    && StrUtil.equals(historicalTask.getObjectKey(), historicalPicture.getObjectKey())) {
                return PictureVO.objectToVO(historicalPicture);
            }
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "该幂等号已被使用，请更换幂等号重试");
        }
        Picture existingPicture = lambdaQuery()
                .eq(Picture::getUserId, loginUser.getId())
                .eq(Picture::getIdempotencyKey, requestKey)
                .one();
        if (existingPicture != null) {
            if (PictureUploadStatusEnum.READY.name().equals(existingPicture.getUploadStatus())) {
                return PictureVO.objectToVO(existingPicture);
            }
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "该上传请求正在处理或已失败，请更换幂等号重试");
        }

        // 校验空间和替换目标
        Long spaceId = pictureUploadRequest.getSpaceId();
        Long pictureId = pictureUploadRequest.getId();
        Picture oldPicture = null;
        if (pictureId != null) {
            oldPicture = this.getById(pictureId);
            ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
            if (oldPicture.getUploadStatus() != null
                    && !PictureUploadStatusEnum.READY.name().equals(oldPicture.getUploadStatus())) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "图片当前不允许替换，请等待当前任务结束");
            }
            if (!oldPicture.getUserId().equals(loginUser.getId()) && !userService.isAdmin(loginUser)) {
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
            if (spaceId == null) {
                spaceId = oldPicture.getSpaceId();
            } else if (ObjectUtil.notEqual(spaceId, oldPicture.getSpaceId())) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "空间不一致");
            }
        }
        if(spaceId != null){
            Space space = spaceService.getById(spaceId);
            ThrowUtils.throwIf(space == null,ErrorCode.NOT_FOUND_ERROR,"空间不存在");
            // 校验是否有空间权限，仅空间管理员才能上传
            if(!loginUser.getId().equals(space.getUserId())){
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR,"没有空间权限");
            }
        }

        // 按照用户 id 划分目录 => 按照空间划分目录
        String uploadPathPrefix;
        if(spaceId == null){
            // 公共图库
            uploadPathPrefix = String.format("public/%s", loginUser.getId());
        }else {
            // 空间
            uploadPathPrefix = String.format("space/%s", spaceId);
        }
        PictureUploadTemplate pictureUploadTemplate = filePictureUpload;
        if (inputResource instanceof String) {
            pictureUploadTemplate = urlPictureUpload;
        }
        PreparedPicture preparedPicture = pictureUploadTemplate.preparePicture(inputResource, uploadPathPrefix);
        PictureUploadTask task = null;
        try {
            final Long finalSpaceId = spaceId;
            final Picture finalOldPicture = oldPicture;
            final Long finalPictureId = pictureId;
            final String finalPicName = StrUtil.isBlank(pictureUploadRequest.getPicName())
                    ? null : pictureUploadRequest.getPicName();
            task = transactionTemplate.execute(status -> createUploadTask(
                    preparedPicture, finalSpaceId, finalPictureId, finalOldPicture,
                    loginUser, requestKey, finalPicName));
            UploadPictureResult uploadPictureResult = pictureUploadTemplate.uploadPreparedPicture(preparedPicture);
            completeUploadTask(task, uploadPictureResult, finalPicName, loginUser);
            return PictureVO.objectToVO(getById(task.getPictureId()));
        } catch (Exception e) {
            if (task != null) {
                failUploadTask(task, e);
            }
            if (e instanceof BusinessException) {
                throw (BusinessException) e;
            }
            log.error("图片上传流程失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败");
        } finally {
            preparedPicture.deleteTempFile();
        }
    }

    private PictureUploadTask createUploadTask(PreparedPicture preparedPicture, Long spaceId, Long pictureId,
                                               Picture oldPicture, User loginUser, String idempotencyKey,
                                               String requestedName) {
        Space space = null;
        if (spaceId != null) {
            // 所有空间内上传事务统一先锁空间，再锁图片和上传任务。
            space = spaceService.lambdaQuery().eq(Space::getId, spaceId).last("FOR UPDATE").one();
            ThrowUtils.throwIf(space == null, ErrorCode.NOT_FOUND_ERROR, "空间不存在");
        }
        if (pictureId != null) {
            // 替换必须锁住原记录，避免两个并发请求同时替换同一张图片并重复扣减额度。
            oldPicture = this.lambdaQuery().eq(Picture::getId, pictureId).last("FOR UPDATE").one();
            ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
            ThrowUtils.throwIf(!ObjectUtil.equal(spaceId, oldPicture.getSpaceId()),
                    ErrorCode.OPERATION_ERROR, "图片不属于当前空间");
            if (oldPicture.getUploadStatus() != null
                    && !PictureUploadStatusEnum.READY.name().equals(oldPicture.getUploadStatus())) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "图片当前不允许替换，请等待当前任务结束");
            }
        }
        if (space != null) {
            long totalSize = valueOrZero(space.getTotalSize());
            long totalCount = valueOrZero(space.getTotalCount());
            long reservedSize = valueOrZero(space.getReservedSize());
            long reservedCount = valueOrZero(space.getReservedCount());
            long oldSize = oldPicture == null ? 0 : valueOrZero(oldPicture.getPicSize());
            long projectedSize = totalSize - oldSize + reservedSize + preparedPicture.getPicSize();
            long projectedCount = totalCount + reservedCount + (oldPicture == null ? 1 : 0);
            if (projectedSize > valueOrZero(space.getMaxSize()) || projectedCount > valueOrZero(space.getMaxCount())) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "空间容量不足");
            }
            space.setReservedSize(reservedSize + preparedPicture.getPicSize());
            if (oldPicture == null) {
                space.setReservedCount(reservedCount + 1);
            }
            ThrowUtils.throwIf(!spaceService.updateById(space), ErrorCode.OPERATION_ERROR, "预留空间额度失败");
        }

        Picture picture;
        if (pictureId == null) {
            picture = new Picture();
            picture.setSpaceId(spaceId);
            picture.setUserId(loginUser.getId());
            picture.setObjectKey(preparedPicture.getObjectKey());
            // url 在现有表中是 NOT NULL；UPLOADING 阶段先写 key 占位，READY 时替换为可访问地址。
            picture.setUrl(preparedPicture.getObjectKey());
            picture.setThumbnailUrl(preparedPicture.getObjectKey());
            picture.setPicSize(preparedPicture.getPicSize());
            picture.setName(StrUtil.isBlank(requestedName)
                    ? FileUtil.mainName(preparedPicture.getOriginalFilename()) : requestedName);
            picture.setIdempotencyKey(idempotencyKey);
            picture.setUploadStatus(PictureUploadStatusEnum.UPLOADING.name());
            picture.setVersion(0);
            this.fillReviewParams(picture, loginUser);
            ThrowUtils.throwIf(!this.save(picture), ErrorCode.OPERATION_ERROR, "创建图片记录失败");
        } else {
            picture = oldPicture;
            ThrowUtils.throwIf(picture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
            picture.setUploadStatus(PictureUploadStatusEnum.UPLOADING.name());
            picture.setIdempotencyKey(idempotencyKey);
            if (picture.getVersion() == null) {
                picture.setVersion(0);
            }
            picture.setEditTime(new Date());
            ThrowUtils.throwIf(!this.updateById(picture), ErrorCode.OPERATION_ERROR, "更新图片状态失败");
        }

        // 图片记录先于上传任务落库，使空间内事务保持“空间→图片→任务”的锁顺序。
        PictureUploadTask task = new PictureUploadTask();
        task.setPictureId(picture.getId());
        task.setOldPictureId(oldPicture == null ? null : oldPicture.getId());
        task.setUserId(loginUser.getId());
        task.setSpaceId(spaceId);
        task.setIdempotencyKey(idempotencyKey);
        task.setObjectKey(preparedPicture.getObjectKey());
        task.setPicSize(preparedPicture.getPicSize());
        task.setOldObjectKey(oldPicture == null ? null : oldPicture.getObjectKey());
        task.setOldThumbnailObjectKey(oldPicture == null ? null : oldPicture.getThumbnailObjectKey());
        task.setOldCompressedObjectKey(oldPicture == null ? null : oldPicture.getCompressedObjectKey());
        task.setOldPicSize(oldPicture == null ? null : oldPicture.getPicSize());
        task.setStatus(PictureUploadTaskStatusEnum.UPLOADING.name());
        task.setRetryCount(0);
        ThrowUtils.throwIf(!pictureUploadTaskService.save(task), ErrorCode.OPERATION_ERROR, "创建上传任务失败");

        OutboxEventPayload payload = new OutboxEventPayload(task.getId());
        outboxEventService.publish(OutboxEventTypeEnum.RECONCILE_UPLOAD.name(), task.getPictureId(),
                "reconcile-upload:" + task.getId(), JSONUtil.toJsonStr(payload));
        return task;
    }

    private void completeUploadTask(PictureUploadTask task, UploadPictureResult result,
                                    String requestedName, User loginUser) {
        transactionTemplate.execute(status -> {
            PictureUploadTask taskSnapshot = pictureUploadTaskService.getById(task.getId());
            ThrowUtils.throwIf(taskSnapshot == null, ErrorCode.OPERATION_ERROR, "上传任务不存在");
            Space lockedSpace = null;
            if (taskSnapshot.getSpaceId() != null) {
                lockedSpace = spaceService.lambdaQuery().eq(Space::getId, taskSnapshot.getSpaceId())
                        .last("FOR UPDATE").one();
                ThrowUtils.throwIf(lockedSpace == null, ErrorCode.NOT_FOUND_ERROR, "空间不存在");
            }
            // 空间内操作统一按“空间→图片→任务”顺序加锁，避免与空间删除互相等待。
            Picture picture = this.lambdaQuery().eq(Picture::getId, taskSnapshot.getPictureId())
                    .last("FOR UPDATE").one();
            PictureUploadTask currentTask = pictureUploadTaskService.lambdaQuery()
                    .eq(PictureUploadTask::getId, task.getId()).last("FOR UPDATE").one();
            ThrowUtils.throwIf(currentTask == null, ErrorCode.OPERATION_ERROR, "上传任务不存在");
            ThrowUtils.throwIf(!PictureUploadTaskStatusEnum.UPLOADING.name().equals(currentTask.getStatus()),
                    ErrorCode.OPERATION_ERROR, "上传任务已完成或已被补偿");
            ThrowUtils.throwIf(picture == null, ErrorCode.NOT_FOUND_ERROR, "图片记录不存在");
            currentTask.setThumbnailObjectKey(result.getThumbnailObjectKey());
            currentTask.setCompressedObjectKey(result.getCompressedObjectKey());
            currentTask.setStatus(PictureUploadTaskStatusEnum.SUCCEEDED.name());
            currentTask.setLastError(null);
            picture.setUrl(result.getUrl());
            picture.setThumbnailUrl(result.getThumbnailUrl());
            picture.setObjectKey(result.getObjectKey());
            picture.setThumbnailObjectKey(result.getThumbnailObjectKey());
            picture.setCompressedObjectKey(result.getCompressedObjectKey());
            picture.setUploadStatus(PictureUploadStatusEnum.READY.name());
            picture.setContentType(result.getContentType());
            picture.setEtag(result.getEtag());
            picture.setPicSize(result.getPicSize());
            picture.setPicWidth(result.getPicWidth());
            picture.setPicHeight(result.getPicHeight());
            picture.setPicScale(result.getPicScale());
            picture.setPicFormat(result.getPicFormat());
            if (StrUtil.isNotBlank(result.getPicColor())) {
                picture.setPicColor(ColorTransformUtils.getStandardColor(result.getPicColor()));
            }
            if (StrUtil.isNotBlank(requestedName)) {
                picture.setName(requestedName);
            } else if (StrUtil.isBlank(picture.getName())) {
                picture.setName(result.getPicName());
            }
            picture.setEditTime(new Date());
            this.fillReviewParams(picture, loginUser);
            ThrowUtils.throwIf(!this.updateById(picture), ErrorCode.OPERATION_ERROR, "更新图片状态失败");
            if (currentTask.getSpaceId() != null) {
                Space space = lockedSpace;
                long reservedSize = Math.max(0, valueOrZero(space.getReservedSize()) - currentTask.getPicSize());
                long totalSize = valueOrZero(space.getTotalSize());
                long totalCount = valueOrZero(space.getTotalCount());
                if (currentTask.getOldPictureId() == null) {
                    space.setReservedCount(Math.max(0, valueOrZero(space.getReservedCount()) - 1));
                    totalCount++;
                } else {
                    totalSize = Math.max(0, totalSize - valueOrZero(currentTask.getOldPicSize()));
                    publishDeleteObjects(currentTask.getPictureId(), "replace-old:" + currentTask.getId(),
                            currentTask.getOldObjectKey(), currentTask.getOldThumbnailObjectKey(), currentTask.getOldCompressedObjectKey());
                }
                space.setReservedSize(reservedSize);
                space.setTotalSize(totalSize + currentTask.getPicSize());
                space.setTotalCount(totalCount);
                ThrowUtils.throwIf(!spaceService.updateById(space), ErrorCode.OPERATION_ERROR, "更新空间额度失败");
            }
            pictureUploadTaskService.updateById(currentTask);
            outboxEventService.markSucceeded("reconcile-upload:" + currentTask.getId());
            outboxEventService.publish(OutboxEventTypeEnum.GENERATE_DERIVATIVES.name(), currentTask.getPictureId(),
                    "generate-derivatives:" + currentTask.getId(), JSONUtil.toJsonStr(new OutboxEventPayload(currentTask.getPictureId())));
            return true;
        });
    }

    private void failUploadTask(PictureUploadTask task, Exception exception) {
        transactionTemplate.execute(status -> {
            PictureUploadTask taskSnapshot = pictureUploadTaskService.getById(task.getId());
            if (taskSnapshot == null) {
                return false;
            }
            Space lockedSpace = null;
            if (taskSnapshot.getSpaceId() != null) {
                lockedSpace = spaceService.lambdaQuery().eq(Space::getId, taskSnapshot.getSpaceId())
                        .last("FOR UPDATE").one();
            }
            // 与上传完成、空间删除保持一致：空间→图片→任务。
            Picture picture = this.lambdaQuery().eq(Picture::getId, taskSnapshot.getPictureId())
                    .last("FOR UPDATE").one();
            PictureUploadTask currentTask = pictureUploadTaskService.lambdaQuery()
                    .eq(PictureUploadTask::getId, task.getId()).last("FOR UPDATE").one();
            if (currentTask == null || !PictureUploadTaskStatusEnum.UPLOADING.name().equals(currentTask.getStatus())) {
                return false;
            }
            if (picture != null) {
                picture.setUploadStatus(currentTask.getOldPictureId() == null
                        ? PictureUploadStatusEnum.FAILED.name() : PictureUploadStatusEnum.READY.name());
                if (picture.getVersion() == null) picture.setVersion(0);
                ThrowUtils.throwIf(!this.updateById(picture), ErrorCode.OPERATION_ERROR, "更新图片状态失败");
            }
            releaseReservation(currentTask, lockedSpace);
            currentTask.setStatus(PictureUploadTaskStatusEnum.FAILED.name());
            currentTask.setLastError(shortError(exception));
            ThrowUtils.throwIf(!pictureUploadTaskService.updateById(currentTask),
                    ErrorCode.OPERATION_ERROR, "更新上传任务状态失败");
            publishDeleteObjects(currentTask.getPictureId(), "upload-cleanup:" + currentTask.getId(),
                    currentTask.getObjectKey(), currentTask.getThumbnailObjectKey(), currentTask.getCompressedObjectKey());
            outboxEventService.markSucceeded("reconcile-upload:" + currentTask.getId());
            return true;
        });
    }

    private void releaseReservation(PictureUploadTask task, Space space) {
        if (space == null) return;
        space.setReservedSize(Math.max(0, valueOrZero(space.getReservedSize()) - valueOrZero(task.getPicSize())));
        if (task.getOldPictureId() == null) {
            space.setReservedCount(Math.max(0, valueOrZero(space.getReservedCount()) - 1));
        }
        ThrowUtils.throwIf(!spaceService.updateById(space), ErrorCode.OPERATION_ERROR, "释放空间额度失败");
    }

    private void publishDeleteObjects(Long aggregateId, String dedupeKey, String... keys) {
        List<String> objectKeys = Arrays.stream(keys)
                .filter(StrUtil::isNotBlank)
                .distinct()
                .collect(Collectors.toList());
        if (objectKeys.isEmpty()) return;
        outboxEventService.publish(OutboxEventTypeEnum.DELETE_OBJECT.name(), aggregateId, dedupeKey,
                JSONUtil.toJsonStr(objectKeys));
    }

    private long valueOrZero(Long value) {
        return value == null ? 0 : value;
    }

    private String shortError(Exception exception) {
        String message = exception.getMessage();
        if (message == null) return exception.getClass().getSimpleName();
        return message.length() > 500 ? message.substring(0, 500) : message;
    }

    private static class OutboxEventPayload {
        private final Long taskId;

        private OutboxEventPayload(Long taskId) {
            this.taskId = taskId;
        }

        public Long getTaskId() {
            return taskId;
        }
    }

    /**
     * 获取查询条件
     *
     * @param pictureQueryRequest 图片查询条件
     * @return 获取查询条件
     */
    @Override
    public QueryWrapper<Picture> getQueryWrapper(PictureQueryRequest pictureQueryRequest) {
        if (pictureQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请求参数为空");
        }
        // 从对象中取值
        Long id = pictureQueryRequest.getId();
        String name = pictureQueryRequest.getName();
        String introduction = pictureQueryRequest.getIntroduction();
        String category = pictureQueryRequest.getCategory();
        List<String> tags = pictureQueryRequest.getTags();
        Long picSize = pictureQueryRequest.getPicSize();
        Integer picWidth = pictureQueryRequest.getPicWidth();
        Integer picHeight = pictureQueryRequest.getPicHeight();
        Double picScale = pictureQueryRequest.getPicScale();
        String picFormat = pictureQueryRequest.getPicFormat();
        String searchText = pictureQueryRequest.getSearchText();
        Long userId = pictureQueryRequest.getUserId();
        Long spaceId = pictureQueryRequest.getSpaceId();
        Boolean nullSpaceId = pictureQueryRequest.getNullSpaceId();
        Integer reviewStatus = pictureQueryRequest.getReviewStatus();
        String reviewMessage = pictureQueryRequest.getReviewMessage();
        Long reviewerId = pictureQueryRequest.getReviewerId();
        String sortField = pictureQueryRequest.getSortField();
        String sortOrder = pictureQueryRequest.getSortOrder();
        Date startEditTime = pictureQueryRequest.getStartEditTime();
        Date endEditTime = pictureQueryRequest.getEndEditTime();


        QueryWrapper<Picture> queryWrapper = new QueryWrapper<>();

        // 从多字段中搜索
        if(StrUtil.isNotBlank(searchText)){
            queryWrapper.and(qw -> qw.like("name", searchText)
                    .or()
                    .like("introduction", searchText)
            );
        }
        queryWrapper.eq(ObjectUtil.isNotEmpty(id), "id", id);
        queryWrapper.like(StrUtil.isNotBlank(name), "name", name);
        queryWrapper.like(StrUtil.isNotBlank(introduction), "introduction", introduction);
        queryWrapper.eq(StrUtil.isNotBlank(category), "category", category);
        queryWrapper.eq(ObjectUtil.isNotEmpty(picSize), "picSize", picSize);
        queryWrapper.eq(ObjectUtil.isNotEmpty(picWidth), "picWidth", picWidth);
        queryWrapper.eq(ObjectUtil.isNotEmpty(picHeight), "picHeight", picHeight);
        queryWrapper.eq(ObjectUtil.isNotEmpty(picScale), "picScale", picScale);
        queryWrapper.eq(StrUtil.isNotBlank(picFormat), "picFormat", picFormat);
        queryWrapper.eq(ObjectUtil.isNotEmpty(userId), "userId", userId);
        queryWrapper.eq(ObjectUtil.isNotEmpty(spaceId), "spaceId", spaceId);
        queryWrapper.isNull(Boolean.TRUE.equals(nullSpaceId), "spaceId");
        queryWrapper.eq(ObjectUtil.isNotEmpty(reviewStatus), "reviewStatus", reviewStatus);
        queryWrapper.like(StrUtil.isNotBlank(reviewMessage), "reviewMessage", reviewMessage);
        queryWrapper.eq(ObjectUtil.isNotEmpty(reviewerId), "reviewerId", reviewerId);
        queryWrapper.ge(ObjectUtil.isNotEmpty(startEditTime), "editTime", startEditTime);
        queryWrapper.lt(ObjectUtil.isNotEmpty(endEditTime), "editTime", endEditTime);
        // 列表默认不展示仍在上传或失败的内部任务；历史数据 uploadStatus 为空时按 READY 兼容。
        queryWrapper.and(qw -> qw.isNull("uploadStatus").or().eq("uploadStatus", PictureUploadStatusEnum.READY.name()));
        // JSON 数组查询
        if(CollUtil.isNotEmpty(tags)){
            for (String tag : tags) {
                queryWrapper.like("tags", "\"" + tag + "\"");
            }
        }
        queryWrapper.orderBy(StrUtil.isNotEmpty(sortField), sortOrder.equals("ascend"), sortField);
        return queryWrapper;
    }

    /**
     * 获取图片信息
     *
     * @param picture     图片
     * @param request     请求
     * @return 图片信息
     */
    @Override
    public PictureVO getPictureVO(Picture picture, HttpServletRequest request){
        // 对象转封装类
        PictureVO pictureVO = PictureVO.objectToVO(picture);
        // 关联查询用户信息
        Long userId = picture.getUserId();
        if(userId != null && userId > 0){
            User user = userService.getById(userId);
            UserVO userVO = userService.getUserVO(user);
            pictureVO.setUserVO(userVO);
        }
        return pictureVO;
    }

    /**
     * 获取图片信息
     *
     * @param picturePage 图片分页
     * @param request     请求
     * @return 图片信息
     */
    @Override
    public Page<PictureVO> getPictureVOPage(Page<Picture> picturePage, HttpServletRequest request) {
        List<Picture> pictureList = picturePage.getRecords();
        Page<PictureVO> pictureVOPage = new Page<>(picturePage.getCurrent(), picturePage.getSize(), picturePage.getTotal());
        if(CollUtil.isEmpty(pictureList)){
            return pictureVOPage;
        }
        // 对象列表 => 封装对象列表
        List<PictureVO> pictureVOList = pictureList.stream().map(PictureVO::objectToVO).collect(Collectors.toList());
        // 1. 关联查询用户信息
        Set<Long> userIdSet = pictureList.stream().map(Picture::getUserId).collect(Collectors.toSet());
        Map<Long, List<User>> userIdUserListMap = userService.listByIds(userIdSet).stream()
                .collect(Collectors.groupingBy(User::getId));
        // 2. 填充信息
        pictureVOList.forEach(pictureVO -> {
            Long userId = pictureVO.getUserId();
            User user = null;
            if(userIdUserListMap.containsKey(userId)){
                user = userIdUserListMap.get(userId).get(0);
            }
            pictureVO.setUserVO(userService.getUserVO(user));
        });
        pictureVOPage.setRecords(pictureVOList);
        return pictureVOPage;
    }

    /**
     * 验证图片信息
     *
     * @param picture 图片信息
     */
    @Override
    public void validPicture(Picture picture){
        ThrowUtils.throwIf(picture == null, ErrorCode.PARAMS_ERROR, "图片不存在");
        // 从对象中取值
        Long id = picture.getId();
        String url = picture.getUrl();
        String introduction = picture.getIntroduction();
        // 修改数据时，id 不能为空，有参数则校验
        ThrowUtils.throwIf(ObjectUtil.isNull(id),ErrorCode.PARAMS_ERROR,"id 不能为空");
        if(StrUtil.isNotBlank(url)){
            ThrowUtils.throwIf(url.length() > 1024, ErrorCode.PARAMS_ERROR, "url 过长");
        }
        if(StrUtil.isNotBlank(introduction)){
            ThrowUtils.throwIf(introduction.length() > 800, ErrorCode.PARAMS_ERROR, "简介过长");
        }
    }

    /**
     * 图片审核
     *
     * @param pictureReviewRequest 图片审核请求
     * @param loginUser            登录用户
     */
    @Override
    public void doPictureReview(PictureReviewRequest pictureReviewRequest, User loginUser) {
        //1. 参数校验
        ThrowUtils.throwIf(pictureReviewRequest == null, ErrorCode.PARAMS_ERROR);
        Long id = pictureReviewRequest.getId();
        Integer reviewStatus = pictureReviewRequest.getReviewStatus();
        String reviewMessage = pictureReviewRequest.getReviewMessage();
        PictureReviewStatusEnum pictureReviewStatusEnum = PictureReviewStatusEnum.getEnumByValue(reviewStatus);
        if (id == null || pictureReviewStatusEnum == null || pictureReviewStatusEnum.equals(PictureReviewStatusEnum.REVIEWING)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        // 2. 判断图片是否存在
        Picture oldPicture = this.getById(id);
        ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR);
        // 3. 校验审核状态是否重复
        if (oldPicture.getReviewStatus().equals(reviewStatus)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请勿重复审核");
        }
        //4. 操作数据库
        Picture picture = BeanUtil.copyProperties(pictureReviewRequest, Picture.class);
        picture.setReviewerId(loginUser.getId());
        picture.setReviewTime(new Date());
        boolean result = this.updateById(picture);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
    }

    /**
     * 填充审核参数
     *
     * @param picture   图片
     * @param loginUser 登录用户
     */
    @Override
    public void fillReviewParams(Picture picture, User loginUser) {
        if (userService.isAdmin(loginUser)) {
            // 管理员自动过审
            picture.setReviewerId(loginUser.getId());
            picture.setReviewTime(new Date());
            picture.setReviewStatus(PictureReviewStatusEnum.PASS.getValue());
            picture.setReviewMessage("管理员审核通过");
        } else {
            // 非管理员，无论是编辑还是创建默认都是待审核
            picture.setReviewStatus(PictureReviewStatusEnum.REVIEWING.getValue());
        }
    }

    /**
     * 批量上传图片
     *
     * @param pictureUploadByBatchRequest 图片上传请求
     * @param loginUser                   登录用户
     * @return 图片数量
     */
    @Override
    public Integer uploadPictureByBatch(PictureUploadByBatchRequest pictureUploadByBatchRequest, User loginUser) {
        // 校验参数
        String searchText = pictureUploadByBatchRequest.getSearchText();
        Integer count = pictureUploadByBatchRequest.getCount();
        String namePrefix = pictureUploadByBatchRequest.getNamePrefix();

        if (StrUtil.isBlank(namePrefix)) {
            namePrefix = searchText;
        }

        ThrowUtils.throwIf(count > 30, ErrorCode.PARAMS_ERROR, "最多上传30张图片");

        // ✅ 使用 async 接口（更稳定）
        String fetchUrl = String.format(
                "https://cn.bing.com/images/async?q=%s&first=0&mmasync=1",
                searchText
        );

        Document document;
        try {
            document = Jsoup.connect(fetchUrl)
                    .userAgent("Mozilla/5.0")
                    .timeout(10000)
                    .get();
        } catch (IOException e) {
            log.error("获取页面失败", e);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "获取页面失败");
        }

        // ✅ 改这里：解析 a.iusc
        Elements elements = document.select("a.iusc");

        if (ObjectUtil.isEmpty(elements)) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "获取图片失败");
        }

        int uploadCount = 0;

        for (Element element : elements) {
            try {
                String json = element.attr("m");

                if (StrUtil.isBlank(json)) {
                    continue;
                }

                // ✅ 解析 JSON
                JSONObject obj = JSONUtil.parseObj(json);

                // 原图地址
                String fileUrl = obj.getStr("murl");

                if (StrUtil.isBlank(fileUrl)) {
                    continue;
                }

                // 去掉参数（可选）
                int questionMarkIndex = fileUrl.indexOf("?");
                if (questionMarkIndex > -1) {
                    fileUrl = fileUrl.substring(0, questionMarkIndex);
                }

                // 上传图片
                PictureUploadRequest pictureUploadRequest = new PictureUploadRequest();
                pictureUploadRequest.setFileUrl(fileUrl);
                // 后缀仅用于展示，上传模板会按文件内容重新检测真实格式，避免额外 HEAD 请求绕过 URL 安全策略。
                String fileName = namePrefix + "_" + (uploadCount + 1) + ".jpg";

                pictureUploadRequest.setPicName(fileName);

                PictureVO pictureVO = this.uploadPicture(fileUrl, pictureUploadRequest, loginUser);

                log.info("图片上传成功,id:{}", pictureVO.getId());

                uploadCount++;

            } catch (Exception e) {
                log.error("图片处理失败", e);
                continue;
            }

            if (uploadCount >= count) {
                break;
            }
        }

        return uploadCount;
    }
    /**
     * 清理图片文件
     * @param oldPicture 图片信息
     */
    @Override
    public void clearPictureFile(Picture oldPicture){
        if (oldPicture == null) {
            return;
        }
        publishDeleteObjects(oldPicture.getId(), "clear-picture:" + oldPicture.getId(),
                oldPicture.getObjectKey(), oldPicture.getThumbnailObjectKey(), oldPicture.getCompressedObjectKey());
    }

    /**
     * 检查图片权限
     * @param picture 图片信息
     * @param loginUser 登录用户
     */
    @Override
    public void checkPictureAuth(Picture picture, User loginUser){
        Long loginUserId = loginUser.getId();
        Long spaceId = picture.getSpaceId();
        if(spaceId == null){
            // 公共图库，仅本人或管理员可操作
            if(!picture.getUserId().equals(loginUserId) && !userService.isAdmin(loginUser)){
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
        }else {
            // 私有空间，仅空间管理员可操作
            if(!picture.getUserId().equals(loginUserId)){
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
        }
    }

    /**
     * 删除图片
     * @param deleteRequest 删除请求
     * @param loginUser 登录用户
     */
    @Override
    public void deletePicture(DeleteRequest deleteRequest,User loginUser) {
        Long id = deleteRequest.getId();
        transactionTemplate.execute(status -> {
            Picture pictureSnapshot = this.getById(id);
            ThrowUtils.throwIf(pictureSnapshot == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
            this.checkPictureAuth(pictureSnapshot, loginUser);
            Space lockedSpace = null;
            if (pictureSnapshot.getSpaceId() != null) {
                lockedSpace = spaceService.lambdaQuery().eq(Space::getId, pictureSnapshot.getSpaceId())
                        .last("FOR UPDATE").one();
                ThrowUtils.throwIf(lockedSpace == null, ErrorCode.NOT_FOUND_ERROR, "空间不存在");
            }
            // 与上传完成、失败补偿和空间删除保持一致：空间→图片（本流程没有任务锁）。
            Picture oldPicture = this.lambdaQuery().eq(Picture::getId, id).last("FOR UPDATE").one();
            ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
            this.checkPictureAuth(oldPicture, loginUser);
            if (PictureUploadStatusEnum.DELETE_PENDING.name().equals(oldPicture.getUploadStatus())
                    || PictureUploadStatusEnum.DELETED.name().equals(oldPicture.getUploadStatus())) {
                return true;
            }
            ThrowUtils.throwIf(PictureUploadStatusEnum.UPLOADING.name().equals(oldPicture.getUploadStatus()),
                    ErrorCode.OPERATION_ERROR, "图片正在上传或替换，请稍后删除");
            boolean ready = oldPicture.getUploadStatus() == null
                    || PictureUploadStatusEnum.READY.name().equals(oldPicture.getUploadStatus());
            if (lockedSpace != null && ready) {
                lockedSpace.setTotalSize(Math.max(0, valueOrZero(lockedSpace.getTotalSize())
                        - valueOrZero(oldPicture.getPicSize())));
                lockedSpace.setTotalCount(Math.max(0, valueOrZero(lockedSpace.getTotalCount()) - 1));
                ThrowUtils.throwIf(!spaceService.updateById(lockedSpace), ErrorCode.OPERATION_ERROR, "更新空间额度失败");
            }
            oldPicture.setUploadStatus(PictureUploadStatusEnum.DELETE_PENDING.name());
            if (oldPicture.getVersion() == null) oldPicture.setVersion(0);
            ThrowUtils.throwIf(!this.updateById(oldPicture), ErrorCode.OPERATION_ERROR, "更新图片状态失败");
            ThrowUtils.throwIf(!this.removeById(id), ErrorCode.OPERATION_ERROR);
            publishDeleteObjects(id, "delete-picture:" + id,
                    oldPicture.getObjectKey(), oldPicture.getThumbnailObjectKey(), oldPicture.getCompressedObjectKey());
            return true;
        });
    }

    /**
     * 编辑图片
     * @param pictureEditRequest 图片编辑
     * @param loginUser 登录用户
     */
    @Override
    public void editPicture(PictureEditRequest pictureEditRequest, User loginUser) {
        // 在此处将实体类和 DTO 进行转换
        Picture picture = BeanUtil.copyProperties(pictureEditRequest, Picture.class);
        // 注意将 list 转为 string
        picture.setTags(JSONUtil.toJsonStr(pictureEditRequest.getTags()));
        // 设置编辑时间
        picture.setEditTime(new Date());
        // 数据校验
        this.validPicture(picture);
        // 判断是否存在
        Long id = pictureEditRequest.getId();
        Picture oldPicture = this.getById(id);
        ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
        //this.checkPictureAuth(oldPicture, loginUser);
        // 填充审核参数
        this.fillReviewParams(picture, loginUser);
        // 操作数据库
        boolean result = this.updateById(picture);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR, "图片更新失败");
    }

    /**
     * 根据颜色搜索图片
     *
     * @param spaceId   空间id
     * @param picColor  颜色
     * @param loginUser 登录用户
     * @return 图片视图列表
     */
    @Override
    public List<PictureVO> searchPictureByColor(Long spaceId, String picColor, User loginUser) {
        //1. 校验参数
        ThrowUtils.throwIf(spaceId == null || StrUtil.isBlank(picColor), ErrorCode.PARAMS_ERROR);
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        //2. 校验空间权限
        Space space = spaceService.getById(spaceId);
        ThrowUtils.throwIf(space == null, ErrorCode.NOT_FOUND_ERROR, "空间不存在");
        if (!space.getUserId().equals(loginUser.getId())) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR, "没用空间访问权限");
        }
        //3. 查询该空间下的所有图片
        List<Picture> pictureList = this.lambdaQuery()
                .eq(Picture::getSpaceId, spaceId)
                .isNotNull(Picture::getPicColor)
                .list();
        // 如果没有图片，返回空列表
        if (CollUtil.isEmpty(pictureList)) {
            return new ArrayList<>();
        }
        // 将颜色字符串转换成主色调
        Color targetColor = Color.decode(picColor);
        //4. 计算图片颜色相似度并排序
        List<Picture> sortedPictureList = pictureList.stream()
                .sorted(Comparator.comparingDouble(picture -> {
                    String hexColor = picture.getPicColor();
                    // 没有主色调的图片会默认排序到最后
                    if (StrUtil.isBlank(hexColor)) {
                        return Double.MAX_VALUE;
                    }
                    Color pictureColor = Color.decode(hexColor);
                    return -ColorSimilarUtils.calculateSimilarity(targetColor, pictureColor);
                }))
                .limit(12)
                .collect(Collectors.toList());
        //5. 返回结果
        return sortedPictureList.stream()
                .map(PictureVO::objectToVO)
                .collect(Collectors.toList());
    }

    /**
     * 图片批量修改
     * @param pictureEditByBatchRequest 图片批量修改请求
     * @param loginUser                 登录用户
     */
    @Override
    public void editPictureByBatch(PictureEditByBatchRequest pictureEditByBatchRequest, User loginUser) {
        //1. 校验参数
        List<Long> pictureIdList = pictureEditByBatchRequest.getPictureIdList();
        Long spaceId = pictureEditByBatchRequest.getSpaceId();
        String category = pictureEditByBatchRequest.getCategory();
        List<String> tags = pictureEditByBatchRequest.getTags();
        ThrowUtils.throwIf(CollUtil.isEmpty(pictureIdList), ErrorCode.PARAMS_ERROR);
        ThrowUtils.throwIf(spaceId == null || spaceId <= 0, ErrorCode.PARAMS_ERROR);
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        //2. 校验空间权限
        Space space = spaceService.getById(spaceId);
        ThrowUtils.throwIf(space == null,ErrorCode.NOT_FOUND_ERROR,"空间不存在");
        if(!space.getUserId().equals(loginUser.getId())){
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR,"没有空间访问权限");
        }
        //3. 查询指定图片
        List<Picture> pictureList = this.lambdaQuery()
                .select(Picture::getId, Picture::getSpaceId)
                .eq(Picture::getSpaceId, spaceId)
                .in(Picture::getId, pictureIdList)
                .list();
        if(pictureList.isEmpty()){
            return;
        }
        //4. 更新
        pictureList.forEach(picture -> {
            if(StrUtil.isNotBlank(category)){
                picture.setCategory(category);
            }
            if(CollUtil.isNotEmpty(tags)){
                picture.setTags(JSONUtil.toJsonStr(tags));
            }
        });
        String nameRule = pictureEditByBatchRequest.getNameRule();
        fillPictureWithNameRule(pictureList, nameRule);
        //5. 操作数据库
        boolean result = this.updateBatchById(pictureList);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR,"批量编辑失败");
    }

    /**
     * nameRule 格式：图片{序号}
     * @param pictureList 图片列表
     * @param nameRule 命名规则
     */
    private void fillPictureWithNameRule(List<Picture> pictureList, String nameRule) {
        if(StrUtil.isBlank(nameRule) || CollUtil.isEmpty(pictureList)){
            return;
        }
        long count = 1;
        try {
            for (Picture picture : pictureList) {
                String pictureName = nameRule.replaceAll("\\{序号}", String.valueOf(count++));
                picture.setName(pictureName);
            }
        } catch (Exception e){
            log.error("名称解析错误",e);
            throw new BusinessException(ErrorCode.OPERATION_ERROR,"名称解析错误");
        }
    }

    /**
     * 创建 AI 扩图任务
     *
     * @param createPictureOutPaintingTaskRequest 图片外绘任务创建请求
     * @param loginUser                           登录用户
     * @return 创建的图片外绘任务响应
     */
    @Override
    public CreateOutPaintingTaskResponse createOutPaintingTask(
            CreatePictureOutPaintingTaskRequest createPictureOutPaintingTaskRequest,
            User loginUser
    ) throws JsonProcessingException {
        // 获取图片信息
        Long pictureId = createPictureOutPaintingTaskRequest.getPictureId();
        Picture picture = Optional.ofNullable(this.getById(pictureId))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_ERROR, "图片不存在"));

        // 校验权限
        // checkPictureAuth(picture, loginUser);

        // 参数校验
        PictureOutPaintingParams dtoParams = createPictureOutPaintingTaskRequest.getParameters();
        if (dtoParams == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "扩图参数不能为空");
        }

        if(picture.getPicWidth() < 512 || picture.getPicHeight() < 512){
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片宽高不能小于512");
        }

        int leftOffset = dtoParams.getLeftOffset() == null ? 0 : dtoParams.getLeftOffset();
        int rightOffset = dtoParams.getRightOffset() == null ? 0 : dtoParams.getRightOffset();
        int topOffset = dtoParams.getTopOffset() == null ? 0 : dtoParams.getTopOffset();
        int bottomOffset = dtoParams.getBottomOffset() == null ? 0 : dtoParams.getBottomOffset();

        Double xScale = dtoParams.getXScale();
        Double yScale = dtoParams.getYScale();

        Boolean addWatermark = dtoParams.getAddWatermark();
        Integer angle = dtoParams.getAngle();
        String outputRatio = dtoParams.getOutputRatio();
        Boolean limitImageSize = dtoParams.getLimitImageSize();
        Boolean bestQuality = dtoParams.getBestQuality();

        boolean useOffsetMode =
                (leftOffset > 0 || rightOffset > 0 || topOffset > 0 || bottomOffset > 0)
                        && xScale == null
                        && yScale == null;

        boolean useScaleMode =
                xScale != null
                        && yScale != null
                        && leftOffset == 0
                        && rightOffset == 0
                        && topOffset == 0
                        && bottomOffset == 0;

        if (!useOffsetMode && !useScaleMode) {
            throw new BusinessException(
                    ErrorCode.PARAMS_ERROR,
                    String.format(
                            "扩图参数不合法: left=%s,right=%s,top=%s,bottom=%s,xScale=%s,yScale=%s",
                            leftOffset, rightOffset, topOffset, bottomOffset, xScale, yScale
                    )
            );
        }

        // 创建扩图任务
        CreateOutPaintingTaskRequest createOutPaintingTaskRequest = new CreateOutPaintingTaskRequest();

        CreateOutPaintingTaskRequest.Input input = new CreateOutPaintingTaskRequest.Input();
        input.setImageUrl(picture.getUrl());
        createOutPaintingTaskRequest.setInput(input);

        CreateOutPaintingTaskRequest.Parameters params = new CreateOutPaintingTaskRequest.Parameters();

        if (useOffsetMode) {
            params.setLeftOffset(leftOffset);
            params.setRightOffset(rightOffset);
            params.setTopOffset(topOffset);
            params.setBottomOffset(bottomOffset);
        }

        if (useScaleMode) {
            params.setXScale(xScale == null ? null : xScale.floatValue());
            params.setYScale(yScale == null ? null : yScale.floatValue());
        }

        params.setAddWatermark(addWatermark);
        params.setAngle(angle);
        params.setOutputRatio(outputRatio);
        params.setLimitImageSize(limitImageSize);
        params.setBestQuality(bestQuality);

        createOutPaintingTaskRequest.setParameters(params);

        // 创建任务
        return aliYunAIApi.createOutPaintingTask(createOutPaintingTaskRequest, loginUser);
    }
}




