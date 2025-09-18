package com.ssafy.lab.orak.common.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "actuator")
public record ActuatorProperties(
        String user,
        String password,
        String roleName
) {
}