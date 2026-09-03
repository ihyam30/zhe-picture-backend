package com.sdfkl.zhepicturebackend.service.impl;

import cn.hutool.core.util.StrUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.sdfkl.zhepicturebackend.api.aliyunai.AiProviderClient;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.GetOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import com.sdfkl.zhepicturebackend.manager.auth.SpaceUserAuthManager;
import com.sdfkl.zhepicturebackend.manager.auth.model.SpaceUserPermissionConstant;
import com.sdfkl.zhepicturebackend.mapper.PictureMapper;
import com.sdfkl.zhepicturebackend.model.dto.picture.CreatePictureOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.model.dto.picture.PictureOutPaintingParams;
import com.sdfkl.zhepicturebackend.model.entity.AiTask;
import com.sdfkl.zhepicturebackend.model.entity.AiUsageRecord;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.enums.AiTaskStatusEnum;
import com.sdfkl.zhepicturebackend.model.enums.AiUsageStatusEnum;
import com.sdfkl.zhepicturebackend.service.AiQuotaService;
import com.sdfkl.zhepicturebackend.service.AiTaskApplicationService;
import com.sdfkl.zhepicturebackend.service.AiTaskService;
import com.sdfkl.zhepicturebackend.service.AiUsageRecordService;
import com.sdfkl.zhepicturebackend.service.SpaceService;
import com.sdfkl.zhepicturebackend.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import jakarta.annotation.Resource;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Objects;

/**
 * AI 任务应用服务。
 *
 * <p>提交接口只负责创建本地任务并完成一次供应商受理，后续状态由定时轮询推进，
 * 因此查询接口不再同步调用供应商。</p>
 */
@Service
public class AiTaskApplicationServiceImpl implements AiTaskApplicationService {

    private static final String PROVIDER = "aliyun";
    private static final String MODEL = "image-out-painting";

    @Resource
    private PictureMapper pictureMapper;
    @Resource
    private UserService userService;
    @Resource
    private SpaceService spaceService;
    @Resource
    private SpaceUserAuthManager spaceUserAuthManager;
    @Resource
    private AiTaskService aiTaskService;
    @Resource
    private AiUsageRecordService aiUsageRecordService;
    @Resource
    private AiQuotaService aiQuotaService;
    @Resource
    private AiProviderClient aiProviderClient;
    @Resource
    private AiProviderCircuitBreaker circuitBreaker;

    @Value("${ai-task.poll.fixed-delay-ms:10000}")
    private long pollFixedDelayMs;
    @Value("${ai-task.poll.batch-size:20}")
    private int pollBatchSize;
    @Value("${ai-task.poll.interval-ms:10000}")
    private long pollIntervalMs;
    @Value("${ai-task.poll.lease-timeout-ms:60000}")
    private long pollLeaseTimeoutMs;
    @Value("${ai-task.provider.read-timeout-ms:15000}")
    private long providerReadTimeoutMs;
    @Value("${ai-task.retry.max-attempts:6}")
    private int maxAttempts;
    @Value("${ai-task.retry.base-delay-ms:10000}")
    private long retryBaseDelayMs;
    @Value("${ai-task.retry.max-delay-ms:3600000}")
    private long retryMaxDelayMs;
    @Value("${ai-task.timeout-ms:1800000}")
    private long taskTimeoutMs;
    @Value("${ai-task.usage.default-currency:CNY}")
    private String defaultCurrency;
    @Value("${ai-task.usage.unit-cost:0}")
    private BigDecimal usageUnitCost;

