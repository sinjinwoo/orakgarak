package com.ssafy.lab.orak.webhook.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class AlertmanagerWebhookRequest {
    private String receiver;
    private String status;
    private List<Alert> alerts;
    private Map<String, String> groupLabels;
    private Map<String, String> commonLabels;
    private Map<String, String> commonAnnotations;
    private String externalURL;
    private String version;
    private String groupKey;
    private Integer truncatedAlerts;

    @Data
    public static class Alert {
        private String status;
        private Map<String, String> labels;
        private Map<String, String> annotations;
        private LocalDateTime startsAt;
        private LocalDateTime endsAt;
        private String generatorURL;
        private String fingerprint;
        private Object value;
    }
}