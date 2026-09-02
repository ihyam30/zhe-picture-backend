package com.sdfkl.zhepicturebackend.manager.websocket;

import com.sdfkl.zhepicturebackend.manager.websocket.disruptor.PictureEditEventProducer;
import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditResponseMessage;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

class PictureEditHandlerTest {

    private PictureEditHandler handler;
    private UserService userService;
    private PictureEditEventProducer eventProducer;
    private PictureEditRedisBroadcaster broadcaster;
    private PictureEditLockService lockService;
    private WebSocketConnectionRegistry connectionRegistry;
    private PictureEditStateStore stateStore;
    private WebSocketSession session;
    private Map<String, Object> attributes;
    private User user;

    @BeforeEach
    void setUp() {
        handler = new PictureEditHandler();
        userService = mock(UserService.class);
        eventProducer = mock(PictureEditEventProducer.class);
        broadcaster = mock(PictureEditRedisBroadcaster.class);
        lockService = mock(PictureEditLockService.class);
        connectionRegistry = mock(WebSocketConnectionRegistry.class);
        stateStore = mock(PictureEditStateStore.class);
        session = mock(WebSocketSession.class);
        attributes = new HashMap<>();
        user = new User();
        user.setId(1L);
        user.setUserName("tester");
        attributes.put("user", user);
        attributes.put("pictureId", 10L);
        attributes.put("wsConnectionId", "connection-1");
        when(session.getAttributes()).thenReturn(attributes);
        when(session.isOpen()).thenReturn(true);
        when(session.getId()).thenReturn("session-1");
        when(broadcaster.publish(anyLong(), any(PictureEditResponseMessage.class), any()))
                .thenReturn(false);
        ReflectionTestUtils.setField(handler, "userService", userService);
        ReflectionTestUtils.setField(handler, "pictureEditEventProducer", eventProducer);
        ReflectionTestUtils.setField(handler, "redisBroadcaster", broadcaster);
        ReflectionTestUtils.setField(handler, "editLockService", lockService);
        ReflectionTestUtils.setField(handler, "connectionRegistry", connectionRegistry);
        ReflectionTestUtils.setField(handler, "stateStore", stateStore);
        ReflectionTestUtils.setField(handler, "maxMessageBytes", 1024);
        ReflectionTestUtils.setField(handler, "heartbeatTimeoutMs", 60000L);
        when(stateStore.listPresence(anyLong())).thenReturn(java.util.Collections.emptyList());
        when(stateStore.getLock(anyLong())).thenReturn(null);
        when(stateStore.registerPresence(anyLong(), anyString(), any())).thenReturn(true);
        when(stateStore.saveLock(anyLong(), anyString(), any(), anyLong())).thenReturn(true);
        when(connectionRegistry.heartbeat(anyLong(), anyString())).thenReturn(true);
        ReflectionTestUtils.setField(handler, "editLockTtlMs", 60000L);
    }

    @Test
    void invalidJsonShouldReturnErrorWithoutPublishingEvent() throws Exception {
        handler.handleTextMessage(session, new TextMessage("{invalid"));

        verify(session).sendMessage(any(TextMessage.class));
        verifyNoInteractions(eventProducer);
    }

    @Test
    void unknownActionShouldReturnError() throws Exception {
        handler.handleTextMessage(session, new TextMessage(
                "{\"type\":\"EDIT_ACTION\",\"editAction\":\"DELETE_ALL\"}"));
        verify(session).sendMessage(any(TextMessage.class));
        verifyNoInteractions(broadcaster);
    }

    @Test
    void editLockShouldUseAtomicPutIfAbsentSemantics() throws Exception {
        when(lockService.tryAcquire(10L, "connection-1")).thenReturn(true);
        handler.afterConnectionEstablished(session);
        handler.handleEnterEditMessage(null, session, user, 10L);

        WebSocketSession secondSession = mock(WebSocketSession.class);
        Map<String, Object> secondAttributes = new HashMap<>();
        User secondUser = new User();
        secondUser.setId(2L);
        secondUser.setUserName("second");
        secondAttributes.put("user", secondUser);
        secondAttributes.put("pictureId", 10L);
        secondAttributes.put("wsConnectionId", "connection-2");
        when(secondSession.getAttributes()).thenReturn(secondAttributes);
        when(secondSession.isOpen()).thenReturn(true);
        when(lockService.tryAcquire(10L, "connection-2")).thenReturn(true);

        handler.afterConnectionEstablished(secondSession);
        handler.handleEnterEditMessage(null, secondSession, secondUser, 10L);

        verify(lockService).release(10L, "connection-2");
        verify(secondSession, atLeastOnce()).sendMessage(any(TextMessage.class));
        assertTrue(attributes.containsKey("lastHeartbeat"));
    }
}
