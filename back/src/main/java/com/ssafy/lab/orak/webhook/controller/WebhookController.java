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

@Log4j2
@RestController
@RequestMapping("/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final RestTemplate restTemplate;

    @Value("${mattermost.webhook.url:}")
    private String mattermostWebhookUrl;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        System.out.println("=== WEBHOOK TEST ENDPOINT HIT ===");
        return ResponseEntity.ok("Webhook controller is working!");
    }

    @PostMapping("/alertmanager")
    public ResponseEntity<String> handleAlertmanagerWebhook(@RequestBody AlertmanagerWebhookRequest request) {
        System.out.println("=== WEBHOOK RECEIVED ===");
        System.out.println("Request: " + request);
        log.info("Received Alertmanager webhook: {}", request);

        try {
            MattermostWebhookRequest mattermostRequest = convertToMattermostFormat(request);
            System.out.println("Converted to Mattermost format: " + mattermostRequest);
            System.out.println("Sending to URL: " + mattermostWebhookUrl);

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

            System.out.println("Mattermost response: " + response.getStatusCode() + " - " + response.getBody());
            log.info("Successfully sent to Mattermost: {}", response.getStatusCode());
            return ResponseEntity.ok("Alert forwarded to Mattermost");

        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            log.error("Failed to forward alert to Mattermost", e);
            return ResponseEntity.internalServerError().body("Failed to forward alert");
        }
    }

    private MattermostWebhookRequest convertToMattermostFormat(AlertmanagerWebhookRequest request) {
        StringBuilder messageBuilder = new StringBuilder();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss KST");

        String username = "Orakgaraki AlertManager";
        String iconEmoji = ":warning:";
        String channel = "alerts";

        if (request.getAlerts() != null && !request.getAlerts().isEmpty()) {
            AlertmanagerWebhookRequest.Alert firstAlert = request.getAlerts().get(0);
            String severity = firstAlert.getLabels() != null ? firstAlert.getLabels().get("severity") : "unknown";

            if ("critical".equals(severity)) {
                username = "🚨 CRITICAL ALERT";
                iconEmoji = ":fire:";
                channel = "critical-alerts";
            } else if ("warning".equals(severity)) {
                username = "⚠️ Orakgaraki Warning";
                iconEmoji = ":warning:";
            }
        }

        for (AlertmanagerWebhookRequest.Alert alert : request.getAlerts()) {
            String status = "firing".equals(alert.getStatus()) ? "🔥 FIRING" : "✅ RESOLVED";
            String summary = alert.getAnnotations() != null ? alert.getAnnotations().get("summary") : "Unknown Alert";
            String description = alert.getAnnotations() != null ? alert.getAnnotations().get("description") : "No description";
            String severity = alert.getLabels() != null ? alert.getLabels().get("severity") : "unknown";
            String instance = alert.getLabels() != null ? alert.getLabels().get("instance") : "unknown";
            String timeStr = alert.getStartsAt() != null ? alert.getStartsAt().format(formatter) : "Unknown time";

            if ("critical".equals(severity)) {
                messageBuilder.append(String.format(
                    "🔥 **CRITICAL ALERT** 🔥\n\n**%s**\n\n%s\n\n**Instance**: %s\n**Started**: %s\n\n@channel\n\n",
                    summary, description, instance, timeStr
                ));
            } else if ("warning".equals(severity)) {
                messageBuilder.append(String.format(
                    "⚠️ **WARNING**: %s\n\n%s\n\n**Severity**: %s\n**Instance**: %s\n**Time**: %s\n\n",
                    summary, description, severity, instance, timeStr
                ));
            } else {
                messageBuilder.append(String.format(
                    "**%s**: %s\n\n**Details**: %s\n**Severity**: %s\n**Instance**: %s\n**Time**: %s\n\n",
                    status, summary, description, severity, instance, timeStr
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