    @Override
    public CreateOutPaintingTaskResponse createOutPaintingTask(
            CreatePictureOutPaintingTaskRequest request, User loginUser, String idempotencyKey)
            throws JsonProcessingException {
        validateCreateRequest(request, loginUser, idempotencyKey);
        String requestKey = idempotencyKey.trim();
        Picture picture = pictureMapper.selectById(request.getPictureId());
        ThrowUtils.throwIf(picture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
        PictureOutPaintingParams params = request.getParameters();
        ValidationResult validation = validateParams(picture, params);
        checkPictureAuth(picture, loginUser);
        String requestHash = buildRequestHash(picture, params, validation);

        AiTask historicalTask = aiTaskService.getByUserAndIdempotencyKey(loginUser.getId(), requestKey);
        AiTask task;
        boolean isRetry = false;
        if (historicalTask != null) {
            ensureRequestMatches(historicalTask, requestHash);
            if (!AiTaskStatusEnum.RETRYABLE.name().equals(historicalTask.getStatus())) {
                return restoreCreateResponse(historicalTask);
            }
            ensureProviderAvailable();
            boolean claimed = aiTaskService.claimRetryableTask(
                    historicalTask.getId(), loginUser.getId(), requestKey);
            if (!claimed) {
                AiTask latest = aiTaskService.getByUserAndIdempotencyKey(loginUser.getId(), requestKey);
                ThrowUtils.throwIf(latest == null, ErrorCode.OPERATION_ERROR, "AI 任务状态已变化");
                return restoreCreateResponse(latest);
            }
            task = historicalTask;
            task.setStatus(AiTaskStatusEnum.CREATING.name());
            task.setProviderTaskId(null);
            task.setErrorMessage(null);
            task.setRetryCount(0);
            task.setCostAmount(configuredUsageUnitCost());
            task.setCurrency(defaultCurrency);
            task.setTimeoutTime(new Date(System.currentTimeMillis()
                    + Math.max(60000L, taskTimeoutMs)));
            isRetry = true;
        } else {
            // 熔断期间不落本地任务，避免后台轮询拿到没有 providerTaskId 的“假任务”。
            ensureProviderAvailable();
            task = new AiTask();
            task.setProvider(PROVIDER);
            task.setModel(MODEL);
            task.setUserId(loginUser.getId());
            task.setPictureId(picture.getId());
            task.setSpaceId(picture.getSpaceId());
            task.setStatus(AiTaskStatusEnum.CREATING.name());
            task.setIdempotencyKey(requestKey);
            task.setRequestHash(requestHash);
            task.setRetryCount(0);
            task.setCostAmount(configuredUsageUnitCost());
            task.setCurrency(defaultCurrency);
            task.setTimeoutTime(new Date(System.currentTimeMillis() + Math.max(60000L, taskTimeoutMs)));
            try {
                ThrowUtils.throwIf(!aiTaskService.save(task), ErrorCode.OPERATION_ERROR, "保存 AI 任务失败");
            } catch (DuplicateKeyException e) {
                AiTask concurrentTask = aiTaskService.getByUserAndIdempotencyKey(loginUser.getId(), requestKey);
                if (concurrentTask != null) {
                    ensureRequestMatches(concurrentTask, requestHash);
                    return restoreCreateResponse(concurrentTask);
                }
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "AI 任务创建冲突，请稍后重试");
            }
        }

        if (!isRetry) {
            boolean reserved = aiQuotaService.tryReserve(task.getUserId(), task.getSpaceId());
            if (!reserved) {
                markFailed(task, "已超过用户或空间的 AI 每日调用额度");
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "已超过 AI 每日调用额度");
            }
        }
        saveUsageReservation(task);

