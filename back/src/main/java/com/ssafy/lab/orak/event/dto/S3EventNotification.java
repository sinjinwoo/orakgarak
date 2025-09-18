package com.ssafy.lab.orak.event.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
public class S3EventNotification {
    
    private List<S3EventRecord> Records;
    
    @Data
    @NoArgsConstructor
    public static class S3EventRecord {
        private String eventVersion;
        private String eventSource;
        private String awsRegion;
        private Instant eventTime;
        private String eventName;
        private UserIdentity userIdentity;
        private RequestParameters requestParameters;
        private ResponseElements responseElements;
        private S3 s3;
        
        @Data
        @NoArgsConstructor
        public static class UserIdentity {
            private String principalId;
        }
        
        @Data
        @NoArgsConstructor
        public static class RequestParameters {
            private String sourceIPAddress;
        }
        
        @Data
        @NoArgsConstructor
        public static class ResponseElements {
            private String xAmzRequestId;
            private String xAmzId2;
        }
        
        @Data
        @NoArgsConstructor
        public static class S3 {
            private String s3SchemaVersion;
            private String configurationId;
            private S3Bucket bucket;
            private S3Object object;
            
            @Data
            @NoArgsConstructor
            public static class S3Bucket {
                private String name;
                private UserIdentity ownerIdentity;
                private String arn;
            }
            
            @Data
            @NoArgsConstructor
            public static class S3Object {
                private String key;
                private Long size;
                private String eTag;
                private String sequencer;
            }
        }
    }
}