package com.ssafy.lab.orak.s3.util;

import com.github.kokorin.jaffree.ffmpeg.FFmpeg;
import com.github.kokorin.jaffree.ffmpeg.UrlInput;
import com.github.kokorin.jaffree.ffmpeg.UrlOutput;
import com.ssafy.lab.orak.s3.exception.S3UploadException;
import com.ssafy.lab.orak.s3.exception.ThumbnailCreationException;
import net.coobird.thumbnailator.Thumbnailator;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Log4j2
public class LocalUploader {


    @Value("${s3.upload.path}")
    private String uploadPath;

    //만약 디렉토리가 없으면 생성

    @PostConstruct
    public void init(){
        log.info("================== 업로드 경로 설정 확인 ==================");
        log.info("업로드 경로 : {}", uploadPath);

        //디렉토리가 없으면 생성
        File uploadDir = new File(uploadPath);
        if(!uploadDir.exists()){
            boolean created = uploadDir.mkdirs();
            if(created){
                log.info("업로드 디렉토리 생성 완료 : {}", uploadPath);
            }else{
                log.info("업로드 디렉토리 생성 실패 : {}" , uploadPath);
            }
        } else{
            log.info("업로드 디렉토리 존재 확인 : {}" , uploadPath);
        }
    }

    /**
     * 파일 업로드 (동기 이미지 처리)
     * 1. 파일을 즉시 저장
     * 2. 이미지인 경우 썸네일 생성 (동기 처리)
     * 3. 원본 및 썸네일 파일 경로 반환
     */
    public List<String> uploadLocal(MultipartFile multipartFile) {
        return uploadLocal(multipartFile, null, null);
    }

    /**
     * 파일 업로드 (게시글 정보 포함)
     */
    public List<String> uploadLocal(MultipartFile multipartFile, Long postId, Long userId) {
        if(multipartFile == null || multipartFile.isEmpty()){
            return null;
        }
        String uuid = UUID.randomUUID().toString();
        String saveFileName = uuid + "_" + multipartFile.getOriginalFilename();
        Path savePath = Paths.get(uploadPath, saveFileName);
        List<String> savePathList = new ArrayList<>();
        try {
            // 1. 파일을 즉시 저장
            multipartFile.transferTo(savePath);
            savePathList.add(savePath.toFile().getAbsolutePath());

            // 2. 파일 타입별 처리
            String contentType = Files.probeContentType(savePath);
            if (isImageFile(contentType)) {
                List<String> thumbnails = createThumbnails(savePath, saveFileName);
                savePathList.addAll(thumbnails);
                log.info("이미지 파일 업로드 및 썸네일 생성 완료: {}", saveFileName);
            } else if (isAudioFile(saveFileName, contentType)) {
                String wavFilePath = convertToWav(savePath, saveFileName);
                if (wavFilePath != null) {
                    savePathList.add(wavFilePath);
                    log.info("오디오 파일 업로드 및 WAV 변환 완료: {}", saveFileName);
                } else {
                    throw new S3UploadException("오디오 파일 WAV 변환 실패: " + saveFileName + ". 유효한 오디오 파일을 업로드해주세요.");
                }
            } else {
                log.info("일반 파일 업로드 완료: {}", saveFileName);
            }

        } catch (Exception e) {
            throw new S3UploadException("파일 업로드 실패: " + saveFileName, e);
        }
        return savePathList;
    }

    /**
     * 여러 크기의 썸네일 생성
     */
    private List<String> createThumbnails(Path originalPath, String fileName) {
        List<String> thumbnails = new ArrayList<>();

        try {
            String baseName = getBaseName(fileName);
            String extension = getExtension(fileName);

            // 여러 크기의 썸네일 생성
            int[] sizes = {150, 300, 600}; // small, medium, large
            String[] prefixes = {"s_", "m_", "l_"};

            for (int i = 0; i < sizes.length; i++) {
                String thumbnailFileName = prefixes[i] + baseName + "." + extension;
                File thumbnailFile = new File(uploadPath, thumbnailFileName);

                try {
                    Thumbnailator.createThumbnail(
                            originalPath.toFile(),
                            thumbnailFile,
                            sizes[i],
                            sizes[i]
                    );

                    thumbnails.add(thumbnailFile.getAbsolutePath());
                    log.debug("썸네일 생성 완료: {} ({}x{})", thumbnailFileName, sizes[i], sizes[i]);

                } catch (Exception e) {
                    throw new ThumbnailCreationException("썸네일 생성 실패: " + thumbnailFileName, e);
                }
            }
        } catch (Exception e) {
            throw new ThumbnailCreationException("썸네일 생성 전체 실패: " + fileName, e);
        }

        return thumbnails;
    }

    private String getBaseName(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
    }

    private String getExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : "";
    }
    
    /**
     * 이미지 파일 여부 체크
     */
    private boolean isImageFile(String contentType) {
        return contentType != null && contentType.startsWith("image/");
    }
    
    /**
     * 오디오 파일 여부 체크 (MIME Type과 확장자 기반)
     */
    private boolean isAudioFile(String fileName, String contentType) {
        // MIME Type 체크
        if (contentType != null && contentType.startsWith("audio/")) {
            return true;
        }
        
        // 확장자 기반 체크 (contentType이 null이거나 정확하지 않은 경우)
        String extension = getExtension(fileName).toLowerCase();
        return extension.matches("mp3|wav|flac|m4a|aac|ogg|mp4|webm|3gp|amr");
    }
    
    /**
     * 오디오 파일을 WAV 형식으로 변환
     */
    private String convertToWav(Path originalPath, String fileName) {
        try {
            String baseName = getBaseName(fileName);
            String wavFileName = baseName + ".wav";
            Path wavPath = Paths.get(uploadPath, wavFileName);
            
            FFmpeg.atPath()
                    .addInput(UrlInput.fromPath(originalPath))
                    .addOutput(UrlOutput.toPath(wavPath)
                            .setFormat("wav")
                            .addArguments("-ar", "16000") // 16kHz 샘플레이트
                            .addArguments("-ac", "1"))    // 모노 채널
                    .setOverwriteOutput(true)             // 기존 파일 덮어쓰기
                    .execute();
            
            log.info("오디오 파일 WAV 변환 완료: {} -> {}", fileName, wavFileName);
            return wavPath.toFile().getAbsolutePath();
            
        } catch (Exception e) {
            log.error("오디오 파일 WAV 변환 실패: {}", fileName, e);
            return null;
        }
    }
}
