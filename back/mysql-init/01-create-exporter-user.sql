-- MySQL Exporter 전용 사용자 생성
CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY '${MYSQL_EXPORTER_PASSWORD}';

-- MySQL Exporter에 필요한 권한 부여
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';

-- 권한 적용
FLUSH PRIVILEGES;