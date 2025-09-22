package com.ssafy.lab.orak.recording.controller;

import com.ssafy.lab.orak.recording.service.AsyncRecordService;
import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AsyncRecordControllerTest {

    @Mock
    private AsyncRecordService asyncRecordService;

    @Mock
    private FileUploadService fileUploadService;

    @Mock
    private S3Helper s3Helper;

    @InjectMocks
    private AsyncRecordController asyncRecordController;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(asyncRecordController, "expectedWebhookToken", "test-eventbridge-webhook-token");
    }

    @Test
    @DisplayName("EventBridge 웹훅 - 올바른 토큰으로 인증 성공")
    void testEventBridgeWebhookWithValidToken() {
        // Given
        String s3Key = "recordings/uuid_test-file.mp3";
        Upload mockUpload = Upload.builder()
                .id(1L)
                .uuid("test-uuid")
                .originalFilename("test-file.mp3")
                .extension("mp3")
                .processingStatus(ProcessingStatus.UPLOADED)
                .build();

        when(s3Helper.extractUuidFromS3Key(s3Key)).thenReturn("test-uuid");
        when(fileUploadService.findByUuid("test-uuid")).thenReturn(mockUpload);

        // When
        ResponseEntity<Map<String, String>> response = asyncRecordController.handleUploadCompleted(
                null, s3Key, "eventbridge", "test-eventbridge-webhook-token");

        // Then
        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(response.getBody()).containsEntry("status", "success");
        assertThat(response.getBody()).containsEntry("uploadId", "1");
        assertThat(response.getBody()).containsEntry("source", "eventbridge");
    }

    @Test
    @DisplayName("EventBridge 웹훅 - 잘못된 토큰으로 인증 실패")
    void testEventBridgeWebhookWithInvalidToken() {
        // Given
        String s3Key = "recordings/uuid_test-file.mp3";

        // When
        ResponseEntity<Map<String, String>> response = asyncRecordController.handleUploadCompleted(
                null, s3Key, "eventbridge", "invalid-token");

        // Then
        assertThat(response.getStatusCodeValue()).isEqualTo(401);
        assertThat(response.getBody()).containsEntry("status", "error");
        assertThat(response.getBody()).containsEntry("message", "Unauthorized: Invalid EventBridge token");
    }

    @Test
    @DisplayName("EventBridge 웹훅 - 토큰 헤더 없이 인증 실패")
    void testEventBridgeWebhookWithoutToken() {
        // Given
        String s3Key = "recordings/uuid_test-file.mp3";

        // When
        ResponseEntity<Map<String, String>> response = asyncRecordController.handleUploadCompleted(
                null, s3Key, "eventbridge", null);

        // Then
        assertThat(response.getStatusCodeValue()).isEqualTo(401);
        assertThat(response.getBody()).containsEntry("status", "error");
        assertThat(response.getBody()).containsEntry("message", "Unauthorized: Invalid EventBridge token");
    }

    @Test
    @DisplayName("클라이언트 직접 호출 - 토큰 검증 없이 성공")
    void testClientDirectCallWithoutTokenValidation() {
        // Given
        Long uploadId = 1L;
        String s3Key = "recordings/uuid_test-file.mp3";

        // When
        ResponseEntity<Map<String, String>> response = asyncRecordController.handleUploadCompleted(
                uploadId, s3Key, "client", null);

        // Then
        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(response.getBody()).containsEntry("status", "success");
        assertThat(response.getBody()).containsEntry("uploadId", "1");
        assertThat(response.getBody()).containsEntry("source", "client");
    }

    @Test
    @DisplayName("S3 키에서 UUID 추출 실패")
    void testEventBridgeWebhookWithInvalidS3Key() {
        // Given
        String invalidS3Key = "invalid-s3-key-format";

        when(s3Helper.extractUuidFromS3Key(invalidS3Key)).thenReturn(null);

        // When
        ResponseEntity<Map<String, String>> response = asyncRecordController.handleUploadCompleted(
                null, invalidS3Key, "eventbridge", "test-eventbridge-webhook-token");

        // Then
        assertThat(response.getStatusCodeValue()).isEqualTo(400);
        assertThat(response.getBody()).containsEntry("status", "error");
        assertThat(response.getBody()).containsEntry("message", "S3 키 형식이 올바르지 않습니다: " + invalidS3Key);
    }

    @Test
    @DisplayName("UUID에 해당하는 업로드 레코드 없음")
    void testEventBridgeWebhookWithNonExistentUpload() {
        // Given
        String s3Key = "recordings/uuid_non-existent-file.mp3";

        when(s3Helper.extractUuidFromS3Key(s3Key)).thenReturn("non-existent-uuid");
        when(fileUploadService.findByUuid("non-existent-uuid")).thenReturn(null);

        // When
        ResponseEntity<Map<String, String>> response = asyncRecordController.handleUploadCompleted(
                null, s3Key, "eventbridge", "test-eventbridge-webhook-token");

        // Then
        assertThat(response.getStatusCodeValue()).isEqualTo(400);
        assertThat(response.getBody()).containsEntry("status", "error");
        assertThat(response.getBody()).containsEntry("message", "업로드 레코드를 찾을 수 없습니다: non-existent-uuid");
    }
}