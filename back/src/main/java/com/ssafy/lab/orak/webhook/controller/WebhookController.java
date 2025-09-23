package com.ssafy.lab.orak.webhook.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.webhook.dto.AlertmanagerWebhookRequest;
import com.ssafy.lab.orak.webhook.dto.MattermostWebhookRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final RestTemplate restTemplate;

    @Value("${mattermost.webhook.url:}")
    private String mattermostWebhookUrl;

    @PostMapping(value = "/alertmanager", consumes = "application/json;charset=UTF-8", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> handleAlertmanagerWebhook(@RequestBody AlertmanagerWebhookRequest request) {
        log.info("Alertmanager 웹훅 수신 - 알림 개수: {}",
                request.getAlerts() != null ? request.getAlerts().size() : 0);

        try {
            MattermostWebhookRequest mattermostRequest = convertToMattermostFormat(request);
            sendToMattermost(mattermostRequest);

            log.info("Mattermost 알림 전송 완료");
            return ResponseEntity.ok("알림이 Mattermost로 전달되었습니다");

        } catch (Exception e) {
            log.error("Mattermost 알림 전송 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("알림 전송에 실패했습니다");
        }
    }

    private void sendToMattermost(MattermostWebhookRequest request) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Accept-Charset", "UTF-8");

        ObjectMapper objectMapper = new ObjectMapper();
        String jsonPayload = objectMapper.writeValueAsString(request);

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("payload", jsonPayload);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(formData, headers);
        restTemplate.postForEntity(mattermostWebhookUrl, entity, String.class);
    }

    private MattermostWebhookRequest convertToMattermostFormat(AlertmanagerWebhookRequest request) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Seoul"));
        List<MattermostWebhookRequest.Attachment> attachments = new ArrayList<>();

        String username = "🤖 오락가락 모니터링 시스템";
        String iconEmoji = ":robot_face:";
        String channel = "c103alertmanager";

        if (request.getAlerts() != null && !request.getAlerts().isEmpty()) {
            AlertmanagerWebhookRequest.Alert firstAlert = request.getAlerts().get(0);
            String severity = firstAlert.getLabels() != null ? firstAlert.getLabels().get("severity") : "unknown";
            String status = firstAlert.getStatus();

            if ("critical".equals(severity)) {
                username = "🚨🔥 CRITICAL ALERT SYSTEM 🔥🚨";
                iconEmoji = ":rotating_light:";
                channel = "c103alertmanager";
            } else if ("warning".equals(severity)) {
                username = "⚠️🟡 WARNING MONITOR 🟡⚠️";
                iconEmoji = ":warning:";
                channel = "c103alertmanager";
            } else if ("resolved".equals(status)) {
                username = "✅🎉 PROBLEM SOLVED 🎉✅";
                iconEmoji = ":white_check_mark:";
                channel = "c103alertmanager";
            } else {
                username = "ℹ️📊 INFO SYSTEM 📊ℹ️";
                iconEmoji = ":information_source:";
                channel = "c103alertmanager";
            }
        }

        if (request.getAlerts() == null) {
            return MattermostWebhookRequest.builder()
                    .text("알림 정보가 없습니다.")
                    .username(username)
                    .iconEmoji(iconEmoji)
                    .channel(channel)
                    .build();
        }

        for (AlertmanagerWebhookRequest.Alert alert : request.getAlerts()) {
            String status = "firing".equals(alert.getStatus()) ? "🔥 발생" : "✅ 해결됨";
            String summary = alert.getAnnotations() != null ? alert.getAnnotations().get("summary") : "알 수 없는 알림";
            String description = alert.getAnnotations() != null ? alert.getAnnotations().get("description") : "설명 없음";
            String severity = alert.getLabels() != null ? alert.getLabels().get("severity") : "unknown";
            String instance = alert.getLabels() != null ? alert.getLabels().get("instance") : "unknown";
            String timeStr = alert.getStartsAt() != null ? alert.getStartsAt().format(formatter) : "시간 정보 없음";

            String alertColor;
            String alertTitle;
            String alertText;

            if ("critical".equals(severity)) {
                alertColor = "danger";  // 빨간색
                alertTitle = "🚨 CRITICAL ALERT";
                alertText = String.format(
                    "#### 알림\n" +
                    "```\n%s\n```\n\n" +
                    "#### 상세\n" +
                    "```\n%s\n```\n\n" +
                    "#### 인스턴스\n" +
                    "```\n%s\n```\n\n" +
                    "#### 시간\n" +
                    "```\n%s\n```\n\n" +
                    "#### 상태\n" +
                    "```\n%s\n```\n\n" +
                    "@channel **즉시 확인 필요**",
                    summary, description, instance, timeStr, status
                );
            } else if ("warning".equals(severity)) {
                alertColor = "warning";  // 노란색
                alertTitle = "⚠️ WARNING";
                alertText = String.format(
                    "#### 알림\n" +
                    "```\n%s\n```\n\n" +
                    "#### 상세\n" +
                    "```\n%s\n```\n\n" +
                    "#### 인스턴스\n" +
                    "```\n%s\n```\n\n" +
                    "#### 시간\n" +
                    "```\n%s\n```\n\n" +
                    "#### 상태\n" +
                    "```\n%s\n```",
                    summary, description, instance, timeStr, status
                );
            } else if ("resolved".equals(alert.getStatus())) {
                alertColor = "good";  // 초록색
                alertTitle = "✅ RESOLVED";
                alertText = String.format(
                    "#### 해결된 문제\n" +
                    "```\n%s\n```\n\n" +
                    "#### 상세\n" +
                    "```\n%s\n```\n\n" +
                    "#### 인스턴스\n" +
                    "```\n%s\n```\n\n" +
                    "#### 해결 시간\n" +
                    "```\n%s\n```",
                    summary, description, instance, timeStr
                );
            } else {
                alertColor = "#3AA3E3";  // 파란색
                alertTitle = "ℹ️ INFO";
                alertText = String.format(
                    "#### 내용\n" +
                    "```\n%s\n```\n\n" +
                    "#### 상세\n" +
                    "```\n%s\n```\n\n" +
                    "#### 인스턴스\n" +
                    "```\n%s\n```\n\n" +
                    "#### 시간\n" +
                    "```\n%s\n```",
                    summary, description, instance, timeStr
                );
            }

            // Attachment로 메시지 추가
            MattermostWebhookRequest.Attachment attachment = MattermostWebhookRequest.Attachment.builder()
                    .color(alertColor)
                    .title(alertTitle)
                    .text(alertText)
                    .build();

            attachments.add(attachment);
        }

        return MattermostWebhookRequest.builder()
            .text("알림이 도착했습니다")
            .username(username)
            .iconEmoji(iconEmoji)
            .channel(channel)
            .attachments(attachments)
            .build();
    }
}