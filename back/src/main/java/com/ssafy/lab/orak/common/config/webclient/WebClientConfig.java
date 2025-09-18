package com.ssafy.lab.orak.common.config.webclient;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    @Bean("pythonWebClient")
    public WebClient pythonWebClient() {
        return WebClient.builder()
                .baseUrl(pythonServiceUrl)
                .build();
    }
}