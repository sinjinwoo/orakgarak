package com.ssafy.lab.orak.webhook.controller;

import com.ssafy.lab.orak.webhook.dto.AlertmanagerWebhookRequest;
import com.ssafy.lab.orak.webhook.dto.MattermostWebhookRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonGenerator;

import java.time.format.DateTimeFormatter;
import java.time.ZoneId;

@Log4j2
@RestController
@RequestMapping("/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final RestTemplate restTemplate;

    @Value("${mattermost.webhook.url:}")
    private String mattermostWebhookUrl;

    @PostMapping(value = "/alertmanager", consumes = "application/json;charset=UTF-8", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> handleAlertmanagerWebhook(@RequestBody AlertmanagerWebhookRequest request) {
        System.out.println("=== 🚨 웹훅 수신됨 ===");
        System.out.println("📨 요청 내용: " + request);
        log.info("🔔 Alertmanager 웹훅이 수신되었습니다: {}", request);

        try {
            MattermostWebhookRequest mattermostRequest = convertToMattermostFormat(request);
            System.out.println("📝 Mattermost 형식으로 변환 완료: " + mattermostRequest);
            System.out.println("📤 전송 대상 URL: " + mattermostWebhookUrl);

            // Mattermost 웹훅은 form-encoded 형식으로 payload를 전송해야 함
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Accept-Charset", "UTF-8");

            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.configure(JsonGenerator.Feature.ESCAPE_NON_ASCII, false);
            String jsonPayload = objectMapper.writeValueAsString(mattermostRequest);

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("payload", jsonPayload);

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(formData, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                mattermostWebhookUrl,
                entity,
                String.class
            );

            System.out.println("📬 Mattermost 응답: " + response.getStatusCode() + " - " + response.getBody());
            log.info("✅ Mattermost로 성공적으로 전송되었습니다: {}", response.getStatusCode());
            return ResponseEntity.ok("알림이 Mattermost로 전달되었습니다");

        } catch (Exception e) {
            System.out.println("❌ 오류 발생: " + e.getMessage());
            e.printStackTrace();
            log.error("❌ Mattermost로 알림 전송에 실패했습니다", e);
            return ResponseEntity.internalServerError().body("알림 전송에 실패했습니다");
        }
    }

    private MattermostWebhookRequest convertToMattermostFormat(AlertmanagerWebhookRequest request) {
        StringBuilder messageBuilder = new StringBuilder();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Seoul"));

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

        for (AlertmanagerWebhookRequest.Alert alert : request.getAlerts()) {
            String status = "firing".equals(alert.getStatus()) ? "🔥 발생" : "✅ 해결됨";
            String summary = alert.getAnnotations() != null ? alert.getAnnotations().get("summary") : "알 수 없는 알림";
            String description = alert.getAnnotations() != null ? alert.getAnnotations().get("description") : "설명 없음";
            String severity = alert.getLabels() != null ? alert.getLabels().get("severity") : "unknown";
            String instance = alert.getLabels() != null ? alert.getLabels().get("instance") : "unknown";
            String timeStr = alert.getStartsAt() != null ? alert.getStartsAt().format(formatter) : "시간 정보 없음";

            if ("critical".equals(severity)) {
                messageBuilder.append(String.format(
                    "🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨\n" +
                    "# 🔴 **CRITICAL** 🔴\n" +
                    "## 🚨 긴급 시스템 알림 🚨\n" +
                    "🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨\n\n" +
                    "### 📢 **알림 내용**\n" +
                    "```\n%s\n```\n\n" +
                    "### 📝 **상세 설명**\n" +
                    "```\n%s\n```\n\n" +
                    "### 📊 **알림 정보**\n" +
                    "| 항목 | 값 |\n" +
                    "|------|----|\n" +
                    "| 🖥️ **인스턴스** | `%s` |\n" +
                    "| ⏰ **발생 시간** | `%s` |\n" +
                    "| 🚨 **상태** | `%s` |\n\n" +
                    "---\n" +
                    "🔴 **즉시 확인이 필요합니다!** 🔴\n" +
                    "@channel\n" +
                    "---\n\n",
                    summary, description, instance, timeStr, status
                ));
            } else if ("warning".equals(severity)) {
                messageBuilder.append(String.format(
                    "⚠️🟡⚠️🟡⚠️🟡⚠️🟡⚠️🟡⚠️\n" +
                    "# 🟡 **WARNING** 🟡\n" +
                    "## ⚠️ 주의 알림 ⚠️\n" +
                    "⚠️🟡⚠️🟡⚠️🟡⚠️🟡⚠️🟡⚠️\n\n" +
                    "### 📢 **경고 내용**\n" +
                    "```\n%s\n```\n\n" +
                    "### 📝 **상세 설명**\n" +
                    "```\n%s\n```\n\n" +
                    "### 📊 **알림 정보**\n" +
                    "| 항목 | 값 |\n" +
                    "|------|----|\n" +
                    "| 🖥️ **인스턴스** | `%s` |\n" +
                    "| ⏰ **시간** | `%s` |\n" +
                    "| ⚠️ **심각도** | `%s` |\n" +
                    "| 📈 **상태** | `%s` |\n\n" +
                    "---\n" +
                    "🟡 **모니터링이 필요합니다** 🟡\n" +
                    "---\n\n",
                    summary, description, instance, timeStr, severity, status
                ));
            } else if ("resolved".equals(alert.getStatus())) {
                messageBuilder.append(String.format(
                    "✅🟢✅🟢✅🟢✅🟢✅🟢✅\n" +
                    "# 🟢 **RESOLVED** 🟢\n" +
                    "## ✅ 문제 해결됨 ✅\n" +
                    "✅🟢✅🟢✅🟢✅🟢✅🟢✅\n\n" +
                    "### 🎉 **해결된 문제**\n" +
                    "```\n%s\n```\n\n" +
                    "### 📝 **상세 내용**\n" +
                    "```\n%s\n```\n\n" +
                    "### 📊 **해결 정보**\n" +
                    "| 항목 | 값 |\n" +
                    "|------|----|\n" +
                    "| 🖥️ **인스턴스** | `%s` |\n" +
                    "| ⏰ **해결 시간** | `%s` |\n" +
                    "| 📊 **심각도** | `%s` |\n\n" +
                    "---\n" +
                    "🎉 **문제가 성공적으로 해결되었습니다!** 🎉\n" +
                    "---\n\n",
                    summary, description, instance, timeStr, severity
                ));
            } else {
                messageBuilder.append(String.format(
                    "ℹ️🔵ℹ️🔵ℹ️🔵ℹ️🔵ℹ️🔵ℹ️\n" +
                    "# 🔵 **INFO** 🔵\n" +
                    "## 📋 정보 알림 📋\n" +
                    "ℹ️🔵ℹ️🔵ℹ️🔵ℹ️🔵ℹ️🔵ℹ️\n\n" +
                    "### 📢 **%s**\n" +
                    "```\n%s\n```\n\n" +
                    "### 📝 **상세 정보**\n" +
                    "```\n%s\n```\n\n" +
                    "### 📊 **시스템 정보**\n" +
                    "| 항목 | 값 |\n" +
                    "|------|----|\n" +
                    "| 🖥️ **인스턴스** | `%s` |\n" +
                    "| ⏰ **시간** | `%s` |\n" +
                    "| 📊 **심각도** | `%s` |\n\n" +
                    "---\n" +
                    "ℹ️ **참고용 정보입니다** ℹ️\n" +
                    "---\n\n",
                    status, summary, description, instance, timeStr, severity
                ));
            }
        }

        return MattermostWebhookRequest.builder()
            .text(messageBuilder.toString().trim())
            .username(username)
            .iconEmoji(iconEmoji)
            .channel(channel)
            .build();
    }
}