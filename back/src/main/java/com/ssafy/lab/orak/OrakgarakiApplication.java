package com.ssafy.lab.orak;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.kafka.annotation.EnableKafka;

@EnableJpaAuditing
@SpringBootApplication
@EnableKafka
public class OrakgarakiApplication {

    public static void main(String[] args) {
        System.out.println("==== 애플리케이션 시작 ====");
        SpringApplication.run(OrakgarakiApplication.class, args);
        System.out.println("==== 애플리케이션 시작 완료 ====");
    }

}
