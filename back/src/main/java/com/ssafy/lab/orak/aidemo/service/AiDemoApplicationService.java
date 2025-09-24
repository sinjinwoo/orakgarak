package com.ssafy.lab.orak.aidemo.service;

import com.ssafy.lab.orak.aidemo.dto.AdminUpdateRequestDTO;
import com.ssafy.lab.orak.aidemo.dto.AiDemoApplicationRequestDTO;
import com.ssafy.lab.orak.aidemo.dto.AiDemoApplicationResponseDTO;
import com.ssafy.lab.orak.aidemo.entity.AiDemoApplication;
import com.ssafy.lab.orak.aidemo.enums.ApplicationStatus;
import com.ssafy.lab.orak.aidemo.exception.AiDemoApplicationNotFoundException;
import com.ssafy.lab.orak.aidemo.exception.AiDemoApplicationOperationException;
import com.ssafy.lab.orak.aidemo.exception.DuplicateAiDemoApplicationException;
import com.ssafy.lab.orak.aidemo.mapper.AiDemoApplicationMapper;
import com.ssafy.lab.orak.aidemo.repository.AiDemoApplicationRepository;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.recording.exception.RecordNotFoundException;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.recording.service.RecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class AiDemoApplicationService {

    private final AiDemoApplicationRepository aiDemoApplicationRepository;
    private final RecordRepository recordRepository;
    private final RecordService recordService;
    private final AiDemoApplicationMapper mapper;

    public AiDemoApplicationResponseDTO createApplication(AiDemoApplicationRequestDTO requestDTO, Long userId) {
        try {
            // 1. 신청할 녹음본이 존재하고 본인 소유인지 확인
            Record record = recordRepository.findById(requestDTO.getRecordId())
                    .orElseThrow(() -> new RecordNotFoundException(requestDTO.getRecordId()));

            if (!record.getUserId().equals(userId)) {
                throw new AiDemoApplicationOperationException("본인 소유의 녹음본만 AI 데모 신청이 가능합니다.");
            }

            // 2. 중복 신청 체크
            if (aiDemoApplicationRepository.existsByUserIdAndRecordId(userId, requestDTO.getRecordId())) {
                throw new DuplicateAiDemoApplicationException(userId, requestDTO.getRecordId());
            }

            // 3. 엔티티 생성 및 저장
            AiDemoApplication application = mapper.toEntity(requestDTO, userId);
            AiDemoApplication savedApplication = aiDemoApplicationRepository.save(application);

            log.info("AI 데모 신청 생성 성공: userId={}, recordId={}, applicationId={}",
                    userId, requestDTO.getRecordId(), savedApplication.getId());

            // 4. 응답 DTO 생성
            return convertToResponseDTO(savedApplication);

        } catch (RecordNotFoundException | DuplicateAiDemoApplicationException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI 데모 신청 생성 실패: userId={}, recordId={}", userId, requestDTO.getRecordId(), e);
            throw new AiDemoApplicationOperationException("AI 데모 신청 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<AiDemoApplicationResponseDTO> getMyApplications(Long userId) {
        try {
            List<AiDemoApplication> applications = aiDemoApplicationRepository.findByUserIdWithRecord(userId);
            return convertToResponseDTOs(applications);
        } catch (Exception e) {
            log.error("내 AI 데모 신청 목록 조회 실패: userId={}", userId, e);
            throw new AiDemoApplicationOperationException("AI 데모 신청 목록 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<AiDemoApplicationResponseDTO> getAllApplicationsByStatus(ApplicationStatus status) {
        try {
            List<AiDemoApplication> applications = aiDemoApplicationRepository.findByStatusWithRecord(status);
            return convertToResponseDTOs(applications);
        } catch (Exception e) {
            log.error("상태별 AI 데모 신청 목록 조회 실패: status={}", status, e);
            throw new AiDemoApplicationOperationException("AI 데모 신청 목록 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public AiDemoApplicationResponseDTO getApplication(Long applicationId) {
        AiDemoApplication application = aiDemoApplicationRepository.findByIdWithRecord(applicationId)
                .orElseThrow(() -> new AiDemoApplicationNotFoundException(applicationId));
        return convertToResponseDTO(application);
    }

    public AiDemoApplicationResponseDTO updateApplicationStatus(Long applicationId, AdminUpdateRequestDTO updateRequest) {
        try {
            AiDemoApplication application = aiDemoApplicationRepository.findById(applicationId)
                    .orElseThrow(() -> new AiDemoApplicationNotFoundException(applicationId));

            // 상태 업데이트
            application.updateStatus(updateRequest.getStatus(), updateRequest.getAdminNote());
            AiDemoApplication updatedApplication = aiDemoApplicationRepository.save(application);

            log.info("AI 데모 신청 상태 업데이트 성공: applicationId={}, status={}",
                    applicationId, updateRequest.getStatus());

            return convertToResponseDTO(updatedApplication);

        } catch (AiDemoApplicationNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI 데모 신청 상태 업데이트 실패: applicationId={}", applicationId, e);
            throw new AiDemoApplicationOperationException("AI 데모 신청 상태 업데이트에 실패했습니다: " + e.getMessage(), e);
        }
    }

    public AiDemoApplicationResponseDTO approveApplication(Long applicationId, String adminNote) {
        AdminUpdateRequestDTO updateRequest = AdminUpdateRequestDTO.builder()
                .status(ApplicationStatus.APPROVED)
                .adminNote(adminNote)
                .build();
        return updateApplicationStatus(applicationId, updateRequest);
    }

    public AiDemoApplicationResponseDTO rejectApplication(Long applicationId, String adminNote) {
        AdminUpdateRequestDTO updateRequest = AdminUpdateRequestDTO.builder()
                .status(ApplicationStatus.REJECTED)
                .adminNote(adminNote)
                .build();
        return updateApplicationStatus(applicationId, updateRequest);
    }

    public AiDemoApplicationResponseDTO completeApplication(Long applicationId, String adminNote) {
        AdminUpdateRequestDTO updateRequest = AdminUpdateRequestDTO.builder()
                .status(ApplicationStatus.COMPLETED)
                .adminNote(adminNote)
                .build();
        return updateApplicationStatus(applicationId, updateRequest);
    }

    @Transactional(readOnly = true)
    public long countMyApplicationsByStatus(Long userId, ApplicationStatus status) {
        return aiDemoApplicationRepository.countByUserIdAndStatus(userId, status);
    }

    private AiDemoApplicationResponseDTO convertToResponseDTO(AiDemoApplication application) {
        try {
            RecordResponseDTO recordResponseDTO = recordService.getRecord(application.getRecordId());
            return mapper.toResponseDTO(application, recordResponseDTO);
        } catch (Exception e) {
            log.warn("Record 정보 조회 실패로 기본 응답 생성: applicationId={}, recordId={}",
                    application.getId(), application.getRecordId(), e);
            return mapper.toResponseDTO(application);
        }
    }

    private List<AiDemoApplicationResponseDTO> convertToResponseDTOs(List<AiDemoApplication> applications) {
        return applications.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
}