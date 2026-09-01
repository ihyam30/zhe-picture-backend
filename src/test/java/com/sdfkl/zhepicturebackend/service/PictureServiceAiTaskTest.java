package com.sdfkl.zhepicturebackend.service;

import com.sdfkl.zhepicturebackend.api.aliyunai.AliYunAIApi;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.manager.auth.SpaceUserAuthManager;
import com.sdfkl.zhepicturebackend.manager.auth.model.SpaceUserPermissionConstant;
import com.sdfkl.zhepicturebackend.mapper.PictureMapper;
import com.sdfkl.zhepicturebackend.model.dto.picture.CreatePictureOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.model.dto.picture.PictureOutPaintingParams;
import com.sdfkl.zhepicturebackend.model.entity.AiTask;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.enums.SpaceTypeEnum;
import com.sdfkl.zhepicturebackend.service.impl.PictureServiceImpl;
import com.sdfkl.zhepicturebackend.service.SpaceService;
import com.sdfkl.zhepicturebackend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PictureServiceAiTaskTest {

    private PictureServiceImpl pictureService;
    private PictureMapper pictureMapper;
    private AiTaskService aiTaskService;
    private AliYunAIApi aliYunAIApi;
    private UserService userService;
    private SpaceService spaceService;
    private SpaceUserAuthManager spaceUserAuthManager;

    @BeforeEach
    void setUp() {
        pictureService = new PictureServiceImpl();
        pictureMapper = mock(PictureMapper.class);
        aiTaskService = mock(AiTaskService.class);
        aliYunAIApi = mock(AliYunAIApi.class);
        userService = mock(UserService.class);
        spaceService = mock(SpaceService.class);
        spaceUserAuthManager = mock(SpaceUserAuthManager.class);
        ReflectionTestUtils.setField(pictureService, "baseMapper", pictureMapper);
        ReflectionTestUtils.setField(pictureService, "aiTaskService", aiTaskService);
        ReflectionTestUtils.setField(pictureService, "aliYunAIApi", aliYunAIApi);
        ReflectionTestUtils.setField(pictureService, "userService", userService);
        ReflectionTestUtils.setField(pictureService, "spaceService", spaceService);
        ReflectionTestUtils.setField(pictureService, "spaceUserAuthManager", spaceUserAuthManager);
    }

    @Test
    void shouldPersistAiTaskBeforeCallingProviderAndReuseIdempotencyKey() throws Exception {
        User user = user(1L);
        Picture picture = picture(10L, 1L);
        CreatePictureOutPaintingTaskRequest request = request(10L);
        CreateOutPaintingTaskResponse providerResponse = providerResponse("provider-task-1");
        when(pictureMapper.selectById(10L)).thenReturn(picture);
        when(userService.isAdmin(user)).thenReturn(false);
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1")).thenReturn(null);
        when(aiTaskService.save(any(AiTask.class))).thenReturn(true);
        when(aiTaskService.updateById(any(AiTask.class))).thenReturn(true);
        when(aliYunAIApi.createOutPaintingTask(any(), eq(user))).thenReturn(providerResponse);

        CreateOutPaintingTaskResponse response = pictureService.createOutPaintingTask(request, user, "request-1");

        assertEquals("provider-task-1", response.getOutput().getTaskId());
        ArgumentCaptor<AiTask> taskCaptor = ArgumentCaptor.forClass(AiTask.class);
        verify(aiTaskService).save(taskCaptor.capture());
        assertEquals(1L, taskCaptor.getValue().getUserId());
        assertEquals(10L, taskCaptor.getValue().getPictureId());
        assertEquals("request-1", taskCaptor.getValue().getIdempotencyKey());
        assertNotNull(taskCaptor.getValue().getRequestHash());
        verify(aliYunAIApi).createOutPaintingTask(any(), eq(user));
    }

    @Test
    void shouldRejectMissingIdempotencyKeyBeforeLoadingPicture() {
        User user = user(1L);

        assertThrows(BusinessException.class,
                () -> pictureService.createOutPaintingTask(request(10L), user, " "));

        verifyNoInteractions(pictureMapper, aiTaskService, aliYunAIApi);
    }

    @Test
    void shouldRejectReusingIdempotencyKeyForDifferentRequest() {
        User user = user(1L);
        Picture picture = picture(10L, 1L);
        when(pictureMapper.selectById(10L)).thenReturn(picture);
        when(userService.isAdmin(user)).thenReturn(false);
        AiTask historicalTask = new AiTask();
        historicalTask.setRequestHash("different-request-hash");
        historicalTask.setStatus("PENDING");
        historicalTask.setProviderTaskId("provider-task-1");
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1")).thenReturn(historicalTask);

        assertThrows(BusinessException.class,
                () -> pictureService.createOutPaintingTask(request(10L), user, "request-1"));
        verifyNoInteractions(aliYunAIApi);
        verify(aiTaskService, never()).save(any(AiTask.class));
    }

    @Test
    void shouldAllowTeamEditorToCreateOutPaintingTask() throws Exception {
        User editor = user(2L);
        Picture picture = picture(10L, 1L);
        picture.setSpaceId(99L);
        Space space = new Space();
        space.setId(99L);
        space.setUserId(1L);
        space.setSpaceType(SpaceTypeEnum.TEAM.getValue());
        when(pictureMapper.selectById(10L)).thenReturn(picture);
        when(userService.isAdmin(editor)).thenReturn(false);
        when(spaceService.getById(99L)).thenReturn(space);
        when(spaceUserAuthManager.getPermissionList(eq(space), eq(editor)))
                .thenReturn(java.util.Collections.singletonList(SpaceUserPermissionConstant.PICTURE_EDIT));
        when(aiTaskService.getByUserAndIdempotencyKey(2L, "request-1")).thenReturn(null);
        when(aiTaskService.save(any(AiTask.class))).thenReturn(true);
        when(aiTaskService.updateById(any(AiTask.class))).thenReturn(true);
        when(aliYunAIApi.createOutPaintingTask(any(), eq(editor)))
                .thenReturn(providerResponse("provider-task-editor"));

        CreateOutPaintingTaskResponse response =
                pictureService.createOutPaintingTask(request(10L), editor, "request-1");

        assertEquals("provider-task-editor", response.getOutput().getTaskId());
        verify(aliYunAIApi).createOutPaintingTask(any(), eq(editor));
    }

    @Test
    void shouldMarkTaskUnknownWhenProviderThrowsRuntimeException() throws Exception {
        User user = user(1L);
        Picture picture = picture(10L, 1L);
        when(pictureMapper.selectById(10L)).thenReturn(picture);
        when(userService.isAdmin(user)).thenReturn(false);
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1")).thenReturn(null);
        when(aiTaskService.save(any(AiTask.class))).thenReturn(true);
        when(aiTaskService.updateById(any(AiTask.class))).thenReturn(true);
        when(aliYunAIApi.createOutPaintingTask(any(), eq(user)))
                .thenThrow(new RuntimeException("network unavailable"));

        assertThrows(BusinessException.class,
                () -> pictureService.createOutPaintingTask(request(10L), user, "request-1"));

        ArgumentCaptor<AiTask> taskCaptor = ArgumentCaptor.forClass(AiTask.class);
        verify(aiTaskService).updateById(taskCaptor.capture());
        assertEquals("UNKNOWN", taskCaptor.getValue().getStatus());
    }

    @Test
    void shouldNotCallProviderAgainWhenTaskSubmissionResultIsUnknown() throws Exception {
        User user = user(1L);
        Picture picture = picture(10L, 1L);
        AiTask unknownTask = new AiTask();
        unknownTask.setStatus("UNKNOWN");

        when(pictureMapper.selectById(10L)).thenReturn(picture);
        when(userService.isAdmin(user)).thenReturn(false);
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1"))
                .thenReturn(null, unknownTask);
        when(aiTaskService.save(any(AiTask.class))).thenAnswer(invocation -> {
            AiTask savedTask = invocation.getArgument(0);
            unknownTask.setRequestHash(savedTask.getRequestHash());
            return true;
        });
        when(aiTaskService.updateById(any(AiTask.class))).thenReturn(true);
        when(aliYunAIApi.createOutPaintingTask(any(), eq(user)))
                .thenThrow(new RuntimeException("network unavailable"));

        assertThrows(BusinessException.class,
                () -> pictureService.createOutPaintingTask(request(10L), user, "request-1"));

        clearInvocations(aliYunAIApi);
        assertThrows(BusinessException.class,
                () -> pictureService.createOutPaintingTask(request(10L), user, "request-1"));
        verifyNoInteractions(aliYunAIApi);
    }

    @Test
    void shouldResubmitOnlyAfterTaskIsMarkedRetryable() throws Exception {
        User user = user(1L);
        Picture picture = picture(10L, 1L);
        CreatePictureOutPaintingTaskRequest request = request(10L);
        AiTask retryableTask = new AiTask();
        retryableTask.setId(99L);
        retryableTask.setUserId(1L);
        retryableTask.setIdempotencyKey("request-1");
        retryableTask.setStatus("RETRYABLE");
        retryableTask.setRequestHash(ReflectionTestUtils.invokeMethod(
                pictureService,
                "buildOutPaintingRequestHash",
                picture,
                request.getParameters(),
                10,
                0,
                0,
                0));

        when(pictureMapper.selectById(10L)).thenReturn(picture);
        when(userService.isAdmin(user)).thenReturn(false);
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1")).thenReturn(retryableTask);
        when(aiTaskService.claimRetryableTask(99L, 1L, "request-1")).thenReturn(true);
        when(aiTaskService.updateById(any(AiTask.class))).thenReturn(true);
        when(aliYunAIApi.createOutPaintingTask(any(), eq(user)))
                .thenReturn(providerResponse("provider-task-retry"));

        CreateOutPaintingTaskResponse response =
                pictureService.createOutPaintingTask(request, user, "request-1");

        assertEquals("provider-task-retry", response.getOutput().getTaskId());
        verify(aiTaskService).claimRetryableTask(99L, 1L, "request-1");
        verify(aiTaskService, never()).save(any(AiTask.class));
        verify(aliYunAIApi).createOutPaintingTask(any(), eq(user));
    }

    @Test
    void shouldMarkTaskFailedWhenRequestSerializationFailsBeforeProviderCall() throws Exception {
        User user = user(1L);
        Picture picture = picture(10L, 1L);
        when(pictureMapper.selectById(10L)).thenReturn(picture);
        when(userService.isAdmin(user)).thenReturn(false);
        when(aiTaskService.getByUserAndIdempotencyKey(1L, "request-1")).thenReturn(null);
        when(aiTaskService.save(any(AiTask.class))).thenReturn(true);
        when(aiTaskService.updateById(any(AiTask.class))).thenReturn(true);
        when(aliYunAIApi.createOutPaintingTask(any(), eq(user)))
                .thenThrow(new com.fasterxml.jackson.core.JsonProcessingException("serialization failed") {
                });

        assertThrows(com.fasterxml.jackson.core.JsonProcessingException.class,
                () -> pictureService.createOutPaintingTask(request(10L), user, "request-1"));

        ArgumentCaptor<AiTask> taskCaptor = ArgumentCaptor.forClass(AiTask.class);
        verify(aiTaskService).updateById(taskCaptor.capture());
        assertEquals("FAILED", taskCaptor.getValue().getStatus());
    }

    @Test
    void shouldNotQueryProviderWhenTaskDoesNotBelongToUser() {
        User user = user(2L);
        when(userService.isAdmin(user)).thenReturn(false);
        when(aiTaskService.getByProviderTaskIdAndUser("provider-task-1", 2L)).thenReturn(null);

        assertThrows(BusinessException.class,
                () -> pictureService.getOutPaintingTask("provider-task-1", user));
        verifyNoInteractions(aliYunAIApi);
    }

    private User user(Long id) {
        User user = new User();
        user.setId(id);
        user.setUserRole("user");
        return user;
    }

    private Picture picture(Long id, Long userId) {
        Picture picture = new Picture();
        picture.setId(id);
        picture.setUserId(userId);
        picture.setPicWidth(1024);
        picture.setPicHeight(1024);
        picture.setUrl("https://picture.example.com/source.png");
        return picture;
    }

    private CreatePictureOutPaintingTaskRequest request(Long pictureId) {
        PictureOutPaintingParams params = new PictureOutPaintingParams();
        params.setLeftOffset(10);
        params.setRightOffset(0);
        params.setTopOffset(0);
        params.setBottomOffset(0);
        CreatePictureOutPaintingTaskRequest request = new CreatePictureOutPaintingTaskRequest();
        request.setPictureId(pictureId);
        request.setParameters(params);
        return request;
    }

    private CreateOutPaintingTaskResponse providerResponse(String taskId) {
        CreateOutPaintingTaskResponse response = new CreateOutPaintingTaskResponse();
        CreateOutPaintingTaskResponse.Output output = new CreateOutPaintingTaskResponse.Output();
        output.setTaskId(taskId);
        output.setTaskStatus("PENDING");
        response.setOutput(output);
        response.setRequestId("request-id-1");
        return response;
    }
}
