package com.ssafy.lab.orak.aidemo.enums;

public enum ApplicationStatus {
    PENDING("대기 중"),
    APPROVED("승인됨"),
    REJECTED("거절됨"),
    COMPLETED("완료됨");

    private final String description;

    ApplicationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}