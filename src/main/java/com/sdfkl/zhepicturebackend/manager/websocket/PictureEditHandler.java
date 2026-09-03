package com.sdfkl.zhepicturebackend.manager.websocket;

import cn.hutool.json.JSONUtil;
import com.sdfkl.zhepicturebackend.manager.websocket.disruptor.PictureEditEventProducer;
import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditActionEnum;
import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditMessageTypeEnum;
import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditRequestMessage;
import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditResponseMessage;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.vo.UserVO;
import com.sdfkl.zhepicturebackend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import jakarta.annotation.Resource;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 图片详情页 WebSocket 处理器。
 *
 * <p>第一版只提供在线状态、编辑锁和动作通知，不承诺 OT/CRDT 级别的多人文档编辑。</p>
 */
@Component
@Slf4j
public class PictureEditHandler extends TextWebSocketHandler {

    @Resource
    private UserService userService;

    @Resource
    @Lazy
    private PictureEditEventProducer pictureEditEventProducer;

    @Resource
    private PictureEditRedisBroadcaster redisBroadcaster;

    @Resource
    private PictureEditLockService editLockService;

    @Resource
    private WebSocketConnectionRegistry connectionRegistry;

    @Resource
    private PictureEditStateStore stateStore;

    /** 每张图片的本机编辑锁缓存，真正的跨实例锁由 Redis 提供。 */
    private final Map<Long, EditLock> pictureEditingUsers = new ConcurrentHashMap<>();

    /** 保存本机连接，Redis Pub/Sub 负责把消息送到其他实例。 */
    private final Map<Long, Set<WebSocketSession>> pictureSessions = new ConcurrentHashMap<>();

    @Value("${websocket.message.max-bytes:65536}")
    private int maxMessageBytes;

    @Value("${websocket.heartbeat.timeout-ms:60000}")
    private long heartbeatTimeoutMs;

