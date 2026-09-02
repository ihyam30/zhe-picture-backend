package com.sdfkl.zhepicturebackend.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sdfkl.zhepicturebackend.annotation.AuthCheck;
import com.sdfkl.zhepicturebackend.common.BaseResponse;
import com.sdfkl.zhepicturebackend.common.ResultUtils;
import com.sdfkl.zhepicturebackend.constant.UserConstant;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import com.sdfkl.zhepicturebackend.manager.auth.CurrentUserService;
import com.sdfkl.zhepicturebackend.model.dto.aitask.AiTaskRecoveryRequest;
import com.sdfkl.zhepicturebackend.model.entity.AiTask;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.GetOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.service.AiTaskApplicationService;
import com.sdfkl.zhepicturebackend.service.AiTaskService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * AI 任务运维恢复接口。
 *
 * <p>这些接口只允许管理员使用，用于处理第三方提交结果不确定的任务。</p>
 */
@RestController
@RequestMapping("/aiTask")
public class AiTaskController {

    @Resource
    private AiTaskService aiTaskService;

    @Resource
    private AiTaskApplicationService aiTaskApplicationService;

    @Resource
    private CurrentUserService currentUserService;

    /**
     * 查询当前用户自己的 AI 任务。数字参数按本地任务 ID 查询，其他参数兼容供应商任务 ID；
     * 两条路径都只读当前用户可见的数据库快照，不同步调用供应商。
     */
    @GetMapping("/my")
    public BaseResponse<GetOutPaintingTaskResponse> getMyTask(@RequestParam String taskId) {
        User loginUser = currentUserService.getRequiredUser();
        ThrowUtils.throwIf(taskId == null || taskId.trim().isEmpty(),
                ErrorCode.PARAMS_ERROR, "AI 任务 ID 不能为空");
        String normalizedTaskId = taskId.trim();
        GetOutPaintingTaskResponse response;
        if (normalizedTaskId.matches("\\d+")) {
            try {
                response = aiTaskApplicationService.getOutPaintingTask(
                        Long.valueOf(normalizedTaskId), loginUser);
            } catch (NumberFormatException e) {
                response = aiTaskApplicationService.getOutPaintingTaskByProviderTaskId(
                        normalizedTaskId, loginUser);
            } catch (BusinessException e) {
                if (e.getCode() != ErrorCode.NOT_FOUND_ERROR.getCode()) {
                    throw e;
                }
                // 供应商任务 ID 通常包含字母，但兼容纯数字 ID，避免与本地 ID 规则冲突。
                response = aiTaskApplicationService.getOutPaintingTaskByProviderTaskId(
                        normalizedTaskId, loginUser);
            }
        } else {
            response = aiTaskApplicationService.getOutPaintingTaskByProviderTaskId(
                    normalizedTaskId, loginUser);
        }
        return ResultUtils.success(response);
    }

    @GetMapping("/admin/unresolved")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Page<AiTask>> listUnresolvedTasks(
            @RequestParam(defaultValue = "1") long current,
            @RequestParam(defaultValue = "20") long pageSize) {
        ThrowUtils.throwIf(current < 1 || pageSize < 1 || pageSize > 100,
                ErrorCode.PARAMS_ERROR, "分页参数不合法");
        return ResultUtils.success(aiTaskService.pageUnresolved(current, pageSize));
    }

    /**
     * 管理员确认第三方没有创建任务后，允许客户端使用原幂等号重新提交。
     */
    @PostMapping("/admin/retry")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> markRetryable(@RequestBody AiTaskRecoveryRequest request) {
        validateTaskId(request);
        aiTaskService.markRetryable(request.getTaskId(), request.getReason());
        return ResultUtils.success(true);
    }

    /**
     * 已从第三方日志或控制台找回 taskId 时，将其绑定回本地任务。
     */
    @PostMapping("/admin/bind")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> bindProviderTask(@RequestBody AiTaskRecoveryRequest request) {
        validateTaskId(request);
        ThrowUtils.throwIf(request.getProviderTaskId() == null,
                ErrorCode.PARAMS_ERROR, "第三方任务 ID 不能为空");
        aiTaskService.bindProviderTask(request.getTaskId(), request.getProviderTaskId(), request.getRequestId());
        return ResultUtils.success(true);
    }

    private void validateTaskId(AiTaskRecoveryRequest request) {
        ThrowUtils.throwIf(request == null || request.getTaskId() == null || request.getTaskId() <= 0,
                ErrorCode.PARAMS_ERROR, "AI 任务 ID 不合法");
    }
}
