package com.sdfkl.zhepicturebackend.manager.websocket;

import cn.hutool.core.util.ObjUtil;
import cn.hutool.core.util.StrUtil;
import com.sdfkl.zhepicturebackend.manager.auth.CurrentUserService;
import com.sdfkl.zhepicturebackend.manager.auth.SpaceUserAuthManager;
import com.sdfkl.zhepicturebackend.manager.auth.model.SpaceUserPermissionConstant;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.enums.SpaceTypeEnum;
import com.sdfkl.zhepicturebackend.service.PictureService;
import com.sdfkl.zhepicturebackend.service.SpaceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Component
public class WsHandshakeInterceptor implements HandshakeInterceptor {
    @Resource
    private CurrentUserService currentUserService;

    @Resource
    private PictureService pictureService;

    @Resource
    private SpaceService spaceService;

    @Resource
    private SpaceUserAuthManager spaceUserAuthManager;

    @Resource
    private WebSocketConnectionRegistry connectionRegistry;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest httpServletRequest = ((ServletServerHttpRequest) request).getServletRequest();
            // 从请求中获取参数
            String pictureId = httpServletRequest.getParameter("pictureId");
            if (StrUtil.isBlank(pictureId)) {
                log.error("缺少图片参数，拒绝握手");
                return false;
            }
            // 获取当前登录用户
            User loginUser = currentUserService.getRequiredUser();
            if (ObjUtil.isEmpty(loginUser)) {
                log.error("用户未登录，拒绝握手");
                return false;
            }
            // 校验用户是否有编辑当前图片的权限
            Picture picture = pictureService.getById(pictureId);
            if (ObjUtil.isEmpty(picture)) {
                log.error("图片不存在，拒绝握手");
                return false;
            }
            Long spaceId = picture.getSpaceId();
            Space space = null;
            if (spaceId != null) {
                space = spaceService.getById(spaceId);
                if (ObjUtil.isEmpty(space)) {
                    log.error("图片所在空间不存在，拒绝握手");
                    return false;
                }
                if (!Objects.equals(space.getSpaceType(), SpaceTypeEnum.TEAM.getValue())) {
                    log.error("图片所在空间不是团队空间，拒绝握手");
                    return false;
                }
            }
            List<String> permissionList = spaceUserAuthManager.getPermissionList(space, loginUser);
            if (!permissionList.contains(SpaceUserPermissionConstant.PICTURE_EDIT)) {
                log.error("用户没有修改图片权限，拒绝握手");
                return false;
            }
            String connectionId = UUID.randomUUID().toString();
            if (!connectionRegistry.tryAcquire(loginUser.getId(), connectionId)) {
                log.warn("用户 WebSocket 连接数超过限制，userId={}", loginUser.getId());
                return false;
            }
            httpServletRequest.setAttribute("userId", loginUser.getId());
            httpServletRequest.setAttribute("wsConnectionId", connectionId);
            // 设置用户登录信息等属性到 WebSocket 会话中
            attributes.put("user", loginUser);
            attributes.put("userId", loginUser.getId());
            attributes.put("pictureId", Long.valueOf(pictureId));
            attributes.put("wsConnectionId", connectionId);
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        if (exception != null && request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
            Object userId = servletRequest.getAttribute("userId");
            Object connectionId = servletRequest.getAttribute("wsConnectionId");
            if (userId instanceof Long && connectionId instanceof String) {
                connectionRegistry.release((Long) userId, (String) connectionId);
            }
        }
    }
}