        CreateOutPaintingTaskRequest providerRequest = buildProviderRequest(picture, params, validation);
        try {
            CreateOutPaintingTaskResponse response = aiProviderClient.createOutPaintingTask(providerRequest, loginUser);
            if (response == null || response.getOutput() == null
                    || StrUtil.isBlank(response.getOutput().getTaskId())) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "AI 服务未返回有效任务 id");
            }
            task.setProviderTaskId(response.getOutput().getTaskId());
            String providerStatus = normalizeProviderStatus(response.getOutput().getTaskStatus());
            // 创建接口只返回任务 ID，不返回结果图片；即使供应商返回 SUCCEEDED，
            // 也必须先进入本地可轮询状态，避免任务永远停在成功但没有结果的状态。
            task.setStatus(AiTaskStatusEnum.SUCCEEDED.name().equals(providerStatus)
                    ? AiTaskStatusEnum.PENDING.name() : providerStatus);
            if (AiTaskStatusEnum.FAILED.name().equals(task.getStatus())) {
                task.setErrorMessage(normalizeError(response.getMessage(), "AI 供应商任务创建失败"));
            }
            task.setRequestId(response.getRequestId());
            task.setNextRetryTime(AiTaskStatusEnum.FAILED.name().equals(task.getStatus())
                    ? null : new Date(System.currentTimeMillis() + Math.max(1000L, pollIntervalMs)));
            task.setLeaseUntil(null);
            // 费用流水先完成幂等更新，避免流水写入异常时把已完成任务误判为可继续轮询。
            saveUsageReservation(task);
            if (AiTaskStatusEnum.FAILED.name().equals(task.getStatus())) {
                aiUsageRecordService.markFailed(task.getId(), AiUsageStatusEnum.FAILED.name(),
                        task.getErrorMessage());
            }
            if (!aiTaskService.updateById(task)) {
                throw new IllegalStateException("保存 AI 供应商任务 ID 失败");
            }
            response.getOutput().setTaskStatus(task.getStatus());
            response.setLocalTaskId(task.getId());
            circuitBreaker.recordSuccess();
            return response;
        } catch (JsonProcessingException e) {
            markFailed(task, e.getMessage());
            throw e;
        } catch (BusinessException e) {
            if (StrUtil.isNotBlank(task.getProviderTaskId())) {
                markProviderAcceptedForPolling(task, e.getMessage());
                circuitBreaker.recordFailure();
                throw new BusinessException(ErrorCode.OPERATION_ERROR,
                        "AI 任务提交结果待确认，请勿更换幂等号并稍后查询");
            }
            markFailed(task, e.getMessage());
            circuitBreaker.recordFailure();
            throw e;
        } catch (RuntimeException e) {
            if (StrUtil.isNotBlank(task.getProviderTaskId())) {
                markProviderAcceptedForPolling(task, e.getMessage());
            } else {
                markUnknown(task, e.getMessage());
            }
            circuitBreaker.recordFailure();
            throw new BusinessException(ErrorCode.OPERATION_ERROR,
                    "AI 任务提交结果待确认，请勿更换幂等号并稍后查询");
        }
    }

    @Override
    public GetOutPaintingTaskResponse getOutPaintingTask(Long taskId, User loginUser) {
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        ThrowUtils.throwIf(taskId == null || taskId <= 0, ErrorCode.PARAMS_ERROR, "AI 任务 ID 不合法");
        AiTask task = userService.isAdmin(loginUser)
                ? aiTaskService.getById(taskId)
                : lambdaGetByIdAndUser(taskId, loginUser.getId());
        ThrowUtils.throwIf(task == null, ErrorCode.NOT_FOUND_ERROR, "AI 任务不存在");
        return toTaskResponse(task);
    }

    @Override
    public GetOutPaintingTaskResponse getOutPaintingTaskByProviderTaskId(String providerTaskId, User loginUser) {
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        ThrowUtils.throwIf(StrUtil.isBlank(providerTaskId), ErrorCode.PARAMS_ERROR);
        AiTask task = userService.isAdmin(loginUser)
                ? aiTaskService.getByProviderTaskId(providerTaskId)
                : aiTaskService.getByProviderTaskIdAndUser(providerTaskId, loginUser.getId());
        ThrowUtils.throwIf(task == null, ErrorCode.NOT_FOUND_ERROR, "AI 任务不存在");
        return toTaskResponse(task);
    }

    @Override
    @Scheduled(fixedDelayString = "${ai-task.poll.fixed-delay-ms:10000}")
    public void pollDueTasks() {
        Date now = new Date();
        List<AiTask> tasks = aiTaskService.listPollable(now, Math.max(1, Math.min(pollBatchSize, 100)));
        for (AiTask task : tasks) {
            if (!aiTaskService.claimPollTask(task.getId(), now,
                    new Date(System.currentTimeMillis() + pollLeaseMs()))) {
                continue;
            }
            pollOne(task);
        }
    }

    private long pollLeaseMs() {
        long configuredLease = Math.max(10000L, pollLeaseTimeoutMs);
        long providerReadTimeout = Math.max(1000L, providerReadTimeoutMs);
        return Math.max(configuredLease, providerReadTimeout + 5000L);
    }

    private void pollOne(AiTask task) {
        Date now = new Date();
        if (task.getTimeoutTime() != null && task.getTimeoutTime().before(now)) {
            markTimedOut(task, "AI 任务超过最大处理时长");
            return;
        }
        if (StrUtil.isBlank(task.getProviderTaskId())) {
            markFailed(task, "AI 任务缺少供应商任务 ID");
            return;
        }
        if (!circuitBreaker.allowRequest()) {
            scheduleRetry(task, "AI 供应商熔断中，请稍后重试");
            return;
        }
        try {
            GetOutPaintingTaskResponse response = aiProviderClient.getOutPaintingTask(task.getProviderTaskId());
            if (response == null || response.getOutput() == null) {
                circuitBreaker.recordFailure();
                scheduleRetry(task, "AI 供应商返回空任务状态");
                return;
            }
            circuitBreaker.recordSuccess();
            String providerStatus = normalizeProviderStatus(response.getOutput().getTaskStatus());
            task.setRequestId(response.getRequestId());
            task.setLastPolledTime(now);
            task.setLeaseUntil(null);
            task.setErrorMessage(response.getOutput().getMessage());
            copyProviderMetadata(task, response.getOutput());
            if (AiTaskStatusEnum.SUCCEEDED.name().equals(providerStatus)) {
                if (StrUtil.isBlank(response.getOutput().getOutputImageUrl())) {
                    scheduleRetry(task, "AI 供应商成功状态缺少结果图片");
                    return;
                }
                task.setStatus(AiTaskStatusEnum.SUCCEEDED.name());
                task.setOutputUrl(response.getOutput().getOutputImageUrl());
                task.setNextRetryTime(null);
                saveUsageReservation(task);
                aiUsageRecordService.markSucceeded(task.getId(), task.getProviderTaskId());
                if (!aiTaskService.updateById(task)) {
                    throw new IllegalStateException("保存 AI 任务成功状态失败");
                }
            } else if ("FAILED".equals(providerStatus)) {
                task.setStatus(AiTaskStatusEnum.FAILED.name());
                task.setErrorMessage(normalizeError(task.getErrorMessage(), "AI 供应商任务失败"));
                task.setNextRetryTime(null);
                saveUsageReservation(task);
                aiUsageRecordService.markFailed(task.getId(), AiUsageStatusEnum.FAILED.name(), task.getErrorMessage());
                if (!aiTaskService.updateById(task)) {
                    throw new IllegalStateException("保存 AI 任务失败状态失败");
                }
            } else {
                task.setStatus(AiTaskStatusEnum.RUNNING.name().equals(providerStatus)
                        ? AiTaskStatusEnum.RUNNING.name() : AiTaskStatusEnum.PENDING.name());
                task.setNextRetryTime(new Date(now.getTime() + Math.max(1000L, pollIntervalMs)));
                if (!aiTaskService.updateById(task)) {
                    throw new IllegalStateException("保存 AI 任务轮询状态失败");
                }
            }
        } catch (RuntimeException e) {
            circuitBreaker.recordFailure();
            scheduleRetry(task, e.getMessage());
        }
    }

    private void scheduleRetry(AiTask task, String reason) {
        int retryCount = task.getRetryCount() == null ? 0 : task.getRetryCount();
        retryCount++;
        task.setRetryCount(retryCount);
        task.setLastPolledTime(new Date());
        task.setLeaseUntil(null);
        task.setErrorMessage(normalizeError(reason, "AI 任务轮询失败"));
        if (retryCount >= Math.max(1, maxAttempts)) {
            task.setStatus(AiTaskStatusEnum.FAILED.name());
            task.setNextRetryTime(null);
            aiUsageRecordService.markFailed(task.getId(), AiUsageStatusEnum.FAILED.name(), task.getErrorMessage());
            aiTaskService.updateById(task);
            return;
        }
        task.setStatus(AiTaskStatusEnum.RETRY_WAIT.name());
        task.setNextRetryTime(new Date(System.currentTimeMillis() + calculateBackoff(retryCount)));
        aiTaskService.updateById(task);
    }

    private long calculateBackoff(int retryCount) {
        int shift = Math.min(Math.max(0, retryCount - 1), 8);
        long base = Math.max(1000L, retryBaseDelayMs);
        long delay = base * (1L << shift);
        return Math.min(Math.max(base, retryMaxDelayMs), delay);
    }

    private void validateCreateRequest(CreatePictureOutPaintingTaskRequest request, User loginUser,
                                       String idempotencyKey) {
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        ThrowUtils.throwIf(request == null || request.getPictureId() == null,
                ErrorCode.PARAMS_ERROR);
        ThrowUtils.throwIf(StrUtil.isBlank(idempotencyKey), ErrorCode.PARAMS_ERROR,
                "AI 任务必须携带 Idempotency-Key");
        ThrowUtils.throwIf(idempotencyKey.trim().length() > 128, ErrorCode.PARAMS_ERROR,
                "AI 任务幂等号长度不能超过128个字符");
    }

    private ValidationResult validateParams(Picture picture, PictureOutPaintingParams params) {
        ThrowUtils.throwIf(params == null, ErrorCode.PARAMS_ERROR, "扩图参数不能为空");
        ThrowUtils.throwIf(picture.getPicWidth() == null || picture.getPicHeight() == null
                        || picture.getPicWidth() < 512 || picture.getPicHeight() < 512,
                ErrorCode.PARAMS_ERROR, "图片宽高不能小于512");
        int left = params.getLeftOffset() == null ? 0 : params.getLeftOffset();
        int right = params.getRightOffset() == null ? 0 : params.getRightOffset();
        int top = params.getTopOffset() == null ? 0 : params.getTopOffset();
        int bottom = params.getBottomOffset() == null ? 0 : params.getBottomOffset();
        Double xScale = params.getXScale();
        Double yScale = params.getYScale();
        ThrowUtils.throwIf(left < 0 || right < 0 || top < 0 || bottom < 0,
                ErrorCode.PARAMS_ERROR, "扩图偏移量不能为负数");
        boolean hasScale = xScale != null || yScale != null;
        ThrowUtils.throwIf(hasScale && (xScale == null || yScale == null
                        || xScale.isNaN() || xScale.isInfinite() || xScale <= 0
                        || yScale.isNaN() || yScale.isInfinite() || yScale <= 0),
                ErrorCode.PARAMS_ERROR, "扩图比例参数不合法");
        boolean offsetMode = (left > 0 || right > 0 || top > 0 || bottom > 0)
                && xScale == null && yScale == null;
        boolean scaleMode = xScale != null && yScale != null
                && left == 0 && right == 0 && top == 0 && bottom == 0;
        ThrowUtils.throwIf(!offsetMode && !scaleMode, ErrorCode.PARAMS_ERROR, "扩图参数不合法");
        return new ValidationResult(left, right, top, bottom, offsetMode, scaleMode);
    }

    private void checkPictureAuth(Picture picture, User loginUser) {
        if (userService.isAdmin(loginUser)) {
            return;
        }
        if (picture.getSpaceId() == null) {
            ThrowUtils.throwIf(!Objects.equals(picture.getUserId(), loginUser.getId()), ErrorCode.NO_AUTH_ERROR);
            return;
        }
        Space space = spaceService.getById(picture.getSpaceId());
        ThrowUtils.throwIf(space == null, ErrorCode.NOT_FOUND_ERROR, "空间不存在");
        boolean owner = Objects.equals(space.getUserId(), loginUser.getId());
        boolean canEdit = spaceUserAuthManager.getPermissionList(space, loginUser)
                .contains(SpaceUserPermissionConstant.PICTURE_EDIT);
        ThrowUtils.throwIf(!owner && !canEdit, ErrorCode.NO_AUTH_ERROR);
    }

    private void ensureProviderAvailable() {
        ThrowUtils.throwIf(!circuitBreaker.allowRequest(), ErrorCode.OPERATION_ERROR,
                "AI 供应商暂时不可用，请稍后使用原幂等号重试");
    }

    private CreateOutPaintingTaskRequest buildProviderRequest(Picture picture,
                                                              PictureOutPaintingParams params,
                                                              ValidationResult validation) {
        CreateOutPaintingTaskRequest providerRequest = new CreateOutPaintingTaskRequest();
        CreateOutPaintingTaskRequest.Input input = new CreateOutPaintingTaskRequest.Input();
        input.setImageUrl(picture.getUrl());
        providerRequest.setInput(input);
        CreateOutPaintingTaskRequest.Parameters providerParams = new CreateOutPaintingTaskRequest.Parameters();
        if (validation.offsetMode) {
            providerParams.setLeftOffset(validation.left);
            providerParams.setRightOffset(validation.right);
            providerParams.setTopOffset(validation.top);
            providerParams.setBottomOffset(validation.bottom);
        } else {
            providerParams.setXScale(params.getXScale() == null ? null : params.getXScale().floatValue());
            providerParams.setYScale(params.getYScale() == null ? null : params.getYScale().floatValue());
        }
        providerParams.setAddWatermark(params.getAddWatermark());
        providerParams.setAngle(params.getAngle());
        providerParams.setOutputRatio(params.getOutputRatio());
        providerParams.setLimitImageSize(params.getLimitImageSize());
        providerParams.setBestQuality(params.getBestQuality());
        providerRequest.setParameters(providerParams);
        return providerRequest;
    }

    private String buildRequestHash(Picture picture, PictureOutPaintingParams params, ValidationResult v) {
        String canonical = String.join("\u001F", Arrays.asList(
                String.valueOf(picture.getId()), StrUtil.blankToDefault(picture.getUrl(), ""),
                String.valueOf(v.left), String.valueOf(v.right), String.valueOf(v.top), String.valueOf(v.bottom),
                String.valueOf(params.getXScale()), String.valueOf(params.getYScale()),
                String.valueOf(params.getAddWatermark()), String.valueOf(params.getAngle()),
                StrUtil.blankToDefault(params.getOutputRatio(), ""), String.valueOf(params.getLimitImageSize()),
                String.valueOf(params.getBestQuality())));
        return DigestUtils.md5DigestAsHex(canonical.getBytes(StandardCharsets.UTF_8));
    }

    private AiTask lambdaGetByIdAndUser(Long taskId, Long userId) {
        return aiTaskService.lambdaQuery().eq(AiTask::getId, taskId).eq(AiTask::getUserId, userId).one();
    }

    private void saveUsageReservation(AiTask task) {
        AiUsageRecord record = new AiUsageRecord();
        record.setTaskId(task.getId());
        record.setUserId(task.getUserId());
        record.setSpaceId(task.getSpaceId());
        record.setProvider(task.getProvider());
        record.setProviderTaskId(task.getProviderTaskId());
        record.setStatus(AiUsageStatusEnum.RESERVED.name());
        record.setRequestUnits(1);
        record.setCostAmount(normalizedUsageUnitCost(task));
        record.setCurrency(defaultCurrency);
        aiUsageRecordService.saveReservation(record);
    }

    private CreateOutPaintingTaskResponse restoreCreateResponse(AiTask task) {
        if (AiTaskStatusEnum.FAILED.name().equals(task.getStatus())
                || AiTaskStatusEnum.TIMED_OUT.name().equals(task.getStatus())) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR,
                    normalizeError(task.getErrorMessage(), "AI 任务创建失败"));
        }
        if (AiTaskStatusEnum.UNKNOWN.name().equals(task.getStatus())) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR,
                    "AI 任务提交结果待确认，请勿更换幂等号并联系管理员核对");
        }
        if (AiTaskStatusEnum.RETRY_WAIT.name().equals(task.getStatus())
                || AiTaskStatusEnum.CREATING.name().equals(task.getStatus())) {
            CreateOutPaintingTaskResponse response = new CreateOutPaintingTaskResponse();
            response.setLocalTaskId(task.getId());
            CreateOutPaintingTaskResponse.Output output = new CreateOutPaintingTaskResponse.Output();
            output.setTaskStatus(task.getStatus());
            response.setOutput(output);
            return response;
        }
        if (StrUtil.isBlank(task.getProviderTaskId())) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "AI 任务正在创建，请稍后查询");
        }
        CreateOutPaintingTaskResponse response = new CreateOutPaintingTaskResponse();
        CreateOutPaintingTaskResponse.Output output = new CreateOutPaintingTaskResponse.Output();
        output.setTaskId(task.getProviderTaskId());
        output.setTaskStatus(task.getStatus());
        response.setOutput(output);
        response.setRequestId(task.getRequestId());
        response.setLocalTaskId(task.getId());
        return response;
    }

    private GetOutPaintingTaskResponse toTaskResponse(AiTask task) {
        GetOutPaintingTaskResponse response = new GetOutPaintingTaskResponse();
        response.setRequestId(task.getRequestId());
        response.setLocalTaskId(task.getId());
        GetOutPaintingTaskResponse.Output output = new GetOutPaintingTaskResponse.Output();
        output.setTaskId(task.getProviderTaskId());
        output.setTaskStatus(task.getStatus());
        output.setSubmitTime(task.getSubmitTime());
        output.setScheduledTime(task.getScheduledTime());
        output.setEndTime(task.getEndTime());
        output.setOutputImageUrl(task.getOutputUrl());
        output.setMessage(task.getErrorMessage());
        GetOutPaintingTaskResponse.TaskMetrics metrics = new GetOutPaintingTaskResponse.TaskMetrics();
        metrics.setTotal(task.getMetricsTotal());
        metrics.setSucceeded(task.getMetricsSucceeded());
        metrics.setFailed(task.getMetricsFailed());
        output.setTaskMetrics(metrics);
        response.setOutput(output);
        return response;
    }

    private void copyProviderMetadata(AiTask task, GetOutPaintingTaskResponse.Output output) {
        if (StrUtil.isNotBlank(output.getSubmitTime())) {
            task.setSubmitTime(output.getSubmitTime());
        }
        if (StrUtil.isNotBlank(output.getScheduledTime())) {
            task.setScheduledTime(output.getScheduledTime());
        }
        if (StrUtil.isNotBlank(output.getEndTime())) {
            task.setEndTime(output.getEndTime());
        }
        GetOutPaintingTaskResponse.TaskMetrics metrics = output.getTaskMetrics();
        if (metrics != null) {
            if (metrics.getTotal() != null) {
                task.setMetricsTotal(metrics.getTotal());
            }
            if (metrics.getSucceeded() != null) {
                task.setMetricsSucceeded(metrics.getSucceeded());
            }
            if (metrics.getFailed() != null) {
                task.setMetricsFailed(metrics.getFailed());
            }
        }
    }

    private void ensureRequestMatches(AiTask task, String requestHash) {
        if (!StrUtil.equals(requestHash, task.getRequestHash())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR,
                    "幂等号已用于其他或无法校验的 AI 请求，请更换幂等号");
        }
    }

    private String normalizeProviderStatus(String status) {
        if (StrUtil.isBlank(status)) {
            return AiTaskStatusEnum.PENDING.name();
        }
        String normalized = status.trim().toUpperCase();
        if ("SUCCEEDED".equals(normalized)) {
            return AiTaskStatusEnum.SUCCEEDED.name();
        }
        if ("FAILED".equals(normalized)) {
            return AiTaskStatusEnum.FAILED.name();
        }
        if ("RUNNING".equals(normalized)) {
            return AiTaskStatusEnum.RUNNING.name();
        }
        if ("SUSPENDED".equals(normalized) || "CANCELED".equals(normalized)
                || "CANCELLED".equals(normalized) || "TIMEOUT".equals(normalized)
                || "TIMED_OUT".equals(normalized)) {
            return AiTaskStatusEnum.FAILED.name();
        }
        return AiTaskStatusEnum.PENDING.name();
    }

    private void markFailed(AiTask task, String errorMessage) {
        task.setStatus(AiTaskStatusEnum.FAILED.name());
        task.setErrorMessage(normalizeError(errorMessage, "AI 任务创建失败"));
        task.setLeaseUntil(null);
        task.setNextRetryTime(null);
        aiUsageRecordService.markFailed(task.getId(), AiUsageStatusEnum.FAILED.name(), task.getErrorMessage());
        aiTaskService.updateById(task);
    }

    private void markUnknown(AiTask task, String errorMessage) {
        task.setStatus(AiTaskStatusEnum.UNKNOWN.name());
        task.setErrorMessage(normalizeError(errorMessage, "AI 任务提交结果待确认，请勿更换幂等号重试"));
        task.setLeaseUntil(null);
        aiUsageRecordService.markFailed(task.getId(), AiUsageStatusEnum.UNKNOWN.name(), task.getErrorMessage());
        aiTaskService.updateById(task);
    }

    private void markProviderAcceptedForPolling(AiTask task, String errorMessage) {
        task.setStatus(AiTaskStatusEnum.PENDING.name());
        task.setNextRetryTime(new Date(System.currentTimeMillis()
                + Math.max(1000L, pollIntervalMs)));
        task.setLeaseUntil(null);
        task.setErrorMessage(normalizeError(errorMessage, "AI 任务已受理，本地状态正在补偿"));
        try {
            aiTaskService.updateById(task);
        } catch (RuntimeException ignored) {
            // 若状态更新本身也失败，保留 providerTaskId，下一次运维扫描可以继续补偿。
        }
    }

    private void markTimedOut(AiTask task, String message) {
        task.setStatus(AiTaskStatusEnum.TIMED_OUT.name());
        task.setErrorMessage(message);
        task.setLeaseUntil(null);
        task.setNextRetryTime(null);
        aiUsageRecordService.markFailed(task.getId(), AiUsageStatusEnum.FAILED.name(), message);
        aiTaskService.updateById(task);
    }

    private String normalizeError(String error, String fallback) {
        if (StrUtil.isBlank(error)) {
            return fallback;
        }
        return error.length() > 512 ? error.substring(0, 512) : error;
    }

    private BigDecimal normalizedUsageUnitCost(AiTask task) {
        BigDecimal cost = task.getCostAmount() == null ? usageUnitCost : task.getCostAmount();
        return cost == null || cost.signum() < 0 ? BigDecimal.ZERO : cost;
    }

    private BigDecimal configuredUsageUnitCost() {
        return usageUnitCost == null || usageUnitCost.signum() < 0
                ? BigDecimal.ZERO : usageUnitCost;
    }

    private static class ValidationResult {
        private final int left;
        private final int right;
        private final int top;
        private final int bottom;
        private final boolean offsetMode;
        private final boolean scaleMode;

        private ValidationResult(int left, int right, int top, int bottom,
                                 boolean offsetMode, boolean scaleMode) {
            this.left = left;
            this.right = right;
            this.top = top;
            this.bottom = bottom;
            this.offsetMode = offsetMode;
            this.scaleMode = scaleMode;
        }
    }
}
