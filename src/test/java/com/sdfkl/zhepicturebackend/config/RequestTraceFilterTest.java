package com.sdfkl.zhepicturebackend.config;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RequestTraceFilterTest {

    @Test
    void shouldPropagateSafeRequestAndTraceIds() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestTraceFilter.REQUEST_ID_HEADER, "request-123");
        request.addHeader(RequestTraceFilter.TRACE_ID_HEADER, "trace-456");
        MockHttpServletResponse response = new MockHttpServletResponse();

        new RequestTraceFilter().doFilter(request, response, (FilterChain) (req, res) -> {
            assertEquals("request-123", MDC.get(RequestTraceFilter.REQUEST_ID_MDC_KEY));
            assertEquals("trace-456", MDC.get(RequestTraceFilter.TRACE_ID_MDC_KEY));
        });

        assertEquals("request-123", response.getHeader(RequestTraceFilter.REQUEST_ID_HEADER));
        assertEquals("trace-456", response.getHeader(RequestTraceFilter.TRACE_ID_HEADER));
        assertNull(MDC.get(RequestTraceFilter.REQUEST_ID_MDC_KEY));
    }

    @Test
    void shouldReplaceUnsafeIncomingIdAndClearMdcAfterRequest() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestTraceFilter.REQUEST_ID_HEADER, "unsafe id");
        MockHttpServletResponse response = new MockHttpServletResponse();

        new RequestTraceFilter().doFilter(request, response, (req, res) -> {
            assertNotEquals("unsafe id", MDC.get(RequestTraceFilter.REQUEST_ID_MDC_KEY));
            assertEquals(MDC.get(RequestTraceFilter.REQUEST_ID_MDC_KEY),
                    MDC.get(RequestTraceFilter.TRACE_ID_MDC_KEY));
        });

        assertNotEquals("unsafe id", response.getHeader(RequestTraceFilter.REQUEST_ID_HEADER));
        assertNull(MDC.get(RequestTraceFilter.REQUEST_ID_MDC_KEY));
        assertNull(MDC.get(RequestTraceFilter.TRACE_ID_MDC_KEY));
    }
}
