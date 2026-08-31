package com.sdfkl.zhepicturebackend.manager.auth;

import com.sdfkl.zhepicturebackend.manager.auth.model.SpaceUserPermissionConstant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StpInterfaceImplTest {

    @AfterEach
    void clearRequestContext() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void shouldAllowPublicPictureUploadWithoutSpaceId() {
        StpInterfaceImpl interfaceImpl = new StpInterfaceImpl();
        SpaceUserAuthManager authManager = mock(SpaceUserAuthManager.class);
        when(authManager.getPermissionsByRole(anyString())).thenReturn(Collections.emptyList());
        ReflectionTestUtils.setField(interfaceImpl, "contextPath", "/api");
        ReflectionTestUtils.setField(interfaceImpl, "spaceUserAuthManager", authManager);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/picture/upload");
        request.setContextPath("/api");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        List<String> permissions = interfaceImpl.getPermissionList(1L, StpKit.USER_TYPE);

        assertTrue(permissions.contains(SpaceUserPermissionConstant.PICTURE_UPLOAD));
    }
}
