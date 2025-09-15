val queryDslVersion = "5.1.0"

plugins {
    java
    id("org.springframework.boot") version "3.5.5"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.ssafy"
version = "0.0.1-SNAPSHOT"
description = "OrakgarakiApplication"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
    all {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
        exclude(group = "ch.qos.logback", module = "logback-classic")
        exclude(group = "org.apache.logging.log4j", module = "log4j-to-slf4j")
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Core
    implementation("org.springframework.boot:spring-boot-starter-data-jpa") {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    }
    implementation("org.springframework.boot:spring-boot-starter-web") {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    }
    implementation("org.springframework.boot:spring-boot-starter-log4j2")

    // Spring Security & OAuth2
    implementation("org.springframework.boot:spring-boot-starter-security") {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    }
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client") {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    }

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.12.7")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.7")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.7")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")

    // MapStruct
    implementation("org.mapstruct:mapstruct:1.6.3")
    annotationProcessor("org.mapstruct:mapstruct-processor:1.6.3")

    // Database
    runtimeOnly("com.mysql:mysql-connector-j")
    runtimeOnly("com.h2database:h2")

    // Redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.session:spring-session-data-redis")

    // QueryDSL
    implementation("com.querydsl:querydsl-jpa:$queryDslVersion:jakarta")
    implementation("com.querydsl:querydsl-core:$queryDslVersion")
    annotationProcessor("com.querydsl:querydsl-apt:$queryDslVersion:jakarta")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")

    // AWS S3 & EventBridge
    implementation("io.awspring.cloud:spring-cloud-aws-starter:3.4.0")
    implementation("software.amazon.awssdk:s3:2.32.9")
    implementation("software.amazon.awssdk:eventbridge:2.32.9")

    // Utilities
    implementation("net.coobird:thumbnailator:0.4.20")
    implementation("com.google.code.gson:gson:2.13.1")

    // Audio Processing
    implementation("com.github.kokorin.jaffree:jaffree:2023.09.10")

    // Kafka 추가
    implementation("org.springframework.kafka:spring-kafka")
    testImplementation("org.springframework.kafka:spring-kafka-test")


    // API Documentation
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.9")

    // Development Tools
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.restdocs:spring-restdocs-mockmvc")
    testImplementation("org.springframework.security:spring-security-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile> {
    options.compilerArgs.addAll(listOf(
        "-Amapstruct.suppressGeneratorTimestamp=true",
        "-Amapstruct.defaultComponentModel=spring",
        "-Amapstruct.unmappedTargetPolicy=IGNORE"
    ))
}

tasks.named<Test>("test") {
    useJUnitPlatform()
    systemProperty("spring.profiles.active", "test")
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = false
    }
    include("**/*Test.class", "**/*Tests.class")
    exclude("**/*IntegrationTest.class", "**/*IT.class")
}

tasks.register<Test>("integrationTest") {
    useJUnitPlatform()
    systemProperty("spring.profiles.active", "local")
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = true
    }
    include("**/*IntegrationTest.class", "**/*IT.class")
}

tasks.register("prodBuild") {
    group = "build"
    description = "Production build without tests"
    dependsOn("clean", "bootJar")
}

sourceSets {
    named("main") {
        java.srcDirs("src/main/java", "build/generated/sources/annotationProcessor/java/main")
    }
}

tasks.named("clean") {
    doLast {
        file("build/generated/sources/annotationProcessor/java/main").deleteRecursively()
    }
}