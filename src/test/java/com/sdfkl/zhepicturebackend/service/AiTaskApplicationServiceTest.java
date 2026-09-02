package com.sdfkl.zhepicturebackend.service;

import com.sdfkl.zhepicturebackend.api.aliyunai.AiProviderClient;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.GetOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.mapper.PictureMapper;
import com.sdfkl.zhepicturebackend.model.dto.picture.CreatePictureOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.model.dto.picture.PictureOutPaintingParams;
import com.sdfkl.zhepicturebackend.model.entity.AiTask;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.service.impl.AiProviderCircuitBreaker;
import com.sdfkl.zhepicturebackend.service.impl.AiTaskApplicationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AiTaskApplicationServiceTest {

    private AiTaskApplicationServiceImpl service;
    private PictureMapper pictureMapper;
    private AiTaskService aiTaskService;
    private AiUsageRecordService usageRecordService;
    private AiQuotaService quotaService;
    private AiProviderClient providerClient;
    private UserService userService;
    private SpaceService spaceService;
    private com.sdfkl.zhepicturebackend.manager.auth.SpaceUserAuthManager authManager;
    private User user;
    private Picture picture;

    @BeforeEach
    void setUp() {
        service = new AiTaskApplicationServiceImpl();
        pictureMapper = mock(PictureMapper.class);
        aiTaskService = mock(AiTaskService.class);
        usageRecordService = mock(AiUsageRecordService.class);
        quotaService = mock(AiQuotaService.class);
        providerClient = mock(AiProviderClient.class);
        userService = mock(UserService.class);
        spaceService = mock(SpaceService.class);
        authManager = mock(com.sdfkl.zhepicturebackend.manager.auth.SpaceUserAuthManager.class);
        user = new User();
        user.setId(1L);
        picture = new Picture();
        picture.setId(10L);
        picture.setUserId(1L);
        picture.setUrl("https://picture.example.com/source.png");
        picture.setPicWidth(1024);
        picture.setPicHeight(1024);
        when(pictureMapper.selectById(10L)).thenReturn(picture);
        when(userService.isAdmin(user)).thenReturn(false);
        ReflectionTestUtils.setField(service, "pictureMapper", pictureMapper);
        ReflectionTestUtils.setField(service, "aiTaskService", aiTaskService);
        ReflectionTestUtils.setField(service, "aiUsageRecordService", usageRecordService);
        ReflectionTestUtils.setField(service, "aiQuotaService", quotaService);
        ReflectionTestUtils.setField(service, "aiProviderClient", providerClient);
        ReflectionTestUtils.setField(service, "userService", userService);
        ReflectionTestUtils.setField(service, "spaceService", spaceService);
        ReflectionTestUtils.setField(service, "spaceUserAuthManager", authManager);
        ReflectionTestUtils.setField(service, "circuitBreaker", new AiProviderCircuitBreaker());
        ReflectionTestUtils.setField(service, "taskTimeoutMs", 1800000L);
        ReflectionTestUtils.setField(service, "pollIntervalMs", 10000L);
        ReflectionTestUtils.setField(service, "retryBaseDelayMs", 1000L);
        ReflectionTestUtils.setField(service, "retryMaxDelayMs", 60000L);
        ReflectionTestUtils.setField(service, "maxAttempts", 3);
        when(aiTaskService.updateById(any(AiTask.class))).thenReturn(true);
    }

    @Test
    void createShouldReserveQuotaAndReturnLocalTaskId() throws Exception {
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1")).thenReturn(null);
        when(aiTaskService.save(any(AiTask.class))).thenAnswer(invocation -> {
            invocation.<AiTask>getArgument(0).setId(100L);
            return true;
        });
        when(quotaService.tryReserve(1L, null)).thenReturn(true);
        when(providerClient.createOutPaintingTask(any(), eq(user))).thenReturn(providerResponse());

        com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse response =
                service.createOutPaintingTask(request(), user, "request-1");

        assertEquals(100L, response.getLocalTaskId());
        assertEquals("provider-1", response.getOutput().getTaskId());
        verify(quotaService).tryReserve(1L, null);
        verify(usageRecordService, atLeastOnce()).saveReservation(any());
        verify(providerClient).createOutPaintingTask(any(), eq(user));
    }

    @Test
    void immediateProviderSuccessShouldRemainPollableUntilResultIsFetched() throws Exception {
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1")).thenReturn(null);
        when(aiTaskService.save(any(AiTask.class))).thenAnswer(invocation -> {
            invocation.<AiTask>getArgument(0).setId(100L);
            return true;
        });
        when(quotaService.tryReserve(1L, null)).thenReturn(true);
        CreateOutPaintingTaskResponse response = providerResponse();
        response.getOutput().setTaskStatus("SUCCEEDED");
        when(providerClient.createOutPaintingTask(any(), eq(user))).thenReturn(response);

        CreateOutPaintingTaskResponse result =
                service.createOutPaintingTask(request(), user, "request-1");

        assertEquals("PENDING", result.getOutput().getTaskStatus());
        verify(aiTaskService).updateById(argThat(task ->
                "PENDING".equals(task.getStatus()) && task.getNextRetryTime() != null));
    }

    @Test
    void immediateProviderFailureShouldFinalizeUsageRecord() throws Exception {
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1")).thenReturn(null);
        when(aiTaskService.save(any(AiTask.class))).thenAnswer(invocation -> {
            invocation.<AiTask>getArgument(0).setId(100L);
            return true;
        });
        when(quotaService.tryReserve(1L, null)).thenReturn(true);
        CreateOutPaintingTaskResponse response = providerResponse();
        response.getOutput().setTaskStatus("FAILED");
        when(providerClient.createOutPaintingTask(any(), eq(user))).thenReturn(response);

        CreateOutPaintingTaskResponse result =
                service.createOutPaintingTask(request(), user, "request-1");

        assertEquals("FAILED", result.getOutput().getTaskStatus());
        verify(usageRecordService).markFailed(100L, "FAILED", "AI 供应商任务创建失败");
    }

    @Test
    void quotaFailureShouldNotCallProvider() throws Exception {
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1")).thenReturn(null);
        when(aiTaskService.save(any(AiTask.class))).thenAnswer(invocation -> {
            invocation.<AiTask>getArgument(0).setId(100L);
            return true;
        });
        when(quotaService.tryReserve(1L, null)).thenReturn(false);

        assertThrows(BusinessException.class,
                () -> service.createOutPaintingTask(request(), user, "request-1"));
        verifyNoInteractions(providerClient);
    }

    @Test
    void openCircuitShouldFailBeforeCreatingTask() {
        AiProviderCircuitBreaker breaker = new AiProviderCircuitBreaker();
        ReflectionTestUtils.setField(breaker, "failureThreshold", 1);
        ReflectionTestUtils.setField(breaker, "openMs", 60000L);
        breaker.recordFailure();
        ReflectionTestUtils.setField(service, "circuitBreaker", breaker);

        assertThrows(BusinessException.class,
                () -> service.createOutPaintingTask(request(), user, "request-1"));
        verify(aiTaskService, never()).save(any(AiTask.class));
        verifyNoInteractions(quotaService, providerClient);
    }

    @Test
    void localQueryShouldNotCallProvider() {
        User admin = new User();
        admin.setId(9L);
        AiTask task = new AiTask();
        task.setId(100L);
        task.setUserId(1L);
        task.setProviderTaskId("provider-1");
        task.setStatus("RUNNING");
        when(userService.isAdmin(admin)).thenReturn(true);
        when(aiTaskService.getById(100L)).thenReturn(task);

        GetOutPaintingTaskResponse response = service.getOutPaintingTask(100L, admin);

        assertEquals(100L, response.getLocalTaskId());
        assertEquals("RUNNING", response.getOutput().getTaskStatus());
        verifyNoInteractions(providerClient);
    }

    @Test
    void pollShouldPersistProviderSuccessAndUsage() {
        AiTask task = new AiTask();
        task.setId(100L);
        task.setUserId(1L);
        task.setProviderTaskId("provider-1");
        task.setStatus("PENDING");
        task.setTimeoutTime(new java.util.Date(System.currentTimeMillis() + 60000L));
        when(aiTaskService.listPollable(any(), anyInt()))
                .thenReturn(Collections.singletonList(task));
        when(aiTaskService.claimPollTask(eq(100L), any(), any())).thenReturn(true);
        when(providerClient.getOutPaintingTask("provider-1")).thenReturn(providerQueryResponse());

        service.pollDueTasks();

        assertEquals("SUCCEEDED", task.getStatus());
        assertEquals("https://picture.example.com/generated.png", task.getOutputUrl());
        verify(aiTaskService).updateById(task);
        verify(usageRecordService).markSucceeded(100L, "provider-1");
    }

    private CreatePictureOutPaintingTaskRequest request() {
        PictureOutPaintingParams params = new PictureOutPaintingParams();
        params.setLeftOffset(10);
        params.setRightOffset(0);
        params.setTopOffset(0);
        params.setBottomOffset(0);
        CreatePictureOutPaintingTaskRequest request = new CreatePictureOutPaintingTaskRequest();
        request.setPictureId(10L);
        request.setParameters(params);
        return request;
    }

    private CreateOutPaintingTaskResponse providerResponse() {
        CreateOutPaintingTaskResponse response = new CreateOutPaintingTaskResponse();
        CreateOutPaintingTaskResponse.Output output = new CreateOutPaintingTaskResponse.Output();
        output.setTaskId("provider-1");
        output.setTaskStatus("PENDING");
        response.setOutput(output);
        response.setRequestId("request-id");
        return response;
    }

    private GetOutPaintingTaskResponse providerQueryResponse() {
        GetOutPaintingTaskResponse response = new GetOutPaintingTaskResponse();
        GetOutPaintingTaskResponse.Output output = new GetOutPaintingTaskResponse.Output();
        output.setTaskId("provider-1");
        output.setTaskStatus("SUCCEEDED");
        output.setOutputImageUrl("https://picture.example.com/generated.png");
        response.setOutput(output);
        response.setRequestId("query-request-id");
        return response;
    }
}
