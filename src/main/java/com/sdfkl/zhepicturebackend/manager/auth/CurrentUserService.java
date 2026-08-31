package com.sdfkl.zhepicturebackend.manager.auth;

import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.mapper.UserMapper;
import com.sdfkl.zhepicturebackend.model.entity.User;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * Unified access to the authenticated user.
 *
 * <p>The token contains only the user id. The current user is loaded from the
 * database on demand so role changes and account deletion take effect without
 * waiting for a serialized user object in a session to expire.</p>
 */
@Component
public class CurrentUserService {

    @Resource
    private UserMapper userMapper;

    /**
     * Get the current user or throw the standard not-login error.
     */
    public User getRequiredUser() {
        if (!StpKit.USER.isLogin()) {
            throw new BusinessException(ErrorCode.NOT_LOGIN_ERROR);
        }
        User user = getUserByLoginId(StpKit.USER.getLoginId());
        if (user == null) {
            // A deleted user must not keep a usable token.
            StpKit.USER.logout();
            throw new BusinessException(ErrorCode.NOT_LOGIN_ERROR);
        }
        return user;
    }

    /**
     * Load a user for Sa-Token permission resolution without reading session data.
     */
    public User getUserByLoginId(Object loginId) {
        Long userId = parseUserId(loginId);
        return userId == null ? null : userMapper.selectById(userId);
    }

    /**
     * Invalidate the current Sa-Token login and its browser cookie.
     */
    public void logout() {
        StpKit.USER.logout();
    }

    private Long parseUserId(Object loginId) {
        if (loginId == null) {
            return null;
        }
        try {
            return Long.valueOf(String.valueOf(loginId));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
