package com.ssafy.lab.orak.s3.util;

import com.ssafy.lab.orak.s3.exception.S3UploadException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
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
    
    
    //서버에 파일 업로드
    //이름 바꿈 uuid_원본파일명
    public String uploadLocal(MultipartFile multipartFile) {
        if(multipartFile == null || multipartFile.isEmpty()){
            return null;
        }
        String uuid = UUID.randomUUID().toString();
        String saveFileName = uuid + "_" + multipartFile.getOriginalFilename();
        Path savePath = Paths.get(uploadPath, saveFileName);
        
        try {
            multipartFile.transferTo(savePath);
            log.info("파일 업로드 완료: {}", saveFileName);
            return savePath.toFile().getAbsolutePath();
        } catch (Exception e) {
            throw new S3UploadException("파일 업로드 실패: " + saveFileName, e);
        }
    }

}
