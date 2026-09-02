package com.sdfkl.zhepicturebackend.manager.websocket.disruptor;

import cn.hutool.json.JSONUtil;
import com.lmax.disruptor.WorkHandler;
import com.sdfkl.zhepicturebackend.manager.websocket.PictureEditHandler;
import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditMessageTypeEnum;
import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditRequestMessage;
import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditResponseMessage;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import javax.annotation.Resource;


/**
 * 图片编辑事件处理器（消费者）
 */
@Component
@Slf4j
public class PictureEditEventWorkHandler implements WorkHandler<PictureEditEvent> {
    @Resource
    private PictureEditHandler pictureEditHandler;

    @Resource
    private UserService userService;

    @Override
    public void onEvent(PictureEditEvent pictureEditEvent) throws Exception {
        if (pictureEditEvent == null || pictureEditEvent.getSession() == null
                || !pictureEditEvent.getSession().isOpen()
                || pictureEditEvent.getUser() == null
                || pictureEditEvent.getPictureId() == null
                || pictureEditEvent.getPictureEditRequestMessage() == null) {
            return;
        }
        PictureEditRequestMessage pictureEditRequestMessage = pictureEditEvent.getPictureEditRequestMessage();
        WebSocketSession session = pictureEditEvent.getSession();
        User user = pictureEditEvent.getUser();
        Long pictureId = pictureEditEvent.getPictureId();
        String type = pictureEditRequestMessage.getType();
        PictureEditMessageTypeEnum pictureEditMessageTypeEnum = PictureEditMessageTypeEnum.getEnumByValue(type);
        if (pictureEditMessageTypeEnum == null) {
            PictureEditResponseMessage errorMessage = new PictureEditResponseMessage();
            errorMessage.setType(PictureEditMessageTypeEnum.ERROR.getValue());
            errorMessage.setMessage("未知的消息类型");
            errorMessage.setUser(userService.getUserVO(user));
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(JSONUtil.toJsonStr(errorMessage)));
            }
            return;
        }
        // 根据消息类型处理消息
        switch (pictureEditMessageTypeEnum) {
            case ENTER_EDIT:
                pictureEditHandler.handleEnterEditMessage(pictureEditRequestMessage, session, user, pictureId);
                break;
            case EXIT_EDIT:
                pictureEditHandler.handleExitEditMessage(pictureEditRequestMessage, session, user, pictureId);
                break;
            case EDIT_ACTION:
                pictureEditHandler.handleEditActionMessage(pictureEditRequestMessage, session, user, pictureId);
                break;
            case HEARTBEAT:
                pictureEditHandler.handleHeartbeatMessage(session, user);
                break;
            default:
                // 其他消息类型，返回错误提示
                PictureEditResponseMessage pictureEditResponseMessage = new PictureEditResponseMessage();
                pictureEditResponseMessage.setType(PictureEditMessageTypeEnum.ERROR.getValue());
                pictureEditResponseMessage.setMessage("未知的消息类型");
                pictureEditResponseMessage.setUser(userService.getUserVO(user));
                session.sendMessage(new TextMessage(JSONUtil.toJsonStr(pictureEditResponseMessage)));
                break;
        }
    }
}