    @Value("${websocket.edit-lock.ttl-ms:60000}")
    private long editLockTtlMs;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        User user = (User) session.getAttributes().get("user");
        Long pictureId = (Long) session.getAttributes().get("pictureId");
        if (user == null || pictureId == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }
        Set<WebSocketSession> sessions = pictureSessions.computeIfAbsent(
                pictureId, ignored -> ConcurrentHashMap.newKeySet());
        try {
            session.getAttributes().put("lastHeartbeat", System.currentTimeMillis());
            Set<Long> sentUserIds = new HashSet<>();
            for (WebSocketSession existingSession : sessions) {
                User existingUser = (User) existingSession.getAttributes().get("user");
                if (existingUser != null && sentUserIds.add(existingUser.getId())) {
                    sendLocal(session, buildInfoMessage(existingUser, "用户已在线"));
                }
            }
            for (UserVO existingUser : stateStore.listPresence(pictureId)) {
                if (existingUser != null && sentUserIds.add(existingUser.getId())) {
                    sendLocal(session, buildInfoMessage(existingUser, "用户已在线"));
                }
            }
            EditLock currentLock = pictureEditingUsers.get(pictureId);
            if (currentLock != null && currentLock.expireAt > System.currentTimeMillis()) {
                PictureEditResponseMessage lockResponse = buildInfoMessage(
                        currentLock.user, String.format("用户 %s 正在编辑图片", currentLock.user.getUserName()));
                lockResponse.setType(PictureEditMessageTypeEnum.ENTER_EDIT.getValue());
                sendLocal(session, lockResponse);
            } else {
                PictureEditStateStore.LockSnapshot lockSnapshot = stateStore.getLock(pictureId);
                if (lockSnapshot != null) {
                    PictureEditResponseMessage lockResponse = buildInfoMessage(
                            lockSnapshot.getUser(), "当前图片正在被其他用户编辑");
                    lockResponse.setType(PictureEditMessageTypeEnum.ENTER_EDIT.getValue());
                    sendLocal(session, lockResponse);
                }
            }
            UserVO userVO = userService.getUserVO(user);
            session.getAttributes().put("wsUserVO", userVO);
            if (!stateStore.registerPresence(pictureId, connectionToken(session), userVO)) {
                stateStore.removePresence(pictureId, connectionToken(session));
                connectionRegistry.release(user.getId(), connectionToken(session));
                pictureSessions.remove(pictureId, sessions);
                session.close(CloseStatus.SERVER_ERROR);
                return;
            }
            session.getAttributes().put("wsPresenceRegistered", true);
            sessions.add(session);
            PictureEditResponseMessage response = buildInfoMessage(user, "用户加入协同会话");
            broadcastToPicture(pictureId, response, session);
        } catch (Exception e) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                pictureSessions.remove(pictureId, sessions);
            }
            stateStore.removePresence(pictureId, connectionToken(session));
            releaseConnection(session);
            try {
                if (session.isOpen()) {
                    session.close(CloseStatus.SERVER_ERROR);
                }
            } catch (IOException closeException) {
                log.debug("关闭初始化失败的 WebSocket 连接失败", closeException);
            }
            throw e;
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        User user = (User) session.getAttributes().get("user");
        Long pictureId = (Long) session.getAttributes().get("pictureId");
        boolean presenceRegistered = Boolean.TRUE.equals(
                session.getAttributes().get("wsPresenceRegistered"));
        try {
            if (user != null && pictureId != null && presenceRegistered) {
                handleExitEditMessage(null, session, user, pictureId);
            }
        } finally {
            if (pictureId != null) {
                Set<WebSocketSession> sessions = pictureSessions.get(pictureId);
                if (sessions != null) {
                    sessions.remove(session);
                    if (sessions.isEmpty()) {
                        pictureSessions.remove(pictureId, sessions);
                    }
                }
                if (presenceRegistered) {
                    stateStore.removePresence(pictureId, connectionToken(session));
                }
            }
            releaseConnection(session);
            if (user != null && pictureId != null && presenceRegistered
                    && !hasOnlineUser(pictureId, user.getId())) {
                try {
                    broadcastToPicture(pictureId, buildInfoMessage(user, "用户断开连接"), session);
                } catch (RuntimeException broadcastException) {
                    log.debug("广播 WebSocket 断开事件失败", broadcastException);
                }
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (message == null || message.getPayload() == null
                || message.getPayload().getBytes(StandardCharsets.UTF_8).length > Math.max(1, maxMessageBytes)) {
            sendError(session, "消息大小超过限制");
            return;
        }
        if (!touchHeartbeat(session)) {
            return;
        }
        PictureEditRequestMessage request;
        try {
            request = JSONUtil.toBean(message.getPayload(), PictureEditRequestMessage.class);
        } catch (RuntimeException e) {
            sendError(session, "消息不是合法 JSON");
            return;
        }
        if (request == null || PictureEditMessageTypeEnum.getEnumByValue(request.getType()) == null) {
            sendError(session, "未知的消息类型");
            return;
        }
        if (PictureEditMessageTypeEnum.EDIT_ACTION.getValue().equals(request.getType())
                && PictureEditActionEnum.getEnumByValue(request.getEditAction()) == null) {
            sendError(session, "未知的编辑动作");
            return;
        }
        User user = (User) session.getAttributes().get("user");
        Long pictureId = (Long) session.getAttributes().get("pictureId");
        if (PictureEditMessageTypeEnum.HEARTBEAT.getValue().equals(request.getType())) {
            handleHeartbeatMessage(session, user);
            return;
        }
        pictureEditEventProducer.publishEvent(request, session, user, pictureId);
    }

    public void handleHeartbeatMessage(WebSocketSession session, User user) throws IOException {
        if (!touchHeartbeat(session)) {
            return;
        }
        PictureEditResponseMessage response = new PictureEditResponseMessage();
        response.setType(PictureEditMessageTypeEnum.PONG.getValue());
        response.setMessage("pong");
        if (user != null) {
            response.setUser(userService.getUserVO(user));
        }
        sendLocal(session, response);
    }

    public void handleEditActionMessage(PictureEditRequestMessage request, WebSocketSession session,
                                        User user, Long pictureId) throws IOException {
        if (session == null || !session.isOpen()) {
            return;
        }
        EditLock lock = pictureEditingUsers.get(pictureId);
        PictureEditActionEnum action = PictureEditActionEnum.getEnumByValue(request.getEditAction());
        if (action == null) {
            sendError(session, "未知的编辑动作");
            return;
        }
        if (!isLockOwner(lock, session, user)) {
            sendError(session, "请先获取图片编辑锁");
            return;
        }
        if (!refreshEditLock(pictureId, lock)) {
            if (pictureEditingUsers.remove(pictureId, lock)) {
                stateStore.removeLock(pictureId, lock.ownerToken);
                PictureEditResponseMessage expired = buildInfoMessage(user, "编辑锁已失效");
                expired.setType(PictureEditMessageTypeEnum.EXIT_EDIT.getValue());
                broadcastToPicture(pictureId, expired, session);
            }
            sendError(session, "编辑锁已失效，请重新获取");
            return;
        }
        PictureEditResponseMessage response = buildInfoMessage(user,
                String.format("用户 %s 执行 %s 操作", user.getUserName(), action.getText()));
        response.setType(PictureEditMessageTypeEnum.EDIT_ACTION.getValue());
        response.setEditAction(request.getEditAction());
        broadcastToPicture(pictureId, response, session);
    }

    public void handleExitEditMessage(PictureEditRequestMessage request, WebSocketSession session,
                                      User user, Long pictureId) throws IOException {
        if (session == null) {
            return;
        }
        EditLock lock = pictureEditingUsers.get(pictureId);
        if (!isLockOwner(lock, session, user)) {
            return;
        }
        if (pictureEditingUsers.remove(pictureId, lock)) {
            editLockService.release(pictureId, lock.ownerToken);
            stateStore.removeLock(pictureId, lock.ownerToken);
            PictureEditResponseMessage response = buildInfoMessage(user,
                    String.format("用户 %s 退出编辑图片", user.getUserName()));
            response.setType(PictureEditMessageTypeEnum.EXIT_EDIT.getValue());
            broadcastToPicture(pictureId, response, session);
        }
    }

    public void handleEnterEditMessage(PictureEditRequestMessage request, WebSocketSession session,
                                       User user, Long pictureId) throws IOException {
        if (session == null || !session.isOpen()) {
            return;
        }
        String ownerToken = connectionToken(session);
        if (!editLockService.tryAcquire(pictureId, ownerToken)) {
            sendError(session, "当前图片正在被其他用户编辑");
            return;
        }
        EditLock newLock = new EditLock(user.getId(), ownerToken,
                user, System.currentTimeMillis() + lockTtl());
        EditLock oldLock = pictureEditingUsers.putIfAbsent(pictureId, newLock);
        if (oldLock != null && oldLock.expireAt <= System.currentTimeMillis()
                && pictureEditingUsers.remove(pictureId, oldLock)) {
            editLockService.release(pictureId, oldLock.ownerToken);
            stateStore.removeLock(pictureId, oldLock.ownerToken);
            oldLock = pictureEditingUsers.putIfAbsent(pictureId, newLock);
        }
        if (oldLock != null) {
            editLockService.release(pictureId, ownerToken);
            sendError(session, "当前图片正在被其他用户编辑");
            return;
        }
        long expiresAt = System.currentTimeMillis() + lockTtl();
        newLock.expireAt = expiresAt;
        if (!stateStore.saveLock(pictureId, ownerToken, userService.getUserVO(user), expiresAt)) {
            pictureEditingUsers.remove(pictureId, newLock);
            stateStore.removeLock(pictureId, ownerToken);
            editLockService.release(pictureId, ownerToken);
            sendError(session, "编辑状态暂时无法同步，请稍后重试");
            return;
        }
        PictureEditResponseMessage response = buildInfoMessage(user,
                String.format("用户 %s 开始编辑图片", user.getUserName()));
        response.setType(PictureEditMessageTypeEnum.ENTER_EDIT.getValue());
        broadcastToPicture(pictureId, response, null);
    }

    /** 定时清理断线连接和过期编辑锁。 */
    @Scheduled(fixedDelayString = "${websocket.heartbeat.cleanup-delay-ms:10000}")
    public void cleanupExpiredConnections() {
        long now = System.currentTimeMillis();
        for (Set<WebSocketSession> sessions : pictureSessions.values()) {
            for (WebSocketSession session : sessions) {
                Object lastValue = session.getAttributes().get("lastHeartbeat");
                long lastHeartbeat = lastValue instanceof Long ? (Long) lastValue : now;
                if (now - lastHeartbeat > Math.max(10000L, heartbeatTimeoutMs)) {
                    try {
                        session.close(CloseStatus.SESSION_NOT_RELIABLE);
                    } catch (IOException e) {
                        log.debug("关闭过期 WebSocket 连接失败", e);
                    }
                }
            }
        }
        for (Map.Entry<Long, EditLock> entry : pictureEditingUsers.entrySet()) {
            if (entry.getValue().expireAt <= now && pictureEditingUsers.remove(entry.getKey(), entry.getValue())) {
                editLockService.release(entry.getKey(), entry.getValue().ownerToken);
                stateStore.removeLock(entry.getKey(), entry.getValue().ownerToken);
                PictureEditResponseMessage response = buildInfoMessage(entry.getValue().user, "编辑锁已超时释放");
                response.setType(PictureEditMessageTypeEnum.EXIT_EDIT.getValue());
                broadcastToPicture(entry.getKey(), response, null);
            }
        }
        for (PictureEditStateStore.ExpiredLock expiredLock : stateStore.releaseExpiredLocks(now)) {
            PictureEditResponseMessage response = buildInfoMessage(
                    expiredLock.getUser(), "编辑锁已超时释放");
            response.setType(PictureEditMessageTypeEnum.EXIT_EDIT.getValue());
            broadcastToPicture(expiredLock.getPictureId(), response, null);
        }
    }

    public void broadcastLocal(Long pictureId, PictureEditResponseMessage message, String excludeSessionId) {
        Set<WebSocketSession> sessions = pictureSessions.get(pictureId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }
        TextMessage textMessage = new TextMessage(JSONUtil.toJsonStr(message));
        for (WebSocketSession session : sessions) {
            if (excludeSessionId != null && excludeSessionId.equals(connectionToken(session))) {
                continue;
            }
            if (!session.isOpen()) {
                sessions.remove(session);
                continue;
            }
            try {
                session.sendMessage(textMessage);
            } catch (IOException e) {
                log.debug("发送 WebSocket 广播失败，sessionId={}", session.getId(), e);
                try {
                    session.close(CloseStatus.SESSION_NOT_RELIABLE);
                } catch (IOException ignored) {
                    // 连接已经不可用，无需继续传播异常。
                }
            }
        }
    }

    private void broadcastToPicture(Long pictureId, PictureEditResponseMessage message,
                                    WebSocketSession excludeSession) {
        String excludeSessionId = excludeSession == null ? null : connectionToken(excludeSession);
        if (!redisBroadcaster.publish(pictureId, message, excludeSessionId)) {
            broadcastLocal(pictureId, message, excludeSessionId);
        }
    }

    private PictureEditResponseMessage buildInfoMessage(User user, String message) {
        PictureEditResponseMessage response = new PictureEditResponseMessage();
        response.setType(PictureEditMessageTypeEnum.INFO.getValue());
        response.setMessage(message);
        response.setUser(userService.getUserVO(user));
        return response;
    }

    private PictureEditResponseMessage buildInfoMessage(UserVO user, String message) {
        PictureEditResponseMessage response = new PictureEditResponseMessage();
        response.setType(PictureEditMessageTypeEnum.INFO.getValue());
        response.setMessage(message);
        response.setUser(user);
        return response;
    }

    private boolean isLockOwner(EditLock lock, WebSocketSession session, User user) {
        return lock != null && user != null && user.getId().equals(lock.userId)
                && lock.ownerToken.equals(connectionToken(session))
                && lock.expireAt > System.currentTimeMillis();
    }

    private boolean touchHeartbeat(WebSocketSession session) {
        long now = System.currentTimeMillis();
        session.getAttributes().put("lastHeartbeat", now);
        User user = (User) session.getAttributes().get("user");
        if (!connectionRegistry.heartbeat(user == null ? null : user.getId(), connectionToken(session))) {
            try {
                session.close(CloseStatus.SERVER_ERROR);
            } catch (IOException e) {
                log.debug("关闭无法续租的 WebSocket 连接失败", e);
            }
            return false;
        }
        Long pictureId = (Long) session.getAttributes().get("pictureId");
        if (pictureId != null) {
            stateStore.refreshPresence(pictureId, connectionToken(session),
                    (UserVO) session.getAttributes().get("wsUserVO"));
            EditLock lock = pictureEditingUsers.get(pictureId);
            if (lock != null && lock.ownerToken.equals(connectionToken(session))) {
                if (!refreshEditLock(pictureId, lock)) {
                    if (pictureEditingUsers.remove(pictureId, lock)) {
                        stateStore.removeLock(pictureId, lock.ownerToken);
                        PictureEditResponseMessage response = buildInfoMessage(
                                lock.user, "编辑锁已失效");
                        response.setType(PictureEditMessageTypeEnum.EXIT_EDIT.getValue());
                        broadcastToPicture(pictureId, response, session);
                    }
                }
            }
        }
        return true;
    }

    private boolean refreshEditLock(Long pictureId, EditLock lock) {
        long expiresAt = System.currentTimeMillis() + lockTtl();
        boolean stateRefreshed = stateStore.refreshLock(pictureId, lock.ownerToken, expiresAt);
        boolean lockRefreshed = stateRefreshed && editLockService.refresh(pictureId, lock.ownerToken);
        if (lockRefreshed) {
            lock.expireAt = expiresAt;
            return true;
        }
        editLockService.release(pictureId, lock.ownerToken);
        return false;
    }

    private long lockTtl() {
        return Math.max(10000L, editLockTtlMs);
    }

    private boolean hasOnlineUser(Long pictureId, Long userId) {
        Set<WebSocketSession> sessions = pictureSessions.get(pictureId);
        if (sessions != null) {
            for (WebSocketSession currentSession : sessions) {
                User currentUser = (User) currentSession.getAttributes().get("user");
                if (currentUser != null && userId.equals(currentUser.getId())) {
                    return true;
                }
            }
        }
        for (UserVO currentUser : stateStore.listPresence(pictureId)) {
            if (currentUser != null && userId.equals(currentUser.getId())) {
                return true;
            }
        }
        return false;
    }

    private void releaseConnection(WebSocketSession session) {
        User user = (User) session.getAttributes().get("user");
        connectionRegistry.release(user == null ? null : user.getId(), connectionToken(session));
    }

    private String connectionToken(WebSocketSession session) {
        Object token = session.getAttributes().get("wsConnectionId");
        return token == null ? session.getId() : String.valueOf(token);
    }

    private void sendError(WebSocketSession session, String message) throws IOException {
        PictureEditResponseMessage response = new PictureEditResponseMessage();
        response.setType(PictureEditMessageTypeEnum.ERROR.getValue());
        response.setMessage(message);
        User user = (User) session.getAttributes().get("user");
        if (user != null) {
            response.setUser(userService.getUserVO(user));
        }
        sendLocal(session, response);
    }

    private void sendLocal(WebSocketSession session, PictureEditResponseMessage response) throws IOException {
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(JSONUtil.toJsonStr(response)));
        }
    }

    private static class EditLock {
        private final Long userId;
        private final String ownerToken;
        private final User user;
        private volatile long expireAt;

        private EditLock(Long userId, String ownerToken, User user, long expireAt) {
            this.userId = userId;
            this.ownerToken = ownerToken;
            this.user = user;
            this.expireAt = expireAt;
        }
    }
}
