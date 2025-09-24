package com.ssafy.lab.orak.upload.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import static com.ssafy.lab.orak.upload.entity.QUpload.upload;

@Repository
@RequiredArgsConstructor
public class UploadRepositoryImpl implements UploadRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Upload> findPendingAudioProcessing(int limit) {
        return queryFactory
                .selectFrom(upload)
                .where(
                    upload.processingStatus.eq(ProcessingStatus.UPLOADED),
                    upload.contentType.like("audio/%")
                        .or(upload.extension.lower().in("mp3", "wav", "m4a", "flac", "aac", "ogg"))
                )
                .orderBy(upload.createdAt.asc())
                .limit(limit)
                .fetch();
    }

    @Override
    public List<Upload> findPendingAudioProcessingWithRetry(int limit, int maxRetries, LocalDateTime retryAfterTime) {
        return queryFactory
                .selectFrom(upload)
                .where(
                    // 기본 업로드 상태이거나
                    upload.processingStatus.eq(ProcessingStatus.UPLOADED)
                    .or(
                        // 재시도 가능한 PENDING 상태
                        upload.processingStatus.eq(ProcessingStatus.PENDING)
                        .and(
                            upload.retryCount.isNull()
                            .or(upload.retryCount.lt(maxRetries))
                        )
                        .and(
                            upload.lastFailedAt.isNull()
                            .or(upload.lastFailedAt.lt(retryAfterTime))
                        )
                    ),
                    // 오디오 파일 조건
                    upload.contentType.like("audio/%")
                    .or(upload.extension.lower().in("mp3", "wav", "m4a", "flac", "aac", "ogg"))
                )
                .orderBy(upload.createdAt.asc())
                .limit(limit)
                .fetch();
    }

    @Override
    public long countProcessingFiles() {
        return queryFactory
                .select(upload.count())
                .from(upload)
                .where(
                    upload.processingStatus.in(
                        ProcessingStatus.PROCESSING,
                        ProcessingStatus.CONVERTING,
                        ProcessingStatus.ANALYSIS_PENDING,
                        ProcessingStatus.IMAGE_OPTIMIZING,
                        ProcessingStatus.THUMBNAIL_GENERATING
                    )
                )
                .fetchOne();
    }

    @Override
    public List<Upload> findCompletedBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return queryFactory
                .selectFrom(upload)
                .where(
                    upload.processingStatus.eq(ProcessingStatus.COMPLETED),
                    upload.updatedAt.between(startDate, endDate)
                )
                .orderBy(upload.updatedAt.desc())
                .fetch();
    }
}