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

configurations.compileOnly {
    extendsFrom(configurations.annotationProcessor.get())
}

configurations.all {
    exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    exclude(group = "ch.qos.logback", module = "logback-classic")
    exclude(group = "org.apache.logging.log4j", module = "log4j-to-slf4j")
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring boot-core
    implementation("org.springframework.boot:spring-boot-starter-data-jpa") {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    }
    implementation("org.springframework.boot:spring-boot-starter-web") {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    }

    // Log4j2 setup
    implementation("org.springframework.boot:spring-boot-starter-log4j2")
    //spring security
    implementation("org.springframework.boot:spring-boot-starter-security") {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    }
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client") {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    }
    implementation("io.jsonwebtoken:jjwt-api:0.12.7")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.7")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.7")
    //lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")
    // mapping
    implementation("org.mapstruct:mapstruct:1.6.3")
    annotationProcessor("org.mapstruct:mapstruct-processor:1.6.3")
    // 운영 DB
    runtimeOnly("com.mysql:mysql-connector-j")
    // 개발/테스트용 DB
    runtimeOnly("com.h2database:h2")
    testRuntimeOnly("com.h2database:h2")
    testRuntimeOnly("com.mysql:mysql-connector-j")

    // AWS S3
    implementation("io.awspring.cloud:spring-cloud-aws-starter:3.4.0")
    implementation("software.amazon.awssdk:s3:2.32.9")
    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.restdocs:spring-restdocs-mockmvc")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // 썸네일 라이브러리
    implementation("net.coobird:thumbnailator:0.4.20")

    // QueryDSL
    implementation("com.querydsl:querydsl-jpa:$queryDslVersion:jakarta")
    implementation("com.querydsl:querydsl-core:$queryDslVersion")
    annotationProcessor("com.querydsl:querydsl-apt:$queryDslVersion:jakarta")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")

    // Swagger (OpenAPI)
    // API Documentation(Swagger)
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.9")
    //JSON
    implementation("com.google.code.gson:gson:2.13.1")

    // Redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.session:spring-session-data-redis")


    // 테스트용
    testImplementation("org.springframework.security:spring-security-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

}

// MapStruct 컴파일 옵션
tasks.withType<JavaCompile> {
    options.compilerArgs.add("-Amapstruct.suppressGeneratorTimestamp=true")
    options.compilerArgs.add("-Amapstruct.defaultComponentModel=spring")
    options.compilerArgs.add("-Amapstruct.unmappedTargetPolicy=IGNORE")
}

// 기본 테스트 태스크 (MySQL 테스트 제외)
tasks.named<Test>("test") {
    useJUnitPlatform()

    systemProperty("spring.profiles.active", "test")

    // 테스트 결과 로깅
    testLogging {
        events("passed", "skipped", "failed")
    }

    // 테스트 파일 패턴 지정
    include("**/*Test.class", "**/*Tests.class", "**/*IT.class")
}

// QueryDSL Q클래스 생성을 위한 소스 경로 설정
sourceSets {
    named("main") {
        java.srcDirs("src/main/java", "build/generated/sources/annotationProcessor/java/main")
    }
    named("test") {
        java.srcDirs("src/test/java")
        resources.srcDirs("src/test/resources")
    }
}

// Clean 시 QueryDSL 생성 파일도 삭제
tasks.named("clean") {
    doLast {
        file("build/generated/sources/annotationProcessor/java/main").deleteRecursively()
    }
}