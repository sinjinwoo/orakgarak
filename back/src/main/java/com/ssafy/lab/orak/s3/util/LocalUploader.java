package com.ssafy.lab.orak.s3.util;

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

            // 2. 이미지인 경우 즉시 썸네일 생성
            String contentType = Files.probeContentType(savePath);
            if (contentType != null && contentType.startsWith("image/")) {
                List<String> thumbnails = createThumbnails(savePath, saveFileName);
                savePathList.addAll(thumbnails);
                log.info("이미지 파일 업로드 및 썸네일 생성 완료: {}", saveFileName);
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
}
