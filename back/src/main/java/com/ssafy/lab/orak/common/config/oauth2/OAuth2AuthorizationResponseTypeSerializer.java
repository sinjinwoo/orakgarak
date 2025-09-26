package com.ssafy.lab.orak.common.config.oauth2;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationResponseType;

import java.io.IOException;

public class OAuth2AuthorizationResponseTypeSerializer extends JsonSerializer<OAuth2AuthorizationResponseType> {

    @Override
    public void serialize(OAuth2AuthorizationResponseType value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        gen.writeString(value.getValue());
    }
}