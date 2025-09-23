package com.ssafy.lab.orak.webhook.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class MattermostWebhookRequest {
    private String text;
    private String username;
    private String iconEmoji;
    private String channel;
    private List<Attachment> attachments;

    @Data
    @Builder
    public static class Attachment {
        private String color;
        private String text;
        private String title;
    }
}