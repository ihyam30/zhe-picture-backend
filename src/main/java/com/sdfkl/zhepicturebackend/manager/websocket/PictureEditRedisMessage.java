package com.sdfkl.zhepicturebackend.manager.websocket;

import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditResponseMessage;
import lombok.Data;

/**
 * WebSocket 跨实例广播消息。
 */
@Data
public class PictureEditRedisMessage {
    private Long pictureId;
    private String excludeSessionId;
    private PictureEditResponseMessage message;
}
