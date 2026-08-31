package com.sdfkl.zhepicturebackend.manager.auth;

import cn.dev33.satoken.stp.StpLogic;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.stereotype.Component;

/**
 * StpLogic 门面类，管理项目中所有的 StpLogic 账号体系
 * 添加 @Component 注解的目的是让认证门面参与 Spring 组件扫描
 */
@Component
public class StpKit {

    public static final String USER_TYPE = "user";

    /**
     * 默认原生会话对象，项目中目前没使用到
     */
    public static final StpLogic DEFAULT = StpUtil.stpLogic;

    /**
     * User session object. Space membership is handled as resource authorization,
     * not as a second login session.
     */
    public static final StpLogic USER = new StpLogic(USER_TYPE);
}
