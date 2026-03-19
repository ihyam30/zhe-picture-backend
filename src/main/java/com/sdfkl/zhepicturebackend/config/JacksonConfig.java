package com.sdfkl.zhepicturebackend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.springframework.boot.jackson.JsonComponent;
import org.springframework.context.annotation.Bean;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
/**
 * Jackson全局转化long类型为String，解决jackson序列化时long类型缺失精度问题
 */
@JsonComponent
public class JacksonConfig {
   @Bean
   public ObjectMapper jacksonObjectMapper(Jackson2ObjectMapperBuilder builder) {
       ObjectMapper objectMapper = builder.createXmlMapper(false).build();
       SimpleModule simpleModule = new SimpleModule();
       simpleModule.addSerializer(Long.class, ToStringSerializer.instance);
       simpleModule.addSerializer(Long.TYPE, ToStringSerializer.instance);
       objectMapper.registerModule(simpleModule);
       return objectMapper;
   }
}