package com.sdfkl.zhepicturebackend.aop;

import com.sdfkl.zhepicturebackend.annotation.AuthCheck;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.manager.auth.CurrentUserService;
import com.sdfkl.zhepicturebackend.model.entity.User;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthInterceptorTest {

    private AuthInterceptor authInterceptor;
    private CurrentUserService currentUserService;

    @BeforeEach
    void setUp() {
        authInterceptor = new AuthInterceptor();
        currentUserService = mock(CurrentUserService.class);
        ReflectionTestUtils.setField(authInterceptor, "currentUserService", currentUserService);
    }

    @Test
    void shouldRejectNonAdminForAdminEndpoint() {
        User user = new User();
        user.setUserRole("user");
        when(currentUserService.getRequiredUser()).thenReturn(user);

        AuthCheck authCheck = mock(AuthCheck.class);
        when(authCheck.mustRole()).thenReturn("admin");

        assertThrows(BusinessException.class, () ->
                authInterceptor.doInterceptor(mock(ProceedingJoinPoint.class), authCheck));
    }

    @Test
    void shouldProceedWhenNoRoleIsRequired() throws Throwable {
        User user = new User();
        user.setUserRole("user");
        when(currentUserService.getRequiredUser()).thenReturn(user);

        AuthCheck authCheck = mock(AuthCheck.class);
        when(authCheck.mustRole()).thenReturn("");

        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
        when(joinPoint.proceed()).thenReturn("ok");

        assertEquals("ok", authInterceptor.doInterceptor(joinPoint, authCheck));
    }
}
