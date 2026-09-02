package com.sdfkl.zhepicturebackend.controller;

import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.Status;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Locale;
import java.util.Map;

/**
 * 面向容器编排的轻量探针。应用已有 /api 上下文，因此最终地址为 /api/livez 和 /api/readyz。
 */
@RestController
public class HealthProbeController {

    private final HealthEndpoint healthEndpoint;

    public HealthProbeController(HealthEndpoint healthEndpoint) {
        this.healthEndpoint = healthEndpoint;
    }

    @GetMapping("/livez")
    public ResponseEntity<Map<String, String>> livez() {
        return probe("liveness");
    }

    @GetMapping("/readyz")
    public ResponseEntity<Map<String, String>> readyz() {
        return probe("readiness");
    }

    private ResponseEntity<Map<String, String>> probe(String group) {
        HealthComponent component = healthEndpoint.healthForPath(group);
        Status status = component == null ? Status.DOWN : component.getStatus();
        Map<String, String> body = Collections.singletonMap(
                "status", status.getCode().toLowerCase(Locale.ROOT));
        HttpStatus httpStatus = Status.UP.equals(status)
                ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(httpStatus).body(body);
    }
}
