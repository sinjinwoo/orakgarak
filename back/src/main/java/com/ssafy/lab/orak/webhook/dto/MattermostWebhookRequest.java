package com.ssafy.lab.orak.webhook.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MattermostWebhookRequest {
    private String text;
    private String username;
    private String iconEmoji;
    private String channel;
}