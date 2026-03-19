package com.sdfkl.zhepicturebackend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.sdfkl.zhepicturebackend.mapper")
public class ZhePictureBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZhePictureBackendApplication.class, args);
    }

}
