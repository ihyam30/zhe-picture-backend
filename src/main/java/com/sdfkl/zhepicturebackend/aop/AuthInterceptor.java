package com.sdfkl.zhepicturebackend.aop;

import com.sdfkl.zhepicturebackend.annotation.AuthCheck;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.manager.auth.CurrentUserService;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.enums.UserRoleEnum;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;

@Aspect
@Component
public class AuthInterceptor {
    @Resource
    private CurrentUserService currentUserService;

    /**
     * 权限拦截校验
     *
     * @param jp        切点
     * @param authCheck 注解
     * @return 是否放行
     * @throws Throwable 异常
     */
    @Around("@annotation(authCheck)")
    public Object doInterceptor(ProceedingJoinPoint jp, AuthCheck authCheck) throws Throwable {
        String mustRole = authCheck.mustRole();
        // 获取当前登录用户
        User loginUser = currentUserService.getRequiredUser();
        UserRoleEnum mustRoleEnum = UserRoleEnum.getEnumByValue(mustRole);
        // 如果不需要权限，放行
        if (mustRoleEnum == null) {
            return jp.proceed();
        }
        // 必须有权限
        UserRoleEnum userRoleEnum = UserRoleEnum.getEnumByValue(loginUser.getUserRole());
        if (userRoleEnum == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN_ERROR);
        }
        // 要求必须由管理员权限
        if (UserRoleEnum.ADMIN.equals(mustRoleEnum) && !UserRoleEnum.ADMIN.equals(userRoleEnum)) {
            throw new BusinessException(ErrorCode.FORBIDDEN_ERROR);
        }
        // 通过权限校验，放行
        return jp.proceed();
    }
}
