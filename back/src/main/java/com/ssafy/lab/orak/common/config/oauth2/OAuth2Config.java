package com.ssafy.lab.orak.common.config.oauth2;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationResponseType;

@Configuration
public class OAuth2Config {

    @Bean
    public ObjectMapper oauth2ObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // OAuth2AuthorizationRequest 직렬화/역직렬화를 위한 설정
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        mapper.configure(DeserializationFeature.READ_ENUMS_USING_TO_STRING, true);
        mapper.configure(SerializationFeature.WRITE_ENUMS_USING_TO_STRING, true);

        // OAuth2AuthorizationResponseType enum 처리를 위한 모듈
        SimpleModule module = new SimpleModule();
        module.addSerializer(OAuth2AuthorizationResponseType.class, new OAuth2AuthorizationResponseTypeSerializer());
        module.addDeserializer(OAuth2AuthorizationResponseType.class, new OAuth2AuthorizationResponseTypeDeserializer());
        mapper.registerModule(module);

        return mapper;
    }
}