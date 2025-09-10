package com.ssafy.lab.orak.s3.util;

import com.ssafy.lab.orak.s3.exception.PresignedUrlException;
import com.ssafy.lab.orak.s3.exception.S3DeleteException;
import com.ssafy.lab.orak.s3.exception.S3UploadException;
import com.ssafy.lab.orak.s3.helper.S3Helper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.File;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;
import java.util.ArrayList;

//디자인패턴 퍼사드 적용
@Component
@RequiredArgsConstructor
@Log4j2
public class S3Uploader {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Helper s3Helper;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${spring.cloud.aws.region.static}")
    private String region;

    //로컬 파일을 S3로 업로드
    //filePath는 /Users/admin/Desktop/abc123_profile.png 이런느낌
    public String upload(String filePath) throws RuntimeException{
        File targetFile = new File(filePath);
        // 예외
        try{
            String s3Key = targetFile.getName();
            //S3 업로드
            s3Helper.uploadToS3(s3Key, targetFile.toPath());
            //업로드 후 로컬 파일 삭제
            removeOriginalFile(targetFile);
            // URL 반환
            return s3Helper.getS3Url(s3Key);

        } catch (Exception e){
            throw new S3UploadException("S3 업로드 실패: " + targetFile.getName(), e);
        }
    }
    //로컬 파일을 S3의 특정 디렉토리로 업로드
    public String upload(String filePath, String s3Directory) throws RuntimeException{
        File targetFile = new File(filePath);
        try{ //s3로 업로드
            String s3Key = s3Directory + "/" + targetFile.getName();

            s3Helper.uploadToS3(s3Key, targetFile.toPath());
            //업로드 후 로컬 파일 삭제
            removeOriginalFile(targetFile);
            //url 반환
            return s3Helper.getS3Url(s3Key);
        } catch (Exception e){
            throw new S3UploadException("S3 업로드 실패: " + targetFile.getName(), e);
        }
    }
    //Presigned URL 생성 (UUID와 파일명 분리)
    public String generatePresignedUrl(String s3Directory, String uuid, String fileName, Duration duration){
        try{
            String s3Key = String.format("%s/%s_%s" , s3Directory , uuid , fileName);
            return s3Helper.createPresignedUrl(s3Key, duration, s3Presigner);
        } catch (Exception e){
            throw new PresignedUrlException("Presigned URL 생성 실패: " + fileName, e);
        }
    }

    /**
     * 여러 파일에 대한 Presigned URL 생성
     */
    public List<String> generatePresignedUrls(String s3Directory, List<String> fileNames, Duration duration) {
        List<String> presignedUrls = new ArrayList<>();

        for (String fileName : fileNames) {
            try {
                String uuid = java.util.UUID.randomUUID().toString();
                String presignedUrl = generatePresignedUrl(s3Directory, uuid, fileName, duration);
                presignedUrls.add(presignedUrl);
            } catch (Exception e) {
                throw new PresignedUrlException("다중 Presigned URL 생성 실패: " + fileName, e);
            }
        }

        return presignedUrls;
    }

    /**
     * 여러 파일 삭제
     */
    public void removeS3Files(List<String> fileNames) {
        for (String fileName : fileNames) {
            try {
                removeS3File(fileName);
            } catch (Exception e) {
                throw new S3DeleteException("다중 파일 삭제 실패: " + fileName, e);
            }
        }
    }

    //S3로 업로드 후 원본 파일 삭제
    private void removeOriginalFile(File targetFile){
        if(targetFile.exists() && targetFile.delete()){
            log.info("로컬 파일 삭제 성공 : {}", targetFile.getName());
        } else {
            log.info("로컬 파일 삭제 실패 : {}", targetFile.getName());
        }
    }
    //파일 삭제 메서드 ===============================================================================

    //S3에서 파일 삭제 , fileName = UUID랑 전부다 합친 파일네임
    public void removeS3File(String fileName){
        try{
            s3Helper.deleteFromS3(fileName);
            log.info("S3 파일 삭제 성공 : {}", fileName);
        } catch(Exception e){
            throw new S3DeleteException("S3 파일 삭제 실패: " + fileName, e);
        }
    }
}