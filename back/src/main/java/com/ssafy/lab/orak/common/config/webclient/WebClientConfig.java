package com.ssafy.lab.orak.common.config.webclient;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

@Configuration
public class WebClientConfig {

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    @Bean("pythonWebClient")
    public WebClient pythonWebClient() {
        // 10MB 버퍼 크기 설정 (Base64 이미지 데이터를 위해)
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();

        return WebClient.builder()
                .baseUrl(pythonServiceUrl)
                .exchangeStrategies(strategies)
                .build();
    }
}