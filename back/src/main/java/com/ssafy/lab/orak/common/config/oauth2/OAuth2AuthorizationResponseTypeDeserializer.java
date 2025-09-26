package com.ssafy.lab.orak.common.config.oauth2;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationResponseType;

import java.io.IOException;

public class OAuth2AuthorizationResponseTypeDeserializer extends JsonDeserializer<OAuth2AuthorizationResponseType> {

    @Override
    public OAuth2AuthorizationResponseType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getValueAsString();
        return new OAuth2AuthorizationResponseType(value);
    }
}