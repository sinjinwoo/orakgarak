package com.ssafy.lab.orak.webhook.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class WebhookConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}