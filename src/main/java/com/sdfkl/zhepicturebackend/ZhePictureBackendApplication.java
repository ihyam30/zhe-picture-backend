package com.sdfkl.zhepicturebackend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@MapperScan("com.sdfkl.zhepicturebackend.mapper")
@EnableAspectJAutoProxy(exposeProxy = true)
public class ZhePictureBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZhePictureBackendApplication.class, args);
    }

}
